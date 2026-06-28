from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    ENVIRONMENT : str 
    DATABASE_URL: str
    SUPER_SECRET_KEY: str
    SUPABASE_ANON_KEY: str
    SUPABASE_URL: Optional[str] = None
    GCP_CLIENT_ID: Optional[str] = None
    GCP_ClIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECERT: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000"

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
