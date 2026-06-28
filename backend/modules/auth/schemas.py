import uuid
from pydantic import BaseModel
import datetime

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

class ForgetPasswordSchema(BaseModel):
    email: str
    username: str
    new_password: str

class OAuthExchangeRequest(BaseModel):
    access_token: str


#============= Response ===================#
class UserPublic(BaseModel):
    """Public response model for user"""
    id: uuid.UUID
    username: str
    email: str
    wins : int 
    losses : int
    elo : int
    avatar_url : str | None = None 
    created_at : datetime.datetime
    matches_played : int
    elo_tier : str