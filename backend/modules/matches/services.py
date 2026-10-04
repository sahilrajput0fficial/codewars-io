from db.redis import async_client, client
from db.session import get_session_async
from .tables import Arena, Matches, Match_Problems
from pydantic import BaseModel
from typing import Any
from uuid import UUID, uuid4
from itertools import combinations_with_replacement
import random
import time
import json
from datetime import datetime
from sqlmodel import select, func
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession
from modules.problems.tables import Problem, ProblemDifficulty
from fastapi import HTTPException, status
from modules.auth.tables import User 
from modules.submissions.tables import Submission, SubmissionVerdict
from core.connection_manager import manager
from core.cache import get_cached_object , set_cached_object
from .schemas import (
    MatchProblemData, 
    MatchUserProfile, 
    MatchDetail, 
    BasePayload, 
    MatchTestCaseResponse, 
    ArenaPublic,
    Match_Status

)

from .constants import DIFFICULTY_SCORE
from core.security import decode_ws_token
from core.join_queue import join_queue, leave_queue
from core.logger import logger

active_match_players = "active_match_players:{user_id}"


DEFAULT_MATCH_DURATION_SECONDS = 20*60


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


async def get_user_profile_dict_async(session: AsyncSession, user_id_str: str) -> MatchUserProfile | None:
    from modules.matches.bots.schemas import BOT_USER_UUID
    # WHY: Allows frontend to render rich opponent card with AI Bot badge, avatar, and ELO
    if user_id_str == "bot" or user_id_str == str(BOT_USER_UUID):
        return MatchUserProfile(
            id=str(BOT_USER_UUID),
            username="bot_gemini",
            displayName="Gemini Flash (AI)",
            elo=1500,
            avatarUrl="/logos/bot-avatar.png",
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
            return None

        profile = MatchUserProfile(
            id=str(user.id),
            username=user.username,
            displayName=user.display_name or user.username,
            elo=user.elo,
            avatarUrl=user.avatar_url,
            solvedProblemIds=[],
            currentScore=0,
        )
        set_cached_object(cache_key, profile, ttl=45*60)
        return profile
    except Exception as e:
        logger.error(f"[get_user_profile_dict_async] Failed to load user profile: {e}")
        return None



async def create_match_from_pair(p1_id: str, p2_id: str, arena: Arena, session: AsyncSession) -> Matches:
    problems = await select_match_problems(arena, session)
    difficulty_config = {}
    for p in problems:
        difficulty_config[p.difficulty] = difficulty_config.get(p.difficulty, 0) + 1

    from modules.matches.bots.schemas import BOT_USER_UUID
    is_bot = (str(p2_id) == str(BOT_USER_UUID) or p2_id == "bot")
    if is_bot:
        difficulty_config["is_bot"] = True
        difficulty_config["bot_tier"] = "balanced"

    match = Matches(
        slug=f"match_{arena.slug}_{p1_id[:4]}_{p2_id[:4]}_{str(uuid4())[:6]}",
        player_one_id=p1_id,
        player_two_id=BOT_USER_UUID if is_bot else p2_id,
        status="waiting",  # Status starts as "waiting" during 15-second Ready Check phase
        difficulty_config=difficulty_config,
        mode="bot" if is_bot else "live",
        arena_id=arena.id,
        started_at=None,
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)

    for idx, p in enumerate(problems, start=1):
        session.add(Match_Problems(match_id=match.id, problem_id=p.id, order=idx))
    await session.commit()

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

    # WHY: Spawn background AI Bot runner when match is against a bot.
    # The runner operates autonomously in the background without blocking FastAPI request handling.
    from modules.matches.bots.schemas import BOT_USER_UUID
    is_bot_match = (
        getattr(match, "mode", None) == "bot" or
        str(match.player_two_id) == str(BOT_USER_UUID) or
        str(match.player_two_id) == "bot" or
        (isinstance(match.difficulty_config, dict) and match.difficulty_config.get("is_bot"))
    )
    if is_bot_match:
        from modules.matches.bots.runner import run_bot_match
        bot_tier = "balanced"
        if isinstance(match.difficulty_config, dict):
            bot_tier = match.difficulty_config.get("bot_tier", "balanced")
        asyncio.create_task(run_bot_match(match.id, bot_tier=bot_tier))

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
                logger.warning(f"Error invalidating cached profile: {e}")

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
        logger.warning(f"abandon_match_penalty error: {e}")

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
    logger.debug({
        "event": event,
        "match": {**dict_payload, "me": dict_b, "opponent": dict_a},
    })





async def get_waiting_match(session: AsyncSession, target_match_id: str) -> Matches | None:
    """Parse + load a match, returning it only if it still exists and is
    still in the 'waiting' (ready-check) state. Eagerly loads match_problems."""
    try:
        target_uuid = UUID(target_match_id)
    except (ValueError, AttributeError):
        return None
    stmt = (
        select(Matches)
        .where(Matches.id == target_uuid, Matches.status == "waiting")
        .options(
            selectinload(Matches.match_problems).selectinload(Match_Problems.problem)
        )
    )
    res = await session.exec(stmt)
    return res.first()


async def start_match_timer(match_id: UUID | str, duration_seconds: int = DEFAULT_MATCH_DURATION_SECONDS) -> int:
    """Start the real match clock. Called once, at activation time (both
    players accepted), so `timer_end` only exists in Redis from this point
    on. Returns the computed end time."""
    timer_end = int(time.time()) + duration_seconds
    await async_client.hset(f"match:{match_id}", "timer_end", timer_end)
    return timer_end


def calculate_elo_deltas(elo_a: int, elo_b: int, score_a: float, k: int = 32) -> tuple[int, int]:
    """
    Standard ELO formula:
    score_a = 1.0 (Player A wins)
    score_a = 0.0 (Player B wins / Player A loses)
    score_a = 0.5 (Draw)
    Returns: (delta_a, delta_b)
    """
    expected_a = 1.0 / (1.0 + 10.0 ** ((elo_b - elo_a) / 400.0))
    expected_b = 1.0 - expected_a
    score_b = 1.0 - score_a

    raw_delta_a = k * (score_a - expected_a)
    raw_delta_b = k * (score_b - expected_b)

    delta_a = int(round(raw_delta_a))
    delta_b = int(round(raw_delta_b))

    # Guard against 0 delta on a decisive win/loss
    if score_a == 1.0 and delta_a <= 0:
        delta_a = 1
    elif score_a == 0.0 and delta_a >= 0:
        delta_a = -1

    if score_b == 1.0 and delta_b <= 0:
        delta_b = 1
    elif score_b == 0.0 and delta_b >= 0:
        delta_b = -1

    return delta_a, delta_b


async def finalize_match(
    session: AsyncSession,
    match: Matches,
    winner_id: UUID | None = None
) -> Matches:
    """
    Finalizes an active match, calculates final ELO changes, updates player stats & ELO history,
    updates match status to 'completed', and broadcasts the 'match.end' WebSocket event to both players.
    Idempotent: if already completed/abandoned/cancelled, skips re-finalization.
    """
    if str(match.status.value if hasattr(match.status, "value") else match.status) in ["completed", "abandoned", "cancelled"]:
        return match

    from modules.auth.tables import EloHistory
    from core.cache import delete_cache_key

    # 1. Determine Winner
    p1_user = await session.get(User, match.player_one_id)
    p2_user = await session.get(User, match.player_two_id) if match.player_two_id else None

    if winner_id is not None:
        decided_winner_id = winner_id
    else:
        if match.p1_score > match.p2_score:
            decided_winner_id = match.player_one_id
        elif match.p2_score > match.p1_score:
            decided_winner_id = match.player_two_id
        else:
            decided_winner_id = None  # Draw

    # 2. Calculate ELO Deltas
    p1_elo = p1_user.elo if p1_user else 1000
    p2_elo = p2_user.elo if p2_user else (match.bot_elo or 1200)

    if decided_winner_id == match.player_one_id:
        score_a = 1.0
    elif decided_winner_id == match.player_two_id:
        score_a = 0.0
    else:
        score_a = 0.5

    delta1, delta2 = calculate_elo_deltas(p1_elo, p2_elo, score_a)

    # 3. Update Player One Stats
    if p1_user:
        elo_before_1 = p1_user.elo
        elo_after_1 = max(0, p1_user.elo + delta1)
        p1_user.elo = elo_after_1
        p1_user.matches_played += 1
        if decided_winner_id == match.player_one_id:
            p1_user.wins += 1
            p1_user.streak_days += 1
            if p1_user.streak_days > p1_user.longest_win_streak:
                p1_user.longest_win_streak = p1_user.streak_days
        elif decided_winner_id is not None:
            p1_user.losses += 1
            p1_user.streak_days = 0

        session.add(p1_user)

        history1 = EloHistory(
            user_id=p1_user.id,
            match_id=match.id,
            elo_before=elo_before_1,
            elo_after=elo_after_1,
            delta=delta1,
        )
        session.add(history1)

        try:
            delete_cache_key(f"profile:{p1_user.email}")
            delete_cache_key(f"active_match_players:{p1_user.id}")
            delete_cache_key(f"user_cache:{p1_user.id}")
        except Exception as ce:
            logger.warning("Cache invalidation error for p1: %s", ce)

    # 4. Update Player Two Stats (if human user)
    if p2_user:
        elo_before_2 = p2_user.elo
        elo_after_2 = max(0, p2_user.elo + delta2)
        p2_user.elo = elo_after_2
        p2_user.matches_played += 1
        if decided_winner_id == match.player_two_id:
            p2_user.wins += 1
            p2_user.streak_days += 1
            if p2_user.streak_days > p2_user.longest_win_streak:
                p2_user.longest_win_streak = p2_user.streak_days
        elif decided_winner_id is not None:
            p2_user.losses += 1
            p2_user.streak_days = 0

        session.add(p2_user)

        history2 = EloHistory(
            user_id=p2_user.id,
            match_id=match.id,
            elo_before=elo_before_2,
            elo_after=elo_after_2,
            delta=delta2,
        )
        session.add(history2)

        try:
            delete_cache_key(f"profile:{p2_user.email}")
            delete_cache_key(f"active_match_players:{p2_user.id}")
            delete_cache_key(f"user_cache:{p2_user.id}")
        except Exception as ce:
            logger.warning("Cache invalidation error for p2: %s", ce)

    # 5. Update Match Record
    match.status = Match_Status.completed
    match.winner_id = decided_winner_id
    match.p1_elo_delta = delta1
    match.p2_elo_delta = delta2
    match.ended_at = datetime.utcnow()
    session.add(match)
    await session.commit()
    await session.refresh(match)

    # 6. Update Redis Hash Status
    try:
        await async_client.hset(f"match:{match.id}", "status", "completed")
    except Exception as re:
        logger.warning("Redis status update error on match complete: %s", re)

    # 7. Broadcast match.end WebSocket Event to Both Players
    payload_p1 = {
        "event": "match.end",
        "match_id": str(match.id),
        "winner_id": str(decided_winner_id) if decided_winner_id else None,
        "elo_delta": delta1,
        "p1_score": match.p1_score,
        "p2_score": match.p2_score,
        "status": "completed",
    }
    payload_p2 = {
        "event": "match.end",
        "match_id": str(match.id),
        "winner_id": str(decided_winner_id) if decided_winner_id else None,
        "elo_delta": delta2,
        "p1_score": match.p1_score,
        "p2_score": match.p2_score,
        "status": "completed",
    }

    logger.info(
       f"[Match] Broadcasting match.end for match_id={match.id} with winner={decided_winner_id}. delta1={delta1}, delta2={delta2}"
    )
    await manager.send_to(str(match.player_one_id), payload_p1)
    if match.player_two_id:
        await manager.send_to(str(match.player_two_id), payload_p2)

    return match



async def get_match_detail_service(
        match_id: UUID,
        session: AsyncSession,
        user: User
) -> MatchDetail:
    stmt = (
        select(Matches)
        .where(Matches.id == match_id)
        .options(
            selectinload(Matches.arena),
            selectinload(Matches.player_one),
            selectinload(Matches.player_two),
            selectinload(Matches.match_problems)
                .selectinload(Match_Problems.problem)
                    .selectinload(Problem.test_cases),
        )
    )
    res = await session.exec(stmt)
    match = res.first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Select players for the match with direct DB fallback if relationships are None
    p1_user = match.player_one
    if not p1_user and match.player_one_id:
        p1_res = await session.exec(select(User).where(User.id == UUID(str(match.player_one_id))))
        p1_user = p1_res.first()
    
    p2_user = match.player_two
    if not p2_user and match.player_two_id:
        p2_res = await session.exec(select(User).where(User.id == UUID(str(match.player_two_id))))
        p2_user = p2_res.first()
    
    ordered_mps = sorted(match.match_problems, key=lambda mp: mp.order)
    problems_list: list[Problem] = [mp.problem for mp in ordered_mps if mp.problem]
    problems_data: list[MatchProblemData] = []
    
    for prob in problems_list:
        sample_tcs = [t for t in prob.test_cases if t.is_sample]
    
        constraints = []
        if prob.constraints:
            if isinstance(prob.constraints, list):
                constraints = prob.constraints
            elif isinstance(prob.constraints, str):
                constraints = [c for c in prob.constraints.split("\n") if c]
    
        score_val = DIFFICULTY_SCORE.get(prob.difficulty, 2)
    
        problems_data.append(MatchProblemData(
            id=str(prob.id),
            slug=prob.slug,
            title=prob.title,
            difficulty=str(prob.difficulty.value if hasattr(prob.difficulty, "value") else prob.difficulty),
            scoreValue=score_val,
            description=prob.description_md or "",
            inputFormat=prob.input_format or "",
            outputFormat=prob.output_format or "",
            constraints=constraints,
            sampleCases=[
                MatchTestCaseResponse(
                    id=str(tc.id),
                    input=tc.input or "",
                    expectedOutput=tc.expected_output or "",
                    explanation=tc.explanation or ""
                )
                for tc in sample_tcs
            ],
            starterCode=prob.starter_code or {}
        ))
    
    # Dynamically map the profiles based on who is querying the match endpoint
    user_id_str = str(user.id).lower()
    p1_id_str = str(match.player_one_id).lower()
    
    # Retrieve solved problem IDs from Redis cache with DB fallback
    match_redis = await async_client.hgetall(f"match:{match.id}")
    p1_solved_raw = match_redis.get("p1_solved")
    p2_solved_raw = match_redis.get("p2_solved")
    
    p1_solved: list[str] = json.loads(p1_solved_raw) if p1_solved_raw else []
    p2_solved: list[str] = json.loads(p2_solved_raw) if p2_solved_raw else []
    
    if not p1_solved and match.player_one_id:
        p1_sub_stmt = select(Submission.problem_id).where(
            Submission.match_id == match.id,
            Submission.user_id == match.player_one_id,
            Submission.verdict == SubmissionVerdict.accepted,
        ).distinct()
        p1_res = await session.exec(p1_sub_stmt)
        p1_solved = [str(pid) for pid in p1_res.all()]
    
    if not p2_solved and match.player_two_id:
        p2_sub_stmt = select(Submission.problem_id).where(
            Submission.match_id == match.id,
            Submission.user_id == match.player_two_id,
            Submission.verdict == SubmissionVerdict.accepted,
        ).distinct()
        p2_res = await session.exec(p2_sub_stmt)
        p2_solved = [str(pid) for pid in p2_res.all()]
    
    if user_id_str == p1_id_str:
        me_user = p1_user or user
        opp_user = p2_user
        me_score = match.p1_score
        opp_score = match.p2_score
        opp_id = str(match.player_two_id) if match.player_two_id else "bot"
        my_solved = p1_solved
        opp_solved = p2_solved
    else:
        me_user = p2_user or user
        opp_user = p1_user
        me_score = match.p2_score
        opp_score = match.p1_score
        opp_id = str(match.player_one_id)
        my_solved = p2_solved
        opp_solved = p1_solved
    
    me_profile = MatchUserProfile(
        id=str(user.id),
        username=me_user.username if me_user else user.username,
        displayName=(me_user.display_name or me_user.username) if me_user else (user.display_name or user.username),
        elo=me_user.elo if me_user else user.elo,
        avatarUrl=me_user.avatar_url if me_user else user.avatar_url,
        solvedProblemIds=my_solved,
        currentScore=me_score,
    )
    
    opp_username = opp_user.username if opp_user else ("Bot" if opp_id == "bot" else "Opponent")
    opp_display = (opp_user.display_name or opp_user.username) if opp_user else ("Bot" if opp_id == "bot" else "Opponent")
    opp_elo = opp_user.elo if opp_user else (match.bot_elo or 1200)
    opp_avatar = opp_user.avatar_url if opp_user else None
    
    opp_profile = MatchUserProfile(
        id=opp_id,
        username=opp_username,
        displayName=opp_display,
        elo=opp_elo,
        avatarUrl=opp_avatar,
        solvedProblemIds=opp_solved,
        currentScore=opp_score,
    )
    
    timer_end = match_redis.get("timer_end")
    if timer_end:
        timer_end_val = int(timer_end.decode()) if isinstance(timer_end, bytes) else int(timer_end)
    else:
        timer_end_val = int(time.time()) + 1200
    
    # Auto-finalize if match is active and timer has expired
    if str(match.status.value if hasattr(match.status, "value") else match.status) == "active" and timer_end_val <= int(time.time()):
        match = await finalize_match(session, match)
    
    return MatchDetail(
        matchId=str(match.id),
        arenaSlug=match.arena.slug,
        arenaName=match.arena.name,
        mode=str(match.mode.value if hasattr(match.mode, "value") else match.mode),
        status=str(match.status.value if hasattr(match.status, "value") else match.status),
        timerEndUnix=timer_end_val,
        me=me_profile,
        opponent=opp_profile,
        problems=problems_data
    )


async def list_active_arenas_service(session: AsyncSession) -> list[ArenaPublic]:
    """Retrieve all active arenas, utilizing Redis cache with 300s TTL."""
    cache_key = "cache:arenas:active"
    
    # Try fetching from cache
    try:
        cached_data = client.get(cache_key)
        if cached_data:
            if isinstance(cached_data, bytes):
                cached_data = cached_data.decode("utf-8")
            return [ArenaPublic.model_validate(a) for a in json.loads(cached_data)]
    except Exception as e:
        logger.warning(f"Error reading arenas cache: {e}")

    stmt = select(Arena).where(Arena.is_active == True)
    res = await session.exec(stmt)
    arenas = res.all()

    if not arenas:
        raise HTTPException(status_code=404, detail="No active arena configured in database")

    # Serialize and save to cache
    try:
        arenas_list = [ArenaPublic.model_validate(a).model_dump(mode="json") for a in arenas]
        client.setex(cache_key, 300, json.dumps(arenas_list))
    except Exception as e:
        logger.warning(f"Error caching arenas: {e}")

    return [ArenaPublic.model_validate(a) for a in arenas]


async def complete_match_service(
    session: AsyncSession,
    match_id: UUID,
    user_id: UUID
) -> dict[str, Any]:
    """Authoritatively finalize and complete a match by ID for a participant."""
    stmt = select(Matches).where(Matches.id == match_id)
    res = await session.exec(stmt)
    match = res.first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Authorize: user must be one of the match participants
    user_str = str(user_id).lower()
    p1_str = str(match.player_one_id).lower()
    p2_str = str(match.player_two_id).lower() if match.player_two_id else ""
    if user_str != p1_str and user_str != p2_str:
        raise HTTPException(status_code=403, detail="Not a participant in this match")

    finalized = await finalize_match(session, match)
    return {
        "status": "completed",
        "match_id": str(finalized.id),
        "winner_id": str(finalized.winner_id) if finalized.winner_id else None,
        "p1_score": finalized.p1_score,
        "p2_score": finalized.p2_score,
        "p1_elo_delta": finalized.p1_elo_delta,
        "p2_elo_delta": finalized.p2_elo_delta,
    }


async def authenticate_ws_user(
    session: AsyncSession,
    token: str | None,
    elo: int | None = None
) -> tuple[str, int]:
    """Authenticates WS connection by token and returns (active_user_id, user_elo)."""
    if not token:
        raise ValueError("Authentication token missing")

    resolved_user_id = decode_ws_token(token)
    stmt = select(User).where(User.id == UUID(resolved_user_id))
    res = await session.exec(stmt)
    db_user = res.first()
    if not db_user:
        raise ValueError(f"User {resolved_user_id} not found in DB")

    active_user_id = str(db_user.id)
    user_elo = elo if (elo is not None and elo > 0) else (db_user.elo or 1000)
    return active_user_id, user_elo


async def handle_queue_connect(
    session: AsyncSession,
    active_user_id: str,
    user_elo: int,
    arena: Arena
) -> None:
    """Checks for existing active/waiting match or enters matchmaking queue and dispatches match.found."""
    try:
        user_uuid = UUID(active_user_id)
        stmt = select(Matches).where(
            ((Matches.player_one_id == user_uuid) | (Matches.player_two_id == user_uuid)),
            Matches.status.in_(["waiting", "active"])
        )
        res = await session.exec(stmt)
        existing_match = res.first()
    except ValueError:
        existing_match = None

    if existing_match:
        logger.info(
            "queue_ws: User %s is already in match %s (status=%s), skipping queue.",
            active_user_id, existing_match.id, existing_match.status
        )
        return

    opponent_id = await join_queue(active_user_id, user_elo, arena.slug)
    if opponent_id:
        # Create match in 'waiting' status (Ready Check phase)
        match = await create_match_from_pair(str(opponent_id), active_user_id, arena, session)

        me_profile: MatchUserProfile = await get_user_profile_dict_async(session, active_user_id)
        opp_profile: MatchUserProfile = await get_user_profile_dict_async(session, str(opponent_id))

        accept_deadline = int(time.time()) + 15
        base_payload = BasePayload(
            match_id=str(match.id),
            arena=arena.slug,
            timer_end=None,
            accept_deadline=accept_deadline
        )

        await send_paired_event(
            "match.found", active_user_id, me_profile, str(opponent_id), opp_profile, base_payload
        )


async def handle_accept_match_action(
    session: AsyncSession,
    target_match_id: str,
    active_user_id: str,
    arena_slug: str
) -> None:
    """Handles player clicking 'Enter Arena' / accept_match and starts match if both accepted."""
    redis_accept_key = f"match:{target_match_id}:accepted"
    await async_client.sadd(redis_accept_key, active_user_id)
    await async_client.expire(redis_accept_key, 60)

    accepted_count = await async_client.scard(redis_accept_key)
    if accepted_count >= 2:
        m_obj = await get_waiting_match(session, target_match_id)
        if m_obj:
            await activate_match(session, m_obj)

            p1_id_str = str(m_obj.player_one_id)
            p2_id_str = str(m_obj.player_two_id) if m_obj.player_two_id else "bot"

            p1_prof = await get_user_profile_dict_async(session, p1_id_str)
            p2_prof = await get_user_profile_dict_async(session, p2_id_str)
            match_timer_end = await start_match_timer(m_obj.id)

            start_payload = BasePayload(
                match_id=str(m_obj.id),
                arena=arena_slug,
                timer_end=match_timer_end
            )

            await send_paired_event(
                "match.start", p1_id_str, p1_prof, p2_id_str, p2_prof, start_payload
            )


async def handle_decline_match_action(
    session: AsyncSession,
    target_match_id: str,
    active_user_id: str
) -> None:
    """Handles player declining a match and notifies both parties."""
    m_obj = await get_waiting_match(session, target_match_id)
    if m_obj:
        await abandon_match_penalty(session, m_obj, active_user_id, penalty_elo=10)

        other_user_id = (
            str(m_obj.player_two_id)
            if str(m_obj.player_one_id) == active_user_id
            else str(m_obj.player_one_id)
        )

        await manager.send_to(active_user_id, {
            "event": "match.abandoned",
            "reason": "You declined the match (-10 ELO penalty).",
            "penalty_elo": -10,
        })
        await manager.send_to(other_user_id, {
            "event": "match.cancelled",
            "reason": "Opponent declined match. Re-queuing...",
        })


async def handle_disconnect_forfeit(
    session: AsyncSession,
    active_user_id: str
) -> None:
    """If a user disconnects while an active match is ongoing, applies forfeit penalty."""
    try:
        user_uuid_check = UUID(active_user_id)
        stmt = select(Matches).where(
            ((Matches.player_one_id == user_uuid_check) | (Matches.player_two_id == user_uuid_check)),
            Matches.status == "active"
        )
        res = await session.exec(stmt)
        active_match = res.first()
        if active_match:
            logger.warning(
                "queue_ws: User %s disconnected mid-match %s — applying forfeit",
                active_user_id, active_match.id
            )
            await abandon_match_penalty(session, active_match, active_user_id, penalty_elo=15)
            other_id = (
                str(active_match.player_two_id)
                if str(active_match.player_one_id) == active_user_id
                else str(active_match.player_one_id)
            )
            await manager.send_to(other_id, {
                "event": "match.abandoned",
                "reason": "Opponent disconnected — you win by forfeit.",
            })
    except Exception as forfeit_err:
        logger.warning(f"queue_ws: Forfeit on disconnect failed: {forfeit_err}")