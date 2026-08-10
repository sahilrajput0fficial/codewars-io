import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
import httpx
from base64 import b64encode, b64decode
from sqlmodel import Session, select ,func
from .schemas import Environment
from config import Credentials
from modules.problems.tables import TestCase
from .tables import Submission, ProgrammingLanguage, SubmissionVerdict
from core.schemas import DifficultyScore
from modules.matches.tables import Matches
from modules.problems.tables import Problem, ProblemDifficulty
from core.connection_manager import manager
from modules.matches.services import send_paired_event
from fastapi import APIRouter, Depends, Request

from sqlmodel.ext.asyncio.session import AsyncSession


# helper to convert into base64 or decode it
class Conversion:
    def to_base64(self, data: str) -> str:
        encoded_data: bytes = b64encode(data.encode("utf-8"))
        return encoded_data.decode("utf-8")

    def to_text(self, encoded_data: bytes) -> str:
        decoded_data = b64decode(encoded_data).decode("utf-8")
        return decoded_data

    def decode_base64_safe(self , encoded: str | None) -> str:
        if not encoded:
            return ""
        try:
            return b64decode(encoded.encode("utf-8")).decode("utf-8", errors="replace")
        except Exception:
            return encoded


convert = Conversion()
JUDGE0_URL = Credentials.JUDGE0_URL
# Filter out None values to prevent RapidAPI authorization headers failure
HEADERS = {
    k: v for k, v in {
        "X-RapidAPI-Key": Credentials.RAPIDAPI_KEY,
        "X-RapidAPI-Host": Credentials.RAPIDAPI_HOST,
        "Content-Type": "application/json",
    }.items() if v is not None
}

# Mapping of database ProgrammingLanguage enum to Judge0 language_id
LANGUAGE_TO_JUDGE0_ID = {
    ProgrammingLanguage.python: 71,      # Python 3
    ProgrammingLanguage.cpp: 54,         # C++ (GCC)
    ProgrammingLanguage.javascript: 63,  # JavaScript (Node.js)
}

# Judge0 status IDs that mean "still running" — keep polling
PENDING_STATUS_IDS = {1, 2}  # 1 = In Queue, 2 = Processing


# ── Core Judge0 client calls (single-submission, combined blob) ─────────────

async def submit_code(
    source_code: str,
    language_id: int,
    stdin: str = "",
    expected_output: str = "",
) -> str:
    """Submit one combined execution (all test cases concatenated into stdin)."""
    payload = {
        "source_code": convert.to_base64(source_code),
        "language_id": language_id,
        "stdin": convert.to_base64(stdin) if stdin else "",
        "expected_output": convert.to_base64(expected_output) if expected_output else "",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{JUDGE0_URL}/submissions?base64_encoded=true&wait=false",
            headers=HEADERS,
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()["token"]


async def get_result(token: str) -> Dict[str, Any]:
    """Get submission status for the result"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{JUDGE0_URL}/submissions/{token}?base64_encoded=true",
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()





# ──── Test-case blob construction + per-case breakdown reconstruction ─────────

def build_combined_stdin(test_cases: List[TestCase]) -> str:
    """
    Concatenate all test case inputs into a single stdin blob.
    First line is the test case count, matching the starter-code harness
    contract (`n = int(input()); for _ in range(n): ...`).
    """
    lines = [str(len(test_cases))]
    for tc in test_cases:
        cleaned = tc.input.replace("\r\n", "\n").replace("\r", "\n").strip()
        lines.append(cleaned)
    return "\n".join(lines)


def build_combined_expected(test_cases: List[TestCase]) -> str:
    lines = []
    for tc in test_cases:
        cleaned = tc.expected_output.replace("\r\n", "\n").replace("\r", "\n").strip()
        lines.append(cleaned)
    return "\n".join(lines)


def compute_test_breakdown(
    actual_output: str,
    expected_output: str,
    test_cases: List[TestCase],
) -> tuple[int, List[Dict[str, Any]]]:
    """
    Line-by-line reconstruction of per-test-case pass/fail from the
    combined stdout, since Judge0 only judges the blob as a whole.
    """
    normalized_actual = actual_output.replace("\r\n", "\n").replace("\r", "\n") if actual_output else ""
    normalized_expected = expected_output.replace("\r\n", "\n").replace("\r", "\n") if expected_output else ""

    actual_lines = normalized_actual.strip("\n").split("\n") if normalized_actual else []
    expected_lines = normalized_expected.strip("\n").split("\n") if normalized_expected else []

    passed_count = 0
    breakdown = []
    first_failed_leaked = False

    for i, tc in enumerate(test_cases):
        actual_line = actual_lines[i].strip() if i < len(actual_lines) else None
        expected_line = expected_lines[i].strip() if i < len(expected_lines) else ""
        passed = actual_line is not None and actual_line == expected_line
        if passed:
            passed_count += 1

        leak_details = tc.is_sample or (not passed and not first_failed_leaked)
        if not passed and not first_failed_leaked:
            first_failed_leaked = True

        breakdown.append({
            "test_case_id": str(tc.id),
            "order_index": tc.order_index,
            "passed": passed,
            "input": tc.input if leak_details else None,
            "expected_output": expected_line if leak_details else None,
            "actual_output": actual_line if leak_details else None,
        })

    return passed_count, breakdown



# ── Submission workflow ───────────────────────────────────────────────────

async def create_and_evaluate_submission(
    env: Environment,
    session: AsyncSession,
    user_id: uuid.UUID,
    request: Request,
    problem_id: uuid.UUID,
    language: ProgrammingLanguage,
    source_code: str,
    match_id: Optional[uuid.UUID] = None,
) -> tuple[Submission, List[Dict[str, Any]]]:
    # 1. Create a pending submission row
    submission = Submission(
        match_id=match_id,
        user_id=user_id,
        problem_id=problem_id,
        language=language,
        source_code=source_code,
        verdict=SubmissionVerdict.pending,
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)

    env_val = env.value if hasattr(env, "value") else str(env)

    queue_key = "match_submissions" if submission.match_id is not None else "practice_submissions"
    await request.app.state.arq_pool.enqueue_job(
        "evaluate_submission",
        submission.id,
        env_val,
        _queue_name=queue_key,
    )

    return submission, []
   

# ── Submissions listing queries ──────────────────────────────────────────────

def list_submissions_query(
    session: Session,
    user_id: Optional[uuid.UUID] = None,
    problem_id: Optional[uuid.UUID] = None,
    match_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    offset: int = 0,
):
    statement = select(Submission)
    if user_id:
        statement = statement.where(Submission.user_id == user_id)
    if problem_id:
        statement = statement.where(Submission.problem_id == problem_id)
    if match_id:
        statement = statement.where(Submission.match_id == match_id)

    
    total_stmt = select(func.count()).select_from(statement.subquery())
    total = session.exec(total_stmt).one()

    statement = statement.order_by(Submission.submitted_at.desc()).offset(offset).limit(limit)
    items = session.exec(statement).all()

    return total, items