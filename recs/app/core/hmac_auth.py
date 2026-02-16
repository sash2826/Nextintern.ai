"""
HMAC authentication middleware for service-to-service calls.
Validates X-Service-Auth header: HMAC-SHA256(timestamp:method:path:bodyHash, secret)
Rejects requests with |now - timestamp| > 300s.
"""

import hashlib
import hmac
import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class HMACAuthMiddleware(BaseHTTPMiddleware):
    """Validates HMAC service authentication on all non-health endpoints."""

    EXEMPT_PATHS = {"/health", "/docs", "/openapi.json"}
    MAX_CLOCK_SKEW = 300  # 5 minutes

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("X-Service-Auth")
        if not auth_header:
            raise HTTPException(status_code=403, detail="Missing X-Service-Auth header")

        try:
            # Header format: "timestamp:signature"
            parts = auth_header.split(":", 1)
            if len(parts) != 2:
                raise ValueError("Invalid format")

            timestamp_str, provided_signature = parts
            timestamp = int(timestamp_str)

            # Check replay window
            now = int(time.time())
            if abs(now - timestamp) > self.MAX_CLOCK_SKEW:
                raise HTTPException(status_code=403, detail="Request timestamp outside allowed window")

            # Reconstruct expected HMAC
            body = await request.body()
            body_hash = hashlib.sha256(body).hexdigest() if body else ""
            message = f"{timestamp}:{request.method}:{request.url.path}:{body_hash}"
            expected_signature = hmac.new(
                settings.hmac_secret.encode(),
                message.encode(),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(provided_signature, expected_signature):
                raise HTTPException(status_code=403, detail="Invalid HMAC signature")

        except (ValueError, IndexError):
            raise HTTPException(status_code=403, detail="Malformed X-Service-Auth header")

        return await call_next(request)
