import os
import json
import secrets
from packaging.version import parse as parse_version
import sqlalchemy as sa
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.api.recommend import scorer as hybrid_scorer

router = APIRouter()
scorer = hybrid_scorer.cf_scorer

_engine = None

def get_db_engine():
    global _engine
    if _engine is None:
        db_url = os.environ.get("DATABASE_URL", settings.database_url)
        _engine = sa.create_engine(db_url)
    return _engine

def verify_admin_token(x_admin_token: str = Header(...)):
    if not secrets.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status_code=403, detail="Invalid admin token")
    return x_admin_token

class RollbackRequest(BaseModel):
    version: str

class RollbackResponse(BaseModel):
    status: str
    message: str
    version: str

@router.get("/models", dependencies=[Depends(verify_admin_token)])
async def list_models():
    base_model_dir = os.environ.get("MODEL_DIR", "model_artifacts")
    prod_dir = os.path.join(base_model_dir, "production")
    versions_dir = os.path.join(base_model_dir, "versions")

    production_metadata = None
    if os.path.exists(prod_dir) and os.path.exists(os.path.join(prod_dir, "metadata.json")):
        try:
            with open(os.path.join(prod_dir, "metadata.json"), "r") as f:
                production_metadata = json.load(f)
        except Exception:
            pass
            
    active_symlink_target = None
    if os.path.islink(prod_dir):
        active_symlink_target = os.readlink(prod_dir)

    candidates = []
    if os.path.exists(versions_dir):
        for entry in os.listdir(versions_dir):
            cand_path = os.path.join(versions_dir, entry)
            if os.path.isdir(cand_path):
                meta_path = os.path.join(cand_path, "metadata.json")
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path, "r") as f:
                            meta = json.load(f)
                            candidates.append({
                                "version": entry,
                                "metadata": meta
                            })
                    except Exception:
                        pass
                        
    # Sort candidates desc
    def _parse_version(v):
        v_str = v["version"]
        if v_str.startswith("v"):
            v_str = v_str[1:]
        try:
            return parse_version(v_str)
        except Exception:
            return parse_version("0.0.0")

    candidates.sort(key=_parse_version, reverse=True)

    return {
        "production_metadata": production_metadata,
        "active_symlink_target": active_symlink_target,
        "available_versions": candidates
    }

@router.post("/models/rollback", response_model=RollbackResponse, dependencies=[Depends(verify_admin_token)])
async def rollback_model(req: RollbackRequest):
    base_model_dir = os.environ.get("MODEL_DIR", "model_artifacts")
    versions_dir = os.path.join(base_model_dir, "versions")
    
    resolved_versions = os.path.realpath(versions_dir)
    resolved_target = os.path.realpath(os.path.join(versions_dir, req.version))
    
    if not resolved_target.startswith(resolved_versions):
        raise HTTPException(status_code=400, detail="Invalid version path")
        
    target_dir = resolved_target

    if not os.path.exists(target_dir):
        raise HTTPException(status_code=404, detail="Candidate version not found")

    meta_path = os.path.join(target_dir, "metadata.json")
    model_path = os.path.join(target_dir, "model.joblib")

    if not os.path.exists(meta_path) or not os.path.exists(model_path):
        raise HTTPException(status_code=400, detail="Candidate directory is missing required artifacts")

    prod_dir = os.path.join(base_model_dir, "production")
    tmp_link = os.path.join(base_model_dir, "production_tmp")

    try:
        old_target = None
        if os.path.islink(prod_dir):
            old_target = os.readlink(prod_dir)
            
        # Create tmp symlink
        os.symlink(target_dir, tmp_link)
        # Atomic swap
        os.replace(tmp_link, prod_dir)
    except Exception as e:
        if os.path.islink(tmp_link):
            os.remove(tmp_link)
        raise HTTPException(status_code=500, detail=f"Failed to perform symlink swap: {e}")

    try:
        # Trigger hotswap in memory
        await scorer.reload_production_model()
    except Exception as e:
        if old_target is not None:
            os.symlink(old_target, tmp_link)
            os.replace(tmp_link, prod_dir)
        raise HTTPException(status_code=500, detail=f"Failed to hotswap model in memory: {e}")

    return RollbackResponse(
        status="success",
        message="Model rolled back successfully",
        version=req.version
    )


@router.get("/fairness/stats", dependencies=[Depends(verify_admin_token)])
async def get_fairness_stats():
    """Compute catalog and exposure fairness metrics using SQL aggregation."""
    engine = get_db_engine()
    
    catalog_query = sa.text("""
        SELECT provider_id, COUNT(*) as count
        FROM internships
        WHERE status = 'active'
        GROUP BY provider_id
        ORDER BY count DESC
    """)
    
    exposure_query = sa.text("""
        SELECT provider_id, COUNT(*) as exposure_count
        FROM recommendation_log
        CROSS JOIN UNNEST(internship_ids) AS internship_id
        JOIN internships USING (internship_id)
        GROUP BY provider_id
        ORDER BY exposure_count DESC
    """)
    
    with engine.connect() as conn:
        try:
            catalog_rows = conn.execute(catalog_query).fetchall()
        except sa.exc.ProgrammingError:
            catalog_rows = []
        try:
            exposure_rows = conn.execute(exposure_query).fetchall()
        except sa.exc.ProgrammingError:
            exposure_rows = []

    # Process Catalog Metrics
    total_providers = len(catalog_rows)
    if total_providers == 0:
        return {
            "catalog": {
                "total_active_providers": 0,
                "max_internships_per_provider": 0,
                "min_internships_per_provider": 0,
                "avg_internships_per_provider": 0,
                "gini_coefficient": 0.0,
                "top_5_providers": []
            },
            "exposure": {
                "top_provider_share": 0.0,
                "hhi_index": 0.0,
                "dominance_risk": "low"
            }
        }

    counts = [row[1] for row in catalog_rows]
    total_internships = sum(counts)
    
    # Gini coefficient
    sorted_counts = sorted(counts)
    n = len(sorted_counts)
    if n > 0 and total_internships > 0:
        index = [i + 1 for i in range(n)]
        gini = (2 * sum(i * count for i, count in zip(index, sorted_counts))) / (n * sum(sorted_counts)) - ((n + 1) / n)
    else:
        gini = 0.0

    catalog_metrics = {
        "total_active_providers": total_providers,
        "max_internships_per_provider": max(counts) if counts else 0,
        "min_internships_per_provider": min(counts) if counts else 0,
        "avg_internships_per_provider": round(total_internships / total_providers, 2) if total_providers else 0,
        "gini_coefficient": round(gini, 3),
        "top_5_providers": [{"provider_id": str(row[0]), "count": row[1]} for row in catalog_rows[:5]]
    }

    # Process Exposure Metrics
    total_exposure = sum(row[1] for row in exposure_rows)
    if total_exposure == 0:
        exposure_metrics = {
            "top_provider_share": 0.0,
            "hhi_index": 0.0,
            "dominance_risk": "low"
        }
    else:
        shares = [row[1] / total_exposure for row in exposure_rows]
        top_share = shares[0] if shares else 0.0
        hhi = sum(s * s for s in shares)
        
        # Risk classification based on HHI
        risk = "low"
        if hhi >= 0.5:
            risk = "high"
        elif hhi >= 0.3:
            risk = "medium"
            
        exposure_metrics = {
            "top_provider_share": round(top_share, 3),
            "hhi_index": round(hhi, 3),
            "dominance_risk_exposure": risk
        }

    return {
        "catalog": catalog_metrics,
        "exposure": exposure_metrics
    }
