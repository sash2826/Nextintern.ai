import time
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
limiter = Limiter(key_func=get_remote_address, storage_uri=redis_url)

from app.engine.hybrid_combiner import HybridCombiner
from app.api.logging_service import log_recommendation
from app.api.metrics import (
    recommendations_served_total,
    recommendation_strategy_total,
    recommendation_latency_seconds
)

router = APIRouter()
scorer = HybridCombiner()


# ── Request / Response Models ────────────────────

class UserProfile(BaseModel):
    skills: list[dict]  # [{name: str, proficiency: int}]
    interests: list[str]
    education_level: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None


class RecommendContext(BaseModel):
    exclude_ids: list[UUID] = []
    limit: int = 10


class RecommendRequest(BaseModel):
    user_id: UUID
    profile: UserProfile
    context: RecommendContext = RecommendContext()


class InternshipScore(BaseModel):
    internship_id: UUID
    score: float
    explanation: dict


class RecommendResponse(BaseModel):
    items: list[InternshipScore]
    model_version: str
    cold_start: bool
    strategy: str
    latency_ms: int
    fairness_metrics: dict
    shadow_metrics: Optional[dict] = None


# ── Endpoint ─────────────────────────────────────

@router.post("/recommend", response_model=RecommendResponse)
@limiter.limit("50/minute")
async def recommend(request: Request, body: RecommendRequest, background_tasks: BackgroundTasks):
    """
    Generate top-N internship recommendations for a user.
    Uses Hybrid Combiner (CF + CB).
    """
    start = time.time()

    result = await scorer.score(
        user_id=body.user_id,
        profile=body.profile,
        exclude_ids=body.context.exclude_ids,
        limit=body.context.limit,
    )

    latency_ms = int((time.time() - start) * 1000)

    response_kwargs = {
        "items": result["items"],
        "model_version": "hybrid-v0.2.0",
        "cold_start": result.get("cold_start", False),
        "strategy": result.get("strategy", "hybrid"),
        "latency_ms": latency_ms,
        "fairness_metrics": result.get("fairness_metrics", {}),
    }
    
    if "shadow_metrics" in result:
        response_kwargs["shadow_metrics"] = result["shadow_metrics"]

    # --- Analytics Logging ---
    # Extract IDs to log
    internship_ids = [getattr(item, "internship_id", item.get("internship_id") if isinstance(item, dict) else None) for item in result["items"]]
    
    background_tasks.add_task(
        log_recommendation,
        user_id=body.user_id,
        internship_ids=internship_ids,
        model_version=response_kwargs["model_version"],
        strategy=response_kwargs["strategy"],
        latency_ms=response_kwargs["latency_ms"],
        fairness_metrics=response_kwargs["fairness_metrics"]
    )
    
    # --- Observability ---
    recommendations_served_total.inc()
    recommendation_strategy_total.labels(strategy=response_kwargs["strategy"]).inc()
    recommendation_latency_seconds.observe(response_kwargs["latency_ms"] / 1000.0)

    return RecommendResponse(**response_kwargs)
