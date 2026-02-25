"""
Shared async SQLAlchemy engine — single connection pool for all scorers.
"""

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


def _to_async_url(url: str) -> str:
    """Convert postgresql:// to postgresql+asyncpg:// for the async driver."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async_engine = create_async_engine(
    _to_async_url(settings.database_url),
    pool_size=5,
    max_overflow=0,
    pool_pre_ping=True,
)
