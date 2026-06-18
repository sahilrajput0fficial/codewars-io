from typing import Dict
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from db.session import get_session
from .schemas import UserLoginRequest, UserSignupRequest, OAuthSyncRequest
from .tables import User
from .services import user_signup, user_login, sync_supabase_oauth_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignupRequest, session: Session = Depends(get_session)) -> User:
    return user_signup(session=session, payload=payload)

@router.post("/login", response_model=User)
def login(payload: UserLoginRequest, session: Session = Depends(get_session)) -> User:
    return user_login(session=session, payload=payload)

@router.post("/logout")
def logout() -> Dict[str, str]:
    return {"message": "Successfully logged out. Please delete your access token."}

@router.post("/oauth/sync", response_model=User)
def oauth_sync(payload: OAuthSyncRequest, session: Session = Depends(get_session)) -> User:
    return sync_supabase_oauth_user(
        session=session,
        user_id=payload.user_id,
        email=payload.email,
        username=payload.username,
        avatar_url=payload.avatar_url
    )