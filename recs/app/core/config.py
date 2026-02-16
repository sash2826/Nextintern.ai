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

    # Runtime
    debug: bool = True
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
