import asyncio
import uuid
import json
from datetime import datetime
from typing import Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from db.session import get_session_async
from db.redis import async_client
from config import Credentials
from core.logger import logger
from core.connection_manager import manager
from modules.auth.tables import User
from modules.matches.tables import Matches, Match_Problems
from modules.problems.tables import Problem
from modules.submissions.tables import Submission, ProgrammingLanguage, SubmissionVerdict
from jobs.submission_tools import judge_submission

from .client import generate_bot_solution
from .schemas import (
    BOT_USER_UUID,
    BotTier,
    BotPacing,
    PACING_CONFIGS,
    BotStatusEvent,
    BotCodeStreamEvent,
)


async def ensure_bot_user(session: AsyncSession) -> User:
    """
    Ensure the system AI Bot user exists in the database.
    """
    bot_user = await session.get(User, BOT_USER_UUID)
    if not bot_user:
        logger.info(f"[BotRunner] Creating default AI Bot user (id: {BOT_USER_UUID})...")
        bot_user = User(
            id=BOT_USER_UUID,
            username="bot_gemini",
            display_name="Gemini Flash (AI)",
            email="ai_bot@codewars.internal",
            elo=1500,
            avatar_url="/logos/bot-avatar.png",
        )
        session.add(bot_user)
        await session.commit()
        await session.refresh(bot_user)
    return bot_user


async def broadcast_bot_event(match_id: str, payload: dict):
    """
    Broadcast a bot lifecycle event to the match WebSocket channel.
    """
    try:
        channel_name = f"match:{match_id}"
        await manager.broadcast(channel_name, payload)
    except Exception as e:
        logger.warning(f"[BotRunner] Failed to broadcast bot event: {e}")


async def is_match_active(match_id: uuid.UUID, session: AsyncSession) -> bool:
    """Check if the match is still in active status."""
    match = await session.get(Matches, match_id)
    if not match or match.status != "active":
        return False
    
    # Also check Redis state
    redis_status = await async_client.hget(f"match:{match_id}", "status")
    if redis_status and redis_status not in ("active", "waiting"):
        return False
        
    return True


