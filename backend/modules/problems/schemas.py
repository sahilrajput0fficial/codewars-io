from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field, field_validator

from .tables import ProblemDifficulty


# ── ProblemTag Schemas ────────────────────────────────────────────────────────

class ProblemTagResponse(BaseModel):
    """A single tag as returned in API responses."""
    id:          uuid.UUID
    name:        str
    slug:        str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class ProblemTagWithCount(ProblemTagResponse):
    """Tag response enriched with a usage count (problems linked to this tag)."""
    count: int = 0


# ── TestCase Schemas ──────────────────────────────────────────────────────────

class TestCaseCreate(BaseModel):
    input:           str
    expected_output: str
    is_sample:       bool = False
    is_hidden:       bool = True
    points:          int  = Field(default=1, ge=1)
    order_index:     int  = Field(default=1, ge=1)
    explanation:     Optional[str] = None


class TestCaseUpdate(BaseModel):
    input:           Optional[str]  = None
    expected_output: Optional[str]  = None
    is_sample:       Optional[bool] = None
    is_hidden:       Optional[bool] = None
    points:          Optional[int]  = Field(default=None, ge=1)
    order_index:     Optional[int]  = Field(default=None, ge=1)
    explanation:     Optional[str]  = None


class TestCaseResponse(BaseModel):
    id:              uuid.UUID
    problem_id:      uuid.UUID
    input:           str
    expected_output: str
    is_sample:       bool
    is_hidden:       bool
    points:          int
    order_index:     int
    explanation:     Optional[str]
    created_at:      datetime

    model_config = {"from_attributes": True}


class TestCasePublicResponse(BaseModel):
    """Response shape for sample test cases shown to users (no hidden test data)."""
    id:             uuid.UUID
    input:          str
    expected_output: str
    explanation:    Optional[str]
    order_index:    int

    model_config = {"from_attributes": True}


# ── Problem Schemas ───────────────────────────────────────────────────────────

class ProblemCreate(BaseModel):
    title:       str = Field(max_length=100)
    slug:        str = Field(max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    difficulty:  ProblemDifficulty = ProblemDifficulty.easy
    # Pass UUIDs of existing problem_tags rows to link this problem.
    # topic_tags (TEXT[]) is no longer accepted on create — use tag_ids instead.
    tag_ids:        Optional[List[uuid.UUID]] = Field(default=None)
    description_md: str
    input_format:   Optional[str] = None
    output_format:  Optional[str] = None
    constraints:    List[str] | None = None
    starter_code:   Optional[Dict[str, str]] = None
    editorial_md:   Optional[str] = None
    time_limit_ms:  int = Field(default=2000, ge=100, le=30_000)
    memory_limit_mb: int = Field(default=256, ge=16, le=1024)


class ProblemUpdate(BaseModel):
    title:        Optional[str] = Field(default=None, max_length=100)
    difficulty:   Optional[ProblemDifficulty] = None
    # Replaces the full set of linked tags when supplied.
    tag_ids:        Optional[List[uuid.UUID]] = None
    description_md: Optional[str] = None
    input_format:   Optional[str] = None
    output_format:  Optional[str] = None
    constraints:    List[str] | None = None
    starter_code:   Optional[Dict[str, str]] = None
    editorial_md:   Optional[str] = None
    time_limit_ms:  Optional[int] = Field(default=None, ge=100, le=30_000)
    memory_limit_mb: Optional[int] = Field(default=None, ge=16, le=1024)


class ProblemListItem(BaseModel):
    """Lightweight shape returned in paginated lists — no description or editorial."""
    id:         uuid.UUID
    title:      str
    slug:       str
    difficulty: ProblemDifficulty
    # Normalised tags (replaces the deprecated topic_tags TEXT[] field)
    tags:       List[ProblemTagResponse] = []
    times_used: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProblemResponse(BaseModel):
    """Full problem detail — includes starter_code; editorial excluded for non-admins."""
    id:           uuid.UUID
    title:        str
    slug:         str
    difficulty:   ProblemDifficulty
    # Normalised tags (replaces the deprecated topic_tags TEXT[] field)
    tags:         List[ProblemTagResponse] = []
    description_md: str
    input_format:   Optional[str] = None
    output_format:  Optional[str] = None
    constraints:    List[str] | None
    starter_code:   Optional[Dict[str, Any]]
    time_limit_ms:  int
    memory_limit_mb: int
    times_used:     int
    created_at:     datetime
    updated_at:     datetime
    sample_test_cases: List[TestCasePublicResponse] = []

    model_config = {"from_attributes": True}


class ProblemAdminResponse(ProblemResponse):
    """Full problem detail for admins — includes editorial and all test cases."""
    editorial_md: Optional[str]
    test_cases:   List[TestCaseResponse] = []

    model_config = {"from_attributes": True}


# ── Paginated list response ───────────────────────────────────────────────────

class ProblemListResponse(BaseModel):
    total:  int
    limit:  int
    offset: int
    items:  List[ProblemListItem]
