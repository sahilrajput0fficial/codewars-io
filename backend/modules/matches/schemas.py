from enum import Enum
from pydantic import BaseModel , Field 
from modules.problems.schemas import ProblemDifficulty , TestCasePublicResponse
from typing import List  , Any
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


# problems_data.append({
#                 "id": str(prob.id),
#                 "slug": prob.slug,
#                 "title": prob.title,
#                 "difficulty": prob.difficulty,
#                 "scoreValue": score_val,
#                 "description": prob.description_md or prob.description or "",
#                 "inputFormat": prob.input_format or "",
#                 "outputFormat": prob.output_format or "",
#                 "constraints": constraints,
#                 "sampleCases": [
class MatchTestCaseResponse(BaseModel):
    id: str
    input: str
    expectedOutput: str
    explanation: str | None = None

class MatchProblemData (BaseModel):
    id : str 
    slug : str 
    title : str
    difficulty : str 
    scoreValue : int
    description : str 
    inputFormat : str
    outputFormat :str
    constraints : List[str]
    sampleCases : List[MatchTestCaseResponse]
    starterCode : dict[str , str]

class MatchUserProfile(BaseModel):
     id : str
     username : str
     displayName : str
     elo : int | None = None
     avatarUrl : str | None = None
     solvedProblemIds : List[str] | None = None
     currentScore : int | None = None

class MatchDetail(BaseModel):
    matchId : str
    arenaSlug : str
    arenaName : str
    mode : str
    timerEndUnix : Any
    me : MatchUserProfile
    opponent : MatchUserProfile
    problems : List[MatchProblemData]


class BasePayload(BaseModel):
    match_id : str
    arena : str
    problem_ids : List[str]
    timer_end : Any = None
    accept_deadline : Any | None = None
