from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    ENVIRONMENT : str 
    DATABASE_URL: str
    SUPER_SECRET_KEY: Optional[str] = "dev-secret-key-change-in-prod"
    JWT_SECRET: Optional[str] = None
    JWT_REFRESH_SECRET: Optional[str] = None
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    GCP_CLIENT_ID: Optional[str] = None
    GCP_CLIENT_SECRET: Optional[str] = None
    ASYNC_DATABASE_URL : str
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None

    @property
    def effective_jwt_secret(self) -> str:
        return self.JWT_SECRET or self.SUPER_SECRET_KEY or "dev-access-secret-key"

    @property
    def effective_jwt_refresh_secret(self) -> str:
        return self.JWT_REFRESH_SECRET or f"{self.effective_jwt_secret}-refresh"
    FRONTEND_URL: str | None = None
    JUDGE0_URL : str | None = None 
    RAPIDAPI_KEY : str | None = None
    RAPIDAPI_HOST: str| None 
    REDIS_HOST : str | None = "localhost"
    REDIS_PORT : int | None = 6379
    REDIS_PASSWORD : str | None = None

    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    LLM_PROVIDER: Optional[str] = "groq"
    BOT_DEFAULT_DIFFICULTY: Optional[str] = "balanced"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False
    )


    @computed_field
    @property
    def active_database_url(self) -> str:
        if self.ENVIRONMENT == "development":
            return "sqlite:///database.db"
        return self.DATABASE_URL

Credentials = Settings()
