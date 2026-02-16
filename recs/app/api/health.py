"""
Health check endpoint.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    """Health check — returns service status and model version."""
    return {
        "status": "ok",
        "service": "nextintern-recs",
        "modelVersion": "content-v0.1.0",
        "modelAge": "n/a",
    }
