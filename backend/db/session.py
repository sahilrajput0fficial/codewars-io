from sqlmodel import create_engine, Session  
from sqlmodel.ext.asyncio.session import AsyncSession 
from sqlalchemy.ext.asyncio import create_async_engine
from config import Credentials

#Use local database in development
#DATABASE_URL = "sqlite:///database.db" if Credentials.ENVIRONMENT == "development" else Credentials.DATABASE_URL


from contextlib import asynccontextmanager

engine = create_engine(Credentials.DATABASE_URL)
async_engine = create_async_engine(Credentials.ASYNC_DATABASE_URL)
def get_session():
    with Session(engine) as session:
        yield session

async def get_session_async():
    async with AsyncSession(async_engine , expire_on_commit=False) as session:
        yield session

# def get_environment():
#     DATABASE_URL = "sqlite:///database.db" if Credentials.ENVIRONMENT == "development" else Credentials.DATABASE_URL
