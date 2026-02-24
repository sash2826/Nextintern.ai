"""Smoke tests for the Recs FastAPI service."""

from app.api.health import router
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Build a minimal app with only the health router
# (avoids importing the full app which connects to the DB on startup)
_app = FastAPI()
_app.include_router(router)
client = TestClient(_app)


def test_health_endpoint():
    """Health endpoint should return 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "nextintern-recs"
