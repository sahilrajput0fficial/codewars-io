from fastapi import WebSocket
from starlette.websockets import WebSocketState
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: str, ws: WebSocket):
        if ws.client_state == WebSocketState.CONNECTING:
            await ws.accept()
        self.active[user_id].add(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        self.active[user_id].discard(ws)
        if user_id in self.active and not self.active[user_id]:
            del self.active[user_id]

    async def send_to(self, user_id: str, message: dict):
        connections = self.active.get(user_id, set())
        print(f"[ConnectionManager] Attempting to send message to user={user_id}. Active users connected: {list(self.active.keys())}. Connections count={len(connections)}")
        for ws in list(connections):
            try:
                await ws.send_json(message)
                print(f"[ConnectionManager] Successfully sent message to user={user_id}")
            except Exception as e:
                print(f"[ConnectionManager] Error sending to user={user_id}: {e}")

manager = ConnectionManager()