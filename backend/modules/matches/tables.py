import uuid
from datetime import datetime
from typing import Any

from sqlmodel import SQLModel, Field , Relationship
from sqlalchemy import Column, Index, String, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID 

from .schemas import Match_Mode, Match_Status
from sqlalchemy import Enum


class Arena(SQLModel, table=True):
    __tablename__ = "arenas"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    name: str = Field(max_length=50)
    slug: str = Field(
        max_length=50,
        unique=True,
        index=True,
    )
    elo_bar: int = Field(default=0)
    elo_cap: int | None = Field(default=None)
    max_net_value: int
    allowed_difficulties: list[str] = Field(
        sa_column=Column(
            ARRAY(String),
            nullable=False,
        )
    )
    description: str | None = None
    icon_url: str | None = None
    is_active: bool = Field(default=True)
    subtitle: str = Field(max_length=100)
    lore: str = Field(max_length=100)
class Matches(SQLModel, table=True):
    __tablename__ = "matches"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    slug: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        unique=True,
        index=True,
        nullable=False,
    )
    player_one_id: uuid.UUID = Field(
        foreign_key="users.id",
        nullable=False,
    )
    player_two_id: uuid.UUID | None = Field(
        foreign_key="users.id",
        default=None,
        nullable=True,
    )
    bot_elo: int | None = Field(
        default=None,
        nullable=True,
    )
    mode: Match_Mode = Field(nullable=False)
    status: Match_Status = Field(
    default=Match_Status.waiting,
    sa_column=Column(
        Enum(
            Match_Status,
            name="matchstatus",
            create_type=False,
        ),
        nullable=False,
    ),
    )
    problem_ids: list[uuid.UUID] = Field(
        sa_column=Column(
            ARRAY(PG_UUID(as_uuid=True)),
            nullable=False,
        )
    )
    difficulty_config: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(
            JSONB,
            nullable=False,
        ),
    )
    winner_id: uuid.UUID | None = Field(
        foreign_key="users.id",
        default=None,
        nullable=True,
    )
    p1_score: int = Field(default=0)
    p2_score: int = Field(default=0)

    p1_penalty: int = Field(default=0)
    p2_penalty: int = Field(default=0)

    p1_elo_delta: int = Field(default=0)
    p2_elo_delta: int = Field(default=0)

    started_at: datetime | None = Field(default=None)
    ended_at: datetime | None = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    arena_id: uuid.UUID = Field(
        foreign_key="arenas.id",
        nullable=False,
    )
    arena: Arena = Relationship()

    __table_args__ = (
        Index("idx_matches_player_one", "player_one_id"),
        Index("idx_matches_player_two", "player_two_id"),
        Index("idx_matches_status", "status"),
        Index("idx_matches_status_created", "status", text("created_at DESC")),
        Index("idx_matches_mode_status", "mode", "status"),
        Index("idx_matches_started_at", text("started_at DESC")),
    )


