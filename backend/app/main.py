"""FastAPI Backend dedicated ONLY for testing the Student Emotional Analyzer NLP Models."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import engine
from app.api.feedback import router as feedback_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# Ensure repo root and ai package are on Python path
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ai.nlp import BertFeedbackAnalyzer, ExternalFeedbackAnalyzer, FeedbackAnalyzer, get_analyzer

# Paths to trained model artifacts
SENTIMENT_MODEL_PATH = REPO_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg.joblib"
EMOTION_MODEL_PATH = REPO_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg.joblib"
SENTIMENT_METRICS_PATH = REPO_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg_metrics.json"
EMOTION_METRICS_PATH = REPO_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg_metrics.json"

# Initialize FastAPI application
app = FastAPI(
    title="Student Feedback Emotional Analyzer — Testing Backend",
    description="Dedicated backend service for testing trained NLP models (Local TF-IDF, HuggingFace BERT, and External Cloud AI Models).",
    version="1.0.0",
)

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feedback_router)

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/health/database")
def database_health_check() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }

# Global analyzers
_tfidf_analyzer: FeedbackAnalyzer | None = None
_bert_analyzer: BertFeedbackAnalyzer | None = None
_external_analyzer: ExternalFeedbackAnalyzer | None = None


def get_tfidf_analyzer() -> FeedbackAnalyzer:
    global _tfidf_analyzer
    if _tfidf_analyzer is None:
        if not SENTIMENT_MODEL_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Sentiment model not found at {SENTIMENT_MODEL_PATH}. Please run training first.",
            )
        emotion_path = EMOTION_MODEL_PATH if EMOTION_MODEL_PATH.exists() else None
        _tfidf_analyzer = FeedbackAnalyzer(SENTIMENT_MODEL_PATH, emotion_path)
    return _tfidf_analyzer


def get_bert_analyzer() -> BertFeedbackAnalyzer:
    global _bert_analyzer
    if _bert_analyzer is None:
        _bert_analyzer = BertFeedbackAnalyzer()
    return _bert_analyzer


def get_external_analyzer() -> ExternalFeedbackAnalyzer:
    global _external_analyzer
    if _external_analyzer is None:
        tfidf = get_tfidf_analyzer()
        _external_analyzer = ExternalFeedbackAnalyzer(fallback_analyzer=tfidf)
    return _external_analyzer


def select_analyzer(engine: str) -> FeedbackAnalyzer | BertFeedbackAnalyzer | ExternalFeedbackAnalyzer:
    eng = engine.lower().strip()
    if eng in ("bert", "transformer", "transformers"):
        return get_bert_analyzer()
    elif eng in ("external", "gemini", "openai", "cloud", "api"):
        return get_external_analyzer()
    else:
        return get_tfidf_analyzer()


# Pydantic Schemas
class FeedbackRequest(BaseModel):
    feedback: str = Field(
        ...,
        description="Student feedback text to analyze.",
        json_schema_extra={"example": "The professor explains concepts very clearly, but assignments are too difficult."},
    )
    engine: str = Field(
        default="tfidf",
        description="Model engine to use: 'tfidf' (Local TF-IDF + LogReg), 'bert' (HuggingFace BERT), or 'external' (Google Gemini / Cloud AI Model API).",
        json_schema_extra={"example": "tfidf"},
    )


class BatchFeedbackRequest(BaseModel):
    feedbacks: list[str] = Field(
        ...,
        description="List of student feedback texts for batch analysis.",
        json_schema_extra={"example": [
            "Great teaching and supportive faculty.",
            "Workload is way too heavy and exams are stressful.",
        ]},
    )
    engine: str = Field(
        default="tfidf",
        description="Model engine to use: 'tfidf', 'bert', or 'external'.",
        json_schema_extra={"example": "tfidf"},
    )


# API Endpoints
@app.get("/api/health", summary="Model Diagnostics & System Status")
def health_check() -> dict[str, Any]:
    sentiment_exists = SENTIMENT_MODEL_PATH.exists()
    emotion_exists = EMOTION_MODEL_PATH.exists()
    return {
        "status": "healthy" if sentiment_exists else "degraded",
        "models": {
            "sentiment": {
                "loaded": sentiment_exists,
                "path": str(SENTIMENT_MODEL_PATH),
            },
            "emotion": {
                "loaded": emotion_exists,
                "path": str(EMOTION_MODEL_PATH),
            },
            "bert_available": True,
            "external_available": True,
        },
    }


@app.get("/api/metrics", summary="Get Trained Model Metrics")
def get_metrics() -> dict[str, Any]:
    metrics: dict[str, Any] = {}
    if SENTIMENT_METRICS_PATH.exists():
        metrics["sentiment"] = json.loads(SENTIMENT_METRICS_PATH.read_text(encoding="utf-8"))
    if EMOTION_METRICS_PATH.exists():
        metrics["emotion"] = json.loads(EMOTION_METRICS_PATH.read_text(encoding="utf-8"))
    return metrics


@app.post("/api/analyze", summary="Analyze Single Student Feedback")
def analyze_single(payload: FeedbackRequest) -> dict[str, Any]:
    analyzer = select_analyzer(payload.engine)
    try:
        return analyzer.analyze(payload.feedback)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err


@app.post("/api/analyze/batch", summary="Analyze Batch Student Feedback")
def analyze_batch(payload: BatchFeedbackRequest) -> dict[str, Any]:
    analyzer = select_analyzer(payload.engine)
    results = []
    for text in payload.feedbacks:
        try:
            results.append(analyzer.analyze(text))
        except ValueError as err:
            results.append({"text": text, "error": str(err)})
    return {"total": len(results), "engine": payload.engine, "results": results}


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def index_test_ui() -> str:
    """Serve Academic Feedback Portal UI directly from frontend/index.html."""
    frontend_index = REPO_ROOT / "frontend" / "index.html"
    if frontend_index.exists():
        return frontend_index.read_text(encoding="utf-8")
    return """<!DOCTYPE html><html><body><h1>Academic Feedback Portal</h1></body></html>"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
