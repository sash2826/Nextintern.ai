import os
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

valid_token = "dev-admin-secret"

def test_admin_invalid_token():
    response = client.get("/admin/models", headers={"X-Admin-Token": "wrong-token"})
    assert response.status_code == 403
    
    response = client.post("/admin/models/rollback", json={"version": "123"}, headers={"X-Admin-Token": "wrong-token"})
    assert response.status_code == 403

def test_rollback_missing_candidate(tmp_path):
    with patch.dict(os.environ, {"MODEL_DIR": str(tmp_path)}):
        response = client.post(
            "/admin/models/rollback", 
            json={"version": "nonexistent"}, 
            headers={"X-Admin-Token": valid_token}
        )
        assert response.status_code == 404

@patch("app.api.admin.scorer", new_callable=AsyncMock)
def test_successful_rollback(mock_scorer, tmp_path):
    base_dir = tmp_path
    versions_dir = base_dir / "versions"
    versions_dir.mkdir()
    
    cand_dir = versions_dir / "2026-01-01T00:00:00Z"
    cand_dir.mkdir()
    
    # Create fake artifacts
    (cand_dir / "metadata.json").write_text('{"foo":"bar"}')
    (cand_dir / "model.joblib").write_text('fake_model')
    
    with patch.dict(os.environ, {"MODEL_DIR": str(base_dir)}):
        # We need os.symlink to work correctly. Windows privileges can be an issue so we mock os.symlink and os.replace
        with patch("os.symlink") as mock_sym, patch("os.replace") as mock_rep:
            response = client.post(
                "/admin/models/rollback", 
                json={"version": "2026-01-01T00:00:00Z"}, 
                headers={"X-Admin-Token": valid_token}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["version"] == "2026-01-01T00:00:00Z"
            
            mock_sym.assert_called_once()
            mock_rep.assert_called_once()
            
            # Verify reload was called
            mock_scorer.reload_production_model.assert_awaited_once()

def test_list_models(tmp_path):
    base_dir = tmp_path
    versions_dir = base_dir / "versions"
    versions_dir.mkdir()
    
    # Candidate 1
    cand_1 = versions_dir / "v1"
    cand_1.mkdir()
    (cand_1 / "metadata.json").write_text('{"version": "v1"}')
    
    # Candidate 2
    cand_2 = versions_dir / "v2"
    cand_2.mkdir()
    (cand_2 / "metadata.json").write_text('{"version": "v2"}')
    
    with patch.dict(os.environ, {"MODEL_DIR": str(base_dir)}):
        response = client.get("/admin/models", headers={"X-Admin-Token": valid_token})
        assert response.status_code == 200
        data = response.json()
        assert len(data["available_versions"]) == 2
        # sorted desc v2, v1
        assert data["available_versions"][0]["version"] == "v2"
