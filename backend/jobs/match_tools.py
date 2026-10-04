import time
from datetime import datetime
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from db.session import async_engine
from db.redis import async_client
from modules.matches.tables import Matches
from modules.matches.services import finalize_match
from core.logger import logger
from datetime import timezone
from core.cache import delete_cache_key

async def complete_exisiting_matches(ctx: dict):
    """
    Background cron job to find active/waiting matches whose timers have expired
    and authoritatively finalize them.
    """
    completed_count = 0
    now_ts = int(time.time())

    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        stmt = select(Matches).where(Matches.status.in_(["active", "waiting"]))
        res = await session.exec(stmt)
        active_matches = res.all()

        for match in active_matches:
            try:
                # Check Redis timer_end
                match_redis = await async_client.hgetall(f"match:{match.id}")
                timer_end_raw = match_redis.get("timer_end")

                is_expired = False
                if timer_end_raw:
                    timer_end = int(timer_end_raw.decode() if isinstance(timer_end_raw, bytes) else timer_end_raw)
                    if now_ts >= timer_end:
                        is_expired = True
                elif match.started_at:
                    # Fallback: started > 20 minutes ago (handles both tz-aware and tz-naive)
                    now_utc = datetime.now(timezone.utc)
                    started = match.started_at if match.started_at.tzinfo is not None else match.started_at.replace(tzinfo=timezone.utc)
                    elapsed = (now_utc - started).total_seconds()
                    if elapsed >= 20 * 60:
                        is_expired = True

                if is_expired:
                    logger.info(f"[Cron] Finalizing expired match: {match.id}")
                    await finalize_match(session, match)
                    delete_cache_key(f"match:{match.id}")
                    completed_count += 1
            except Exception as err:
                logger.error(f"[Cron] Error finalizing match {match.id}: {err}")

    return {"matches_completed": completed_count}
