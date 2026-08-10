from typing import List, Optional , Annotated
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status , Request
from sqlmodel import Session
from .schemas import Environment
from db.session import get_session , get_session_async
from modules.auth.dependencies import get_current_user
from modules.auth.tables import User
from .tables import Submission
from .schemas import (
    SubmissionCreate,
    SubmissionResponse,
    SubmissionListItem,
    SubmissionListResponse,
)
from sqlalchemy.ext.asyncio import AsyncSession
from .services import create_and_evaluate_submission, list_submissions_query

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_code_route(
    request : Request , 
    env : Annotated[Environment , Query()] , 
    payload: SubmissionCreate,
    session: Annotated[AsyncSession, Depends(get_session_async)],
    current_user: User = Depends(get_current_user),
) -> SubmissionResponse:
    """
    Submit code for evaluation against all test cases.
    Evaluates the code against configured test cases in a batch using Judge0,
    calculates runtime, memory usage, score, and updates DB record.
    """
    submission, test_cases = await create_and_evaluate_submission(
        request = request , 
        session=session,
        user_id=current_user.id,
        problem_id=payload.problem_id,
        language=payload.language,
        source_code=payload.source_code,
        match_id=payload.match_id,
        env = env
    )
    response = SubmissionResponse.model_validate(submission)
    response.test_cases = test_cases
    return response


@router.get("/", response_model=SubmissionListResponse)
def list_submissions_route(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    problem_id: Optional[uuid.UUID] = Query(default=None),
    match_id: Optional[uuid.UUID] = Query(default=None),
    user_id: Optional[uuid.UUID] = Query(default=None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SubmissionListResponse:
    """
    List submissions with optional filters by problem, match, or user.
    """
    total, items = list_submissions_query(
        session=session,
        user_id=user_id,
        problem_id=problem_id,
        match_id=match_id,
        limit=limit,
        offset=offset,
    )
    return SubmissionListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[SubmissionListItem.model_validate(item) for item in items],
    )


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission_route(
    submission_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    
) -> SubmissionResponse:
    """
    Get detailed submission details by ID.
    """
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission {submission_id} not found."
        )
    response = SubmissionResponse.model_validate(submission)
    if submission.breakdown:
        response.test_cases = submission.breakdown
    return response
