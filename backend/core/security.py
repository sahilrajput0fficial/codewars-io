import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from config import Credentials
from fastapi import Cookie, HTTPException, status

ALGORITHM: str = "HS256"

def hash_password(password: str) -> str:
    """Hash plain passwords into undecodeable hashes"""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt, 
        100000
    )
    return f"{salt.hex()}:{key.hex()}"




def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    try:
        salt_hex, key_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac(
            'sha256', 
            plain_password.encode('utf-8'), 
            salt, 
            100000
        )
        return new_key == key
    except Exception:
        return False



def create_jwt(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """if user login verified , then this utility provides a jwt"""
    to_encode: Dict[str, Any] = data.copy()
    if expires_delta:
        expire: datetime = datetime.now(timezone.utc) + expires_delta
    else:
        expire: datetime = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt: str = jwt.encode(to_encode, Credentials.SUPER_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt




def verify_jwt(access_token: Optional[str] = Cookie(None)) -> Dict[str, Any]:
    """if user visits a private route , this utility verifies his/her identity"""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated"
        )
    try:
        payload: Dict[str, Any] = jwt.decode(
            access_token, 
            Credentials.SUPER_SECRET_KEY, 
            algorithms=[ALGORITHM]
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
