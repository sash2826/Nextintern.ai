"""
Health check endpoint.
"""

from fastapi import APIRouter

from app.engine.content_scorer import ContentScorer
from app.engine.collaborative_scorer import CollaborativeScorer

router = APIRouter()

_content_version = ContentScorer().version()
_collab_version = CollaborativeScorer().version()


@router.get("/health")
async def health():
    """Health check — returns service status and dynamic model version."""
    return {
        "status": "ok",
        "service": "nextintern-recs",
        "modelVersion": f"hybrid-{_content_version}-{_collab_version}",
        "modelAge": "n/a",
    }
