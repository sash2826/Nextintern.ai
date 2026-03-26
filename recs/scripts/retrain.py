"""
Retrain Pipeline for LightFM recommender.
Extracts interactions from Postgres, trains candidate model, evaluates, and conditionally promotes.
"""

import os
import json
import uuid
import shutil
import argparse
from datetime import datetime, timezone
import numpy as np
import scipy.sparse as sp
import joblib
import sqlalchemy as sa

# Training-only dependency: `lightfm`.
# CI/tests don't need training, but unit tests patch `precision_at_k` at module scope,
# so we must provide that symbol even when `lightfm` isn't installed.
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


MIN_INTERACTIONS = 1000
MAX_MODEL_SIZE_MB = 500

def get_db_engine():
    # Tests patch `load_interactions` and don't set DATABASE_URL.
    # Creating an engine is safe (it doesn't connect), so provide a default.
    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://recs_readonly:recs_readonly_dev@localhost:5432/nextintern",
    )
    return sa.create_engine(db_url)


def load_interactions(engine):
    """Load user-item interactions from applications and saved_internships."""
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


def get_production_precision():
    prod_meta_path = os.path.join(os.environ.get("MODEL_DIR", "model_artifacts"), "production", "metadata.json")
    if os.path.exists(prod_meta_path):
        try:
            with open(prod_meta_path, "r") as f:
                meta = json.load(f)
                return meta.get("precision_at_10", 0.0)
        except Exception:
            return 0.0
    return 0.0


def check_model_size(model_dir):
    total_size = 0
    for dirpath, _, filenames in os.walk(model_dir):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return total_size / (1024 * 1024)


def train_candidate():
    print("Starting retraining pipeline...")
    try:
        engine = get_db_engine()
        interactions = load_interactions(engine)
    except Exception as e:
        print(f"Failed to connect to database or load interactions: {e}")
        return False

    interaction_count = len(interactions)
    print(f"Loaded {interaction_count} interactions.")
    
    if interaction_count < MIN_INTERACTIONS:
        print(f"Abort training: total interactions ({interaction_count}) < {MIN_INTERACTIONS}")
        return False
        
    interactions_coo, user_mapping, item_mapping = build_interaction_matrix(interactions)
    interactions_csr = interactions_coo.tocsr()
    
    model = LightFM(loss="warp", no_components=64, learning_rate=0.05)
    
    print("Training LightFM candidate model...")
    model.fit(interactions_coo, epochs=10, num_threads=2)
    
    print("Evaluating precision@10...")
    p_at_k = precision_at_k(model, interactions_csr, k=10).mean()
    print(f"Candidate Precision@10: {p_at_k:.4f}")
    
    prod_precision = get_production_precision()
    print(f"Production Precision@10: {prod_precision:.4f}")
    
    if p_at_k < 0.9 * prod_precision:
        print("Abort training: candidate precision is < 90% of production precision")
        return False
        
    # Save candidate artifacts
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    base_model_dir = os.environ.get("MODEL_DIR", "model_artifacts")
    candidate_dir = os.path.join(base_model_dir, "candidates", timestamp)
    os.makedirs(candidate_dir, exist_ok=True)
    
    print(f"Saving candidate artifacts to {candidate_dir}...")
    joblib.dump(model, os.path.join(candidate_dir, "model.joblib"))
    joblib.dump(user_mapping, os.path.join(candidate_dir, "user_mapping.joblib"))
    joblib.dump(item_mapping, os.path.join(candidate_dir, "item_mapping.joblib"))
    
    size_mb = check_model_size(candidate_dir)
    print(f"Candidate model size: {size_mb:.2f} MB")
    
    if size_mb > MAX_MODEL_SIZE_MB:
        print(f"Abort training: candidate model size > {MAX_MODEL_SIZE_MB}MB")
        shutil.rmtree(candidate_dir)
        return False
    
    metadata = {
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "interaction_count": interaction_count,
        "precision_at_10": float(p_at_k),
        "model_size_mb": float(size_mb),
        "hyperparameters": {
            "loss": "warp",
            "no_components": 64,
            "learning_rate": 0.05
        }
    }
    
    with open(os.path.join(candidate_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Candidate generation successful: {timestamp}")
    return True


def promote_candidate(timestamp):
    base_model_dir = os.environ.get("MODEL_DIR", "model_artifacts")
    candidate_dir = os.path.join(base_model_dir, "candidates", timestamp)
    prod_dir = os.path.join(base_model_dir, "production")
    
    if not os.path.exists(candidate_dir):
        print(f"Error: Candidate {timestamp} not found.")
        return
        
    print(f"Promoting candidate {timestamp} to production...")
    if os.path.exists(prod_dir):
        shutil.rmtree(prod_dir)
    shutil.copytree(candidate_dir, prod_dir)
    print("Promotion complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrain Pipeline")
    parser.add_argument("--shadow", action="store_true", help="Run in shadow mode (generate candidate)")
    parser.add_argument("--promote", type=str, help="Promote a candidate timestamp to production")
    
    args = parser.parse_args()
    
    if args.promote:
        promote_candidate(args.promote)
    elif args.shadow:
        train_candidate()
    else:
        print("Please specify --shadow or --promote <timestamp>")
