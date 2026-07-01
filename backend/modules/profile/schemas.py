from pydantic import BaseModel
import uuid
import datetime
from modules.auth.schemas import UserPublic
from core.schemas import BulkGetRequest
from modules.matches.schemas import MatchMode, MatchStatus
from typing import Any, Dict, List


class ProfileUserResponse(UserPublic):
    rank: int
    avg_solve_time_ms: int
    problems_solved: int
    is_online: bool

class ProfileUpdateRequest(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    banner_url: str | None = None
    hide_online_status: bool | None = None
    show_achievements: bool | None = None


class MatchOpponentPublic(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str | None = None
    avatar_url: str | None = None
    elo_tiers : str
    elo: int

    model_config = {"from_attributes": True}


class UserMatchResponse(BaseModel):
    id: uuid.UUID
    player_one: MatchOpponentPublic
    player_two: MatchOpponentPublic | None = None
    bot_elo: int | None = None
    mode: MatchMode
    status: MatchStatus
    problem_ids: List[uuid.UUID]
    difficulty_config: Dict[str, Any]
    winner_id: uuid.UUID | None = None
    p1_score: int
    p2_score: int
    p1_penalty: int
    p2_penalty: int
    p1_elo_delta: int
    p2_elo_delta: int
    started_at: datetime.datetime | None = None
    ended_at: datetime.datetime | None = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class UserMatchesResponse(BaseModel):
    total: int
    limit: int
    offset: int
    matches: List[UserMatchResponse]

class UserMatchesRequest(BulkGetRequest):
    pass

# -------------------------------------------------------------------
# Code below Reserved for future use.
# This code is not currently used but may be needed for practice mode
# or future features. Do not remove unless confirmed obsolete.
# -------------------------------------------------------------------

# class EloHistoryEntry(BaseModel):
#     """Single ELO delta record."""
#     id: uuid.UUID
#     user_id: uuid.UUID
#     match_id: uuid.UUID | None = None
#     elo_before: int
#     elo_after: int
#     delta: int | None = None
#     recorded_at: datetime.datetime
#     match_level : str | None = None

#     model_config = {"from_attributes": True}


# class EloHistoryResponse(BaseModel):
#     """Paginated ELO history for a user."""
#     user_id: uuid.UUID
#     total: int
#     limit: int
#     offset: int
#     history: list[EloHistoryEntry]
   


# class EloHistoryRequest(BulkGetRequest):
#     """Query params for fetching ELO history of a user."""
#     pass







    

