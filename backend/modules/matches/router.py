import logging
import uuid
import time
from typing import Annotated, List, Optional
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, status, Query, Depends, HTTPException , Cookie ,Request
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from modules.auth.tables import User
from modules.auth.dependencies import get_current_user
from core.connection_manager import manager
from core.join_queue import join_queue, leave_queue
from db.redis import client, async_client
from db.session import get_session_async
from modules.problems.tables import Problem, TestCase
from modules.problems.schemas import TestCasePublicResponse
from .tables import Arena, Matches
from .services import (
    get_user_profile_dict_async,
    get_arena_or_404,
    validate_elo_for_arena,
    create_match_from_pair,
    select_match_problems,
    activate_match,
    abandon_match_penalty,
    send_paired_event,
    start_match_timer,
    get_waiting_match
)
from .schemas import MatchProblemData , MatchUserProfile , MatchDetail , BasePayload, MatchTestCaseResponse
import json
import logging

router = APIRouter(prefix="/matches", tags=["Matches"])
logger = logging.getLogger(__name__)

@router.get("/arenas", summary="List active arenas")
async def list_arenas(session: Annotated[AsyncSession, Depends(get_session_async)]):
    cache_key = "cache:arenas:active"
    
    # Try fetching from cache
    try:
        cached_data = client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
    except Exception as e:
        logger.warning(f"Error reading arenas cache: {e}")

    stmt = select(Arena).where(Arena.is_active == True)
    res = await session.exec(stmt)
    arenas = res.all()

    if not arenas:
        raise HTTPException(status_code=404, detail="No active arena configured in database")

    # Serialize and save to cache
    try:
        arenas_list = []
        for arena in arenas:
            d = arena.model_dump()
            d["id"] = str(d["id"])
            if "created_at" in d and hasattr(d["created_at"], "isoformat"):
                d["created_at"] = d["created_at"].isoformat()
            arenas_list.append(d)
            
        client.setex(cache_key, 300, json.dumps(arenas_list))
    except Exception as e:
        logger.warning(f"Error caching arenas: {e}")

    return arenas

DIFFICULTY_SCORE = {
    "easy": 2,
    "medium": 4,
    "hard": 7,
    "extreme": 10,
    "hardcore": 15,
}


@router.get("/{match_id}", summary="Get detailed match info by ID")
async def get_match_detail(
    match_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_session_async)],
    user : Annotated[User , Depends(get_current_user)]
):
    stmt = select(Matches).where(Matches.id == match_id).options(selectinload(Matches.arena))
    res = await session.exec(stmt)
    match = res.first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    p1_user = None 
    p2_user = None
    if match.player_one_id == user.id:
        p1_user = await session.get(User, match.player_one_id)
        p2_user = await session.get(User, match.player_two_id)
    else:
        p1_user = await session.get(User, match.player_two_id)
        p2_user = await session.get(User, match.player_one_id)

    problems_data : List[MatchProblemData] = []
    for pid in match.problem_ids:
        prob = await session.get(Problem, pid)
        if prob:
            tc_stmt = select(TestCase).where(TestCase.problem_id == prob.id, TestCase.is_sample == True)
            tc_res = await session.exec(tc_stmt)
            sample_tcs = tc_res.all()

            constraints = []
            if prob.constraints:
                if isinstance(prob.constraints, list):
                    constraints = prob.constraints
                elif isinstance(prob.constraints, str):
                    constraints = [c for c in prob.constraints.split("\n") if c]

            score_val = DIFFICULTY_SCORE[prob.difficulty]

            problems_data.append(MatchProblemData(
                id=str(prob.id),
                slug = prob.slug,
                title = prob.title,
                difficulty =  prob.difficulty,
                scoreValue = score_val,
                description = prob.description_md or prob.description or "",
                inputFormat = prob.input_format or "",
                outputFormat = prob.output_format or "",
                constraints = constraints,
                sampleCases= [
                    MatchTestCaseResponse(
                        id=str(tc.id),
                        input=tc.input or "",
                        expectedOutput=tc.expected_output or "",
                        explanation=tc.explanation or ""
                    )
                    for tc in sample_tcs
                ],
                starterCode = prob.starter_code or {}
        ))
    # Dynamically map the profiles based on who is querying the match endpoint
    if match.player_one_id == user.id:
        me_user = p1_user
        opp_user = p2_user
        me_score = match.p1_score
        opp_score = match.p2_score
        opp_id = str(match.player_two_id) if match.player_two_id else "bot"
    else:
        me_user = p1_user  # player_two
        opp_user = p2_user  # player_one
        me_score = match.p2_score
        opp_score = match.p1_score
        opp_id = str(match.player_one_id)

    me_profile = MatchUserProfile(
        id = str(user.id),
        username = me_user.username if me_user else "Player 1",
        displayName=(me_user.display_name or me_user.username) if me_user else "Player 1",
        elo = me_user.elo if me_user else 1200,
        avatarUrl =  me_user.avatar_url if me_user else None,
        solvedProblemIds= [],
        currentScore=me_score,
    )

    opp_profile = MatchUserProfile(
        id = opp_id ,
        username = opp_user.username if opp_user else "Opponent",
        displayName=(opp_user.display_name or opp_user.username) if opp_user else "Player 1",
        elo = opp_user.elo if opp_user else 1200,
        avatarUrl =  opp_user.avatar_url if opp_user else None,
        solvedProblemIds= [],
        currentScore=opp_score
    )

    timer_end = await async_client.hget(f"match:{match.id}", "timer_end")
    if timer_end:
        timer_end_val = int(timer_end.decode()) if isinstance(timer_end, bytes) else int(timer_end)
    else:
        timer_end_val = int(time.time()) + 1200

    return MatchDetail(
        matchId=str(match.id),
        arenaSlug= match.arena.slug,
        arenaName = match.arena.name,
        mode=match.mode,
        timerEndUnix=timer_end_val ,
        me= me_profile,
        opponent=opp_profile,
        problems=problems_data
    )


