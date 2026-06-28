from datetime import date, datetime
from typing import List, Optional , Literal
import uuid
from sqlmodel import Field, Relationship, SQLModel
from core.schemas import ELOTiers

class User(SQLModel, table=True):
    __tablename__: str = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(max_length=30, unique=True, index=True, nullable=False)
    email: str = Field(nullable=False)
    elo: int = Field(default=0 , index=True)
    wins: int = Field(default=0)
    losses: int = Field(default=0)
    matches_played: int = Field(default=0)
    streak_days: int = Field(default=0)
    last_active_date: Optional[date] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    hashed_password: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    elo_tier : ELOTiers = Field(default=ELOTiers.bronze)

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

    # Relationships
    user: User = Relationship(back_populates="elo_history")

