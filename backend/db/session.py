from sqlmodel import create_engine, Session
from config import Credentials

#Use local database in development
DATABASE_URL = "sqlite:///database.db" if Credentials.ENVIRONMENT == "development" else Credentials.DATABASE_URL


engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

def get_environment():
    DATABASE_URL = "sqlite:///database.db" if Credentials.ENVIRONMENT == "development" else Credentials.DATABASE_URL
