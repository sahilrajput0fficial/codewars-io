# ─── Profile Services ─────────────────────────────────────────────────────────
import os
import json
from sqlmodel import Session  , select , func
from sqlalchemy.orm import selectinload
from typing import Dict , Any 
from .schemas import (
    ProfileUpdateRequest , 
    ProfileUserResponse , 
    UserMatchesResponse, 
    UserMatchesRequest, 
    MatchOpponentPublic , 
    UserMatchResponse ,
    EloHistoryRequest ,
    EloHistoryResponse ,
    EloHistoryEntry

)
from modules.auth.tables import User
from config import Credentials
import httpx
import datetime
import uuid
from fastapi import HTTPException , status
from core.utils import apply_sort_order
from modules.matches.tables import Matches
from modules.auth.tables import EloHistory






def get_profile_data(session: Session, user: User) -> ProfileUserResponse:
    # Calculate dynamic rank based on ELO
    rank_stmt = select(func.count(User.id)).where(User.elo > user.elo)
    higher_elo_users = session.exec(rank_stmt).one()
    rank = higher_elo_users + 1

    avg_solve_time_ms = 18 # hardcoded as not made teh table
    problems_solved = 10

    bio = user.bio or "No bio set yet. Ready to conquer the leaderboard!"
    data = user.model_dump()
    data.update({
    "bio": bio,
    "rank": rank,
    "avg_solve_time_ms":avg_solve_time_ms , 
    "problems_solved":problems_solved ,
    "is_online":True
    })

    return ProfileUserResponse(**user.model_dump() , rank=rank , avg_solve_time_ms=avg_solve_time_ms , 
            problems_solved=problems_solved ,is_online=True)




def update_user_profile(session: Session, user: User, payload: ProfileUpdateRequest) -> ProfileUserResponse:
    if payload.display_name is not None:
        user.display_name = payload.display_name.strip()
    if payload.bio is not None:
        user.bio = payload.bio.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip() if payload.avatar_url else None
    if payload.banner_url is not None:
        user.banner_url = payload.banner_url.strip() if payload.banner_url else None
    if payload.hide_online_status is not None:
        user.hide_online_status = payload.hide_online_status
    if payload.show_achievements is not None:
        user.show_achievements = payload.show_achievements

    session.add(user)
    session.commit()
    session.refresh(user)
    return get_profile_data(session, user)



def get_user_matches_service(
    session: Session,
    user: User,
    query: UserMatchesRequest
) -> UserMatchesResponse:
    """
    Retrieve the paginated matches history for a user, containing opponent profiles.
    """


    # Note: We are considering the point that either the matches table stores a player as player_one or player_two.
    # No two rows/documents are stored for the same match where the user is both player one and player two.



    total = session.exec(
        select(func.count(Matches.id))
        .where((Matches.player_one_id == user.id) | (Matches.player_two_id == user.id))
    ).one()
    '''
    select count(id) from matches
    where player_one_id = user.id or player_two_id = user.id
    '''

    stmt = (
        select(Matches)
        .where((Matches.player_one_id == user.id) | (Matches.player_two_id == user.id))
        .options(selectinload(Matches.match_problems))
    )
    stmt = apply_sort_order(stmt, Matches.created_at, query.sort_order)
    stmt = stmt.limit(query.limit).offset(query.offset)
    matches = session.exec(stmt).all()
    """
    slect * from matches
    where player_one_id = user.id or player_two_id = user.id
    order by created_at desc
    limit query.limit offset query.offset
    """

    # Collect all unique player IDs to batch-fetch profiles
    player_ids = set()
    for m in matches:
        player_ids.add(m.player_one_id)
        if m.player_two_id:
            player_ids.add(m.player_two_id)

    users_map = {}
    if player_ids:
        players_stmt = select(User).where(User.id.in_(list(player_ids)))
        """
        select * from users
        where id in (list of player_ids)
        """
        db_players = session.exec(players_stmt).all()
        for p in db_players:
            users_map[p.id] = MatchOpponentPublic(
                id=p.id,
                username=p.username,
                display_name=p.display_name,
                avatar_url=p.avatar_url,
                elo_tiers=p.elo_tier,
                elo=p.elo
            )

    user_matches = []
    for m in matches:
        p1 = users_map.get(m.player_one_id)
        if not p1:
            p1 = MatchOpponentPublic(
                id=m.player_one_id, 
                username="unknown", 
                display_name="Unknown Player", 
                elo_tiers="bronze",
                elo=1200
            )
        
        p2 = users_map.get(m.player_two_id) if m.player_two_id else None

        user_matches.append(UserMatchResponse(
            id=m.id,
            player_one=p1, # replaces stored user id with actual opponent profile
            player_two=p2,  # replaces stored user id with actual opponent profile
            bot_elo=m.bot_elo,
            mode=m.mode,
            status=m.status,
            problem_ids=[mp.problem_id for mp in (m.match_problems or [])],
            difficulty_config=m.difficulty_config,
            winner_id=m.winner_id,
            p1_score=m.p1_score,
            p2_score=m.p2_score,
            p1_penalty=m.p1_penalty,
            p2_penalty=m.p2_penalty,
            p1_elo_delta=m.p1_elo_delta,
            p2_elo_delta=m.p2_elo_delta,
            started_at=m.started_at,
            ended_at=m.ended_at,
            created_at=m.created_at
        ))

    return UserMatchesResponse(
        total=total,
        limit=query.limit,
        offset=query.offset,
        matches=user_matches
    )




def upload_image_to_supabase(file_content: bytes, file_name: str, content_type: str, user_id: str) -> str:
    ext = file_name.split(".")[-1] if "." in file_name else "png"
    timestamp = int(datetime.datetime.utcnow().timestamp())
    path = f"{user_id}/asset-{timestamp}.{ext}"

    url = f"{Credentials.SUPABASE_URL}/storage/v1/object/profile-assets/{path}"
    key = Credentials.SUPABASE_SERVICE_ROLE_KEY or Credentials.SUPABASE_ANON_KEY

    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key or "",
        "Content-Type": content_type
    }

    try:
        with httpx.Client() as client:
            resp = client.post(url, content=file_content, headers=headers)
            if resp.is_error:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Supabase storage upload failed: {resp.text}"
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Connection to Supabase storage failed: {str(e)}"
        )

    return f"{Credentials.SUPABASE_URL}/storage/v1/object/public/profile-assets/{path}"


def get_user_elo_history_service(
    session: Session,
    user: User,
    query: EloHistoryRequest,
) -> EloHistoryResponse:
    """Return paginated ELO history records for a specific user.

    Records are ordered by *recorded_at* in the direction specified by
    *query.sort_order* (default: desc = most recent first).
    """
    # Verify user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found.",
        )

    # Total count for this user
    total: int = session.exec(
        select(func.count()).where(EloHistory.user_id == user.id)
    ).one()

    stmt = apply_sort_order(
        select(EloHistory)
        .join(Matches , EloHistory.match_id == Matches.id)
        .where(EloHistory.user_id == user.id),
        EloHistory.recorded_at,
        query.sort_order,
    ).limit(query.limit).offset(query.offset)

    records: list[EloHistory] = list(session.exec(stmt).all())
    history = [EloHistoryEntry.model_validate(r) for r in records]

    return EloHistoryResponse(
        user_id=user.id,
        total=total,
        limit=query.limit,
        offset=query.offset,
        history=history,
    )

# -------------------------------------------------------------------
# Code below Reserved for future use.
# This code is not currently used but may be needed for practice mode
# or future features. Do not remove unless confirmed obsolete.
# -------------------------------------------------------------------

