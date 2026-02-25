"""
NextIntern.ai — Recommender Service
FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.health import router as health_router
from app.api.recommend import router as recommend_router
from app.api.admin import router as admin_router
from app.api.metrics import router as metrics_router, MetricsMiddleware
from app.core.config import settings

app = FastAPI(
    title="NextIntern Recommender Service",
    description="Content-based + hybrid internship recommendation engine",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

# SlowAPI Rate Limiter
from app.api.recommend import limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Don't apply to metrics
        if request.url.path == "/metrics":
            return response
            
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        
        # In a real app the CSP would jump here, omitted full CSP logic to keep simple
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        if settings.env == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS — internal service only, but useful for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics
app.add_middleware(MetricsMiddleware)

# Routers
app.include_router(health_router, tags=["health"])
app.include_router(recommend_router, tags=["recommendations"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(metrics_router, tags=["metrics"])
