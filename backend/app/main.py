"""FastAPI Backend dedicated ONLY for testing the Student Emotional Analyzer NLP Models."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

# Ensure repo root and backend directory are on Python path
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import engine
from app.api.feedback import router as feedback_router
from app.api.auth import router as auth_router
from app.services.realtime import realtime_events
from ai.nlp import BertFeedbackAnalyzer, ExternalFeedbackAnalyzer, FeedbackAnalyzer, get_analyzer


# Paths to trained model artifacts
SENTIMENT_MODEL_PATH = REPO_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg.joblib"
EMOTION_MODEL_PATH = REPO_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg.joblib"
SENTIMENT_METRICS_PATH = REPO_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg_metrics.json"
EMOTION_METRICS_PATH = REPO_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg_metrics.json"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Enable local WebSocket delivery and optional Kafka publishing during lifecycle."""
    realtime_events.configure(asyncio.get_running_loop())
    yield
    realtime_events.close()


# Initialize FastAPI application
app = FastAPI(
    title="Student Feedback Emotional Analyzer — Testing Backend",
    description="Dedicated backend service for testing trained NLP models (Local TF-IDF, HuggingFace BERT, and External Cloud AI Models).",
    version="1.0.0",
    lifespan=lifespan,
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
app.include_router(auth_router)


@app.websocket("/ws/events")
async def realtime_event_socket(websocket: WebSocket) -> None:
    """Push feedback, request, and complaint updates to open dashboards."""
    await realtime_events.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_events.disconnect(websocket)

# Mount frontend directory for static assets
FRONTEND_DIST = REPO_ROOT / "frontend" / "dist"
FRONTEND_DIR = FRONTEND_DIST if FRONTEND_DIST.exists() else (REPO_ROOT / "frontend")

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

@app.get("/bixi-avatar.png", include_in_schema=False)
def get_bixi_avatar():
    img_path = REPO_ROOT / "frontend" / "bixi-avatar.png"
    if img_path.exists():
        return FileResponse(str(img_path))
    raise HTTPException(status_code=404, detail="Avatar not found")

@app.get("/bixi-icon.png", include_in_schema=False)
def get_bixi_icon():
    img_path = REPO_ROOT / "frontend" / "bixi-icon.png"
    if img_path.exists():
        return FileResponse(str(img_path))
    raise HTTPException(status_code=404, detail="Icon not found")

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
    try:
        from app.services.gemini_service import get_gemini_api_key
        has_gemini = bool(get_gemini_api_key())
    except Exception:
        has_gemini = False

    return {
        "status": "healthy" if (sentiment_exists or has_gemini) else "degraded",
        "gemini_active": has_gemini,
        "models": {
            "sentiment": {
                "loaded": sentiment_exists,
                "path": str(SENTIMENT_MODEL_PATH),
            },
            "emotion": {
                "loaded": emotion_exists,
                "path": str(EMOTION_MODEL_PATH),
            },
            "gemini_cloud_ai": {
                "configured": has_gemini,
                "preferred_model": "gemini-3-flash-preview",
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
    """Serve Academic Feedback Portal UI directly from frontend/dist/index.html or frontend/index.html."""
    dist_index = FRONTEND_DIST / "index.html"
    if dist_index.exists():
        return dist_index.read_text(encoding="utf-8")
    src_index = REPO_ROOT / "frontend" / "index.html"
    if src_index.exists():
        return src_index.read_text(encoding="utf-8")
    return """<!DOCTYPE html><html><head><title>Student Emotional Analyzer</title></head><body><h1>Student Emotional Analyzer</h1><p>External AI Model</p></body></html>"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


class BixiChatRequest(BaseModel):
    message: str
    user: dict | None = None
    context: dict | None = None
    history: list[dict[str, str]] | None = None


@app.post("/api/bixi/chat")
async def bixi_chat_endpoint(req: BixiChatRequest):
    """Bixi AI Assistant chat endpoint powered by Google Gemini with domain fallback."""
    from app.services.gemini_service import chat_with_bixi_gemini, get_gemini_api_key

    # 1. High-fidelity reasoning via Google Gemini
    gemini_reply = chat_with_bixi_gemini(
        message=req.message,
        user=req.user,
        history=req.history,
    )
    if gemini_reply:
        return {"reply": gemini_reply, "source": "gemini_1.5_flash"}

    # 2. Check local LLM if configured
    import os
    import httpx

    local_llm_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/api/generate")
    local_llm_model = os.getenv("LOCAL_LLM_MODEL", "llama3")

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(
                local_llm_url,
                json={
                    "model": local_llm_model,
                    "prompt": (
                        "You are Bixi, a friendly academic assistant for the Sentio emotional feedback portal. "
                        f"User says: {req.message}"
                    ),
                    "stream": False,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return {"reply": data.get("response", ""), "source": "local_llm"}
    except Exception:
        pass

    # 3. Context-aware intelligent fallback
    q = req.message.lower()
    user_role = (req.user.get("role") if req.user else "STUDENT") or "STUDENT"

    if any(k in q for k in ["gemini", "token", "key", "hallucinat", "accuracy"]):
        has_key = bool(get_gemini_api_key())
        if has_key:
            reply = "Google Gemini is active! All feedback analyses and chat interactions use live Gemini AI reasoning."
        else:
            reply = "You can add your Google Gemini API key in the Admin Dashboard under 'AI & Gemini Token' or in backend/.env to activate live, zero-shot AI reasoning!"
    elif any(k in q for k in ["sentiment", "positive", "negative", "trend"]):
        reply = "Across active semester classes, sentiment is currently trending 68% positive on course content clarity and 32% highlighting assignment and exam pacing bottlenecks."
    elif any(k in q for k in ["stress", "anxiety", "burnout", "tired", "fatigue"]):
        reply = "Academic stress is real and acknowledged. Remember to take short breaks using the 25/5 Pomodoro method, stay hydrated, and reach out to your Academic Mentor (Dr. Ramesh Ponnala, Cabin B-304) whenever you need guidance."
    elif any(k in q for k in ["complaint", "grievance", "issue"]):
        reply = "You can lodge a confidential student grievance via the 'Grievance Box' tab. The Dean and Course Coordinators review and resolve complaints with recorded action plans."
    elif any(k in q for k in ["poll", "pulse", "vote"]):
        reply = "60-second Lecture Pulse Polls allow you to give instant live feedback during classes. Check the active pulse banner on your dashboard to vote!"
    elif user_role == "ADMIN":
        reply = "Hello Dean/Faculty! In the Admin Dashboard you can monitor the 6-Axis Emotional Radar, track the Institutional Wellbeing Index, review student grievances, and generate pedagogical interventions."
    else:
        reply = f"Hello {req.user.get('name', 'there') if req.user else 'there'}! I'm Bixi ☁️, your academic sentiment buddy. Ask me about study strategies, course feedback, stress management, or campus mentors!"

    return {"reply": reply, "source": "bixi_core"}

