from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from .tables import Problem, ProblemTag, ProblemTagLink, TestCase, ProblemDifficulty
from .schemas import (
    ProblemCreate,
    ProblemUpdate,
    ProblemTagResponse,
    ProblemTagWithCount,
    ProblemListItem,
    ProblemResponse,
    ProblemAdminResponse,
    ProblemListResponse,
    TestCaseCreate,
    TestCaseUpdate,
    TestCasePublicResponse,
    TestCaseResponse,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_problem_or_404(session: Session, problem_id: uuid.UUID) -> Problem:
    problem = session.get(Problem, problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem '{problem_id}' not found.",
        )
    return problem


def _get_problem_by_slug_or_404(session: Session, slug: str) -> Problem:
    statement = select(Problem).where(Problem.slug == slug)
    problem = session.exec(statement).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with slug '{slug}' not found.",
        )
    return problem


def _get_test_case_or_404(session: Session, tc_id: uuid.UUID) -> TestCase:
    tc = session.get(TestCase, tc_id)
    if not tc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test case '{tc_id}' not found.",
        )
    return tc


def _resolve_tags(session: Session, tag_ids: List[uuid.UUID]) -> List[ProblemTag]:
    """Fetch ProblemTag rows for the given UUIDs; raise 400 for any missing."""
    tags = []
    for tid in tag_ids:
        tag = session.get(ProblemTag, tid)
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag '{tid}' not found in problem_tags.",
            )
        tags.append(tag)
    return tags


def _set_problem_tags(
    session: Session, problem: Problem, tag_ids: List[uuid.UUID]
) -> None:
    """Replace all tag links for a problem with a new set of tag_ids."""
    # Delete existing links for this problem
    existing_links = session.exec(
        select(ProblemTagLink).where(ProblemTagLink.problem_id == problem.id)
    ).all()
    for link in existing_links:
        session.delete(link)

    # Insert new links
    for tid in tag_ids:
        # Validate tag exists
        if not session.get(ProblemTag, tid):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag '{tid}' not found in problem_tags.",
            )
        session.add(ProblemTagLink(problem_id=problem.id, tag_id=tid))


def _tags_for_problem(session: Session, problem_id: uuid.UUID) -> List[ProblemTag]:
    """Return ProblemTag rows linked to a problem via problem_tags_link."""
    stmt = (
        select(ProblemTag)
        .join(ProblemTagLink, ProblemTagLink.tag_id == ProblemTag.id)
        .where(ProblemTagLink.problem_id == problem_id)
        .order_by(ProblemTag.name)
    )
    return list(session.exec(stmt).all())


# ── Tag CRUD ──────────────────────────────────────────────────────────────────

def list_tags(session: Session) -> List[ProblemTagWithCount]:
    """
    Return all tags in problem_tags, each annotated with a `count` of how many
    problems are linked to it via problem_tags_link.
    Ordered by count descending so the most-used tags appear first.
    """
    # Subquery: count problems per tag
    count_stmt = (
        select(
            ProblemTagLink.tag_id,
            func.count(ProblemTagLink.problem_id).label("problem_count"),
        )
        .group_by(ProblemTagLink.tag_id)
        .subquery()
    )

    # Left-join tags with the count subquery so tags with 0 problems are included
    rows = session.exec(
        select(ProblemTag, count_stmt.c.problem_count)
        .outerjoin(count_stmt, count_stmt.c.tag_id == ProblemTag.id)
        .order_by(func.coalesce(count_stmt.c.problem_count, 0).desc(), ProblemTag.name)
    ).all()

    result = []
    for tag, count in rows:
        item = ProblemTagWithCount.model_validate(tag)
        item.count = count or 0
        result.append(item)
    return result


# ── Problem CRUD ──────────────────────────────────────────────────────────────

def create_problem(session: Session, payload: ProblemCreate) -> Problem:
    # Ensure slug is unique
    existing = session.exec(select(Problem).where(Problem.slug == payload.slug)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A problem with slug '{payload.slug}' already exists.",
        )

    # Note: topic_tags is intentionally not set — use tag_ids / problem_tags_link instead
    problem = Problem(
        title=payload.title,
        slug=payload.slug,
        difficulty=payload.difficulty,
        description_md=payload.description_md,
        constraints=payload.constraints,
        starter_code=payload.starter_code,
        editorial_md=payload.editorial_md,
        time_limit_ms=payload.time_limit_ms,
        memory_limit_mb=payload.memory_limit_mb,
    )
    session.add(problem)
    session.commit()
    session.refresh(problem)

    # Link tags via the join table
    if payload.tag_ids:
        _set_problem_tags(session, problem, payload.tag_ids)
        session.commit()
        session.refresh(problem)

    return problem


