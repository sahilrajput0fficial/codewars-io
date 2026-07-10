from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON, String
from sqlalchemy.dialects.postgresql import ARRAY, TEXT


# ── Enum ─────────────────────────────────────────────────────────────────────

class ProblemDifficulty(str, Enum):
    easy   = "easy"
    medium = "medium"
    hard   = "hard"


# ── Problem ───────────────────────────────────────────────────────────────────

class Problem(SQLModel, table=True):
    __tablename__: str = "problems"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    title: str = Field(max_length=100, nullable=False)
    slug: str = Field(max_length=100, unique=True, index=True, nullable=False)
    difficulty: ProblemDifficulty = Field(
        default=ProblemDifficulty.easy,
        nullable=True,
    )
    # Stored as array of strings (e.g. text[]) matching PostgreSQL DDL
    topic_tags: List[str] = Field(
        default=[],
        sa_column=Column(ARRAY(String), nullable=True, server_default="{}"),
    )
    description_md: str = Field(nullable=False)
    input_format: Optional[str] = Field(default=None, nullable=True)
    output_format: Optional[str] = Field(default=None, nullable=True)
    constraints: List[str] = Field(
    default_factory=list,
    sa_column=Column(ARRAY(TEXT), nullable=True, server_default="{}")
)
    # Stored as JSON object: {"python": "def solve(...):", "cpp": "int solve(...){...}"}
    starter_code: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=True, server_default="{}"),
    )
    editorial_md: Optional[str] = Field(default=None, nullable=True)
    time_limit_ms: int = Field(default=2000, nullable=True)
    memory_limit_mb: int = Field(default=256, nullable=True)
    times_used: int = Field(default=0, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    test_cases: List["TestCase"] = Relationship(
        back_populates="problem",
        cascade_delete=True,
    )


# ── TestCase ──────────────────────────────────────────────────────────────────

class TestCase(SQLModel, table=True):
    __tablename__: str = "test_cases"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    problem_id: uuid.UUID = Field(
        foreign_key="problems.id",
        nullable=False,
        index=True,
    )
    input: str = Field(nullable=False)
    expected_output: str = Field(nullable=False)
    is_sample: bool = Field(default=False, nullable=True)
    is_hidden: bool = Field(default=True, nullable=True)
    points: int = Field(default=1, nullable=True)
    order_index: int = Field(default=1, nullable=True)
    explanation: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    problem: Problem = Relationship(back_populates="test_cases")