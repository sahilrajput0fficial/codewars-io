import secrets
import urllib.parse
import urllib.request
import json
import uuid
from datetime import timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, status, Response, HTTPException, Cookie
from fastapi.responses import RedirectResponse
from sqlmodel import Session , select
from db.session import get_session
from config import Credentials
from core.security import verify_jwt, create_access_token, create_refresh_token, ALGORITHM
import jwt
from .schemas import UserLoginRequest, UserSignupRequest, ForgetPasswordSchema, AuthResponse, UserPublic
from .tables import User
from .services import user_signup, user_login, user_forget_password, sync_local_oauth_user
from .dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def _set_auth_cookies(response: Response, user_id: str) -> None:
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    is_production = Credentials.ENVIRONMENT == "production"

    # Short-lived access token cookie (15 mins) - httponly=False so JS can read it for WS auth query param
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=False,
        max_age=15 * 60,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/"
    )

    # Long-lived refresh token cookie (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 60 * 60,
        secure=is_production,
        samesite="none" if is_production else "lax",
        path="/"
    )

def _set_jwt_cookie(response: Response, user_id: str) -> None:
    _set_auth_cookies(response, user_id)

@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
def signup(
    payload: UserSignupRequest, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = user_signup(session=session, payload=payload)
    _set_auth_cookies(response=response, user_id=str(user.id))
    return {"message": "User created successfully", "user": user}

@router.post("/login", response_model=AuthResponse)
def login(
    payload: UserLoginRequest, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = user_login(session=session, payload=payload)
    _set_auth_cookies(response=response, user_id=str(user.id))
    return {"message": "Login successful", "user": user}

@router.post("/refresh", response_model=AuthResponse)
def refresh_token_endpoint(
    response: Response,
    refresh_token: str | None = Cookie(None),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    try:
        payload = jwt.decode(
            refresh_token,
            Credentials.SUPER_SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type for refresh"
            )
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

    user_id = payload.get("sub")
    user = session.get(User, user_id) if user_id else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    _set_auth_cookies(response=response, user_id=str(user.id))
    return {"message": "Token refreshed successfully", "user": user}

@router.post("/logout")
def logout(response: Response) -> Dict[str, str]:
    is_production = Credentials.ENVIRONMENT == "production"
    for cookie_key in ("access_token", "refresh_token"):
        response.delete_cookie(
            key=cookie_key,
            httponly=True,
            secure=is_production,
            samesite="none" if is_production else "lax",
            path="/"
        )
    return {"message": "Logged out successfully"}

@router.post("/forget-pass", response_model=AuthResponse)
def forget_pass(
    payload: ForgetPasswordSchema, 
    response: Response, 
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    user: User = user_forget_password(session=session, payload=payload)
    _set_auth_cookies(response=response, user_id=str(user.id))
    return {"message": "Password reset successfully", "user": user}

@router.get("/me", response_model=UserPublic)
def get_me(
    session: Session = Depends(get_session),
    jwt_data: Dict[str, Any] = Depends(verify_jwt)
) -> User:
    current_user = get_current_user(session , jwt_data)
    if not current_user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return current_user

def _get_oauth_redirect_uri(provider: str) -> str:
    if Credentials.ENVIRONMENT == "production":
        return f"{Credentials.FRONTEND_URL}/_/backend/auth/oauth/{provider}/callback"
    return f"http://localhost:8000/auth/oauth/{provider}/callback"

@router.get("/oauth/google/login")
def google_login(response: Response):
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": Credentials.GCP_CLIENT_ID,
        "redirect_uri": _get_oauth_redirect_uri("google"), #where to return after login
        "response_type": "code",
        "scope": "openid email profile",
        "state": state
    }

    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    response = RedirectResponse(url=url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=600,  # 10 minutes
        secure=Credentials.ENVIRONMENT == "production",
        samesite="lax"
    )
    return response

@router.get("/oauth/google/callback")
def google_callback(
    code: str, #temperory code return by google
    state: str,
    response: Response,
    oauth_state: str | None = Cookie(None),
    session: Session = Depends(get_session)
):
    if not oauth_state or state != oauth_state: #to avoid attacker send annonymous code which may used to track user
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state verification failed. CSRF suspected."
        )
    
    # Clear state cookie
    response.delete_cookie(
        key="oauth_state",
        httponly=True,
        secure=Credentials.ENVIRONMENT == "production",
        samesite="lax"
    )
    
    # 1. Exchange auth code for token
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": Credentials.GCP_CLIENT_ID,
        "client_secret": Credentials.GCP_ClIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": _get_oauth_redirect_uri("google")
    }
    
    try:
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req) as res:
            tokens = json.loads(res.read().decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange Google OAuth code: {str(e)}"
        )
        
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access token returned from Google")
        
    # 2. Fetch user profile
    profile_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    try:
        req = urllib.request.Request(profile_url, headers={"Authorization": f"Bearer {access_token}"})
        with urllib.request.urlopen(req) as res:
            profile = json.loads(res.read().decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch user profile from Google: {str(e)}"
        )
        
    email = profile.get("email")
    name = profile.get("name") or profile.get("given_name") or email.split("@")[0]
    avatar_url = profile.get("picture")
    
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account has no associated email")
        
    # 3. Sync User
    user = sync_local_oauth_user(
        session=session,
        email=email,
        display_name=name,
        avatar_url=avatar_url
    )
    
    # 4. Set session cookie and redirect to dashboard
    redirect_url = f"{Credentials.FRONTEND_URL}/dashboard" if Credentials.FRONTEND_URL else "/dashboard"
    final_response = RedirectResponse(url=redirect_url)
    _set_jwt_cookie(response=final_response, user_id=str(user.id))
    return final_response