def list_problems(
    session: Session,
    limit: int = 20,
    offset: int = 0,
    difficulty: Optional[ProblemDifficulty] = None,
    tag: Optional[str] = None,    # now matches problem_tags.slug
    q: Optional[str] = None,
) -> ProblemListResponse:
    statement = select(Problem)

    if difficulty:
        statement = statement.where(Problem.difficulty == difficulty)
    if q:
        statement = statement.where(Problem.title.ilike(f"%{q}%"))
    if tag:
        # Filter problems that have a linked tag with the given slug
        statement = statement.where(
            Problem.id.in_(
                select(ProblemTagLink.problem_id)
                .join(ProblemTag, ProblemTag.id == ProblemTagLink.tag_id)
                .where(ProblemTag.slug == tag)
            )
        )

    # Count total (without pagination)
    total_stmt = select(func.count()).select_from(statement.subquery())
    total: int = session.exec(total_stmt).one()

    # Paginate
    statement = statement.order_by(Problem.created_at.desc()).offset(offset).limit(limit)
    problems = session.exec(statement).all()

    # Build response items — load tags for each problem individually.
    # For large lists consider a batch join; this is acceptable for limit ≤ 100.
    items = []
    for p in problems:
        item = ProblemListItem.model_validate(p)
        item.tags = [
            ProblemTagResponse.model_validate(t)
            for t in _tags_for_problem(session, p.id)
        ]
        items.append(item)

    return ProblemListResponse(total=total, limit=limit, offset=offset, items=items)


def get_problem(session: Session, slug: str) -> ProblemResponse:
    """Public detail — excludes editorial; only returns sample test cases."""
    problem = _get_problem_by_slug_or_404(session, slug)

    sample_cases_stmt = (
        select(TestCase)
        .where(TestCase.problem_id == problem.id, TestCase.is_sample == True)  # noqa: E712
        .order_by(TestCase.order_index)
    )
    sample_cases = session.exec(sample_cases_stmt).all()

    response = ProblemResponse.model_validate(problem)
    response.tags = [
        ProblemTagResponse.model_validate(t)
        for t in _tags_for_problem(session, problem.id)
    ]
    response.sample_test_cases = [
        TestCasePublicResponse.model_validate(tc) for tc in sample_cases
    ]
    return response


def get_problem_admin(session: Session, problem_id: uuid.UUID) -> ProblemAdminResponse:
    """Admin detail — includes editorial and all test cases."""
    problem = _get_problem_or_404(session, problem_id)

    all_cases_stmt = (
        select(TestCase)
        .where(TestCase.problem_id == problem.id)
        .order_by(TestCase.order_index)
    )
    all_cases = session.exec(all_cases_stmt).all()

    response = ProblemAdminResponse.model_validate(problem)
    response.tags = [
        ProblemTagResponse.model_validate(t)
        for t in _tags_for_problem(session, problem.id)
    ]
    response.test_cases = [TestCaseResponse.model_validate(tc) for tc in all_cases]
    return response


def update_problem(
    session: Session, problem_id: uuid.UUID, payload: ProblemUpdate
) -> Problem:
    problem = _get_problem_or_404(session, problem_id)
    update_data = payload.model_dump(exclude_unset=True)

    # Handle tag_ids separately — do NOT write to the deprecated topic_tags column
    tag_ids = update_data.pop("tag_ids", None)

    for field, value in update_data.items():
        setattr(problem, field, value)
    problem.updated_at = datetime.utcnow()
    session.add(problem)
    session.commit()
    session.refresh(problem)

    if tag_ids is not None:
        _set_problem_tags(session, problem, tag_ids)
        session.commit()
        session.refresh(problem)

    return problem


def delete_problem(session: Session, problem_id: uuid.UUID) -> None:
    problem = _get_problem_or_404(session, problem_id)
    session.delete(problem)
    session.commit()


def increment_times_used(session: Session, problem_id: uuid.UUID) -> None:
    """Called by match engine when a problem is selected for a match."""
    problem = _get_problem_or_404(session, problem_id)
    problem.times_used = (problem.times_used or 0) + 1
    session.add(problem)
    session.commit()


# ── Test Case CRUD ────────────────────────────────────────────────────────────

def add_test_case(
    session: Session, problem_id: uuid.UUID, payload: TestCaseCreate
) -> TestCase:
    # Validate problem exists
    _get_problem_or_404(session, problem_id)
    tc = TestCase(
        problem_id=problem_id,
        input=payload.input,
        expected_output=payload.expected_output,
        is_sample=payload.is_sample,
        is_hidden=payload.is_hidden,
        points=payload.points,
        order_index=payload.order_index,
        explanation=payload.explanation,
    )
    session.add(tc)
    session.commit()
    session.refresh(tc)
    return tc


def update_test_case(
    session: Session, tc_id: uuid.UUID, payload: TestCaseUpdate
) -> TestCase:
    tc = _get_test_case_or_404(session, tc_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tc, field, value)
    session.add(tc)
    session.commit()
    session.refresh(tc)
    return tc


def delete_test_case(session: Session, tc_id: uuid.UUID) -> None:
    tc = _get_test_case_or_404(session, tc_id)
    session.delete(tc)
    session.commit()


def list_test_cases(session: Session, problem_id: uuid.UUID) -> List[TestCase]:
    _get_problem_or_404(session, problem_id)
    statement = (
        select(TestCase)
        .where(TestCase.problem_id == problem_id)
        .order_by(TestCase.order_index)
    )
    return list(session.exec(statement).all())
