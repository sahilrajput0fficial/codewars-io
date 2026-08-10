from db.redis import async_client, client
from .tables import Arena, Matches
from pydantic import BaseModel
from typing import Any
from uuid import UUID, uuid4
from itertools import combinations_with_replacement
import random
import time
from datetime import datetime
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from modules.problems.tables import Problem
from fastapi import HTTPException, status
from modules.auth.tables import User
from modules.problems.tables import ProblemDifficulty
from core.connection_manager import manager
from core.cache import get_cached_object , set_cached_object
from .schemas import MatchUserProfile
DIFFICULTY_SCORE = {
    "easy": 2,
    "medium": 4,
    "hard": 7,
    "extreme": 10,
    "hardcore": 15,
}

DIFFICULT_MAP = {
    "easy" : ProblemDifficulty.easy,
    "medium" : ProblemDifficulty.medium,
    "hard" : ProblemDifficulty.hard,
    "extreme" : ProblemDifficulty.extreme,
    "hardcore" : ProblemDifficulty.hardcore
}

def get_valid_combos(arena: Arena) -> list[tuple[str, str, str]]:
    combos = combinations_with_replacement(arena.allowed_difficulties, 3)
    return [
        combo for combo in combos
        if sum(DIFFICULTY_SCORE[d] for d in combo) <= arena.max_net_value
    ]


async def select_match_problems(arena: Arena, session: AsyncSession) -> list[Problem]:
    valid_combos = get_valid_combos(arena)
    if not valid_combos:
        raise ValueError(f"Arena {arena.slug} has no valid combos — check max_net_value/allowed_difficulties")

    combo = random.choice(valid_combos)
    problems = []
    for difficulty in combo:
        stmt = (
            select(Problem)
            .where(
                Problem.difficulty == DIFFICULT_MAP[difficulty],
                Problem.id.notin_([p.id for p in problems]),
            )
            .order_by(Problem.times_used.asc(), func.random())
            .limit(1)
        )
        result = await session.exec(stmt)
        problem = result.first()
        if problem is None:
            raise ValueError(f"No available {difficulty} problem — seed data gap")
        problems.append(problem)
    return problems

active_match_players = "active_match_players:{user_id}"
async def get_user_profile_dict_async(session: AsyncSession, user_id_str: str) -> MatchUserProfile | None:
    if user_id_str == "bot":
        return MatchUserProfile(
            id="bot",
            username="bot",
            displayName="Bot",
            elo=1200,
            avatarUrl=None,
            solvedProblemIds=[],
            currentScore=0,
        )

    if not user_id_str or user_id_str in ("None", "undefined", "null", ""):
        return None

    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid user ID format"
        )

    try:
        cache_key = active_match_players.format(user_id=user_uuid)
        cached_user = get_cached_object(cache_key, MatchUserProfile)
        if cached_user is not None:
            return cached_user

        res = await session.exec(select(User).where(User.id == user_uuid))
        user = res.first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        data = MatchUserProfile(
            id=str(user.id),
            username=user.username,
            displayName=user.display_name or user.username,
            elo=user.elo,
            avatarUrl=user.avatar_url,
        )
        set_cached_object(cache_key, data, 45*60)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # short_id = user_id_str[:6] if user_id_str else "Guest"
    # return {
    #     "id": user_id_str,
    #     "username": f"Player-{short_id}",
    #     "display_name": f"Player-{short_id}",
    #     "elo": 1000,
    #     "avatar_url": None,
    # }



async def create_match_from_pair(p1_id: str, p2_id: str, arena: Arena, session: AsyncSession) -> Matches:
    problems = await select_match_problems(arena, session)
    problem_ids = [p.id for p in problems]
    difficulty_config = {}
    for p in problems:
        difficulty_config[p.difficulty] = difficulty_config.get(p.difficulty, 0) + 1

    match = Matches(
        slug=f"match_{arena.slug}_{p1_id[:4]}_{p2_id[:4]}_{str(uuid4())[:6]}",
        player_one_id=p1_id,
        player_two_id=p2_id,
        status="waiting",  # Status starts as "waiting" during 15-second Ready Check phase
        problem_ids=problem_ids,
        difficulty_config=difficulty_config,
        mode="live",
        arena_id=arena.id,
        started_at=None,
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)

    await async_client.hset(f"match:{match.id}", mapping={
        "p1_solved": "[]",
        "p2_solved": "[]",
        "timer_end": str(int(time.time()) + 20 * 60),
        "status": "waiting",
    })
    await async_client.expire(f"match:{match.id}", 20 * 60 + 300)
    return match


