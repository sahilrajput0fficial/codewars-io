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
    display_name : str| None
    bio : str | None = ""
    email: str
    wins : int 
    losses : int
    elo : int
    streak_days : int | None = 0
    avatar_url : str | None = None 
    banner_url : str| None = None
    hide_online_status: bool = False
    show_achievements: bool = True
    created_at : datetime.datetime
    last_active_date : datetime.datetime | None
    longest_win_streak : int | None = 0
    matches_played : int
    elo_tier : str