@router.get("/oauth/github/login")
def github_login(response: Response):
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": Credentials.GITHUB_CLIENT_ID,
        "redirect_uri": _get_oauth_redirect_uri("github"),
        "scope": "user:email",
        "state": state
    }
    url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    response = RedirectResponse(url = url)

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=600,  # 10 minutes
        secure=Credentials.ENVIRONMENT == "production",
        samesite="lax"
    )
    

    return response

@router.get("/oauth/github/callback")
def github_callback(
    code: str,
    state: str,
    response: Response,
    oauth_state: str | None = Cookie(None),
    session: Session = Depends(get_session)
):
    if not oauth_state or state != oauth_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state verification failed. CSRF suspected."
        )
        
    # Clear state cookie
    response.delete_cookie(
        key="oauth_state",
        httponly=True,
        secure=Credentials.ENVIRONMENT == "production",
        samesite="lax"
    )
    
    # 1. Exchange auth code for token
    token_url = "https://github.com/login/oauth/access_token"
    payload = {
        "client_id": Credentials.GITHUB_CLIENT_ID,
        "client_secret": Credentials.GITHUB_CLIENT_SECERT,
        "code": code,
        "redirect_uri": _get_oauth_redirect_uri("github")
    }
    
    try:
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(
            token_url, 
            data=data, 
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req) as res:
            tokens = json.loads(res.read().decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange GitHub OAuth code: {str(e)}"
        )
        
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No access token returned from GitHub")
        
    # 2. Fetch user profile
    profile_url = "https://api.github.com/user"
    try:
        req = urllib.request.Request(
            profile_url, 
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "CodeWars-API"
            }
        )
        with urllib.request.urlopen(req) as res:
            profile = json.loads(res.read().decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch user profile from GitHub: {str(e)}"
        )
        
    email = profile.get("email")
    name = profile.get("name") or profile.get("login") or "GitHub User"
    avatar_url = profile.get("avatar_url")
    
    # 3. If email is not in primary profile (private email), fetch it via emails endpoint
    if not email:
        try:
            emails_url = "https://api.github.com/user/emails"
            req = urllib.request.Request(
                emails_url, 
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "User-Agent": "CodeWars-API"
                }
            )
            with urllib.request.urlopen(req) as res:
                emails_list = json.loads(res.read().decode())
                
            for email_entry in emails_list:
                if email_entry.get("primary") and email_entry.get("verified"):
                    email = email_entry.get("email")
                    break
        except Exception as e:
            # log warning or ignore, we will check if email is set below
            pass
            
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub account has no primary verified email")
        
    # 4. Sync User
    user = sync_local_oauth_user(
        session=session,
        email=email,
        display_name=name,
        avatar_url=avatar_url
    )
    
    # 5. Set session cookie and redirect to dashboard
    redirect_url = f"{Credentials.FRONTEND_URL}/dashboard" if Credentials.FRONTEND_URL else "/dashboard"
    final_response = RedirectResponse(url=redirect_url)
    _set_jwt_cookie(response=final_response, user_id=str(user.id))
    return final_response