from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid

from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON
from sqlalchemy.dialects.postgresql import ARRAY, TEXT


# ── Enum ─────────────────────────────────────────────────────────────────────

class ProblemDifficulty(str, Enum):
    easy   = "easy"
    medium = "medium"
    hard   = "hard"


# ── ProblemTagLink (join table) ────────────────────────────────────────────────
# Many-to-many bridge between `problems` and `problem_tags`.
# Defined FIRST so it can be referenced directly (as a class, not a string)
# by the Relationship() calls on ProblemTag and Problem below.

class ProblemTagLink(SQLModel, table=True):
    __tablename__: str = "problem_tags_link"

    problem_id: uuid.UUID = Field(
        foreign_key="problems.id",
        primary_key=True,
    )
    tag_id: uuid.UUID = Field(
        foreign_key="problem_tags.id",
        primary_key=True,
    )


# ── ProblemTag ────────────────────────────────────────────────────────────────
# Mirrors the `problem_tags` table created in Supabase:
#
#   CREATE TABLE public.problem_tags (
#     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
#     name        text NOT NULL CHECK (char_length(name) <= 50),
#     slug        text NOT NULL UNIQUE,
#     description text,
#     created_at  timestamptz NOT NULL DEFAULT now(),
#     updated_at  timestamptz NOT NULL DEFAULT now()
#   );

class ProblemTag(SQLModel, table=True):
    __tablename__: str = "problem_tags"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    name: str        = Field(max_length=50, nullable=False)
    slug: str        = Field(max_length=100, unique=True, index=True, nullable=False)
    description: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # NOTE: No SQLAlchemy Relationship here — tags are loaded via explicit joins
    # in _tags_for_problem() (services.py) to avoid lazy-load on non-existent tables.


# ── Problem ───────────────────────────────────────────────────────────────────

class Problem(SQLModel, table=True):
    __tablename__: str = "problems"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    title: str = Field(max_length=100, nullable=False)
    slug:  str = Field(max_length=100, unique=True, index=True, nullable=False)
    difficulty: ProblemDifficulty = Field(
        default=ProblemDifficulty.easy,
        nullable=False,
    )

    # DEPRECATED: denormalised TEXT[] column — kept in ORM to avoid crashes
    # while data still exists in the DB column.  Stop writing to this field;
    # use the `tags` relationship (problem_tags_link) for all new code.
    # A future Alembic migration will DROP COLUMN topic_tags once migrated.
    topic_tags: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(TEXT), nullable=True, server_default="{}"),
    )

    description_md: str = Field(nullable=False)
    input_format:   Optional[str] = Field(default=None, nullable=True)
    output_format:  Optional[str] = Field(default=None, nullable=True)
    constraints: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(TEXT), nullable=True, server_default="{}"),
    )
    # JSON object: {"python": "def solve(...):", "cpp": "int solve(...){...}"}
    starter_code: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=True, server_default="{}"),
    )
    editorial_md:     Optional[str] = Field(default=None, nullable=True)
    time_limit_ms:    int = Field(default=2000, nullable=False)
    memory_limit_mb:  int = Field(default=256,  nullable=False)
    times_used:       int = Field(default=0,    nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # NOTE: No SQLAlchemy Relationship to ProblemTag here.
    # Tags are loaded via explicit SQL joins in _tags_for_problem() (services.py)
    # to avoid SQLAlchemy lazy-loading the problem_tags_link join table on every
    # model_validate() call. Once the join table is confirmed to exist in the DB,
    # a Relationship can be re-added if needed.

    # Test cases (one-to-many, cascade delete)
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
    input:           str  = Field(nullable=False)
    expected_output: str  = Field(nullable=False)
    is_sample:       bool = Field(default=False, nullable=False)
    is_hidden:       bool = Field(default=True,  nullable=False)
    points:          int  = Field(default=1,     nullable=False)
    order_index:     int  = Field(default=1,     nullable=False)
    explanation: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    problem: Problem = Relationship(back_populates="test_cases")