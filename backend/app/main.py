from fastapi import FastAPI
from sqlalchemy import text

from app.database.connection import engine
from app.api.feedback import router as feedback_router

app = FastAPI(
    title="AI Emotional Sentiment Analyzer",
    description="Backend API for analyzing student feedback",
    version="1.0.0",
)

app.include_router(feedback_router)

@app.get("/")
def root():
    return {
        "message": "AI Emotional Sentiment Analyzer API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }