from fastapi import Depends , HTTPException 
from sqlmodel import Session ,select
from typing import Dict , Any
from core.security import verify_jwt    
from modules.auth.tables import User
from db.session import get_session

def get_current_user(session: Session = Depends(get_session),
    jwt_data: Dict[str, Any] = Depends(verify_jwt))-> User:
    """Get Current User once the jwt is verified"""
    email: str = jwt_data.get("sub", "")
    statement = select(User).where(User.email == email)
    user: User | None = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user