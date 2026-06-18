from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.auth.router import router as auth_router

app = FastAPI(
    title="CodeWars.IO API",
    description="Backend service for CodeWars.IO",
    version="1.0.0"
)

# Set up CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth Router
app.include_router(auth_router)

@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Welcome to CodeWars.IO API. Go to /docs for Swagger documentation."}
