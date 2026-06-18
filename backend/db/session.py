from sqlmodel import create_engine, Session
from config import Credentials

engine = create_engine(Credentials.DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

