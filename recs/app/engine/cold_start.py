"""
Cold-start detector — determines if a user has enough interaction history
for collaborative scoring.

Uses a single SQL query that also resolves user_id → student_profile_id.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from sqlalchemy import text

from app.core.config import settings
from app.core.db import async_engine


@dataclass(frozen=True)
class ColdStartInfo:
    """Result of cold-start detection."""

    is_cold: bool
    interaction_count: int
    student_profile_id: Optional[UUID]
    strategy: str  # "content_only" | "hybrid"


class ColdStartDetector:
    """Detects whether a user is cold (insufficient interaction history).

    Cold-start threshold is configurable via COLD_START_MIN_INTERACTIONS.
    Also resolves user_id → student_profile_id in the same query.
    """

    _QUERY = text("""
        SELECT
            sp.id AS student_profile_id,
            COALESCE(app_count.cnt, 0) + COALESCE(save_count.cnt, 0)
                AS interaction_count
        FROM student_profiles sp
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS cnt
            FROM applications a
            WHERE a.student_id = sp.id
        ) app_count ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS cnt
            FROM saved_internships si
            WHERE si.student_id = sp.id
        ) save_count ON TRUE
        WHERE sp.user_id = :user_id
    """)

    async def check(self, user_id: UUID) -> ColdStartInfo:
        """Check cold-start status for a user.

        Returns ColdStartInfo with student_profile_id resolved and
        interaction count computed. If the user has no profile, returns
        cold with student_profile_id=None.
        """
        async with async_engine.connect() as conn:
            result = await conn.execute(self._QUERY, {"user_id": str(user_id)})
            row = result.first()

        if row is None:
            return ColdStartInfo(
                is_cold=True,
                interaction_count=0,
                student_profile_id=None,
                strategy="content_only",
            )

        count = int(row.interaction_count)
        threshold = settings.cold_start_min_interactions
        is_cold = count < threshold

        return ColdStartInfo(
            is_cold=is_cold,
            interaction_count=count,
            student_profile_id=row.student_profile_id,
            strategy="content_only" if is_cold else "hybrid",
        )
