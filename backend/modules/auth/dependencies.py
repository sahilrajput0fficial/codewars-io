from fastapi import Depends, HTTPException 
from sqlmodel import Session, select
from typing import Dict, Any
from core.security import verify_jwt    
from modules.auth.tables import User 
from db.session import get_session
from core.cache import get_cached_object, set_cached_object

import uuid

redis_profile_key = "cache:profile:{user_id}"

def get_current_user(
    session: Session = Depends(get_session),
    jwt_data: Dict[str, Any] = Depends(verify_jwt)
) -> User:
    """Get Current User once the JWT is verified"""
    user_id: str = jwt_data.get("sub", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Try to load user from cache first
    cache_key = redis_profile_key.format(user_id=user_id)
    cached_user = get_cached_object(cache_key, User)
    if cached_user:
        return cached_user

    # Cache miss: query the database
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")

    statement = select(User).where(User.id == user_uuid)
    user: User | None = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    # Store in cache with 5 minute TTL (300 seconds)
    set_cached_object(cache_key, user, ttl=300)
    return user

