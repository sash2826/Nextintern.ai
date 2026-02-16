"""
Content-based scorer — MVP recommendation engine.

Scoring formula (from v3 plan):
  CB_score = 0.5 * skill_score + 0.2 * location_score + 0.2 * interest_score + 0.1 * recency_bonus

Skill overlap: weighted Jaccard between student skills and internship skills,
weighted by importance (required=1.0, preferred=0.6, bonus=0.3) and proficiency.
"""

import os
from datetime import date, timedelta
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import create_engine, text

from app.core.config import settings


class ContentScorer:
    """Content-based internship scorer using skill overlap, location, and interests."""

    IMPORTANCE_WEIGHTS = {"required": 1.0, "preferred": 0.6, "bonus": 0.3}

    def __init__(self):
        self.engine = create_engine(
            settings.database_url,
            pool_size=5,
            max_overflow=0,
            pool_pre_ping=True,
        )

    async def score(
        self,
        profile,
        exclude_ids: list[UUID],
        limit: int = 10,
    ) -> list:
        """Score all active internships against the user profile."""

        internships = self._fetch_active_internships(exclude_ids)

        if not internships:
            return []

        scored = []
        for internship in internships:
            skill_score = self._skill_overlap(profile.skills, internship["skills"])
            location_score = self._location_match(profile, internship)
            interest_score = self._interest_overlap(profile.interests, internship)
            recency_bonus = self._recency_bonus(internship.get("created_at"))

            final_score = (
                0.5 * skill_score
                + 0.2 * location_score
                + 0.2 * interest_score
                + 0.1 * recency_bonus
            )

            explanation = {
                "matchedSkills": self._matched_skill_names(profile.skills, internship["skills"]),
                "skillOverlapScore": round(skill_score, 3),
                "locationMatch": location_score > 0,
                "interestOverlap": self._matched_interests(profile.interests, internship),
                "finalScore": round(final_score, 3),
                "reason": self._build_reason(profile, internship, skill_score, location_score),
            }

            scored.append({
                "internship_id": internship["id"],
                "score": round(final_score, 4),
                "explanation": explanation,
            })

        # Sort descending by score, return top N
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def _fetch_active_internships(self, exclude_ids: list[UUID]) -> list:
        """Fetch active internships with their skills from Postgres."""
        query = text("""
            SELECT
                i.id, i.title, i.category, i.location_city, i.location_state,
                i.work_mode, i.created_at,
                COALESCE(
                    json_agg(json_build_object(
                        'name', s.name,
                        'importance', isj.importance
                    )) FILTER (WHERE s.id IS NOT NULL),
                    '[]'::json
                ) as skills
            FROM internships i
            LEFT JOIN internship_skills isj ON i.id = isj.internship_id
            LEFT JOIN skills s ON isj.skill_id = s.id
            WHERE i.status = 'active'
              AND i.application_deadline >= CURRENT_DATE
              AND i.id != ALL(:exclude_ids)
            GROUP BY i.id
        """)

        with self.engine.connect() as conn:
            rows = conn.execute(
                query,
                {"exclude_ids": [str(uid) for uid in exclude_ids] if exclude_ids else []},
            ).mappings().all()

        return [dict(row) for row in rows]

    def _skill_overlap(self, user_skills: list[dict], internship_skills: list) -> float:
        """
        Weighted Jaccard similarity.
        User skill proficiency (1-5) × internship importance weight.
        """
        if not internship_skills or not user_skills:
            return 0.0

        user_skill_map = {
            s.get("name", "").lower(): s.get("proficiency", 3) / 5.0
            for s in user_skills
        }

        matched_weight = 0.0
        total_weight = 0.0

        for iskill in internship_skills:
            name = iskill.get("name", "").lower()
            importance = self.IMPORTANCE_WEIGHTS.get(iskill.get("importance", "bonus"), 0.3)
            total_weight += importance

            if name in user_skill_map:
                matched_weight += importance * user_skill_map[name]

        return matched_weight / total_weight if total_weight > 0 else 0.0

    def _location_match(self, profile, internship: dict) -> float:
        """Binary boost for location match or remote internship."""
        if internship.get("work_mode") == "remote":
            return 1.0
        if (
            profile.location_city
            and internship.get("location_city")
            and profile.location_city.lower() == internship["location_city"].lower()
        ):
            return 1.0
        if (
            profile.location_state
            and internship.get("location_state")
            and profile.location_state.lower() == internship["location_state"].lower()
        ):
            return 0.5
        return 0.0

    def _interest_overlap(self, user_interests: list[str], internship: dict) -> float:
        """Overlap between user interests and internship category/tags."""
        if not user_interests:
            return 0.0
        interests_lower = {i.lower() for i in user_interests}
        category = (internship.get("category") or "").lower()
        if category in interests_lower:
            return 1.0
        return 0.0

    def _recency_bonus(self, created_at) -> float:
        """Boost for recently posted internships (decay over 30 days)."""
        if not created_at:
            return 0.0
        if hasattr(created_at, "date"):
            created_date = created_at.date()
        else:
            created_date = created_at
        days_old = (date.today() - created_date).days
        if days_old <= 0:
            return 1.0
        if days_old > 30:
            return 0.0
        return max(0.0, 1.0 - (days_old / 30.0))

    def _matched_skill_names(self, user_skills: list[dict], internship_skills: list) -> list[str]:
        """Return names of skills that match between user and internship."""
        user_names = {s.get("name", "").lower() for s in user_skills}
        return [
            s.get("name", "")
            for s in internship_skills
            if s.get("name", "").lower() in user_names
        ]

    def _matched_interests(self, user_interests: list[str], internship: dict) -> list[str]:
        """Return matching interest tags."""
        if not user_interests:
            return []
        interests_lower = {i.lower() for i in user_interests}
        category = (internship.get("category") or "").lower()
        return [internship.get("category", "")] if category in interests_lower else []

    def _build_reason(self, profile, internship: dict, skill_score: float, location_score: float) -> str:
        """Generate human-readable explanation."""
        parts = []
        matched = self._matched_skill_names(profile.skills, internship.get("skills", []))
        if matched:
            pct = int(skill_score * 100)
            parts.append(f"Matched skills {', '.join(matched)} ({pct}% overlap)")
        if location_score > 0:
            if internship.get("work_mode") == "remote":
                parts.append("Remote work available")
            else:
                parts.append(f"Located in your area ({internship.get('location_city', '')})")
        if not parts:
            parts.append("Trending internship in your field")
        return ". ".join(parts) + "."
