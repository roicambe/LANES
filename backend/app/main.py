from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app import models


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attempt to create database tables on startup
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created or already exist.")
    except Exception as e:
        print(f"Warning: Could not create database tables on startup ({e}). Continuing startup...")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Core backend server logic for LANES application",
    version=settings.API_VERSION,
    lifespan=lifespan,
)


# Define allowed origins for CORS.
# Allows local Next.js development server to make requests to this backend.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.api import api_router

# Include routing endpoints coordinator
app.include_router(api_router, prefix="/api/v1")



@app.get("/")
def read_root():
    """
    Root gateway route. Returns general information about the API.
    """
    return {
        "status": "active",
        "message": "Welcome to the LANES API gateway.",
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check():
    """
    Health check route for monitoring.
    """
    database_status = "not_connected"
    try:
        # Try to connect and execute a simple query
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        # Connection failed
        pass

    return {
        "status": "healthy",
        "details": {
            "database": database_status,
        }
    }

