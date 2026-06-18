from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Credentials(BaseSettings):
    DATABASE_URL: str
    SUPER_SECRET_KEY: str
    SUPABASE_ANON_KEY: str
    SUPABASE_URL: Optional[str] = None
    GCP_CLIENT_ID: Optional[str] = None
    GCP_ClIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECERT: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False
    )

Credentials = Credentials()
