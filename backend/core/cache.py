import json
from typing import Any, Optional, Type, TypeVar
from pydantic import BaseModel
from db.redis import client

T = TypeVar("T", bound=BaseModel)

def get_cached_object(key: str, model_type: Type[T]) -> Optional[T]:
    """Retrieve and deserialize a Pydantic model from Redis."""
    try:
        data = client.get(key)
        if data:
            if isinstance(data, bytes):
                data = data.decode("utf-8")
            return model_type.model_validate_json(data)
    except Exception as e:
        print(f"[Cache] Error getting key {key}: {e}")
    return None

def set_cached_object(key: str, obj: BaseModel, ttl: int = 60) -> None:
    """Serialize and save a Pydantic model to Redis with a TTL."""
    try:
        client.setex(key, ttl, obj.model_dump_json())
    except Exception as e:
        print(f"[Cache] Error setting key {key}: {e}")

def delete_cache_key(key: str) -> None:
    """Delete a single cache key."""
    try:
        client.delete(key)
    except Exception as e:
        print(f"[Cache] Error deleting key {key}: {e}")

def invalidate_pattern(pattern: str) -> None:
    """Find and delete all keys matching a pattern."""
    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
    except Exception as e:
        print(f"[Cache] Error invalidating pattern {pattern}: {e}")
