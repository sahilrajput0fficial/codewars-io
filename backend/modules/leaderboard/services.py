from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, func, select

from modules.auth.schemas import UserPublic
from modules.auth.tables import EloHistory, User

from .schemas import (
    EloHistoryEntry,
    EloHistoryRequest,
    EloHistoryResponse,
    LeaderboardEntry,
    LeaderboardGlobalRequest,
    LeaderboardListResponse,
    LeaderboardMeResponse,
    SortBy,
    UserRankResponse,
)


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────

def _compute_rank(session: Session, user: User, sort_by: SortBy) -> int:
    """Return the 1-based rank of *user* for the given sort field.

    Rank = (number of users with a strictly better value) + 1.
    For elo / wins / matches_played a higher value is better;
    for losses a lower value is better.
    """
    column = getattr(User, sort_by.value)
    current_value = getattr(user, sort_by.value)

    if sort_by == SortBy.LOSSES:
        # Fewer losses → better rank
        count_stmt = select(func.count()).where(column < current_value)
    else:
        count_stmt = select(func.count()).where(column > current_value)

    better_count: int = session.exec(count_stmt).one()
    return better_count + 1


def _apply_sort_order(stmt, column, sort_order: str):
    """Apply ascending or descending order to a SQLModel statement."""
    if sort_order == "asc":
        return stmt.order_by(column.asc())
    return stmt.order_by(column.desc())


# ─────────────────────────────────────────────
#  Service Functions
# ─────────────────────────────────────────────

def get_global_leaderboard_service(
    session: Session,
    query: LeaderboardGlobalRequest,
) -> LeaderboardListResponse:
    """Return a paginated, ranked leaderboard list.

    Uses a single SQL RANK() window function so every user's absolute rank
    is computed in the database — no N+1 problem.

    SQL emitted (conceptually):
        SELECT *, RANK() OVER (ORDER BY <col> <dir>) AS rank
        FROM users
        ORDER BY <col> <dir>
        LIMIT ? OFFSET ?
    """
    column = getattr(User, query.sort_by.value)

    # ── Window-function ordering ────────────────────────────────────────
    # For LOSSES: fewer losses = better rank → ASC
    # For everything else: higher value = better rank → DESC
    if query.sort_by == SortBy.LOSSES:
        rank_order = column.asc()
    else:
        rank_order = column.desc()

    rank_col = func.rank().over(order_by=rank_order).label("rank")

    # ── Single query: users + their ranks ──────────────────────────────
    # We still respect sort_order from the request for display ordering;
    # rank itself is always computed best-first (see rank_order above).
    page_stmt = (
        select(User, rank_col)
        .order_by(rank_order if query.sort_order == "desc" else column.asc())
        .limit(query.limit)
        .offset(query.offset)
    )
    rows = session.exec(page_stmt).all()  # list of (User, int) tuples

    entries: list[LeaderboardEntry] = [
        LeaderboardEntry(**user.model_dump(), rank=rank)
        for user, rank in rows
    ]

    # Total count — separate scalar query (unavoidable for pagination metadata)
    total: int = session.exec(select(func.count()).select_from(User)).one()

    return LeaderboardListResponse(
        total=total,
        limit=query.limit,
        offset=query.offset,
        sort_by=query.sort_by,
        entries=entries,
    )


def get_leaderboard_me_service(
    session: Session,
    user: User,
    sort_by: SortBy,
) -> LeaderboardMeResponse:
    """Return the authenticated user's own leaderboard rank and public stats."""
    rank = _compute_rank(session, user, sort_by)
    return LeaderboardMeResponse(**user.model_dump(), rank=rank)


def get_user_rank_service(
    session: Session,
    user_id: uuid.UUID,
    sort_by: SortBy,
) -> UserRankResponse:
    """Return the public leaderboard profile and rank of any user by UUID."""
    user: User | None = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found.",
        )
    rank = _compute_rank(session, user, sort_by)
    return UserRankResponse(**user.model_dump(), rank=rank)


def get_user_elo_history_service(
    session: Session,
    user_id: uuid.UUID,
    query: EloHistoryRequest,
) -> EloHistoryResponse:
    """Return paginated ELO history records for a specific user.

    Records are ordered by *recorded_at* in the direction specified by
    *query.sort_order* (default: desc = most recent first).
    """
    # Verify user exists
    user: Optional[User] = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' not found.",
        )

    # Total count for this user
    total: int = session.exec(
        select(func.count()).where(EloHistory.user_id == user_id)
    ).one()

    stmt = _apply_sort_order(
        select(EloHistory).where(EloHistory.user_id == user_id),
        EloHistory.recorded_at,
        query.sort_order,
    ).limit(query.limit).offset(query.offset)

    records: list[EloHistory] = list(session.exec(stmt).all())
    history = [EloHistoryEntry.model_validate(r) for r in records]

    return EloHistoryResponse(
        user_id=user_id,
        total=total,
        limit=query.limit,
        offset=query.offset,
        history=history,
    )
