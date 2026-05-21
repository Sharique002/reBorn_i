"""
reBorn_i — Application Settings

All environment variables are loaded here with defaults.
Secrets MUST be provided via env vars or .env file — never hardcoded.
"""

from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application-wide settings loaded from environment variables."""

    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "reBorn_i"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── API ──────────────────────────────────────────────────
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = "*"
    FRONTEND_URL: str = ""

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://reborn:reborn@localhost:5432/reborn_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # ── Redis ────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT Authentication ───────────────────────────────────
    JWT_SECRET_KEY: str = Field(default="CHANGE_ME_IN_PRODUCTION", min_length=16)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # ── Google OAuth ─────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    # ── OpenAI / LLM ────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.3
    LLM_REQUEST_TIMEOUT: int = 60
    LLM_MAX_RETRIES: int = 3

    # ── Embedding ────────────────────────────────────────────
    EMBEDDING_MODEL: str = "text-embedding-3-small"  # OpenAI model
    EMBEDDING_CACHE_TTL: int = 3600  # seconds
    EMBEDDING_TIMEOUT: int = 5  # seconds — fail fast to keyword fallback

    # ── File Upload ──────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: str = "application/pdf"

    # ── Scoring Weights (deterministic) ──────────────────────
    WEIGHT_SKILL_MATCH: float = 0.35
    WEIGHT_EXPERIENCE_ALIGNMENT: float = 0.25
    WEIGHT_KEYWORD_DENSITY: float = 0.20
    WEIGHT_EMBEDDING_SIMILARITY: float = 0.20

    # ── Market Radar ─────────────────────────────────────────
    MARKET_DATA_PATH: str = "data/job_market_dataset.json"
    MARKET_REFRESH_INTERVAL_HOURS: int = 24

    # ── Razorpay Payment ─────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        # Rewrite standard postgresql:// or postgres:// to use the asyncpg driver
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"LOG_LEVEL must be one of {valid}")
        return upper

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        valid = {"development", "staging", "production"}
        if v not in valid:
            raise ValueError(f"ENVIRONMENT must be one of {valid}")
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
