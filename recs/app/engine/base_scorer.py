"""
Base scorer interface — typed, deterministic contract for all scorers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from uuid import UUID


@dataclass(frozen=True)
class ScoreResult:
    """Immutable scored internship result."""

    internship_id: UUID
    score: float
    explanation: dict = field(default_factory=dict)


class BaseScorer(ABC):
    """Abstract base class for all recommendation scorers."""

    @abstractmethod
    async def score(
        self,
        user_id: UUID,
        profile: dict,
        exclude_ids: set[UUID],
        limit: int,
    ) -> list[ScoreResult]:
        """Score internships for a given user profile.

        Args:
            user_id: The user's UUID (from users table).
            profile: Dict with keys: skills, interests, education_level,
                     location_city, location_state.
            exclude_ids: Internship UUIDs to exclude from results.
            limit: Maximum number of results to return.

        Returns:
            Sorted list of ScoreResult, descending by score.
        """

    @abstractmethod
    def version(self) -> str:
        """Return the scorer version string, e.g. 'content-v0.1.0'."""
