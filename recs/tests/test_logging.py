import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient
from fastapi import BackgroundTasks

from app.main import app
from app.api.recommend import RecommendRequest, UserProfile, RecommendContext

client = TestClient(app)

@patch("app.api.recommend.scorer")
@patch("app.api.recommend.BackgroundTasks.add_task")
def test_recommend_logging_background_task(mock_add_task, mock_scorer):
    # Mock scorer output
    mock_scorer.score = AsyncMock(return_value={
        "items": [
            {"internship_id": uuid4(), "score": 0.9, "explanation": {}},
            {"internship_id": uuid4(), "score": 0.8, "explanation": {}}
        ],
        "cold_start": False,
        "strategy": "hybrid",
        "fairness_metrics": {"foo": "bar"}
    })
    
    user_id = uuid4()
    req_data = {
        "user_id": str(user_id),
        "profile": {
            "skills": [{"name": "Python", "proficiency": 3}],
            "interests": ["AI"]
        }
    }
    
    res = client.post("/recommend", json=req_data)
    
    assert res.status_code == 200
    
    # Assert background task was queued correctly
    mock_add_task.assert_called_once()
    
    # Check arguments
    args, kwargs = mock_add_task.call_args
    from app.api.logging_service import log_recommendation
    assert args[0] == log_recommendation
    assert kwargs["user_id"] == user_id
    assert len(kwargs["internship_ids"]) == 2
    assert kwargs["model_version"] == "hybrid-v0.2.0"
    assert kwargs["strategy"] == "hybrid"
    assert "latency_ms" in kwargs
    assert kwargs["fairness_metrics"] == {"foo": "bar"}

@patch("app.api.logging_service._get_engine")
@pytest.mark.asyncio
async def test_log_recommendation_swallows_errors(mock_get_engine):
    # Mock engine throwing exception
    mock_engine = MagicMock()
    mock_engine.begin.side_effect = Exception("DB Connection Error")
    mock_get_engine.return_value = mock_engine
    
    from app.api.logging_service import log_recommendation
    # Should not raise exception
    await log_recommendation(
        user_id=uuid4(),
        internship_ids=[uuid4()],
        model_version="test",
        strategy="test",
        latency_ms=10,
        fairness_metrics={}
    )
