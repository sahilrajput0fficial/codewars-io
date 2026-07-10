from datetime import datetime
from typing import List, Optional
import uuid
from enum import Enum
from pydantic import BaseModel

from .tables import ProgrammingLanguage, SubmissionVerdict



class Environment(Enum):
    sample = "f2ca9155"
    submit = "b0c66f5b"



class SubmissionCreate(BaseModel):
    problem_id: uuid.UUID
    language: ProgrammingLanguage
    source_code: str
    match_id: Optional[uuid.UUID] = None


class TestCaseResultResponse(BaseModel):
    test_case_id: uuid.UUID
    order_index: int
    passed: bool
    input: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None

    model_config = {"from_attributes": True}


class SubmissionResponse(BaseModel):
    id: uuid.UUID
    match_id: Optional[uuid.UUID]
    user_id: uuid.UUID
    problem_id: uuid.UUID
    language: ProgrammingLanguage
    source_code: str
    verdict: SubmissionVerdict
    runtime_ms: Optional[int]
    memory_kb: Optional[int]
    compile_output: Optional[str]
    stderr: Optional[str]
    score: int
    passed_testcases: int
    total_testcases: int
    submitted_at: datetime
    judged_at: Optional[datetime]
    test_cases: List[TestCaseResultResponse] = []

    model_config = {"from_attributes": True}


class SubmissionListItem(BaseModel):
    id: uuid.UUID
    problem_id: uuid.UUID
    user_id: uuid.UUID
    language: ProgrammingLanguage
    verdict: SubmissionVerdict
    passed_testcases: int
    total_testcases: int
    submitted_at: datetime

    model_config = {"from_attributes": True}


class SubmissionListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[SubmissionListItem]
