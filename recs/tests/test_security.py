import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_security_headers_present():
    # We can use /health to check headers without triggering rate limits
    res = client.get("/health")
    assert res.status_code == 200
    
    headers = res.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "no-referrer"
    assert "Content-Security-Policy" in headers

def test_security_headers_omitted_on_metrics():
    res = client.get("/metrics")
    assert res.status_code == 200
    
    headers = res.headers
    assert "X-Frame-Options" not in headers

@patch("app.api.recommend.scorer")
@patch("app.api.recommend.BackgroundTasks.add_task")
def test_rate_limiting_recommend(mock_add_task, mock_scorer):
    # Mock scorer
    mock_scorer.score = AsyncMock(return_value={
        "items": [],
        "cold_start": False,
        "strategy": "content",
        "fairness_metrics": {}
    })
    
    req_data = {
        "user_id": str(uuid4()),
        "profile": {
            "skills": [],
            "interests": []
        }
    }

    # The limit is 50/minute string, we can hit it 51 times
    
    # We need to ensure we have a fresh IP or limiter state for the test, 
    # but since this is a unit test, we'll just hit it 51 times.
    # Note: If Redis is not available locally during CI, SlowAPI might fallback to memory 
    # or fail depending on storage_uri. Assuming memory fallback or redis is up.
    
    responses = []
    for _ in range(51):
        # Different IP to avoid breaking other tests, we can spoof X-Forwarded-For 
        # but slowapi might just use the test client IP (usually 127.0.0.1 or testserver)
        res = client.post("/recommend", json=req_data, headers={"X-Forwarded-For": "192.168.1.100"})
        responses.append(res.status_code)
        if res.status_code == 429:
            break

    # We expect at least one 429 (Too Many Requests)
    assert 429 in responses

def test_production_config_validation():
    from app.core.config import Settings
    
    # Should raise RuntimeError because debug=True
    with pytest.raises(RuntimeError) as exc_info:
        Settings(env="production", debug=True, admin_token="secure")
    
    assert "DEBUG must be False" in str(exc_info.value)
    
    # Should raise RuntimeError because token is default
    with pytest.raises(RuntimeError) as exc_info:
        Settings(env="production", debug=False, admin_token="dev-admin-secret")
        
    assert "ADMIN_TOKEN must be changed" in str(exc_info.value)
    
    # Valid
    Settings(env="production", debug=False, admin_token="super-secret")
