import uuid
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from sqlmodel import Session, select, or_
from fastapi import HTTPException, status
from security import hash_password, verify_password
from config import Credentials
from .schemas import UserLoginRequest, UserSignupRequest, ForgetPasswordSchema
from .tables import User

def user_signup(session: Session, payload: UserSignupRequest) -> User:
    # 1. Check if user email already exists
    statement = select(User).where(User.email == payload.email)
    existing_user_by_email = session.exec(statement).first()
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Check if username already exists
    statement = select(User).where(User.username == payload.username)
    existing_user_by_username = session.exec(statement).first()
    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # 3. Hash the password
    hashed_pass: str = hash_password(payload.password)

    # 4. Create new User
    db_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hashed_pass,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def user_login(session: Session, payload: UserLoginRequest) -> User:
    # Check if the user exists by username OR email
    statement = select(User).where(
        or_(User.username == payload.username, User.email == payload.username)
    )
    user = session.exec(statement).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    
    # Verify password
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
        
    return user

def user_forget_password(session: Session, payload: ForgetPasswordSchema) -> User:
    # Check if email and username match an existing user
    statement = select(User).where(
        (User.email == payload.email) & (User.username == payload.username)
    )
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching user found with the provided email and username"
        )

    # Hash the new password and update
    user.hashed_password = hash_password(payload.new_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def sync_supabase_oauth_user(
    session: Session, 
    user_id: uuid.UUID, 
    email: str, 
    username: Optional[str] = None, 
    avatar_url: Optional[str] = None
) -> User:
    # Check if the user already exists in our public.users table
    statement = select(User).where(User.id == user_id)
    user = session.exec(statement).first()
    
    if user:
        # Update details if they have changed
        user.email = email
        if avatar_url:
            user.avatar_url = avatar_url
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    
    # If the user doesn't exist, create a new record.
    # Generate a unique username if none was provided or if it's already taken
    base_username: str = username or email.split("@")[0]
    final_username: str = base_username
    counter: int = 1
    
    while True:
        check_stmt = select(User).where(User.username == final_username)
        if not session.exec(check_stmt).first():
            break
        final_username = f"{base_username}{counter}"
        counter += 1
        
    db_user = User(
        id=user_id,
        username=final_username,
        email=email,
        avatar_url=avatar_url,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def exchange_supabase_token(session: Session, access_token: str) -> User:
    url: str = f"{Credentials.SUPABASE_URL}/auth/v1/user"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": Credentials.SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            data: Dict[str, Any] = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        raise HTTPException(
            status_code=e.code,
            detail="Invalid Supabase access token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Supabase Auth: {str(e)}"
        )

    # Extract user details from Supabase response
    user_id_str: str = data.get("id", "")
    email: str = data.get("email", "")
    user_metadata: Dict[str, Any] = data.get("user_metadata", {})
    
    if not user_id_str or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supabase user profile is missing required fields"
        )

    user_id = uuid.UUID(user_id_str)
    username: Optional[str] = user_metadata.get("user_name") or user_metadata.get("full_name") or user_metadata.get("name")
    avatar_url: Optional[str] = user_metadata.get("avatar_url")

    # Sync to our users table and return the user
    return sync_supabase_oauth_user(
        session=session,
        user_id=user_id,
        email=email,
        username=username,
        avatar_url=avatar_url
    )
