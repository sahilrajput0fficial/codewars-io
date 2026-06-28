from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, func, select

from modules.auth.schemas import UserPublic
from modules.auth.tables import EloHistory, User
from core.schemas import ELOTiers , ELOThreshold
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



def _get_elo_tiers(elo : int ) ->str:
    if elo >= ELOThreshold.diamond:
        return ELOTiers.diamond
    elif elo>= ELOThreshold.gold:
        return ELOTiers.gold
    elif elo>= ELOThreshold.silver:
        return ELOTiers.silver
    else:
        return ELOTiers.bronze


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

    links = _generate_hateoas_links(total=total, limit=query.limit, offset=query.offset)

    return LeaderboardListResponse(
        total=total,
        limit=query.limit,
        offset=query.offset,
        sort_by=query.sort_by,
        entries=entries,
        total_global=total_global,
        links=links,
    )


def _generate_hateoas_links(total: int, limit: int, offset: int) -> list[dict]:
    """Generate page navigation links following hypermedia/HATEOAS constraints.

    Renders a standard page range: First Page, Previous Page, Adjacent Pages,
    Ellipsis placeholders, Next Page, and Last Page.
    """
    links = []
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    current_page = (offset // limit) + 1

    # 1. Previous navigation link
    if current_page > 1:
        links.append({
            "rel": "prev",
            "label": "Previous",
            "offset": max(0, offset - limit),
            "is_active": False
        })

    # 2. Page Range buttons
    if total_pages <= 5:
        for p in range(1, total_pages + 1):
            links.append({
                "rel": "page",
                "label": str(p),
                "offset": (p - 1) * limit,
                "is_active": (p == current_page)
            })
    else:
        # First page
        links.append({
            "rel": "first",
            "label": "1",
            "offset": 0,
            "is_active": (current_page == 1)
        })

        if current_page > 3:
            links.append({
                "rel": "ellipsis",
                "label": "...",
                "offset": None,
                "is_active": False
            })

        start = max(2, current_page - 1)
        end = min(total_pages - 1, current_page + 1)
        for p in range(start, end + 1):
            if p > 1 and p < total_pages:
                links.append({
                    "rel": "page",
                    "label": str(p),
                    "offset": (p - 1) * limit,
                    "is_active": (p == current_page)
                })

        if current_page < total_pages - 2:
            links.append({
                "rel": "ellipsis",
                "label": "...",
                "offset": None,
                "is_active": False
            })

        # Last page
        links.append({
            "rel": "last",
            "label": str(total_pages),
            "offset": (total_pages - 1) * limit,
            "is_active": (current_page == total_pages)
        })

    # 3. Next navigation link
    if current_page < total_pages:
        links.append({
            "rel": "next",
            "label": "Next",
            "offset": offset + limit,
            "is_active": False
        })

    return links



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
