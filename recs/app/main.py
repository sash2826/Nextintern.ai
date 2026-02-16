"""
NextIntern.ai — Recommender Service
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.recommend import router as recommend_router
from app.core.config import settings

app = FastAPI(
    title="NextIntern Recommender Service",
    description="Content-based + hybrid internship recommendation engine",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

# CORS — internal service only, but useful for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router, tags=["health"])
app.include_router(recommend_router, tags=["recommendations"])
