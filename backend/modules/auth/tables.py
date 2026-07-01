from datetime import date, datetime
from typing import List, Optional , Literal
import uuid
from sqlmodel import Field, Relationship, SQLModel
from core.schemas import ELOTiers , MatchLevel

class User(SQLModel, table=True):
    __tablename__: str = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(max_length=30, unique=True, index=True, nullable=False)
    display_name : str | None = Field(max_length=50 , nullable=True , default= None, description="The name displayed on the user's platform")
    bio : str = Field(max_length=100 , nullable = True)
    email: str = Field(nullable=False)
    elo: int = Field(default=0 , index=True)
    wins: int = Field(default=0)
    losses: int = Field(default=0)
    matches_played: int = Field(default=0)
    streak_days: int = Field(default=0)
    last_active_date: Optional[date] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    banner_url : str | None = Field(default = None)
    hide_online_status: bool = Field(default=False, nullable=False)
    show_achievements: bool = Field(default=True, nullable=False)
    hashed_password: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    elo_tier : ELOTiers = Field(default=ELOTiers.bronze)
    longest_win_streak : int = Field(default=0)

    # Relationships
    elo_history: List["EloHistory"] = Relationship(back_populates="user", cascade_delete=True)

class EloHistory(SQLModel, table=True):
    __tablename__: str = "elo_history"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)
    match_id: Optional[uuid.UUID] = Field(default=None)
    elo_before: int = Field(nullable=False)
    elo_after: int = Field(nullable=False)
    delta: Optional[int] = Field(default=None, description="Generated column: elo_after - elo_before")
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    match_level: MatchLevel = Field(default=MatchLevel.easy, nullable=True)

    # Relationships
    user: User = Relationship(back_populates="elo_history")




