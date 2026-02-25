import time
from typing import Callable

from fastapi import APIRouter, Request, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware

router = APIRouter()

# --- Definitions ---

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP Requests",
    ["method", "endpoint", "status"]
)

http_errors_total = Counter(
    "http_errors_total",
    "Total HTTP Errors",
    ["endpoint"]
)

recommendations_served_total = Counter(
    "recommendations_served_total",
    "Total Recommendations Served"
)

recommendation_strategy_total = Counter(
    "recommendation_strategy_total",
    "Recommendations by Strategy",
    ["strategy"]
)

LATENCY_BUCKETS = (0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, float("inf"))

http_request_latency_seconds = Histogram(
    "http_request_latency_seconds",
    "HTTP Request Latency",
    ["method", "endpoint"],
    buckets=LATENCY_BUCKETS
)

recommendation_latency_seconds = Histogram(
    "recommendation_latency_seconds",
    "Recommendation Generation Latency",
    buckets=LATENCY_BUCKETS
)

# --- Middleware ---

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        
        if path == "/metrics":
            return await call_next(request)
            
        method = request.method
        endpoint = request.url.path
        
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
            status = str(response.status_code)
        except Exception:
            status = "500"
            raise
        finally:
            latency = time.perf_counter() - start_time
            http_request_latency_seconds.labels(method=method, endpoint=endpoint).observe(latency)
            http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
            
            if status.startswith("4") or status.startswith("5"):
                http_errors_total.labels(endpoint=endpoint).inc()

        return response

# --- Endpoint ---

@router.get("/metrics")
async def get_metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