async def run_bot_match(match_id: uuid.UUID, bot_tier: str = "balanced"):
    """
    Background asynchronous worker driving the AI Bot's gameplay for a live match.
    Workflow per Problem:
    1. Check match activity (exit early if user left or match ended).
    2. Broadcast 'thinking' status + sleep for simulated thinking delay.
    3. Invoke LLM to generate solution code in target language.
    4. Broadcast 'typing' status and stream code chunks over WebSocket.
    5. Broadcast 'submitting' status, save Submission row, and execute Judge0.
    6. If accepted, progress to next problem.
    """
    logger.info(f"[BotRunner] Starting Bot match runner for match_id={match_id}, tier={bot_tier}")
    
    # Normalize tier and get pacing config
    try:
        tier_enum = BotTier(bot_tier.lower())
    except ValueError:
        tier_enum = BotTier.senior
    pacing: BotPacing = PACING_CONFIGS.get(tier_enum, PACING_CONFIGS[BotTier.senior])

    async for session in get_session_async():
        try:
            bot_user = await ensure_bot_user(session)
            
            # Fetch match & problems in sequence
            match = await session.get(Matches, match_id)
            if not match:
                logger.warning(f"[BotRunner] Match {match_id} not found. Terminating bot runner.")
                return

            match_problems_stmt = (
                select(Match_Problems)
                .where(Match_Problems.match_id == match_id)
                .order_by(Match_Problems.order)
            )
            mp_result = await session.exec(match_problems_stmt)
            match_problems_list = list(mp_result.all())

            if not match_problems_list:
                logger.warning(f"[BotRunner] No problems assigned to match {match_id}. Terminating.")
                return

            # Main loop: Iterate through each problem in the match
            for idx, mp in enumerate(match_problems_list, start=1):
                # 1. Verify match is still active before starting next problem
                if not await is_match_active(match_id, session):
                    logger.info(f"[BotRunner] Match {match_id} is no longer active. Exiting bot loop.")
                    return

                problem: Optional[Problem] = await session.get(Problem, mp.problem_id)
                if not problem:
                    continue

                problem_id_str = str(problem.id)
                
                # 2. Phase 1: Thinking Delay
                # WHY: Simulates human comprehension time; makes the duel paced and realistic.
                await broadcast_bot_event(
                    str(match_id),
                    {
                        "event": "opponent.status",
                        "status": "thinking",
                        "problem_id": problem_id_str,
                        "problem_index": idx,
                    }
                )
                await asyncio.sleep(pacing.thinking_delay_seconds)

                # Check match active status after sleep
                if not await is_match_active(match_id, session):
                    return

                # 3. Phase 2: Generate Solution via LLM
                target_language = "python"
                starter_code_str = ""
                if problem.starter_code and isinstance(problem.starter_code, dict):
                    starter_code_str = problem.starter_code.get("python", "")

                constraints_list = problem.constraints if isinstance(problem.constraints, list) else []

                generated_code = await generate_bot_solution(
                    problem_title=problem.title,
                    problem_description=problem.description,
                    input_format=problem.input_format,
                    output_format=problem.output_format,
                    constraints=constraints_list,
                    starter_code=starter_code_str,
                    language=target_language,
                    tier=tier_enum.value,
                )

                if not generated_code:
                    logger.error(f"[BotRunner] LLM generated empty code for problem {problem.title}.")
                    continue

                # 4. Phase 3: Simulated Live Typing Stream over WebSocket
                # WHY: Streams code progressively into the human player's opponent pane.
                await broadcast_bot_event(
                    str(match_id),
                    {
                        "event": "opponent.status",
                        "status": "typing",
                        "problem_id": problem_id_str,
                        "problem_index": idx,
                    }
                )

                chunk_size = pacing.chunk_size_chars
                typing_delay_sec = pacing.typing_interval_ms / 1000.0

                for i in range(0, len(generated_code), chunk_size):
                    if not await is_match_active(match_id, session):
                        return
                    chunk = generated_code[i:i + chunk_size]
                    await broadcast_bot_event(
                        str(match_id),
                        {
                            "event": "opponent.code_stream",
                            "code_chunk": chunk,
                            "problem_id": problem_id_str,
                        }
                    )
                    await asyncio.sleep(typing_delay_sec)

                # 5. Phase 4: Submit to Judge0 Pipeline
                await broadcast_bot_event(
                    str(match_id),
                    {
                        "event": "opponent.status",
                        "status": "submitting",
                        "problem_id": problem_id_str,
                        "problem_index": idx,
                    }
                )
                
                # Brief pause before submit
                await asyncio.sleep(1.5)

                submission = Submission(
                    match_id=match.id,
                    user_id=bot_user.id,
                    problem_id=problem.id,
                    language=ProgrammingLanguage.python,
                    source_code=generated_code,
                    verdict=SubmissionVerdict.pending,
                    submitted_at=datetime.utcnow(),
                )
                session.add(submission)
                await session.commit()
                await session.refresh(submission)

                # Execute Judge0 evaluation synchronously for the bot
                logger.info(f"[BotRunner] Submitting bot solution {submission.id} to Judge0...")
                judged_sub, _ = await judge_submission(
                    submission_id=submission.id,
                    env="production",
                )

                # 6. Phase 5: Check Verdict
                if judged_sub and judged_sub.verdict == SubmissionVerdict.accepted:
                    logger.info(f"[BotRunner] Bot solved problem {idx}: {problem.title}!")
                    # Small celebratory pause before moving to the next problem
                    await asyncio.sleep(3.0)
                else:
                    verdict_name = judged_sub.verdict if judged_sub else "failed"
                    logger.warning(f"[BotRunner] Bot submission failed with verdict: {verdict_name}")
                    # Junior tier flaw simulation: Wait retry delay
                    await asyncio.sleep(pacing.retry_delay_seconds)

            logger.info(f"[BotRunner] Bot finished all problems for match {match_id}.")

        except Exception as e:
            logger.error(f"[BotRunner] Unhandled exception in bot runner loop: {e}", exc_info=True)
        finally:
            break
