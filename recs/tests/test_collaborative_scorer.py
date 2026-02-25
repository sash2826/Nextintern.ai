"""Tests for CollaborativeScorer."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.engine.collaborative_scorer import CollaborativeScorer


@pytest.fixture
def scorer():
    return CollaborativeScorer()


@pytest.mark.asyncio
async def test_no_student_profile_id_returns_empty(scorer):
    """Without student_profile_id, collaborative scorer returns empty."""
    result = await scorer.score(
        user_id=uuid4(),
        profile={},
        exclude_ids=set(),
        limit=10,
        student_profile_id=None,
    )
    assert result == []


@pytest.mark.asyncio
async def test_returns_scored_results(scorer):
    """Should return ScoreResult list from DB co-occurrence query."""
    iid1, iid2 = uuid4(), uuid4()
    profile_id = uuid4()

    mock_rows = [
        MagicMock(internship_id=iid1, score=3.5, similar_user_count=5),
        MagicMock(internship_id=iid2, score=1.0, similar_user_count=2),
    ]

    mock_result = MagicMock()
    mock_result.all.return_value = mock_rows

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.collaborative_scorer.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        results = await scorer.score(
            user_id=uuid4(),
            profile={},
            exclude_ids=set(),
            limit=10,
            student_profile_id=profile_id,
        )

    assert len(results) == 2
    assert results[0].internship_id == iid1
    assert results[0].score == 3.5
    assert results[0].explanation["source"] == "collaborative"
    assert results[0].explanation["similarUserCount"] == 5
    assert results[1].internship_id == iid2
    assert results[1].score == 1.0


@pytest.mark.asyncio
async def test_empty_db_results(scorer):
    """Empty DB result returns empty list."""
    profile_id = uuid4()

    mock_result = MagicMock()
    mock_result.all.return_value = []

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.collaborative_scorer.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        results = await scorer.score(
            user_id=uuid4(),
            profile={},
            exclude_ids=set(),
            limit=10,
            student_profile_id=profile_id,
        )

    assert results == []


@pytest.mark.asyncio
async def test_exclude_ids_passed_to_query(scorer):
    """Exclude IDs should be passed as parameters to the SQL query."""
    profile_id = uuid4()
    exclude1, exclude2 = uuid4(), uuid4()

    mock_result = MagicMock()
    mock_result.all.return_value = []

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.collaborative_scorer.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        await scorer.score(
            user_id=uuid4(),
            profile={},
            exclude_ids={exclude1, exclude2},
            limit=5,
            student_profile_id=profile_id,
        )

    # Verify the query was called with correct params
    call_args = mock_conn.execute.call_args
    params = call_args[0][1]
    assert str(profile_id) == params["student_id"]
    assert set(params["exclude_ids"]) == {str(exclude1), str(exclude2)}
    assert params["limit"] == 5


def test_version(scorer):
    """Version string should be correct."""
    assert scorer.version() == "collab-v0.1.0"