@router.websocket("/ws/queue")
async def queue_ws(
    websocket: WebSocket,
    session: Annotated[AsyncSession, Depends(get_session_async)],
    arena_id: str = Query(default="kabul"),
    user_id: Optional[str] = Query(default=None),
    elo: Optional[int] = Query(default=1000),
    access_token: Optional[str] = Cookie(None),
):
    await websocket.accept()

    token = (user_id if user_id and user_id.strip() else None) or access_token
    if not token:
        logger.error("queue_ws: Authentication token missing (user_id=%s, access_token=%s)", user_id, access_token)
        await websocket.close(code=1008)
        return

    try:
        from core.security import verify_jwt
        import jwt
        from config import Credentials
        from core.security import ALGORITHM
        
        resolved_user_id = None
        # First attempt: Decode as JWT token
        try:
            payload = jwt.decode(
                token, 
                Credentials.SUPER_SECRET_KEY, 
                algorithms=[ALGORITHM]
            )
            resolved_user_id = payload.get("sub")
        except Exception:
            # Second attempt: Direct user ID / UUID string
            resolved_user_id = token

        if not resolved_user_id:
            raise ValueError("No sub claim or valid user ID found in token")
            
        stmt = select(User).where(User.id == uuid.UUID(resolved_user_id))
        res = await session.exec(stmt)
        db_user = res.first()
        if not db_user:
            raise ValueError(f"User {resolved_user_id} not found in DB")
            
        active_user_id = str(db_user.id)
        user_elo = elo if (elo is not None and elo > 0) else (db_user.elo or 1000)
    except Exception as e:
        logger.error("Failed to verify user token in queue_ws: %s", e)
        await websocket.close(code=1008)
        return



    try:
        arena = await get_arena_or_404(session, arena_id)
    except Exception as e:
        logger.exception("queue_ws: Arena lookup failed for arena_id=%s: %s", arena_id, e)
        await websocket.close(code=1008)
        return

    await manager.connect(active_user_id, websocket)

    try:
        # Check if the user is already in an active or waiting match in this arena
        existing_match = None
        try:
            user_uuid = uuid.UUID(active_user_id)
            stmt = select(Matches).where(
                ((Matches.player_one_id == user_uuid) | (Matches.player_two_id == user_uuid)),
                Matches.status.in_(["waiting", "active"])
            )
            res = await session.exec(stmt)
            existing_match = res.first()
        except ValueError:
            pass

        if existing_match:
            logger.info("queue_ws: User %s is already in match %s (status=%s), skipping queue.", active_user_id, existing_match.id, existing_match.status)
        else:
            try:
                opponent_id = await join_queue(active_user_id, user_elo, arena.slug)
            except Exception as queue_err:
                logger.exception("queue_ws: join_queue failed for user=%s arena=%s: %s", active_user_id, arena.slug, queue_err)
                await websocket.send_json({"event": "error", "detail": "Queue unavailable, please retry."})
                await websocket.close(code=1011)
                return

            if opponent_id:
                # 1. Create match in 'waiting' status (Ready Check phase)
                match = await create_match_from_pair(str(opponent_id), active_user_id, arena, session)

                me_profile : MatchUserProfile =  await get_user_profile_dict_async(session, active_user_id)
                opp_profile : MatchUserProfile = await get_user_profile_dict_async(session, str(opponent_id))

                accept_deadline = int(time.time()) + 15
                timer_end = None

                base_payload = BasePayload(
                    match_id=str(match.id),
                    arena= arena.slug,
                    problem_ids=[str(pid) for pid in match.problem_ids],
                    timer_end = timer_end,
                    accept_deadline=accept_deadline
                )

                await send_paired_event(
                    "match.found", active_user_id, me_profile, str(opponent_id), opp_profile, base_payload
                )

        # 3. WebSocket event processing loop


        while True:
            msg_text = await websocket.receive_text()
            try:
                msg_data = json.loads(msg_text)
                action = msg_data.get("action")
                target_match_id = msg_data.get("match_id")

                if action == "accept_match" and target_match_id:
                    # Record that this user clicked 'Enter Arena'
                    redis_accept_key = f"match:{target_match_id}:accepted"
                    await async_client.sadd(redis_accept_key, active_user_id)
                    await async_client.expire(redis_accept_key, 60)

                    accepted_count = await async_client.scard(redis_accept_key)
                    
                    #?  If BOTH players have accepted, activate match & emit "match.start"
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
                                arena=arena.slug,
                                problem_ids=[str(pid) for pid in m_obj.problem_ids],
                                timer_end=match_timer_end
                            )
        

                            await send_paired_event(
                                "match.start", p1_id_str, p1_prof, p2_id_str, p2_prof, start_payload
                            )


                elif action == "decline_match" and target_match_id:
                    #?  User manually declined the match — apply -10 ELO penalty
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

            except Exception as parse_err:
                logger.warning("queue_ws: Message parse/process error: %s", parse_err)

    except WebSocketDisconnect:
        logger.info("queue_ws: Client disconnected user=%s", active_user_id)
    except Exception as e:
        logger.exception("queue_ws: Unexpected error in queue loop: %s", e)
    finally:
        manager.disconnect(active_user_id, websocket)
        await leave_queue(active_user_id, arena.slug)
