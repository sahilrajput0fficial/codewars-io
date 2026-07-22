from typing import Any, Dict, List
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from db.session import get_session
from modules.auth.dependencies import get_current_user
from modules.auth.tables import User

from .tables import ProblemDifficulty
from .schemas import (
    ProblemCreate,
    ProblemUpdate,
    ProblemResponse,
    ProblemAdminResponse,
    ProblemListResponse,
    ProblemTagWithCount,
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
)
from .services import (
    list_tags,
    create_problem,
    list_problems,
    get_problem,
    get_problem_admin,
    update_problem,
    delete_problem,
    add_test_case,
    update_test_case,
    delete_test_case,
    list_test_cases,
)

router = APIRouter(prefix="/problems", tags=["problems"])


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC ROUTES — no auth required
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/tags/",
    response_model=List[ProblemTagWithCount],
    summary="List all problem tags with usage counts",
)
def route_list_tags(
    session: Session = Depends(get_session),
) -> List[ProblemTagWithCount]:
    """
    Return every tag in the `problem_tags` table, each enriched with a `count`
    of how many problems are linked to it via `problem_tags_link`.

    Tags are ordered by count descending (most-used first), then alphabetically.
    This endpoint is used by the frontend TagCloud component.
    """
    return list_tags(session=session)


@router.get("/", response_model=ProblemListResponse, summary="List problems")
def route_list_problems(
    limit:      int = Query(default=20, ge=1, le=100, description="Items per page"),
    offset:     int = Query(default=0, ge=0, description="Items to skip"),
    difficulty: ProblemDifficulty | None = Query(default=None),
    tag:        str | None = Query(
        default=None,
        description="Filter by tag slug (matches problem_tags.slug exactly)",
    ),
    q:          str | None = Query(default=None, description="Search by title"),
    session:    Session = Depends(get_session),
) -> ProblemListResponse:
    """
    Return a paginated, filterable list of problems.

    - `difficulty`: easy | medium | hard
    - `tag`: filter by tag slug (e.g. `dynamic-programming`)
    - `q`: title search (case-insensitive)

    Each item's `tags` field is a list of `{id, name, slug, description}` objects
    sourced from the `problem_tags` table — not the deprecated `topic_tags` column.
    """
    return list_problems(
        session=session,
        limit=limit,
        offset=offset,
        difficulty=difficulty,
        tag=tag,
        q=q,
    )


@router.get("/{slug}", response_model=ProblemResponse, summary="Get problem by slug")
def route_get_problem(
    slug:    str,
    session: Session = Depends(get_session),
) -> ProblemResponse:
    """
    Return full problem detail for the given slug.
    Only sample test cases are included. Editorial is excluded.
    Tags are populated from `problem_tags_link`.
    """
    return get_problem(session=session, slug=slug)


# ═══════════════════════════════════════════════════════════════════════════════
# PROTECTED ROUTES — require authenticated user
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/",
    response_model=ProblemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a problem (admin only)",
)
def route_create_problem(
    payload:      ProblemCreate,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> ProblemResponse:
    """
    Create a new problem. Slug must be unique and in kebab-case.
    `starter_code` is a JSON object mapping language keys to boilerplate strings.
    `tag_ids` is an optional list of `problem_tags.id` UUIDs to link.
    """
    problem = create_problem(session=session, payload=payload)
    return get_problem(session=session, slug=problem.slug)


@router.patch(
    "/{problem_id}",
    response_model=ProblemResponse,
    summary="Update a problem (admin only)",
)
def route_update_problem(
    problem_id:   uuid.UUID,
    payload:      ProblemUpdate,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> ProblemResponse:
    """
    Partially update a problem. Only supplied fields are changed.
    Slug cannot be changed after creation.
    When `tag_ids` is supplied it replaces the problem's full set of tag links.
    """
    problem = update_problem(session=session, problem_id=problem_id, payload=payload)
    return get_problem(session=session, slug=problem.slug)


@router.delete(
    "/{problem_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a problem (admin only)",
)
def route_delete_problem(
    problem_id:   uuid.UUID,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> None:
    """Permanently delete a problem, its test cases (cascade), and its tag links."""
    delete_problem(session=session, problem_id=problem_id)


# ── Admin: full detail with editorial ────────────────────────────────────────

@router.get(
    "/admin/{problem_id}",
    response_model=ProblemAdminResponse,
    summary="Admin detail — includes editorial and all test cases",
)
def route_get_problem_admin(
    problem_id:   uuid.UUID,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> ProblemAdminResponse:
    """
    Returns the full problem record including editorial_md and all (including
    hidden) test cases. Intended for admin/content editors only.
    """
    return get_problem_admin(session=session, problem_id=problem_id)


# ═══════════════════════════════════════════════════════════════════════════════
# TEST CASE ROUTES — all admin-only
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/{problem_id}/test-cases",
    response_model=List[TestCaseResponse],
    summary="List all test cases for a problem (admin only)",
)
def route_list_test_cases(
    problem_id:   uuid.UUID,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> List[TestCaseResponse]:
    cases = list_test_cases(session=session, problem_id=problem_id)
    return [TestCaseResponse.model_validate(tc) for tc in cases]


@router.post(
    "/{problem_id}/test-cases",
    response_model=TestCaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a test case to a problem (admin only)",
)
def route_add_test_case(
    problem_id:   uuid.UUID,
    payload:      TestCaseCreate,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> TestCaseResponse:
    """
    Add a test case to a problem.
    - `is_sample=true` → shown to the user on the problem page
    - `is_hidden=true` → used only during judge evaluation, not shown to users
    """
    tc = add_test_case(session=session, problem_id=problem_id, payload=payload)
    return TestCaseResponse.model_validate(tc)


@router.patch(
    "/{problem_id}/test-cases/{tc_id}",
    response_model=TestCaseResponse,
    summary="Update a test case (admin only)",
)
def route_update_test_case(
    problem_id:   uuid.UUID,
    tc_id:        uuid.UUID,
    payload:      TestCaseUpdate,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> TestCaseResponse:
    tc = update_test_case(session=session, tc_id=tc_id, payload=payload)
    return TestCaseResponse.model_validate(tc)


@router.delete(
    "/{problem_id}/test-cases/{tc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a test case (admin only)",
)
def route_delete_test_case(
    problem_id:   uuid.UUID,
    tc_id:        uuid.UUID,
    session:      Session = Depends(get_session),
    current_user: User    = Depends(get_current_user),
) -> None:
    delete_test_case(session=session, tc_id=tc_id)
