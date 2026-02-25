"""
Hybrid Combiner that blends Content-Based and Collaborative Filtering scores.
Supports Shadow Mode for evaluating candidate models alongside production.
"""
import asyncio
from uuid import UUID
from typing import Optional, Any
import numpy as np

from app.engine.content_scorer import ContentScorer
from app.engine.lightfm_scorer import LightFMScorer
from app.engine.fairness import FairnessLayer
from app.core.config import settings

class HybridCombiner:
    """Orchestrates hybrid scoring across content and collaborative scorers."""
    
    def __init__(self):
        self.content_scorer = ContentScorer()
        self.cf_scorer = LightFMScorer()
        self.fairness_layer = FairnessLayer(max_per_provider=2)
        
    def _normalize(self, scores_dict):
        if not scores_dict: return {}
        vals = list(scores_dict.values())
        min_v, max_v = min(vals), max(vals)
        if max_v == min_v:
            return {k: 1.0 for k in scores_dict}
        return {k: (v - min_v) / (max_v - min_v) for k, v in scores_dict.items()}

    async def score(self, user_id: UUID, profile, exclude_ids: list[UUID], limit: int = 10) -> dict:
        """
        Generate blended recommendations using production model, and compute shadow metrics if candidate prevails.
        """
        # Get content scores
        cb_scored_raw = await self.content_scorer.score(
            profile=profile,
            exclude_ids=exclude_ids,
            limit=1000  # Pull more for blending
        )
        
        if not cb_scored_raw:
            return {"items": [], "cold_start": True, "strategy": "content", "fairness_metrics": {}}
            
        candidate_ids = [item["internship_id"] for item in cb_scored_raw]
        
        # Detect cold start for production
        is_cold_prod_initial = self.cf_scorer.is_cold_start_production(user_id)
        is_cold_prod = is_cold_prod_initial
        
        prod_cf_raw_scores = {}
        if not is_cold_prod:
            prod_cf_raw_scores = await asyncio.to_thread(self.cf_scorer.score_production, user_id, candidate_ids)
            if not prod_cf_raw_scores:
                is_cold_prod = True # fallback if CF returned empty
                
        # Shadow evaluation
        shadow_metrics = None
        if self.cf_scorer.cand_ready and not is_cold_prod and bool(prod_cf_raw_scores):
            cand_cf_raw_scores = await asyncio.to_thread(self.cf_scorer.score_candidate, user_id, candidate_ids)
            if cand_cf_raw_scores:
                # Calculate metrics between prod and cand scores
                prod_vals = [prod_cf_raw_scores.get(cid, 0.0) for cid in candidate_ids]
                cand_vals = [cand_cf_raw_scores.get(cid, 0.0) for cid in candidate_ids]
                
                mean_score_delta = float(np.mean(np.array(cand_vals) - np.array(prod_vals)))
                mean_candidate_score = float(np.mean(cand_vals))
                
                # Top-N overlap ratio (top 10 CF scores)
                prod_top = set(sorted(prod_cf_raw_scores, key=prod_cf_raw_scores.get, reverse=True)[:10])
                cand_top = set(sorted(cand_cf_raw_scores, key=cand_cf_raw_scores.get, reverse=True)[:10])
                overlap_ratio = len(prod_top.intersection(cand_top)) / max(1, len(prod_top))
                
                shadow_metrics = {
                    "mean_score_delta": mean_score_delta,
                    "top_N_overlap_ratio": overlap_ratio,
                    "mean_candidate_score": mean_candidate_score
                }

        # Normalize production scores
        cb_scores_dict = {item["internship_id"]: item["score"] for item in cb_scored_raw}
        norm_cb_scores = self._normalize(cb_scores_dict)
        norm_cf_scores = self._normalize(prod_cf_raw_scores) if prod_cf_raw_scores else {}
        
        # Blend (Production only to users)
        w_cb = settings.content_weight
        w_cf = settings.cf_weight
        
        blended = []
        for cb_item in cb_scored_raw:
            iid = cb_item["internship_id"]
            pid = cb_item["provider_id"]
            
            if is_cold_prod:
                final_score = norm_cb_scores.get(iid, 0.0)
                strategy_used = "content_fallback" if bool(prod_cf_raw_scores) and not is_cold_prod_initial else "content_cold_start"
            else:
                c_score = norm_cb_scores.get(iid, 0.0)
                cf_score = norm_cf_scores.get(iid, 0.0)
                final_score = w_cb * c_score + w_cf * cf_score
                strategy_used = "hybrid"
                
            explanation = cb_item["explanation"].copy()
            explanation["isColdStart"] = is_cold_prod
            explanation["strategy"] = strategy_used
            
            blended.append({
                "internship_id": iid,
                "provider_id": pid,
                "score": round(final_score, 4),
                "explanation": explanation
            })
            
        blended.sort(key=lambda x: x["score"], reverse=True)
        
        fair_results, metrics = self.fairness_layer.apply(blended, limit)
        
        strategy = "content" if is_cold_prod else "hybrid"
        
        output = {
            "items": fair_results,
            "cold_start": is_cold_prod,
            "strategy": strategy,
            "fairness_metrics": metrics
        }
        
        if shadow_metrics:
            output["shadow_metrics"] = shadow_metrics
            
        return output
