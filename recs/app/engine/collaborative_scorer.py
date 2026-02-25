"""
Collaborative scorer — SQL-aggregated co-occurrence scoring.

Finds similar users by shared application/save history, then ranks
internships by weighted co-occurrence count.

Interaction weights: apply = 1.0, save = 0.5.
All computation done in PostgreSQL — O(N) in Python, no loops.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text

from app.core.db import async_engine
from app.engine.base_scorer import BaseScorer, ScoreResult


class CollaborativeScorer(BaseScorer):
    """Co-occurrence collaborative scorer using SQL aggregation.

    Query plan (single query):
      1. user_history: internships the user applied to or saved
      2. similar_users: other students who interacted with the same internships
      3. candidate_scores: internships those similar users interacted with,
         weighted by interaction type (apply=1.0, save=0.5) × overlap count
      4. Filter to active internships not in exclude_ids
    """

    _QUERY = text("""
        WITH user_history AS (
            SELECT internship_id
            FROM applications
            WHERE student_id = :student_id

            UNION

            SELECT internship_id
            FROM saved_internships
            WHERE student_id = :student_id
        ),

        similar_users AS (
            SELECT sub.student_id, COUNT(*) AS overlap
            FROM (
                SELECT student_id, internship_id
                FROM applications
                WHERE internship_id IN (SELECT internship_id FROM user_history)
                  AND student_id != :student_id
                UNION ALL
                SELECT student_id, internship_id
                FROM saved_internships
                WHERE internship_id IN (SELECT internship_id FROM user_history)
                  AND student_id != :student_id
            ) sub
            GROUP BY sub.student_id
        ),

        candidate_scores AS (
            SELECT
                src.internship_id,
                SUM(
                    CASE WHEN src.source = 'apply' THEN 1.0 ELSE 0.5 END
                    * su.overlap
                ) AS score,
                COUNT(DISTINCT src.student_id) AS similar_user_count
            FROM (
                SELECT student_id, internship_id, 'apply' AS source
                FROM applications
                WHERE student_id IN (SELECT student_id FROM similar_users)
                UNION ALL
                SELECT student_id, internship_id, 'save' AS source
                FROM saved_internships
                WHERE student_id IN (SELECT student_id FROM similar_users)
            ) src
            JOIN similar_users su ON su.student_id = src.student_id
            WHERE src.internship_id NOT IN (SELECT internship_id FROM user_history)
              AND src.internship_id != ALL(:exclude_ids)
            GROUP BY src.internship_id
        )

        SELECT
            cs.internship_id,
            cs.score,
            cs.similar_user_count
        FROM candidate_scores cs
        JOIN internships i ON i.id = cs.internship_id
        WHERE i.status = 'active'
          AND i.application_deadline >= CURRENT_DATE
        ORDER BY cs.score DESC
        LIMIT :limit
    """)

    async def score(
        self,
        user_id: UUID,
        profile: dict,
        exclude_ids: set[UUID],
        limit: int,
        *,
        student_profile_id: UUID | None = None,
    ) -> list[ScoreResult]:
        """Score internships by collaborative co-occurrence.

        Args:
            user_id: User UUID (from users table).
            profile: Not used by this scorer — collaborative signals
                     come from DB interaction history.
            exclude_ids: Internship UUIDs to exclude.
            limit: Maximum results.
            student_profile_id: Resolved student_profiles.id (from
                ColdStartDetector). Required for DB queries.

        Returns:
            Scored internships, descending by co-occurrence score.
        """
        if student_profile_id is None:
            return []

        async with async_engine.connect() as conn:
            result = await conn.execute(
                self._QUERY,
                {
                    "student_id": str(student_profile_id),
                    "exclude_ids": (
                        [str(uid) for uid in exclude_ids] if exclude_ids else []
                    ),
                    "limit": limit,
                },
            )
            rows = result.all()

        return [
            ScoreResult(
                internship_id=row.internship_id,
                score=float(row.score),
                explanation={
                    "source": "collaborative",
                    "similarUserCount": int(row.similar_user_count),
                    "reason": (
                        f"Popular among {row.similar_user_count} students "
                        f"with similar interests"
                    ),
                },
            )
            for row in rows
        ]

    def version(self) -> str:
        return "collab-v0.1.0"
