import asyncio
import json
import logging
import uuid
from collections import defaultdict
from fastapi import WebSocket
from starlette.websockets import WebSocketState
from db.redis import async_client

logger = logging.getLogger(__name__)

MATCH_BROADCAST_CHANNEL = "ws:match_broadcast"

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, set[WebSocket]] = defaultdict(set)
        self.node_id: str = str(uuid.uuid4())
        self._listener_task: asyncio.Task | None = None

    async def connect(self, user_id: str, ws: WebSocket):
        if ws.client_state == WebSocketState.CONNECTING:
            await ws.accept()
        self.active[user_id].add(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        self.active[user_id].discard(ws)
        if user_id in self.active and not self.active[user_id]:
            del self.active[user_id]

    async def _send_local(self, user_id: str, message: dict):
        connections = self.active.get(user_id, set())
        logger.debug(
            "[ConnectionManager] Sending local message to user=%s (connections=%d)",
            user_id, len(connections)
        )
        for ws in list(connections):
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
            except Exception as e:
                logger.warning("[ConnectionManager] Error sending to user=%s: %s", user_id, e)

    async def send_to(self, user_id: str, message: dict):
        """Send to local WebSockets and broadcast to Redis Pub/Sub for other processes/workers."""
        # 1. Send locally first if client is connected to this process
        await self._send_local(user_id, message)

        # 2. Publish to Redis so other processes (FastAPI / workers) receive it
        try:
            payload = {
                "sender_node": self.node_id,
                "user_id": user_id,
                "message": message,
            }
            await async_client.publish(MATCH_BROADCAST_CHANNEL, json.dumps(payload))
        except Exception as pub_err:
            logger.debug("[ConnectionManager] Redis publish skipped/failed: %s", pub_err)

    async def start_redis_listener(self):
        """Background listener subscribing to Redis Pub/Sub for inter-process WS events."""
        try:
            pubsub = async_client.pubsub()
            await pubsub.subscribe(MATCH_BROADCAST_CHANNEL)
            logger.info("[ConnectionManager] Subscribed to Redis channel: %s", MATCH_BROADCAST_CHANNEL)
            async for raw_msg in pubsub.listen():
                if raw_msg and raw_msg.get("type") == "message":
                    try:
                        data = json.loads(raw_msg.get("data", "{}"))
                        # Ignore messages originating from self to avoid duplicate delivery
                        if data.get("sender_node") == self.node_id:
                            continue
                        target_user = data.get("user_id")
                        msg = data.get("message")
                        if target_user and msg:
                            await self._send_local(target_user, msg)
                    except Exception as e:
                        logger.warning("[ConnectionManager] Error handling pubsub message: %s", e)
        except asyncio.CancelledError:
            logger.info("[ConnectionManager] Redis listener cancelled.")
        except Exception as e:
            logger.error("[ConnectionManager] Redis listener loop error: %s", e)

manager = ConnectionManager()