from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.auth.router import router as auth_router
import uvicorn

app = FastAPI(
    title="CodeWars.IO API",
    description="Backend service for CodeWars.IO",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "message": "Welcome to CodeWars.IO API. Go to /docs for Swagger documentation."
    }

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )