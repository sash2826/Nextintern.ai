import pytest
from unittest.mock import patch, AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.api.metrics import (
    http_requests_total,
    recommendations_served_total,
    recommendation_strategy_total
)

client = TestClient(app)

def test_metrics_endpoint_returns_200():
    # Make a dummy request to trigger middleware
    client.get("/health")
    
    response = client.get("/metrics")
    assert response.status_code == 200
    
    # Check if prometheus metrics format is returned
    text = response.text
    assert "http_requests_total" in text
    assert 'endpoint="/health"' in text
    assert 'status="200"' in text

@patch("app.api.recommend.scorer")
@patch("app.api.recommend.BackgroundTasks.add_task")
def test_recommend_increments_metrics(mock_add_task, mock_scorer):
    mock_scorer.score = AsyncMock(return_value={
        "items": [],
        "cold_start": True,
        "strategy": "content",
        "fairness_metrics": {}
    })
    
    # Store previous metric values
    prev_served = recommendations_served_total._value.get()
    
    req_data = {
        "user_id": str(uuid4()),
        "profile": {
            "skills": [],
            "interests": []
        }
    }
    
    res = client.post("/recommend", json=req_data)
    assert res.status_code == 200
    
    # Check if metrics incremented
    assert recommendations_served_total._value.get() == prev_served + 1
    
    # Check if /metrics exposes it
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    text = metrics_res.text
    assert "recommendations_served_total" in text
    assert "recommendation_strategy_total" in text
