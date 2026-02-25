"""
Application configuration via environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Recommender service configuration."""

    # Database (read-only)
    database_url: str = "postgresql://recs_readonly:recs_readonly_dev@localhost:5432/nextintern"

    # HMAC service auth
    hmac_secret: str = "dev-hmac-secret-change-in-prod"

    # Model
    model_dir: str = "./models"

    # Hybrid combiner weights (must sum to 1.0)
    content_weight: float = 0.7
    collaborative_weight: float = 0.3
    cold_start_min_interactions: int = 3

    # Runtime
    debug: bool = True
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
