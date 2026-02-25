from uuid import UUID
from typing import TypedDict, Any

class ScoreResult(TypedDict):
    internship_id: UUID
    provider_id: UUID
    score: float
    explanation: dict[str, Any]

class FairnessMetrics(TypedDict):
    provider_distribution: dict[UUID, int]
    max_provider_count: int
    capped_providers: list[UUID]
    skipped_items: int
    fairness_relaxed: bool

class FairnessLayer:
    def __init__(self, max_per_provider: int):
        if max_per_provider <= 0:
            raise ValueError("max_per_provider must be a positive integer")
        self.max_per_provider = max_per_provider

    def apply(
        self,
        ranked_items: list[ScoreResult],
        top_n: int
    ) -> tuple[list[ScoreResult], FairnessMetrics]:
        selected: list[ScoreResult] = []
        skipped: list[ScoreResult] = []
        provider_counts: dict[UUID, int] = {}
        
        for item in ranked_items:
            if len(selected) >= top_n:
                break
                
            pid = item["provider_id"]
            count = provider_counts.get(pid, 0)
            
            if count < self.max_per_provider:
                provider_counts[pid] = count + 1
                selected.append(item)
            else:
                skipped.append(item)
                
        fairness_relaxed = False
        
        # Fallback: if we haven't reached top_n and have skipped items, relax cap
        if len(selected) < top_n and skipped:
            fairness_relaxed = True
            for item in skipped:
                if len(selected) >= top_n:
                    break
                pid = item["provider_id"]
                provider_counts[pid] = provider_counts.get(pid, 0) + 1
                selected.append(item)
                
        capped_providers = [pid for pid, count in provider_counts.items() if count >= self.max_per_provider]
        
        metrics = FairnessMetrics(
            provider_distribution=provider_counts,
            max_provider_count=max(provider_counts.values()) if provider_counts else 0,
            capped_providers=capped_providers,
            skipped_items=len(ranked_items) - len(selected),
            fairness_relaxed=fairness_relaxed
        )
        
        return selected, metrics
