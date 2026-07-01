from enum import Enum

class MatchStatus(str, Enum):
    waiting = "waiting"
    active = "active"
    completed = "completed"
    abandoned = "abandoned"
    cancelled = "cancelled"

class MatchMode(str, Enum):
    live = "live"
    async_ = "async"
    bot = "bot"
