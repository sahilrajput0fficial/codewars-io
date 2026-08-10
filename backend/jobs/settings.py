from arq.connections import RedisSettings
from config import Credentials

REDIS_SETTINGS = RedisSettings(
    host=Credentials.REDIS_HOST or "localhost",
    port=Credentials.REDIS_PORT or 6379,
    database=0,
    password=Credentials.REDIS_PASSWORD or None,
)