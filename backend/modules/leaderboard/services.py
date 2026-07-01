from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, func, select
from modules.auth.tables import  User
from .schemas import (
    LeaderboardEntry,
    LeaderboardGlobalRequest,
    LeaderboardListResponse,
    LeaderboardMeResponse,
    SortBy,
    UserRankResponse,
)
from core.utils import generate_hateoas_links

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

    # Define a subquery with the user ID and their absolute global rank calculated over all users
    subquery = select(User.id.label("user_id"), rank_col).subquery()
    '''
    sql equivalent :
    SELECT id as user_id,RANK() OVER (ORDER BY elo DESC) AS rank
    FROM users;
    '''

    

    # Join the User table to the subquery to fetch users along with their absolute rank
    stmt = select(User, subquery.c.rank).join(subquery, User.id == subquery.c.user_id)
    '''sql equivalent
    SELECT u.* , r.rank
    FROM users u
    JOIN (
        SELECT id as user_id, RANK() OVER (ORDER BY elo DESC) AS rank
        FROM users
    ) r ON u.id = r.user_id
    WHERE u.username ILIKE '%keyword%';
    '''

    if query.q:

        stmt = stmt.where(User.username.ilike(f'%{query.q}%'))

        

    page_stmt = (
        stmt.order_by(rank_order if query.sort_order == "desc" else column.asc())
        .limit(query.limit)
        .offset(query.offset)
    )
    rows = session.exec(page_stmt).all()  # list of (User, int) tuples

    entries: list[LeaderboardEntry] = [
        LeaderboardEntry(**user.model_dump(), rank=rank)
        for user, rank in rows
    ]

    # Total counts — unfiltered global count and filtered total count
    total_global: int = session.exec(select(func.count()).select_from(User)).one()

    if not query.q:
        total: int = total_global
    else:
        total = session.exec(select(func.count()).select_from(User)
                    .where(User.username.ilike(f'%{query.q}%'))).one()

    links = generate_hateoas_links(total=total, limit=query.limit, offset=query.offset)

    return LeaderboardListResponse(
        total=total,
        limit=query.limit,
        offset=query.offset,
        sort_by=query.sort_by,
        entries=entries,
        total_global=total_global,
        links=links,
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

