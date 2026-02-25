import os
import json
import logging
from uuid import UUID
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.dialects.postgresql import JSONB, array, UUID as PGUUID

from app.core.config import settings

logger = logging.getLogger(__name__)

def get_logging_engine():
    db_url = os.environ.get(
        "DATABASE_URL",
        settings.database_url
    )
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    return create_async_engine(db_url)

# Keep a single engine for logging to avoid connection overhead
_logging_engine = get_logging_engine()

async def log_recommendation(
    user_id:       UUID,
    internship_ids: list[UUID],
    model_version: str,
    strategy:      str,
    latency_ms:    int,
    fairness_metrics: Optional[dict] = None
) -> None:
    """
    Log a recommendation to the recommendation_log table asynchronously.
    Swallows exceptions to ensure the main API flow is not interrupted.
    """
    try:
        engine = _logging_engine
        
        insert_stmt = sa.text("""
            INSERT INTO recommendation_log 
            (user_id, internship_ids, model_version, strategy, latency_ms, fairness_metrics)
            VALUES 
            (:user_id, :internship_ids, :model_version, :strategy, :latency_ms, :fairness_metrics)
        """)
        
        # Convert lists and dicts to appropriate types for SQLAlchemy binding
        i_ids = [str(i) for i in internship_ids]
        metrics_json = json.dumps(fairness_metrics) if fairness_metrics is not None else None
        
        async with engine.begin() as conn: # Creates transaction and auto-commits
            await conn.execute(
                insert_stmt,
                {
                    "user_id": str(user_id),
                    "internship_ids": i_ids,
                    "model_version": model_version,
                    "strategy": strategy,
                    "latency_ms": latency_ms,
                    "fairness_metrics": metrics_json
                }
            )
            
    except Exception as e:
        logger.error(f"Failed to log recommendation: {e}")
        # Never raise within the background task to ensure stability
