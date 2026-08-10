import redis 
from config import Credentials

REDIS_HOST = Credentials.REDIS_HOST 
REDIS_PORT = Credentials.REDIS_PORT
REDIS_PASSWORD = Credentials.REDIS_PASSWORD
client = redis.Redis(
    host= REDIS_HOST,
    port= REDIS_PORT,
    password= REDIS_PASSWORD,
    decode_responses=True
)


async_client = redis.asyncio.Redis(
    host= REDIS_HOST,
    port= REDIS_PORT,
    password= REDIS_PASSWORD,
    decode_responses=True

)