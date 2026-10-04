import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.logger import logger
from core.cache import async_set_cached_object, async_get_cached_object, async_delete_cache_key
from config import Credentials
from db.session import get_session_async
from modules.auth.dependencies import get_current_user
from modules.auth.tables import User
from core.connection_manager import manager
from modules.matches.services import (
    get_arena_or_404,
    create_match_from_pair,
    activate_match,
    start_match_timer,
)
from .schemas import CreateCodeModel, CreateDuelRequest

router = APIRouter(
    prefix="/duel",
    tags=["Duels"],
)

duel_key = "cache:duel:{code}"


@router.post("/", response_model=CreateCodeModel, summary="Create a private friendly duel room")
async def create_duel_room(
    user: Annotated[User, Depends(get_current_user)],
    payload: Optional[CreateDuelRequest] = None,
    arena_slug: Optional[str] = None,
    is_ranked: Optional[bool] = None,
):
    chosen_arena = (payload.arena_slug if payload else None) or arena_slug or "kabul"
    ranked_flag = (payload.is_ranked if payload else None) if (payload and payload.is_ranked is not None) else (is_ranked or False)

    room_code = str(uuid.uuid4())[:6].upper()
    frontend_base = Credentials.FRONTEND_URL.rstrip("/")
    model = CreateCodeModel(
        code=room_code,
        url=f"{frontend_base}/duel/invite/{room_code}",
        arena_slug=chosen_arena,
        is_ranked=ranked_flag,
        host_id=user.id,
        host_name=user.display_name or user.username,
        host_avatar=user.avatar_url or None,
        status="waiting",
    )
    await async_set_cached_object(duel_key.format(code=room_code), model, 60 * 30)
    return model


@router.get("/{code}", response_model=CreateCodeModel, summary="Get duel room status")
async def get_duel_room(
    code: Annotated[str, Path()]
):
    clean_code = code.upper()
    key = duel_key.format(code=clean_code)
    room_data = await async_get_cached_object(key, CreateCodeModel)
    if not room_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or has expired"
        )
    return room_data


@router.post("/join/{code}", response_model=CreateCodeModel, summary="Guest player joins the duel lobby")
async def join_match_duel(
    user: Annotated[User, Depends(get_current_user)],
    code: Annotated[str, Path()]
):
    clean_code = code.upper()
    key = duel_key.format(code=clean_code)
    room_data = await async_get_cached_object(key, CreateCodeModel)
    logger.debug(f"ROOM DATA for {clean_code}: {room_data}")

    if not room_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or has expired"
        )

    if uuid.UUID(str(user.id)) == uuid.UUID(str(room_data.host_id)):
        logger.error(f"The Current User is the HOST of the duel room {user.id} : {room_data.host_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot join your own duel room"
        )

    if room_data.guest_id is not None and str(room_data.guest_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is already full"
        )

    room_data.guest_id = user.id
    room_data.guest_name = user.display_name or user.username
    room_data.guest_avatar = user.avatar_url
    room_data.status = "ready"

    await async_set_cached_object(key, room_data, 60 * 30)

    # Notify host via WebSocket if connected
    try:
        await manager.send_to(str(room_data.host_id), {
            "event": "duel.guest_joined",
            "room": room_data.model_dump(mode="json"),
        })
    except Exception as ws_err:
        logger.warning(f"Failed to notify host of duel join: {ws_err}")

    return room_data


@router.post("/start/{code}", response_model=CreateCodeModel, summary="Host starts the duel match")
async def start_duel_room(
    user: Annotated[User, Depends(get_current_user)],
    code: Annotated[str, Path()],
    session: Annotated[AsyncSession, Depends(get_session_async)],
):
    clean_code = code.upper()
    key = duel_key.format(code=clean_code)
    room_data = await async_get_cached_object(key, CreateCodeModel)
    logger.debug(f"START DUEL for {clean_code}: {room_data}")

    if not room_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found or has expired"
        )

    if uuid.UUID(str(user.id)) != uuid.UUID(str(room_data.host_id)):
        logger.error(f"User {user.id} is not the host of duel {clean_code} (host={room_data.host_id})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can start the duel"
        )

    if not room_data.guest_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start duel: waiting for a friend to join"
        )

    arena = await get_arena_or_404(session, room_data.arena_slug)

    # Create and activate match in DB
    match = await create_match_from_pair(
        p1_id=str(room_data.host_id),
        p2_id=str(room_data.guest_id),
        arena=arena,
        session=session,
    )
    await activate_match(session, match)
    await start_match_timer(match.id)

    room_data.status = "started"
    room_data.match_id = match.id
    await async_set_cached_object(key, room_data, 60 * 30)

    # Broadcast match start redirect to both players
    start_event = {
        "event": "duel.started",
        "match_id": str(match.id),
        "redirect_url": f"/match/{match.id}",
    }
    try:
        await manager.send_to(str(room_data.host_id), start_event)
        await manager.send_to(str(room_data.guest_id), start_event)
    except Exception as ws_err:
        logger.warning(f"Failed to broadcast duel.started: {ws_err}")

    return room_data


@router.delete("/{code}", summary="Cancel or leave duel room")
async def leave_or_cancel_duel(
    user: Annotated[User, Depends(get_current_user)],
    code: Annotated[str, Path()],
):
    clean_code = code.upper()
    key = duel_key.format(code=clean_code)
    room_data = await async_get_cached_object(key, CreateCodeModel)
    if not room_data:
        return {"status": "ok", "message": "Room already closed"}

    user_uuid = uuid.UUID(str(user.id))
    if user_uuid == uuid.UUID(str(room_data.host_id)):
        # Host left -> dissolve room
        if room_data.guest_id:
            try:
                await manager.send_to(str(room_data.guest_id), {
                    "event": "duel.cancelled",
                    "reason": "Host closed the duel lobby.",
                })
            except Exception as ws_err:
                logger.warning(f"Failed to notify guest of duel cancellation: {ws_err}")
        await async_delete_cache_key(key)
        return {"status": "ok", "message": "Duel lobby cancelled"}
    elif room_data.guest_id and user_uuid == uuid.UUID(str(room_data.guest_id)):
        # Guest left -> reset guest slot
        room_data.guest_id = None
        room_data.guest_name = None
        room_data.guest_avatar = None
        room_data.status = "waiting"
        await async_set_cached_object(key, room_data, 60 * 30)
        try:
            await manager.send_to(str(room_data.host_id), {
                "event": "duel.guest_left",
                "room": room_data.model_dump(mode="json"),
            })
        except Exception as ws_err:
            logger.warning(f"Failed to notify host of guest leave: {ws_err}")
        return {"status": "ok", "message": "Left duel lobby"}

    raise HTTPException(status_code=400, detail="You are not a participant in this room")
