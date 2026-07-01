import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from db.session import get_session
from modules.auth.dependencies import get_current_user
from modules.auth.tables import User

from .schemas import (
    LeaderboardGlobalRequest,
    LeaderboardListResponse,
    LeaderboardMeResponse,
    SortBy,
    UserRankResponse,
)
from .services import (
    get_global_leaderboard_service,
    get_leaderboard_me_service,
    get_user_rank_service,
)

router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"],
)


# ─────────────────────────────────────────────
#  GET /leaderboard/
# ─────────────────────────────────────────────

@router.get("/", response_model=LeaderboardListResponse, summary="Global leaderboard")
def get_global_leaderboard(
    session: Annotated[Session, Depends(get_session)],
    query: Annotated[LeaderboardGlobalRequest, Query()],
):
    """Paginated, ranked list of all users.

    - **sort_by** – field to rank by (elo | wins | losses | matches_played)
    - **sort_order** – `asc` or `desc`
    - **limit** / **offset** – standard pagination
    """
    return get_global_leaderboard_service(session=session, query=query)


# ─────────────────────────────────────────────
#  GET /leaderboard/me
# ─────────────────────────────────────────────

@router.get("/me", response_model=LeaderboardMeResponse, summary="Current user's rank")
def get_leaderboard_me(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
    sort_by: SortBy = SortBy.ELO,
):
    """Return the authenticated user's leaderboard rank and public stats.

    - **sort_by** – the metric used to compute the rank (default: elo)
    """
    return get_leaderboard_me_service(session=session, user=user, sort_by=sort_by)


# ─────────────────────────────────────────────
#  GET /leaderboard/users/{user_id}
# ─────────────────────────────────────────────

@router.get(
    "/users/{user_id}",
    response_model=UserRankResponse,
    summary="Get any user's leaderboard rank",
)
def get_user_rank(
    user_id: uuid.UUID,
    session: Annotated[Session, Depends(get_session)],
    sort_by: SortBy = SortBy.ELO,
):
    """Return the public profile and leaderboard rank of any user by their UUID.

    - **user_id** – UUID of the target user
    - **sort_by** – the metric used to compute the rank (default: elo)
    """
    return get_user_rank_service(session=session, user_id=user_id, sort_by=sort_by)


# ─────────────────────────────────────────────
#  GET /leaderboard/users/{user_id}/elo-history
# ─────────────────────────────────────────────
