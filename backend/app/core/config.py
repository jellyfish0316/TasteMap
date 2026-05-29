"""Application settings, loaded from environment / .env.

Import the singleton `settings` everywhere; do not read os.environ directly.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_env: str = "development"
    app_debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # Auth
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Datastores
    database_url: str = "postgresql+psycopg://tastemap:tastemap@localhost:5432/tastemap"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    #: Run import tasks inline (no broker/worker needed). Handy for local dev/tests.
    celery_task_always_eager: bool = False
    #: DEV/TEST ONLY. Route every import to a built-in fake parser with canned data
    #: and synthesize place matches — no scraping, no API keys. Never enable in prod.
    fake_imports: bool = False

    # Shared external services
    anthropic_api_key: str | None = None
    llm_model: str = "claude-sonnet-4-6"
    google_places_api_key: str | None = None

    # Per-platform credentials (optional; each owner fills their own)
    google_maps_api_key: str | None = None
    youtube_api_key: str | None = None
    x_bearer_token: str | None = None
    instagram_token: str | None = None
    threads_token: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
