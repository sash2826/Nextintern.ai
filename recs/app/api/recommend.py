"""
Recommendation endpoint — content-based scoring for MVP.
"""

import time
from typing import Optional
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from app.engine.content_scorer import ContentScorer

router = APIRouter()
scorer = ContentScorer()


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
    latency_ms: int
    fairness_metrics: dict


# ── Endpoint ─────────────────────────────────────

@router.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """
    Generate top-N internship recommendations for a user.
    MVP: content-based scoring only.
    """
    start = time.time()

    items = await scorer.score(
        profile=request.profile,
        exclude_ids=request.context.exclude_ids,
        limit=request.context.limit,
    )

    latency_ms = int((time.time() - start) * 1000)

    return RecommendResponse(
        items=items,
        model_version="content-v0.1.0",
        latency_ms=latency_ms,
        fairness_metrics={
            "provider_cap_max": max((1 for _ in items), default=0),
            "note": "Fairness layer not active in MVP",
        },
    )
