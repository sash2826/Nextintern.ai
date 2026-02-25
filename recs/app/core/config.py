"""
Application configuration via environment variables.
"""

from typing import Literal
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Recommender service configuration."""

    # Database (read-only)
    database_url: str = "postgresql://recs_readonly:recs_readonly_dev@localhost:5432/nextintern"

    # HMAC service auth
    hmac_secret: str = "dev-hmac-secret-change-in-prod"

    # Model
    model_dir: str = "./models"

    # Runtime
    env: Literal["development", "staging", "production"] = "development"
    debug: bool = True
    log_level: str = "INFO"

    # Weights for hybrid scoring
    content_weight: float = Field(0.6, ge=0.0, le=1.0)
    cf_weight: float = Field(0.4, ge=0.0, le=1.0)

    # Admin
    admin_token: str = ""

    @model_validator(mode="after")
    def check_weights_sum(self):
        if abs(self.content_weight + self.cf_weight - 1.0) > 1e-6:
            raise ValueError("content_weight and cf_weight must sum to 1.0")
        return self

    class Config:
        env_file = ".env"


settings = Settings()

if settings.env == "production":
    if settings.debug:
        raise RuntimeError("DEBUG must be False in production")
    if not settings.admin_token or settings.admin_token == "dev-admin-secret":
        raise RuntimeError("ADMIN_TOKEN must be changed in production")
    if settings.hmac_secret == "dev-hmac-secret-change-in-prod":
        raise RuntimeError("HMAC_SECRET must be changed in production")
