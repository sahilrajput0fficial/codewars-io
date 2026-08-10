from db.redis import client , async_client

RADIUS = 200

async def join_queue(user_id: str, elo: int, arena_name: str) -> str | None:
    """
    Try to find a waiting opponent within ELO range, in the SAME arena.
    Returns the opponent's user_id if paired, None if now waiting.
    """
    queue_key = f"mqueue:{arena_name}"

    # redis-py v8: zrangebyscore is removed — use zrange with byscore=True
    candidates = await async_client.zrange(
        queue_key,
        float(elo - RADIUS),
        float(elo + RADIUS),
        byscore=True,
    )
    opponents = [op for op in candidates if op != user_id]

    if opponents:
        opponent_id = opponents[0]
        await async_client.zrem(queue_key, opponent_id)
        await async_client.zrem(queue_key, user_id)   # in case user_id was already queued from a stale connection
        return opponent_id

    await async_client.zadd(queue_key, {user_id: elo})
    print(f"[USER ADDED TO QUEUE]:{user_id}")
    return None


async def leave_queue(user_id: str, arena_name: str):
    await async_client.zrem(f"mqueue:{arena_name}", user_id)