
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uuid

BOT_USER_UUID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class BotTier(str, Enum):
    junior = "junior"          # Bronze Tier (~1200 ELO)
    senior = "senior"          # Gold Tier (~1600 ELO, Balanced)
    grandmaster = "grandmaster"# Diamond Tier (~2100+ ELO)


class BotPacing(BaseModel):
    """
    Simulation pacing parameters to give the AI Bot human-like behavior.
    """
    thinking_delay_seconds: float = Field(
        default=10.0,
        description="Delay in seconds before the bot begins generating and streaming code."
    )
    typing_interval_ms: int = Field(
        default=80,
        description="Milliseconds between streamed code chunks over WebSocket."
    )
    chunk_size_chars: int = Field(
        default=25,
        description="Number of characters emitted per WebSocket chunk to simulate typing."
    )
    retry_delay_seconds: float = Field(
        default=12.0,
        description="Delay before retrying a submission if a testcase fails (Junior tier simulation)."
    )


# Predefined pacing profiles per tier
PACING_CONFIGS: Dict[BotTier, BotPacing] = {
    BotTier.junior: BotPacing(
        thinking_delay_seconds=20.0,
        typing_interval_ms=120,
        chunk_size_chars=15,
        retry_delay_seconds=15.0,
    ),
    BotTier.senior: BotPacing(
        thinking_delay_seconds=10.0,
        typing_interval_ms=70,
        chunk_size_chars=28,
        retry_delay_seconds=8.0,
    ),
    BotTier.grandmaster: BotPacing(
        thinking_delay_seconds=4.0,
        typing_interval_ms=35,
        chunk_size_chars=40,
        retry_delay_seconds=4.0,
    ),
}


class BotProfile(BaseModel):
    """Configuration profile representing an AI Bot."""
    name: str = "Gemini Flash AI"
    tier: BotTier = BotTier.senior
    elo: int = 1600
    avatar_url: Optional[str] = "/logos/bot-avatar.png"
    pacing: BotPacing = Field(default_factory=lambda: PACING_CONFIGS[BotTier.senior])


class CodeResponse(BaseModel):
    """
    Structured output schema for LLM generation.
    
    WHY:
    Using structured output (Pydantic object) guarantees the LLM returns only
    the code payload without surrounding markdown chatter.
    """
    code: str = Field(
        description="The complete, raw executable source code implementing the solution."
    )


class BotStatusEvent(BaseModel):
    """WebSocket event payload emitted when bot status changes."""
    event: str = "opponent.status"
    status: str = Field(..., description="'thinking' | 'typing' | 'submitting'")
    problem_id: str
    problem_index: int


class BotCodeStreamEvent(BaseModel):
    """WebSocket event payload emitted during simulated typing."""
    event: str = "opponent.code_stream"
    code_chunk: str
    problem_id: str