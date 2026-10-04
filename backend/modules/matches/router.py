import json
import uuid
from typing import Annotated, List, Optional
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query, Depends, HTTPException, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from modules.auth.tables import User
from modules.auth.dependencies import get_current_user_async
from core.connection_manager import manager
from core.join_queue import leave_queue
from db.session import get_session_async
from core.logger import logger
from .services import (
    list_active_arenas_service,
    get_match_detail_service,
    complete_match_service,
    get_arena_or_404,
    authenticate_ws_user,
    handle_queue_connect,
    handle_accept_match_action,
    handle_decline_match_action,
    handle_disconnect_forfeit,
)
from .schemas import MatchDetail, ArenaPublic
from .duels.router import router as duel_router


router = APIRouter(prefix="/matches", tags=["Matches"])
router.include_router(duel_router)


@router.get("/arenas", response_model=List[ArenaPublic], summary="List active arenas")
async def list_arenas(session: Annotated[AsyncSession, Depends(get_session_async)]):
    return await list_active_arenas_service(session)


@router.get("/{match_id}", response_model=MatchDetail, summary="Get detailed match info by ID")
async def get_match_detail(
    match_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_session_async)],
    user: Annotated[User, Depends(get_current_user_async)]
):
    if not match_id:
        raise HTTPException(status_code=404, detail="Match Id not found")
    return await get_match_detail_service(match_id=match_id, session=session, user=user)


@router.post("/{match_id}/complete", summary="Authoritatively finalize and complete a match")
async def complete_match_endpoint(
    match_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_session_async)],
    user: Annotated[User, Depends(get_current_user_async)]
):
    """
    Once the match is completed or a player solves all or something happens causing match.end to
    trigger for the players, then the match will be finalized.
    This route is called (only by user who is in match) and it will finalize the match.
    It is idempotent -> once match is completed, any further calls will not change the match status.
    """
    return await complete_match_service(session=session, match_id=match_id, user_id=user.id)


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

    try:
        active_user_id, user_elo = await authenticate_ws_user(session, access_token, elo)
    except Exception as e:
        logger.error(f"Failed to authenticate user in queue_ws: {e}")
        await websocket.close(code=1008)
        return

    try:
        arena = await get_arena_or_404(session, arena_id)
    except Exception as e:
        logger.error(f"queue_ws: Arena lookup failed for arena_id={arena_id}: {e}")
        await websocket.close(code=1008)
        return

    await manager.connect(active_user_id, websocket)

    try:
        await handle_queue_connect(session, active_user_id, user_elo, arena)

        while True:
            msg_text = await websocket.receive_text()
            try:
                msg_data = json.loads(msg_text)
                action = msg_data.get("action")
                target_match_id = msg_data.get("match_id")

                if action == "accept_match" and target_match_id:
                    await handle_accept_match_action(session, target_match_id, active_user_id, arena.slug)
                elif action == "decline_match" and target_match_id:
                    await handle_decline_match_action(session, target_match_id, active_user_id)
            except Exception as parse_err:
                logger.warning(f"queue_ws: Message parse/process error: {parse_err}")

    except WebSocketDisconnect:
        logger.info(f"queue_ws: Client disconnected user={active_user_id}")
        await handle_disconnect_forfeit(session, active_user_id)
    except Exception as e:
        logger.exception(f"queue_ws: Unexpected error in queue loop: {e}")
    finally:
        manager.disconnect(active_user_id, websocket)
        await leave_queue(active_user_id, arena.slug)
