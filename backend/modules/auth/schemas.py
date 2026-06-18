import uuid
from pydantic import BaseModel

# ============ REQUEST ==================

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserSignupRequest(BaseModel):
    username: str
    password: str
    email: str

class OAuthSyncRequest(BaseModel):
    user_id: uuid.UUID
    email: str
    username: str 
    avatar_url: str | None = None
