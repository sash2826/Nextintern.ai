"""
Recommendation endpoint — hybrid scoring with cold-start fallback.
"""

import time
from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.cold_start import ColdStartDetector
from app.engine.collaborative_scorer import CollaborativeScorer
from app.engine.content_scorer import ContentScorer
from app.engine.hybrid_combiner import HybridCombiner

router = APIRouter()

# ── Wire up the combiner ────────────────────────────
_content = ContentScorer()
_collab = CollaborativeScorer()
_cold_start = ColdStartDetector()
combiner = HybridCombiner(_content, _collab, _cold_start)


# ── Request / Response Models ────────────────────────


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
    latency_ms: int
    strategy: str
    cold_start: bool
    fairness_metrics: dict


# ── Endpoint ─────────────────────────────────────────


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """
    Generate top-N internship recommendations for a user.
    Uses hybrid scoring with automatic cold-start fallback.
    """
    start = time.time()

    result = await combiner.recommend(
        user_id=request.user_id,
        profile=request.profile.model_dump(),
        exclude_ids=set(request.context.exclude_ids),
        limit=request.context.limit,
    )

    latency_ms = int((time.time() - start) * 1000)

    return RecommendResponse(
        items=[
            InternshipScore(
                internship_id=item.internship_id,
                score=item.score,
                explanation=item.explanation,
            )
            for item in result.items
        ],
        model_version=result.model_version,
        latency_ms=latency_ms,
        strategy=result.strategy,
        cold_start=result.cold_start,
        fairness_metrics={
            "provider_cap_max": max((1 for _ in result.items), default=0),
            "note": "Fairness layer not active in MVP",
        },
    )
