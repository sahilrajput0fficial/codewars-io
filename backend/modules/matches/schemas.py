import uuid
from enum import Enum
from pydantic import BaseModel, Field
from modules.problems.schemas import ProblemDifficulty, TestCasePublicResponse
from typing import List, Any, Optional

class Match_Status(str, Enum):
    waiting = "waiting"
    active = "active"
    completed = "completed"
    abandoned = "abandoned"
    cancelled = "cancelled"

class Match_Mode(str, Enum):
    live = "live"
    async_ = "async"
    bot = "bot"


class ArenaPublic(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    elo_bar: int
    elo_cap: Optional[int] = None
    max_net_value: int
    allowed_difficulties: List[str]
    description: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: bool
    subtitle: str
    lore: str

    model_config = {"from_attributes": True}


class MatchTestCaseResponse(BaseModel):
    id: str
    input: str
    expectedOutput: str
    explanation: Optional[str] = None

    model_config = {"from_attributes": True}


class MatchProblemData(BaseModel):
    id: str
    slug: str
    title: str
    difficulty: str
    scoreValue: int
    description: str
    inputFormat: str
    outputFormat: str
    constraints: List[str]
    sampleCases: List[MatchTestCaseResponse]
    starterCode: dict[str, Any]

    model_config = {"from_attributes": True}


class MatchUserProfile(BaseModel):
    id: str
    username: str
    displayName: str
    elo: Optional[int] = None
    avatarUrl: Optional[str] = None
    solvedProblemIds: Optional[List[str]] = None
    currentScore: Optional[int] = None

    model_config = {"from_attributes": True}


class MatchDetail(BaseModel):
    matchId: str
    arenaSlug: str
    arenaName: str
    mode: str
    status: Optional[str] = None
    timerEndUnix: Any
    me: MatchUserProfile
    opponent: MatchUserProfile
    problems: List[MatchProblemData]

    model_config = {"from_attributes": True}


class BasePayload(BaseModel):
    match_id: str
    arena: str
    timer_end: Any = None
    accept_deadline: Any | None = None
