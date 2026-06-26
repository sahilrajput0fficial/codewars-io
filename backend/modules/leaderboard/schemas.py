from pydantic import BaseModel, Field
from core.schemas import BulkGetRequest
from enum import Enum
from typing import Optional
import uuid
import datetime
from modules.auth.schemas import UserPublic
from core.schemas import ListResponse


# ─────────────────────────────────────────────
#  Enums
# ─────────────────────────────────────────────

class SortBy(str, Enum):
    ELO = "elo"
    WINS = "wins"
    LOSSES = "losses"
    MATCHES_PLAYED = "matches_played"


# ─────────────────────────────────────────────
#  Requests
# ─────────────────────────────────────────────

class LeaderboardGlobalRequest(BulkGetRequest):
    """Query params for the global leaderboard list."""
    sort_by: SortBy = Field(default=SortBy.ELO, description="Field to sort by")


class EloHistoryRequest(BulkGetRequest):
    """Query params for fetching ELO history of a user."""
    pass


# ─────────────────────────────────────────────
#  Responses
# ─────────────────────────────────────────────

class LeaderboardEntry(UserPublic):
    """A single row in the global leaderboard — user data + rank."""
    rank: int = Field(description="1-based rank position")


class LeaderboardMeResponse(UserPublic):
    """Current authenticated user's leaderboard position."""
    rank: int = Field(description="1-based rank position of the current user")


class UserRankResponse(UserPublic):
    """Public leaderboard profile of any user by their ID."""
    rank: int = Field(description="1-based rank position of the queried user")


class EloHistoryEntry(BaseModel):
    """Single ELO delta record."""
    id: uuid.UUID
    user_id: uuid.UUID
    match_id: Optional[uuid.UUID] = None
    elo_before: int
    elo_after: int
    delta: Optional[int] = None
    recorded_at: datetime.datetime

    model_config = {"from_attributes": True}


class EloHistoryResponse(BaseModel):
    """Paginated ELO history for a user."""
    user_id: uuid.UUID
    total: int
    limit: int
    offset: int
    history: list[EloHistoryEntry]


class LeaderboardListResponse(ListResponse):
    """Paginated leaderboard list with ranked entries."""
    sort_by: SortBy
    entries: list[LeaderboardEntry]
