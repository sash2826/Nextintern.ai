import pytest
from uuid import uuid4
from app.engine.fairness import FairnessLayer, ScoreResult

def create_item(provider_id, score=1.0) -> ScoreResult:
    return {
        "internship_id": uuid4(),
        "provider_id": provider_id,
        "score": score,
        "explanation": {}
    }

def test_provider_dominance():
    fairness = FairnessLayer(max_per_provider=3)
    p1 = uuid4()
    p2 = uuid4()
    
    # 10 items from p1, 2 from p2
    items = [create_item(p1, score=10-i) for i in range(10)]
    items.extend([create_item(p2, score=0.5), create_item(p2, score=0.4)])
    
    # Sort just in case setup was slightly off
    items.sort(key=lambda x: x["score"], reverse=True)
    
    results, metrics = fairness.apply(items, top_n=5)
    
    assert len(results) == 5
    # Should be 3 from p1, 2 from p2
    p1_count = sum(1 for r in results if r["provider_id"] == p1)
    p2_count = sum(1 for r in results if r["provider_id"] == p2)
    
    assert p1_count == 3
    assert p2_count == 2
    assert metrics["max_provider_count"] == 3
    assert metrics["fairness_relaxed"] is False

def test_balanced_providers():
    fairness = FairnessLayer(max_per_provider=3)
    providers = [uuid4() for _ in range(5)]
    items = []
    
    # 2 items per provider, 10 total
    score = 10.0
    for p in providers:
        items.append(create_item(p, score))
        score -= 0.1
        items.append(create_item(p, score))
        score -= 0.1
        
    results, metrics = fairness.apply(items, top_n=5)
    
    assert len(results) == 5
    assert not metrics["fairness_relaxed"]
    assert metrics["max_provider_count"] <= 2

def test_insufficient_diversity():
    fairness = FairnessLayer(max_per_provider=2)
    p1 = uuid4()
    p2 = uuid4()
    
    # Only 2 providers, but we want top 10. Max allowed under strict is 4.
    items = [create_item(p1, 10-i) for i in range(6)]
    items.extend([create_item(p2, 5-i) for i in range(4)])
    
    items.sort(key=lambda x: x["score"], reverse=True)
    
    results, metrics = fairness.apply(items, top_n=10)
    
    assert len(results) == 10
    assert metrics["fairness_relaxed"] is True
    assert metrics["max_provider_count"] == 6

def test_determinism():
    fairness = FairnessLayer(max_per_provider=2)
    p1 = uuid4()
    p2 = uuid4()
    
    items = [create_item(p1, 10-i) for i in range(5)]
    items.extend([create_item(p2, 5-i) for i in range(5)])
    items.sort(key=lambda x: x["score"], reverse=True)
    
    results1, _ = fairness.apply(items, top_n=5)
    results2, _ = fairness.apply(items, top_n=5)
    
    ids1 = [r["internship_id"] for r in results1]
    ids2 = [r["internship_id"] for r in results2]
    
    assert ids1 == ids2
