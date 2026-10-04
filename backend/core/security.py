from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from config import Credentials
from fastapi import Cookie, Header, HTTPException, status 

password_hasher = PasswordHasher()

ALGORITHM: str = "HS256"


def hash_password(password: str) -> str:
    return password_hasher.hash(password)



def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hasher.verify(hashed_password, password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates short-lived access token (default 15 minutes)"""
    to_encode: Dict[str, Any] = data.copy()
    expire: datetime = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, Credentials.effective_jwt_secret, algorithm=ALGORITHM)

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates long-lived refresh token (default 7 days)"""
    to_encode: Dict[str, Any] = data.copy()
    expire: datetime = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, Credentials.effective_jwt_refresh_secret, algorithm=ALGORITHM)

def create_jwt(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Alias for create_access_token for backward compatibility"""
    return create_access_token(data, expires_delta)


def verify_jwt(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Verify JWT access token from access_token cookie or Authorization header"""
    token = access_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated"
        )

    try:
        payload: Dict[str, Any] = jwt.decode(
            token, 
            Credentials.effective_jwt_secret, 
            algorithms=[ALGORITHM]
        )
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type (expected access token)"
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid token"
        )


def verify_refresh_token(token: str) -> Dict[str, Any]:
    """Verify JWT refresh token"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    try:
        payload: Dict[str, Any] = jwt.decode(
            token,
            Credentials.effective_jwt_refresh_secret,
            algorithms=[ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type for refresh"
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


def decode_ws_token(token: str) -> str:
    """
    Decode and validate an access token for WebSocket auth.
    Returns the ``sub`` (user UUID string) on success.
    Raises ``ValueError`` with a human-readable message on any failure
    so the WS handler can close with code 1008 without duplicating logic.
    """
    try:
        payload: Dict[str, Any] = jwt.decode(
            token,
            Credentials.effective_jwt_secret,
            algorithms=[ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Invalid token: {exc}")

    if payload.get("type") != "access":
        raise ValueError("Token must be a valid access token")

    sub = payload.get("sub")
    if not sub:
        raise ValueError("No sub claim in token")

    return sub
