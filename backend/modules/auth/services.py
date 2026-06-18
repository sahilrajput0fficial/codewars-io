import uuid
from typing import Optional
from sqlmodel import Session, select
from fastapi import HTTPException, status
from security import hash_password, verify_password
from .schemas import UserLoginRequest, UserSignupRequest
from .tables import User

def user_signup(session: Session, payload: UserSignupRequest) -> User:
    # Check if username or email already exists in a single query
    statement = select(User).where(
        (User.username == payload.username) | (User.email == payload.email)
    )
    existing_user = session.exec(statement).first()
    if existing_user:
        if existing_user.username == payload.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Hash the password
    hashed_pass = hash_password(payload.password)

    # Create new User
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
    # Check if the user exists
    statement = select(User).where(User.username == payload.username)
    user = session.exec(statement).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Verify password
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
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
    final_username = username or email.split("@")[0]
    counter = 1
    
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

