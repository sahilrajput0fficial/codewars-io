from datetime import timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, status, Response, HTTPException
from core.security import verify_jwt , create_jwt
from sqlmodel import Session, select
from db.session import get_session
from .schemas import UserLoginRequest, UserSignupRequest, ForgetPasswordSchema, OAuthExchangeRequest
from .tables import User
from .services import user_signup, user_login, user_forget_password, exchange_supabase_token
from .dependencies import get_current_user
router = APIRouter(prefix="/auth", tags=["auth"])

def _set_jwt_cookie(response: Response, email: str) -> None:
    token: str = create_jwt({"sub": email}, expires_delta=timedelta(days=365))
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=365 * 24 * 60 * 60,  # 365 days in seconds
        secure=False,                # Set to True in production with HTTPS
        samesite="lax"
    )

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    payload: UserSignupRequest, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = user_signup(session=session, payload=payload)
    _set_jwt_cookie(response=response, email=user.email)
    return {"message": "User created successfully", "user": user}

@router.post("/login")
def login(
    payload: UserLoginRequest, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = user_login(session=session, payload=payload)
    _set_jwt_cookie(response=response, email=user.email)
    return {"message": "Login successful", "user": user}

@router.post("/logout")
def logout(response: Response) -> Dict[str, str]:
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.post("/forget-pass")
def forget_pass(
    payload: ForgetPasswordSchema, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = user_forget_password(session=session, payload=payload)
    # Clear old cookie first
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,
        samesite="lax"
    )
    # Set new cookie with updated user info
    _set_jwt_cookie(response=response, email=user.email)
    return {"message": "Password reset successfully", "user": user}

@router.post("/exchange")
def exchange(
    payload: OAuthExchangeRequest, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = exchange_supabase_token(session=session, access_token=payload.access_token)
    _set_jwt_cookie(response=response, email=user.email)
    return {"message": "OAuth login successful", "user": user}

@router.get("/me", response_model=User)
def get_me(
    session: Session = Depends(get_session),
    jwt_data: Dict[str, Any] = Depends(verify_jwt)
) -> User:
    current_user = get_current_user(session , jwt_data)
    if not current_user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return current_user