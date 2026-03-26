"""
Training Pipeline for LightFM recommender.
Extracts interactions from Postgres, trains model, and saves artifacts.
"""

import os
import json
import uuid
from datetime import datetime, timezone
import numpy as np
import scipy.sparse as sp
import joblib
import sqlalchemy as sa

# Training-only dependency: `lightfm`.
# Provide a stub so importing this module doesn't break CI when `lightfm`
# isn't installed.
try:
    from lightfm import LightFM  # type: ignore
    from lightfm.evaluation import precision_at_k  # type: ignore
except Exception:  # pragma: no cover
    class LightFM:  # noqa: D401
        """Stub LightFM used when `lightfm` isn't installed."""

        def __init__(self, *args, **kwargs) -> None:
            pass

        def fit(self, *args, **kwargs) -> "LightFM":
            return self

    def precision_at_k(*args, **kwargs):
        raise RuntimeError(
            "lightfm is not installed. Install training deps with: "
            "pip install -r recs/requirements-train.txt"
        )


def get_db_engine():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL must be set")
    return sa.create_engine(db_url)


def load_interactions(engine):
    """
    Load user-item interactions from applications (weight 5) and saved_internships (weight 3).
    """
    query = sa.text("""
        SELECT student_id, internship_id, 5.0 as weight FROM applications
        UNION ALL
        SELECT student_id, internship_id, 3.0 as weight FROM saved_internships
    """)
    with engine.connect() as conn:
        rows = conn.execute(query).fetchall()
        
    interactions = []
    for row in rows:
        interactions.append({
            "user_id": str(row[0]),
            "item_id": str(row[1]),
            "weight": float(row[2])
        })
    return interactions


def build_interaction_matrix(interactions):
    unique_users = list(set(x["user_id"] for x in interactions))
    unique_items = list(set(x["item_id"] for x in interactions))
    
    user_mapping = {uid: i for i, uid in enumerate(unique_users)}
    item_mapping = {iid: i for i, iid in enumerate(unique_items)}
    
    user_indices = [user_mapping[x["user_id"]] for x in interactions]
    item_indices = [item_mapping[x["item_id"]] for x in interactions]
    weights = [x["weight"] for x in interactions]
    
    interactions_coo = sp.coo_matrix(
        (weights, (user_indices, item_indices)),
        shape=(len(unique_users), len(unique_items))
    )
    
    return interactions_coo, user_mapping, item_mapping


def train_and_save():
    try:
        engine = get_db_engine()
        interactions = load_interactions(engine)
    except Exception as e:
        print(f"Failed to connect to database or load interactions: {e}")
        return

    interaction_count = len(interactions)
    print(f"Loaded {interaction_count} interactions.")
    
    if interaction_count < 1000:
        print("Abort training: total interactions < 1000")
        return
        
    interactions_coo, user_mapping, item_mapping = build_interaction_matrix(interactions)
    interactions_csr = interactions_coo.tocsr()
    
    model = LightFM(loss="warp", no_components=64, learning_rate=0.05)
    
    print("Training LightFM model...")
    model.fit(interactions_coo, epochs=10, num_threads=2)
    
    print("Evaluating precision@10...")
    # Evaluate precision at 10 on the training set as a baseline
    p_at_k = precision_at_k(model, interactions_csr, k=10).mean()
    print(f"Precision@10: {p_at_k:.4f}")
    
    if p_at_k < 0.05:
        print("Abort training: precision@10 < 0.05")
        return
        
    # Save artifacts
    model_dir = os.environ.get("MODEL_DIR", "model_artifacts/hybrid-v0.2.0")
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"Saving artifacts to {model_dir}...")
    joblib.dump(model, os.path.join(model_dir, "model.joblib"))
    joblib.dump(user_mapping, os.path.join(model_dir, "user_mapping.joblib"))
    joblib.dump(item_mapping, os.path.join(model_dir, "item_mapping.joblib"))
    
    metadata = {
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "interaction_count": interaction_count,
        "precision_at_10": float(p_at_k),
        "hyperparameters": {
            "loss": "warp",
            "no_components": 64,
            "learning_rate": 0.05
        }
    }
    
    with open(os.path.join(model_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print("Training complete.")


if __name__ == "__main__":
    train_and_save()
