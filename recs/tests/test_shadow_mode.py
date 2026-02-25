import pytest
from uuid import uuid4
import numpy as np

from app.engine.lightfm_scorer import LightFMScorer
from app.engine.hybrid_combiner import HybridCombiner

class MockLightFMScorer:
    def __init__(self):
        self.prod_ready = True
        self.cand_ready = True
    
    def is_cold_start_production(self, user_id):
        return False
        
    def score_production(self, user_id, candidate_ids):
        # Return deterministic scores for production
        return {cid: float(sum(cid.bytes) % 100) / 100.0 for cid in candidate_ids}
        
    def score_candidate(self, user_id, candidate_ids):
        # Candidate runs slightly higher on average
        return {cid: (float(sum(cid.bytes) % 100) / 100.0) + 0.1 for cid in candidate_ids}

class MockContentScorer:
    async def score(self, profile, exclude_ids, limit):
        # Create 10 dummy items
        results = []
        for i in range(10):
            iid = uuid4()
            results.append({
                "internship_id": iid,
                "provider_id": uuid4(),
                "score": float(i) / 10.0,
                "explanation": {"reason": "Content Match"}
            })
        return results

@pytest.fixture
def hybrid_scorer():
    combiner = HybridCombiner()
    # inject mock scorers
    combiner.cf_scorer = MockLightFMScorer()
    combiner.content_scorer = MockContentScorer()
    return combiner

@pytest.mark.asyncio
async def test_shadow_mode(hybrid_scorer):
    user_id = uuid4()
    
    # Run a recommendation
    res = await hybrid_scorer.score(user_id, profile=None, exclude_ids=[])
    
    assert "items" in res
    assert len(res["items"]) <= 10
    
    # Assert shadow_metrics is present
    assert "shadow_metrics" in res
    metrics = res["shadow_metrics"]
    
    assert "mean_score_delta" in metrics
    assert "top_N_overlap_ratio" in metrics
    assert "mean_candidate_score" in metrics
    
    # Given candidate is explicitly +0.1 over production
    assert pytest.approx(metrics["mean_score_delta"]) == 0.1
    
    # Overlap should be the exact same top N items since candidate simply shifts all elements by 0.1
    # Thus the ordering doesn't change
    assert metrics["top_N_overlap_ratio"] == 1.0
