"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, Any


class Settings(BaseSettings):
    """Application settings and configuration."""

    # Application
    app_name: str = "DualLoop"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Database
    database_url: str = Field(default="sqlite+aiosqlite:///./dualloop.db", alias="DATABASE_URL")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    # Security
    secret_key: str = Field(default="dev-secret-key-change-in-production", alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # GitHub OAuth
    github_client_id: str = Field(default="dev-github-client-id", alias="GITHUB_CLIENT_ID")
    github_client_secret: str = Field(default="dev-github-client-secret", alias="GITHUB_CLIENT_SECRET")
    github_webhook_secret: str = Field(default="dev-webhook-secret", alias="GITHUB_WEBHOOK_SECRET")

    # GitHub App
    github_app_id: str = Field(default="dev-app-id", alias="GITHUB_APP_ID")
    github_app_private_key: str = Field(default="dev-private-key", alias="GITHUB_APP_PRIVATE_KEY")
    github_app_webhook_secret: str = Field(default="dev-app-webhook-secret", alias="GITHUB_APP_WEBHOOK_SECRET")

    # Anthropic / Groq
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")

    # CORS
    allowed_origins: Any = Field(default=["http://localhost:3000"], alias="ALLOWED_ORIGINS")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list:
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    # Frontend
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    # Sentry
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
