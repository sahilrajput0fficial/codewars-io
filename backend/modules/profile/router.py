from fastapi import APIRouter , Depends , status , HTTPException, File, UploadFile , Query
from typing import List , Dict , Annotated , Any
from .schemas import (
    ProfileUserResponse,
    ProfileUpdateRequest,
    UserMatchesRequest,
    UserMatchesResponse,
)
import uuid
from modules.auth.dependencies import get_current_user
from modules.auth.tables import User
from core.security import verify_jwt
from .services import get_profile_data , update_user_profile, upload_image_to_supabase , get_user_matches_service
from sqlmodel import Session ,select
from db.session import get_session
router = APIRouter(
    prefix="/u",
    tags = ["Profile"]
)


# ─── Profile Routes ───────────────────────────────────────────────────────────

@router.get("/me", response_model=ProfileUserResponse)
def get_my_profile(
    session: Session = Depends(get_session),
    user : User = Depends(get_current_user)
) -> ProfileUserResponse:
    """
    Retrieve the authenticated user's own detailed profile.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user not found"
        )
    return get_profile_data(session, user)

@router.patch("/me", response_model=ProfileUserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    session: Session = Depends(get_session),
    jwt_data: Dict[str, Any] = Depends(verify_jwt)
) -> ProfileUserResponse:
    """
    Update the authenticated user's profile details (display_name and bio).
    """
    current_user = get_current_user(session, jwt_data)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user not found"
        )
    return update_user_profile(session, current_user, payload)

@router.get("/{username}", response_model=ProfileUserResponse)
def get_user_profile(
    username: str,
    session: Session = Depends(get_session)
) -> ProfileUserResponse:
    """
    Retrieve any user's public profile details by username.
    """
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player '{username}' not found in the arena"
        )
        
    return get_profile_data(session, user)


@router.get("/{username}/matches", response_model=UserMatchesResponse)
def get_user_matches(
    username: str,
    session: Annotated[Session, Depends(get_session)],
    query: Annotated[UserMatchesRequest, Query()]
) -> UserMatchesResponse:
    """
    Retrieve the paginated matches history for a specific username.
    """
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player '{username}' not found in the arena"
        )
        
    return get_user_matches_service(session=session, user=user, query=query)







@router.post("/upload", response_model=Dict[str, str])
def upload_profile_asset(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Upload an image asset (avatar or banner) to Supabase Storage.
    Bypasses RLS by routing through the FastAPI server using the Service Role Key.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image"
        )

    try:
        content = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}"
        )

    url = upload_image_to_supabase(
        file_content=content,
        file_name=file.filename or "upload.png",
        content_type=file.content_type,
        user_id=str(user.id)
    )

    return {"url": url}




# -------------------------------------------------------------------
# Code below Reserved for future use.
# This code is not currently used but may be needed for practice mode
# or future features. Do not remove unless confirmed obsolete.
# -------------------------------------------------------------------
# @router.get(
#     "/{user_id}/elo-history",
#     response_model=EloHistoryResponse,
#     summary="ELO history for a user",
# )
# def get_user_elo_history(
#     user_id: uuid.UUID,
#     session: Annotated[Session, Depends(get_session)],
#     query: Annotated[EloHistoryRequest, Query()],
# ):
#     """Return paginated ELO delta records for a specific user.

#     - **user_id** – UUID of the target user
#     - **sort_order** – `desc` = most recent first (default), `asc` = oldest first
#     - **limit** / **offset** – standard pagination
#     """
#     return get_user_elo_history_service(
#         session=session, user_id=user_id, query=query
#     )
