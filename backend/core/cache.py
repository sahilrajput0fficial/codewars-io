import json
from typing import Any, Optional, Type, TypeVar
from pydantic import BaseModel
from db.redis import client, async_client
from core.logger import logger

T = TypeVar("T", bound=BaseModel)

# ── Sync helpers (for sync service functions) ──────────────────────────────────

def get_cached_object(key: str, model_type: Type[T]) -> Optional[T]:
    """Retrieve and deserialize a Pydantic model from Redis."""
    try:
        data = client.get(key)
        if data:
            if isinstance(data, bytes):
                data = data.decode("utf-8")
            return model_type.model_validate_json(data)
    except Exception as e:
        logger.error(f"[Cache] Error getting key {key}: {e}")
    return None

def set_cached_object(key: str, obj: BaseModel, ttl: int = 60) -> None:
    """Serialize and save a Pydantic model to Redis with a TTL."""
    try:
        client.setex(key, ttl, obj.model_dump_json())
    except Exception as e:
        logger.error(f"[Cache] Error setting key {key}: {e}")

def delete_cache_key(key: str) -> None:
    """Delete a single cache key."""
    try:
        client.delete(key)
    except Exception as e:
        logger.error(f"[Cache] Error deleting key {key}: {e}")

def invalidate_pattern(pattern: str) -> None:
    """Find and delete all keys matching a pattern using SCAN (non-blocking)."""
    try:
        cursor = 0
        while True:
            cursor, keys = client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.error(f"[Cache] Error invalidating pattern {pattern}: {e}")


# ── Async helpers (for async route handlers / services) ───────────────────────

async def async_get_cached_object(key: str, model_type: Type[T]) -> Optional[T]:
    """Async: retrieve and deserialize a Pydantic model from Redis."""
    try:
        data = await async_client.get(key)
        logger.info(f"DATA : {data}")
        if data:
            if isinstance(data, bytes):
                data = data.decode("utf-8")
            return model_type.model_validate_json(data) # return complete model
    except Exception as e:
        logger.error(f"[Cache] Error getting key {key}: {e}")
    return None

async def async_set_cached_object(key: str, obj: BaseModel, ttl: int = 60) -> None:
    """Async: serialize and save a Pydantic model to Redis with a TTL."""
    try:
        await async_client.setex(key, ttl, obj.model_dump_json())
    except Exception as e:
        logger.error(f"[Cache] Error setting key {key}: {e}")

async def async_delete_cache_key(key: str) -> None:
    """Async: delete a single cache key."""
    try:
        await async_client.delete(key)
    except Exception as e:
        logger.error(f"[Cache] Error deleting key {key}: {e}")

async def async_invalidate_pattern(pattern: str) -> None:
    """Async: find and delete all keys matching a pattern using SCAN (non-blocking)."""
    try:
        cursor = 0
        while True:
            cursor, keys = await async_client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await async_client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.error(f"[Cache] Error invalidating pattern {pattern}: {e}")
