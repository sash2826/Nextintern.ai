"""
Hybrid combiner — orchestrates content + collaborative scorers with
cold-start detection, min-max normalization, and concurrent execution.

Execution flow:
    1. ColdStartDetector.check(user_id)
    2. If cold → ContentScorer only
    3. If warm → run both scorers concurrently via asyncio.gather
       → normalize scores (min-max)
       → blend with configurable weights
       → merge explanations
       → return top-N
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from uuid import UUID

from app.core.config import settings
from app.engine.base_scorer import ScoreResult
from app.engine.cold_start import ColdStartDetector, ColdStartInfo
from app.engine.collaborative_scorer import CollaborativeScorer
from app.engine.content_scorer import ContentScorer


@dataclass(frozen=True)
class HybridResult:
    """Complete recommendation result with metadata."""

    items: list[ScoreResult]
    model_version: str
    strategy: str  # "content_only" | "hybrid"
    cold_start: bool
    cold_start_info: ColdStartInfo
    latency_ms: int = 0


# ── Score normalization ──────────────────────────────────


def normalize_scores(results: list[ScoreResult]) -> dict[UUID, float]:
    """Min-max normalize scores to [0, 1].

    Required so content and collaborative scores are on the same
    scale before blending — without this, hybrid blending is
    mathematically invalid.
    """
    if not results:
        return {}

    scores = [r.score for r in results]
    min_s, max_s = min(scores), max(scores)

    if max_s == min_s:
        return {r.internship_id: 1.0 for r in results}

    return {
        r.internship_id: (r.score - min_s) / (max_s - min_s)
        for r in results
    }


# ── Hybrid combiner ─────────────────────────────────────


class HybridCombiner:
    """Orchestrates content + collaborative scoring with cold-start fallback.

    Performance constraints:
        - ≤ 3 DB queries per request
        - ≤ 200ms latency target
        - O(N) memory only
    """

    def __init__(
        self,
        content_scorer: ContentScorer,
        collaborative_scorer: CollaborativeScorer,
        cold_start_detector: ColdStartDetector,
    ) -> None:
        self._content = content_scorer
        self._collab = collaborative_scorer
        self._cold_start = cold_start_detector

    @property
    def model_version(self) -> str:
        return f"hybrid-{self._content.version()}-{self._collab.version()}"

    async def recommend(
        self,
        user_id: UUID,
        profile: dict,
        exclude_ids: set[UUID],
        limit: int,
    ) -> HybridResult:
        """Generate top-N recommendations using hybrid scoring.

        Args:
            user_id: The authenticated user's UUID.
            profile: Dict with skills, interests, location fields.
            exclude_ids: Internships to exclude.
            limit: Maximum results to return.

        Returns:
            HybridResult with scored items, strategy, and metadata.
        """
        # Step 1: Cold-start detection (1 DB query)
        cold_info = await self._cold_start.check(user_id)

        # Step 2: Cold-start path — content only
        if cold_info.is_cold:
            content_results = await self._content.score(
                user_id, profile, exclude_ids, limit
            )
            return HybridResult(
                items=content_results[:limit],
                model_version=f"{self.model_version}-cold",
                strategy="content_only",
                cold_start=True,
                cold_start_info=cold_info,
            )

        # Step 3: Warm path — run both scorers concurrently
        # Fetch extra candidates (2× limit) so blending has a good pool
        fetch_limit = limit * 2

        content_task = asyncio.create_task(
            self._content.score(user_id, profile, exclude_ids, fetch_limit)
        )
        collab_task = asyncio.create_task(
            self._collab.score(
                user_id,
                profile,
                exclude_ids,
                fetch_limit,
                student_profile_id=cold_info.student_profile_id,
            )
        )

        content_results, collab_results = await asyncio.gather(
            content_task, collab_task
        )

        # Step 4: Fallback — if collaborative returns empty, use content only
        if not collab_results:
            return HybridResult(
                items=content_results[:limit],
                model_version=self.model_version,
                strategy="content_only",
                cold_start=False,
                cold_start_info=cold_info,
            )

        # Step 5: Normalize scores (min-max → [0, 1])
        content_norm = normalize_scores(content_results)
        collab_norm = normalize_scores(collab_results)

        # Build explanation lookup
        content_explanations = {
            r.internship_id: r.explanation for r in content_results
        }
        collab_explanations = {
            r.internship_id: r.explanation for r in collab_results
        }

        # Step 6: Blend scores
        w_content = settings.content_weight
        w_collab = settings.collaborative_weight
        all_ids = set(content_norm.keys()) | set(collab_norm.keys())

        blended: list[ScoreResult] = []
        for iid in all_ids:
            c_score = content_norm.get(iid, 0.0)
            co_score = collab_norm.get(iid, 0.0)
            final = w_content * c_score + w_collab * co_score

            # Merge explanations from both scorers
            explanation: dict = {}
            if iid in content_explanations:
                explanation["content"] = content_explanations[iid]
            if iid in collab_explanations:
                explanation["collaborative"] = collab_explanations[iid]
            explanation["blendedScore"] = round(final, 4)
            explanation["weights"] = {
                "content": w_content,
                "collaborative": w_collab,
            }

            blended.append(
                ScoreResult(
                    internship_id=iid,
                    score=round(final, 4),
                    explanation=explanation,
                )
            )

        # Sort descending and return top-N
        blended.sort(key=lambda x: x.score, reverse=True)

        return HybridResult(
            items=blended[:limit],
            model_version=self.model_version,
            strategy="hybrid",
            cold_start=False,
            cold_start_info=cold_info,
        )
