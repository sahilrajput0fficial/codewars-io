from datetime import datetime
from enum import Enum
from typing import Optional
import uuid
from sqlmodel import Field, SQLModel


class ProgrammingLanguage(str, Enum):
    python = "python"
    cpp = "cpp"
    javascript = "javascript"


class SubmissionVerdict(str, Enum):
    pending = "pending"
    accepted = "accepted"
    wrong_answer = "wrong_answer"
    time_limit_exceeded = "time_limit_exceeded"
    memory_limit_exceeded = "memory_limit_exceeded"
    runtime_error = "runtime_error"
    compilation_error = "compilation_error"


class Submission(SQLModel, table=True):
    __tablename__: str = "submissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    match_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="matches.id",
        nullable=True,
        index=True,
    )
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False, index=True)
    problem_id: uuid.UUID = Field(
        foreign_key="problems.id",
        nullable=False,
        index=True,
    )
    language: ProgrammingLanguage = Field(nullable=False)
    source_code: str = Field(nullable=False)
    verdict: SubmissionVerdict = Field(
        default=SubmissionVerdict.pending,
        nullable=False,
        index=True,
    )
    runtime_ms: Optional[int] = Field(default=None, nullable=True)
    memory_kb: Optional[int] = Field(default=None, nullable=True)
    compile_output: Optional[str] = Field(default=None, nullable=True)
    stderr: Optional[str] = Field(default=None, nullable=True)
    judge0_token: Optional[str] = Field(default=None, max_length=255, nullable=True)
    score: int = Field(default=0, nullable=True)
    passed_testcases: int = Field(default=0, nullable=True)
    total_testcases: int = Field(default=0, nullable=True)
    submitted_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
    )
    judged_at: Optional[datetime] = Field(default=None, nullable=True)