async def activate_match(session: AsyncSession, match: Matches) -> Matches:
    """
    Activates the match once BOTH players have successfully clicked 'Enter Arena' (accepted match).
    Transitions status from 'waiting' -> 'active' and records start time.
    """
    match.status = "active"
    match.started_at = datetime.utcnow()
    session.add(match)
    await session.commit()
    await session.refresh(match)

    # Update Redis match state to active
    await async_client.hset(f"match:{match.id}", "status", "active")
    return match


async def abandon_match_penalty(
    session: AsyncSession,
    match: Matches,
    abandoning_user_id_str: str,
    penalty_elo: int = 10
) -> None:
    """
    Penalizes a player who fails to accept or abandons during the 15-second Ready Check window.
    Deducts `penalty_elo` (10 ELO) from the abandoning player, records an EloHistory entry,
    and updates match status to 'abandoned'.
    """
    try:
        from modules.auth.tables import EloHistory
        user_uuid = UUID(abandoning_user_id_str)
        user = await session.get(User, user_uuid)
        if user:
            elo_before = user.elo
            elo_after = max(0, user.elo - penalty_elo)
            delta = elo_after - elo_before

            user.elo = elo_after
            user.losses += 1
            user.matches_played += 1
            session.add(user)

            # Invalidate cached profile
            try:
                from core.cache import delete_cache_key
                delete_cache_key(f"profile:{user.email}")
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("Error invalidating cached profile: %s", e)

            # Record EloHistory log entry for transparency
            history_entry = EloHistory(
                user_id=user.id,
                match_id=match.id,
                elo_before=elo_before,
                elo_after=elo_after,
                delta=delta,
            )
            session.add(history_entry)

            if str(match.player_one_id) == abandoning_user_id_str:
                match.p1_penalty = penalty_elo
                match.p1_elo_delta = delta
            else:
                match.p2_penalty = penalty_elo
                match.p2_elo_delta = delta
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("abandon_match_penalty error: %s", e)

    match.status = "abandoned"
    match.ended_at = datetime.utcnow()
    session.add(match)
    await session.commit()
    await session.refresh(match)


async def get_arena_or_404(session: AsyncSession, arena_id: str) -> Arena:
    if not arena_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena not found",
        )

    # 1. Check by slug (e.g. "kabul", "mumbai")
    stmt = select(Arena).where(Arena.slug == arena_id, Arena.is_active == True)
    res = await session.exec(stmt)
    arena = res.first()

    if not arena:
        stmt = select(Arena).where(Arena.is_active == True)
        res = await session.exec(stmt)
        arena = res.first()

    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena not found",
        )

    return arena


def validate_elo_for_arena(arena: Arena, elo: int):
    if elo < arena.elo_bar:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires {arena.elo_bar}+ ELO to enter {arena.name}")



async def send_paired_event(event: str, user_a_id: str, profile_a: Any, user_b_id: str, profile_b: Any, extra_payload: Any) -> None:
    """Send the same event to both players in a match, each seeing themselves
    as 'me' and the other as 'opponent'. Centralizing this avoids the
    copy/paste risk of accidentally swapping me/opponent for one side."""
    dict_payload = extra_payload.model_dump() if isinstance(extra_payload, BaseModel) else extra_payload
    dict_a = profile_a.model_dump() if isinstance(profile_a, BaseModel) else profile_a
    dict_b = profile_b.model_dump() if isinstance(profile_b, BaseModel) else profile_b

    await manager.send_to(user_a_id, {
        "event": event,
        "match": {**dict_payload, "me": dict_a, "opponent": dict_b},
    })
    await manager.send_to(user_b_id, {
        "event": event,
        "match": {**dict_payload, "me": dict_b, "opponent": dict_a},
    })
    print({
        "event": event,
        "match": {**dict_payload, "me": dict_b, "opponent": dict_a},
    })

DEFAULT_MATCH_DURATION_SECONDS = 20*60




async def get_waiting_match(session: AsyncSession, target_match_id: str) -> Matches | None:
    """Parse + load a match, returning it only if it still exists and is
    still in the 'waiting' (ready-check) state. Shared by accept/decline
    handlers so the guard can't drift between them."""
    try:
        target_uuid = UUID(target_match_id)
    except (ValueError, AttributeError):
        return None
    m_obj = await session.get(Matches, target_uuid)
    if m_obj and m_obj.status == "waiting":
        return m_obj
    return None


async def start_match_timer(match_id: UUID | str, duration_seconds: int = DEFAULT_MATCH_DURATION_SECONDS) -> int:
    """Start the real match clock. Called once, at activation time (both
    players accepted), so `timer_end` only exists in Redis from this point
    on. Returns the computed end time."""
    timer_end = int(time.time()) + duration_seconds
    await async_client.hset(f"match:{match_id}", "timer_end", timer_end)
    return timer_end



