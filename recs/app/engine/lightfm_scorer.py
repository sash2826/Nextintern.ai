"""
LightFM scorer using artifacts loaded at startup.
Supports loading both production and candidate models for shadow execution.
"""
import os
import joblib
import numpy as np
from uuid import UUID
import asyncio

class LightFMScorer:
    """LightFM scorer for collaborative filtering."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LightFMScorer, cls).__new__(cls)
            cls._instance._init_models()
        return cls._instance
        
    def _init_models(self):
        self.prod_model = None
        self.prod_user_mapping = {}
        self.prod_item_mapping = {}
        self.prod_ready = False
        
        self.cand_model = None
        self.cand_user_mapping = {}
        self.cand_item_mapping = {}
        self.cand_ready = False
        self._reload_lock = None  # Lazily created inside async context
        self._load_production_model()
        
    def _load_production_model(self):
        base_model_dir = os.environ.get("MODEL_DIR", "model_artifacts")
        prod_dir = os.path.join(base_model_dir, "production")
        
        # Load production model
        if os.path.exists(prod_dir):
            try:
                # Load locally first
                new_model = joblib.load(os.path.join(prod_dir, "model.joblib"))
                new_user_mapping = joblib.load(os.path.join(prod_dir, "user_mapping.joblib"))
                new_item_mapping = joblib.load(os.path.join(prod_dir, "item_mapping.joblib"))
                
                # Swap references atomically
                self.prod_model = new_model
                self.prod_user_mapping = new_user_mapping
                self.prod_item_mapping = new_item_mapping
                self.prod_ready = True
            except Exception as e:
                print(f"Failed to load production model: {e}")
                
        return base_model_dir

    async def reload_production_model(self):
        """Hot-reload the production model safely."""
        if self._reload_lock is None:
            self._reload_lock = asyncio.Lock()
        async with self._reload_lock:
            base_model_dir = await asyncio.to_thread(self._load_production_model)
                
            active_candidate = os.environ.get("ACTIVE_CANDIDATE")
            if active_candidate:
                cand_dir = os.path.join(base_model_dir, "candidates", active_candidate)
                if os.path.exists(cand_dir):
                    try:
                        def _load_cand():
                            return (
                                joblib.load(os.path.join(cand_dir, "model.joblib")),
                                joblib.load(os.path.join(cand_dir, "user_mapping.joblib")),
                                joblib.load(os.path.join(cand_dir, "item_mapping.joblib"))
                            )
                        c_model, c_um, c_im = await asyncio.to_thread(_load_cand)
                        self.cand_model = c_model
                        self.cand_user_mapping = c_um
                        self.cand_item_mapping = c_im
                        self.cand_ready = True
                    except Exception as e:
                        print(f"Failed to load candidate model {active_candidate}: {e}")

    def is_cold_start_production(self, user_id: UUID) -> bool:
        return str(user_id) not in self.prod_user_mapping

    def _score_internal(self, user_id: UUID, candidate_ids: list[UUID], model, u_mapping, i_mapping, ready) -> dict[UUID, float]:
        if not ready:
            return {}
            
        uid_str = str(user_id)
        if uid_str not in u_mapping:
            return {}
            
        u_idx = u_mapping[uid_str]
        
        valid_candidates = []
        i_indices = []
        
        for cid in candidate_ids:
            cid_str = str(cid)
            if cid_str in i_mapping:
                valid_candidates.append(cid)
                i_indices.append(i_mapping[cid_str])
                
        if not i_indices:
            return {}
            
        u_indices = np.full(len(i_indices), u_idx, dtype=np.int32)
        i_indices = np.array(i_indices, dtype=np.int32)
        
        scores = model.predict(u_indices, i_indices)
        
        return {cid: float(score) for cid, score in zip(valid_candidates, scores)}

    def score_production(self, user_id: UUID, candidate_ids: list[UUID]) -> dict[UUID, float]:
        """Generate CF scores using production model."""
        return self._score_internal(user_id, candidate_ids, self.prod_model, self.prod_user_mapping, self.prod_item_mapping, self.prod_ready)
        
    def score_candidate(self, user_id: UUID, candidate_ids: list[UUID]) -> dict[UUID, float]:
        """Generate CF scores using candidate model for shadow testing."""
        return self._score_internal(user_id, candidate_ids, self.cand_model, self.cand_user_mapping, self.cand_item_mapping, self.cand_ready)
