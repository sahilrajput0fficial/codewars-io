import uuid
from datetime import datetime
from typing import List, Dict, Any
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Index, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID, JSONB
from .schemas import MatchMode, MatchStatus

class Matches(SQLModel, table=True):
    __tablename__ = "matches"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False)
    player_one_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    player_two_id: uuid.UUID | None = Field(foreign_key="users.id", default=None, nullable=True)
    bot_elo: int | None = Field(default=None, nullable=True)
    
    mode: MatchMode = Field(nullable=False)
    status: MatchStatus = Field(default=MatchStatus.waiting, nullable=False)
    
    problem_ids: List[uuid.UUID] = Field(sa_column=Column(ARRAY(UUID(as_uuid=True)), nullable=False))
    
    difficulty_config: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False)
    )
    
    winner_id: uuid.UUID | None = Field(foreign_key="users.id", default=None, nullable=True)
    p1_score: int = Field(default=0, nullable=False)
    p2_score: int = Field(default=0, nullable=False)
    p1_penalty: int = Field(default=0, nullable=False)
    p2_penalty: int = Field(default=0, nullable=False)
    p1_elo_delta: int = Field(default=0, nullable=False)
    p2_elo_delta: int = Field(default=0, nullable=False)
    
    started_at: datetime | None = Field(default=None, nullable=True)
    ended_at: datetime | None = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_matches_player_one", "player_one_id"),
        Index("idx_matches_player_two", "player_two_id"),
        Index("idx_matches_status", "status"),
        Index("idx_matches_status_created", "status", text("created_at DESC")),
        Index("idx_matches_mode_status", "mode", "status"),
        Index("idx_matches_started_at", text("started_at DESC")),
    )