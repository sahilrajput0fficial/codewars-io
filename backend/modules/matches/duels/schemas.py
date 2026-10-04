from pydantic import BaseModel, Field
from typing import Optional
from config import Credentials
import uuid
from datetime import datetime


class CreateDuelRequest(BaseModel):
    arena_slug: str = "kabul"
    is_ranked: bool = False


class CreateCodeModel(BaseModel):
    code: str
    url: str
    arena_slug: str
    is_ranked: bool
    host_id: uuid.UUID
    host_name: str
    host_avatar: str | None = None
    guest_id: uuid.UUID | None = None
    guest_name: str | None = None
    guest_avatar: str | None = None
    status: str = Field(default="waiting")
    match_id: uuid.UUID | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
