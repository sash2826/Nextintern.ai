import os
import shutil
import json
import pytest
from unittest.mock import patch, MagicMock

import scipy.sparse as sp
import numpy as np

# We have to patch get_db_engine to avoid actual DB calls
@pytest.fixture
def mock_db_engine():
    with patch("scripts.retrain.get_db_engine") as mock:
        yield mock

@pytest.fixture
def mock_db_data():
    with patch("scripts.retrain.load_interactions") as mock:
        yield mock

from scripts.retrain import train_candidate, MIN_INTERACTIONS, MAX_MODEL_SIZE_MB

def test_abort_on_low_interactions(mock_db_data):
    # Only supply 10 interactions < MIN_INTERACTIONS (1000)
    mock_db_data.return_value = [{"user_id": str(i), "item_id": str(i), "weight": 5.0} for i in range(10)]
    
    assert train_candidate() is False

@patch("scripts.retrain.get_production_precision")
def test_abort_on_precision_drop(mock_prod_precision, mock_db_data):
    # Supply enough interactions
    mock_db_data.return_value = [{"user_id": str(i), "item_id": "item1", "weight": 5.0} for i in range(MIN_INTERACTIONS + 1)]
    
    # Force production to be 1.0, and fake the candidate to be 0
    mock_prod_precision.return_value = 1.0
    
    with patch("scripts.retrain.precision_at_k") as mock_pak:
        mock_arr = MagicMock()
        mock_arr.mean.return_value = 0.5 # < 0.9 * 1.0
        mock_pak.return_value = mock_arr
        
        assert train_candidate() is False

@patch("scripts.retrain.get_production_precision")
@patch("scripts.retrain.datetime")
def test_success_saves_candidate(mock_dt, mock_prod_precision, mock_db_data, tmp_path):
    # Setup enough interactions
    mock_db_data.return_value = [{"user_id": str(i), "item_id": "item1", "weight": 5.0} for i in range(MIN_INTERACTIONS + 1)]
    
    # Acceptable precision
    mock_prod_precision.return_value = 0.5
    
    # Mock datetime to control folder name
    mock_dt.now.return_value.strftime.return_value = "20260101T000000"
    mock_dt.now.return_value.isoformat.return_value = "2026-01-01T00:00:00Z"
    
    with patch("scripts.retrain.precision_at_k") as mock_pak, \
         patch.dict(os.environ, {"MODEL_DIR": str(tmp_path)}):
        
        mock_arr = MagicMock()
        mock_arr.mean.return_value = 0.6 # > 0.9 * 0.5
        mock_pak.return_value = mock_arr
        
        assert train_candidate() is True
        
        cand_dir = tmp_path / "candidates" / "20260101T000000"
        assert cand_dir.exists()
        assert (cand_dir / "model.joblib").exists()
        assert (cand_dir / "metadata.json").exists()
        
        with open(cand_dir / "metadata.json", "r") as f:
            meta = json.load(f)
            assert meta["interaction_count"] > MIN_INTERACTIONS
            assert meta["precision_at_10"] == 0.6
