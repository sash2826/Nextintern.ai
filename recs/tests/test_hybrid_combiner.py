"""Tests for HybridCombiner."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.engine.base_scorer import ScoreResult
from app.engine.cold_start import ColdStartInfo
from app.engine.hybrid_combiner import HybridCombiner, HybridResult, normalize_scores


# ── normalize_scores tests ───────────────────────────


def test_normalize_empty():
    """Empty list returns empty dict."""
    assert normalize_scores([]) == {}


def test_normalize_single():
    """Single result normalizes to 1.0."""
    iid = uuid4()
    result = normalize_scores([ScoreResult(iid, 0.5, {})])
    assert result == {iid: 1.0}


def test_normalize_identical_scores():
    """All equal scores normalize to 1.0."""
    ids = [uuid4() for _ in range(3)]
    results = [ScoreResult(iid, 0.5, {}) for iid in ids]
    normed = normalize_scores(results)
    for iid in ids:
        assert normed[iid] == 1.0


def test_normalize_range():
    """Scores should be mapped linearly to [0, 1]."""
    iid_low, iid_mid, iid_high = uuid4(), uuid4(), uuid4()
    results = [
        ScoreResult(iid_low, 0.0, {}),
        ScoreResult(iid_mid, 0.5, {}),
        ScoreResult(iid_high, 1.0, {}),
    ]
    normed = normalize_scores(results)
    assert normed[iid_low] == pytest.approx(0.0)
    assert normed[iid_mid] == pytest.approx(0.5)
    assert normed[iid_high] == pytest.approx(1.0)


# ── Fixtures ─────────────────────────────────────────


def _cold_info(is_cold: bool, count: int = 0, profile_id=None):
    return ColdStartInfo(
        is_cold=is_cold,
        interaction_count=count,
        student_profile_id=profile_id or uuid4(),
        strategy="content_only" if is_cold else "hybrid",
    )


@pytest.fixture
def content_scorer():
    scorer = MagicMock()
    scorer.score = AsyncMock()
    scorer.version.return_value = "content-v0.1.0"
    return scorer


@pytest.fixture
def collab_scorer():
    scorer = MagicMock()
    scorer.score = AsyncMock()
    scorer.version.return_value = "collab-v0.1.0"
    return scorer


@pytest.fixture
def cold_start():
    return AsyncMock()


# ── HybridCombiner tests ────────────────────────────


@pytest.mark.asyncio
async def test_cold_start_uses_content_only(content_scorer, collab_scorer, cold_start):
    """Cold-start user should only use content scorer."""
    cold_start.check.return_value = _cold_info(is_cold=True, count=0)

    iid = uuid4()
    content_scorer.score.return_value = [
        ScoreResult(iid, 0.8, {"source": "content"}),
    ]

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)
    result = await combiner.recommend(uuid4(), {}, set(), 10)

    assert result.cold_start is True
    assert result.strategy == "content_only"
    assert len(result.items) == 1
    assert result.items[0].internship_id == iid
    collab_scorer.score.assert_not_called()


@pytest.mark.asyncio
async def test_warm_user_blends_scores(content_scorer, collab_scorer, cold_start):
    """Warm user should blend content and collaborative scores."""
    profile_id = uuid4()
    cold_start.check.return_value = _cold_info(
        is_cold=False, count=5, profile_id=profile_id
    )

    iid1, iid2, iid3 = uuid4(), uuid4(), uuid4()

    content_scorer.score.return_value = [
        ScoreResult(iid1, 1.0, {"source": "content"}),
        ScoreResult(iid2, 0.5, {"source": "content"}),
        ScoreResult(iid3, 0.0, {"source": "content"}),
    ]
    collab_scorer.score.return_value = [
        ScoreResult(iid1, 0.0, {"source": "collaborative"}),
        ScoreResult(iid2, 0.5, {"source": "collaborative"}),
        ScoreResult(iid3, 1.0, {"source": "collaborative"}),
    ]

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)

    with patch("app.engine.hybrid_combiner.settings") as mock_settings:
        mock_settings.content_weight = 0.7
        mock_settings.collaborative_weight = 0.3
        result = await combiner.recommend(uuid4(), {}, set(), 10)

    assert result.cold_start is False
    assert result.strategy == "hybrid"
    assert len(result.items) == 3

    # iid1: 0.7*1.0 + 0.3*0.0 = 0.7
    # iid2: 0.7*0.5 + 0.3*0.5 = 0.5
    # iid3: 0.7*0.0 + 0.3*1.0 = 0.3
    scores = {item.internship_id: item.score for item in result.items}
    assert scores[iid1] == pytest.approx(0.7, abs=0.01)
    assert scores[iid2] == pytest.approx(0.5, abs=0.01)
    assert scores[iid3] == pytest.approx(0.3, abs=0.01)

    # Should be sorted descending
    assert result.items[0].score >= result.items[1].score >= result.items[2].score


@pytest.mark.asyncio
async def test_empty_collab_falls_back(content_scorer, collab_scorer, cold_start):
    """If collaborative returns empty, should fallback to content_only."""
    cold_start.check.return_value = _cold_info(is_cold=False, count=5)

    iid = uuid4()
    content_scorer.score.return_value = [
        ScoreResult(iid, 0.9, {"source": "content"}),
    ]
    collab_scorer.score.return_value = []  # empty!

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)
    result = await combiner.recommend(uuid4(), {}, set(), 10)

    assert result.strategy == "content_only"
    assert result.cold_start is False
    assert len(result.items) == 1


@pytest.mark.asyncio
async def test_explanations_merged(content_scorer, collab_scorer, cold_start):
    """Warm user should have merged explanations from both scorers."""
    cold_start.check.return_value = _cold_info(is_cold=False, count=5)

    iid = uuid4()
    content_scorer.score.return_value = [
        ScoreResult(iid, 0.8, {"reason": "skill match"}),
    ]
    collab_scorer.score.return_value = [
        ScoreResult(iid, 0.6, {"reason": "popular"}),
    ]

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)

    with patch("app.engine.hybrid_combiner.settings") as mock_settings:
        mock_settings.content_weight = 0.7
        mock_settings.collaborative_weight = 0.3
        result = await combiner.recommend(uuid4(), {}, set(), 10)

    item = result.items[0]
    assert "content" in item.explanation
    assert "collaborative" in item.explanation
    assert "blendedScore" in item.explanation
    assert "weights" in item.explanation
    assert item.explanation["weights"]["content"] == 0.7
    assert item.explanation["weights"]["collaborative"] == 0.3


@pytest.mark.asyncio
async def test_dynamic_model_version(content_scorer, collab_scorer, cold_start):
    """Model version should be dynamically built from scorer versions."""
    cold_start.check.return_value = _cold_info(is_cold=False, count=5)

    content_scorer.score.return_value = [ScoreResult(uuid4(), 0.5, {})]
    collab_scorer.score.return_value = [ScoreResult(uuid4(), 0.5, {})]

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)

    with patch("app.engine.hybrid_combiner.settings") as mock_settings:
        mock_settings.content_weight = 0.7
        mock_settings.collaborative_weight = 0.3
        result = await combiner.recommend(uuid4(), {}, set(), 10)

    assert result.model_version == "hybrid-content-v0.1.0-collab-v0.1.0"


@pytest.mark.asyncio
async def test_limit_respected(content_scorer, collab_scorer, cold_start):
    """Should return at most `limit` items."""
    cold_start.check.return_value = _cold_info(is_cold=True, count=0)

    content_scorer.score.return_value = [
        ScoreResult(uuid4(), 0.9 - i * 0.1, {}) for i in range(20)
    ]

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)
    result = await combiner.recommend(uuid4(), {}, set(), 5)

    assert len(result.items) <= 5


@pytest.mark.asyncio
async def test_custom_weights(content_scorer, collab_scorer, cold_start):
    """Custom weights should affect blended scores."""
    cold_start.check.return_value = _cold_info(is_cold=False, count=5)

    iid = uuid4()
    content_scorer.score.return_value = [ScoreResult(iid, 1.0, {})]
    collab_scorer.score.return_value = [ScoreResult(iid, 1.0, {})]

    combiner = HybridCombiner(content_scorer, collab_scorer, cold_start)

    with patch("app.engine.hybrid_combiner.settings") as mock_settings:
        mock_settings.content_weight = 0.5
        mock_settings.collaborative_weight = 0.5
        result = await combiner.recommend(uuid4(), {}, set(), 10)

    # Both normalized to 1.0 (single item), so: 0.5*1.0 + 0.5*1.0 = 1.0
    assert result.items[0].score == pytest.approx(1.0, abs=0.01)
