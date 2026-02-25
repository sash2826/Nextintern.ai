"""Tests for ColdStartDetector."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.engine.cold_start import ColdStartDetector, ColdStartInfo


@pytest.fixture
def detector():
    return ColdStartDetector()


def _mock_row(student_profile_id, interaction_count):
    """Create a mock DB row."""
    row = MagicMock()
    row.student_profile_id = student_profile_id
    row.interaction_count = interaction_count
    return row


@pytest.mark.asyncio
async def test_cold_user_zero_interactions(detector):
    """User with 0 interactions should be cold."""
    user_id = uuid4()
    profile_id = uuid4()

    mock_result = MagicMock()
    mock_result.first.return_value = _mock_row(profile_id, 0)

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.cold_start.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        info = await detector.check(user_id)

    assert info.is_cold is True
    assert info.interaction_count == 0
    assert info.student_profile_id == profile_id
    assert info.strategy == "content_only"


@pytest.mark.asyncio
async def test_cold_user_below_threshold(detector):
    """User with 2 interactions (below default threshold of 3) should be cold."""
    user_id = uuid4()
    profile_id = uuid4()

    mock_result = MagicMock()
    mock_result.first.return_value = _mock_row(profile_id, 2)

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.cold_start.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        info = await detector.check(user_id)

    assert info.is_cold is True
    assert info.interaction_count == 2
    assert info.strategy == "content_only"


@pytest.mark.asyncio
async def test_warm_user_at_threshold(detector):
    """User with exactly 3 interactions (at threshold) should be warm."""
    user_id = uuid4()
    profile_id = uuid4()

    mock_result = MagicMock()
    mock_result.first.return_value = _mock_row(profile_id, 3)

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.cold_start.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        info = await detector.check(user_id)

    assert info.is_cold is False
    assert info.interaction_count == 3
    assert info.strategy == "hybrid"


@pytest.mark.asyncio
async def test_warm_user_above_threshold(detector):
    """User with 10 interactions should be warm."""
    user_id = uuid4()
    profile_id = uuid4()

    mock_result = MagicMock()
    mock_result.first.return_value = _mock_row(profile_id, 10)

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.cold_start.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        info = await detector.check(user_id)

    assert info.is_cold is False
    assert info.interaction_count == 10
    assert info.student_profile_id == profile_id
    assert info.strategy == "hybrid"


@pytest.mark.asyncio
async def test_no_profile_returns_cold(detector):
    """User with no student profile should be cold with None profile ID."""
    user_id = uuid4()

    mock_result = MagicMock()
    mock_result.first.return_value = None

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with patch("app.engine.cold_start.async_engine") as mock_engine:
        mock_engine.connect.return_value = mock_conn
        info = await detector.check(user_id)

    assert info.is_cold is True
    assert info.interaction_count == 0
    assert info.student_profile_id is None
    assert info.strategy == "content_only"


@pytest.mark.asyncio
async def test_custom_threshold():
    """Cold-start threshold should be configurable."""
    detector = ColdStartDetector()
    user_id = uuid4()
    profile_id = uuid4()

    mock_result = MagicMock()
    mock_result.first.return_value = _mock_row(profile_id, 5)

    mock_conn = AsyncMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_conn.__aexit__ = AsyncMock(return_value=False)

    with (
        patch("app.engine.cold_start.async_engine") as mock_engine,
        patch("app.engine.cold_start.settings") as mock_settings,
    ):
        mock_engine.connect.return_value = mock_conn
        mock_settings.cold_start_min_interactions = 10
        info = await detector.check(user_id)

    # 5 < 10, so still cold
    assert info.is_cold is True
    assert info.interaction_count == 5
    assert info.strategy == "content_only"
