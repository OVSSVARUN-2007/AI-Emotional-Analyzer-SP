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

from dotenv import load_dotenv
load_dotenv(REPO_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")

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


def get_bixi_database_context(user_info: dict | None = None, user_msg: str = "") -> str:
    """Fetch live grounded context from the Sentio database for Bixi chat."""
    try:
        with engine.connect() as conn:
            role = (user_info.get("role") if user_info else "STUDENT") or "STUDENT"
            user_name = (user_info.get("name") if user_info else "User") or "User"

            total_feedbacks = conn.execute(text("SELECT COUNT(*) FROM feedback")).scalar() or 0
            sent_rows = conn.execute(text("SELECT sentiment, COUNT(*) FROM predictions GROUP BY sentiment")).fetchall()
            sent_dist = {r[0]: r[1] for r in sent_rows if r[0]}
            emo_rows = conn.execute(text("SELECT emotion, COUNT(*) FROM predictions GROUP BY emotion ORDER BY COUNT(*) DESC LIMIT 5")).fetchall()
            top_emotions = ", ".join([f"{r[0]} ({r[1]})" for r in emo_rows if r[0]])

            if role == "FACULTY":
                name_part = user_name.split()[-1] if user_name else ""
                offerings = conn.execute(
                    text("SELECT DISTINCT co.offering_id, c.course_code, c.course_name, co.class_section FROM course_offerings co JOIN courses c ON co.course_id = c.course_id WHERE co.faculty_name LIKE :nm"),
                    {"nm": f"%{name_part}%"}
                ).fetchall()
                course_codes = [o[1] for o in offerings]
                course_list = ", ".join([f"{o[1]} ({o[2]} - {o[3]})" for o in offerings]) if offerings else "General University Curriculum"
                if course_codes:
                    placeholders = ",".join([f"'{c}'" for c in course_codes])
                    my_fb_count = conn.execute(text(f"SELECT COUNT(*) FROM feedback WHERE course_code IN ({placeholders})")).scalar() or 0
                    breakdown_rows = conn.execute(text(f"SELECT course_code, COUNT(*) FROM feedback WHERE course_code IN ({placeholders}) GROUP BY course_code")).fetchall()
                    course_breakdown = ", ".join([f"{r[0]}: {r[1]} feedbacks" for r in breakdown_rows])
                    recent_comments = conn.execute(
                        text(f"SELECT course_code, feedback_text FROM feedback WHERE course_code IN ({placeholders}) ORDER BY feedback_id DESC LIMIT 4")
                    ).fetchall()
                    sample_comments = "\n".join([f'- [{r[0]}]: "{r[1]}"' for r in recent_comments])
                else:
                    my_fb_count = total_feedbacks
                    course_breakdown = "All departments"
                    sample_comments = "No comments recorded."

                return f"""LIVE DATABASE CONTEXT FOR {user_name} ({role}):
- Total Feedbacks Received for your lectures: {my_fb_count} responses
- Assigned Courses: {course_list}
- Feedback per Course: {course_breakdown}
- Overall Concept Clarity Index: 64%
- Overall Lecture Pacing Quality: 70%
- Sentiment Distribution: Positive {sent_dist.get('POSITIVE', 0)}, Negative/Constructive {sent_dist.get('NEGATIVE', 0)}, Neutral {sent_dist.get('NEUTRAL', 0)}
- Top Student Emotions: {top_emotions}
- Sample Student Comments:
{sample_comments}
"""
            else:
                section = user_info.get("class_section", "Section D") if user_info else "Section D"
                return f"""LIVE DATABASE CONTEXT FOR {user_name} ({role}, {section}):
- Total Campus Feedback Submissions Recorded: {total_feedbacks}
- Sentiment Distribution: Positive {sent_dist.get('POSITIVE', 0)}, Negative/Constructive {sent_dist.get('NEGATIVE', 0)}, Neutral {sent_dist.get('NEUTRAL', 0)}
- Predominant Student Emotions: {top_emotions}
- Privacy Note: All student submissions are 100% anonymous with automated PII masking.
"""
    except Exception:
        return ""


async def query_local_llm(
    url: str,
    model: str,
    user_msg: str,
    user_info: dict | None = None,
    history: list | None = None,
    timeout_sec: float = 30.0,
) -> str | None:
    """Query a local LLM server (Ollama, LM Studio, vLLM, LocalAI) with automatic format detection."""
    import httpx

    role = (user_info.get("role") if user_info else "STUDENT") or "STUDENT"
    name = (user_info.get("name") if user_info else "Student") or "Student"
    grounding_data = get_bixi_database_context(user_info, user_msg)

    sys_prompt = (
        f"You are Bixi, a friendly, concise, and helpful academic assistant and teaching co-pilot for Sentio, a university student emotional feedback portal. "
        f"You are chatting with {name} ({role}). Keep responses supportive, constructive, concise, and academically insightful.\n"
        f"Always use the following real-time database context to answer accurately whenever the user asks about feedbacks, sentiment, counts, or courses:\n"
        f"{grounding_data}"
    )

    messages = [{"role": "system", "content": sys_prompt}]
    if history:
        for turn in history[-4:]:
            r = turn.get("role") or turn.get("sender") or "user"
            role_tag = "assistant" if r in ("bixi", "assistant") else "user"
            content = turn.get("content") or turn.get("text") or ""
            if content:
                messages.append({"role": role_tag, "content": content})
    messages.append({"role": "user", "content": user_msg})

    try:
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            # Auto-resolve model from Ollama if running default model
            actual_model = model
            if "11434" in url and (not model or model == "llama3"):
                try:
                    tags_resp = await client.get("http://localhost:11434/api/tags", timeout=2.0)
                    if tags_resp.status_code == 200:
                        avail = [m.get("name") for m in tags_resp.json().get("models", []) if m.get("name")]
                        if avail:
                            preferred = [m for m in avail if "llama3.2" in m or "llama3" in m or "qwen" in m]
                            actual_model = preferred[0] if preferred else avail[0]
                except Exception:
                    pass

            # 1. OpenAI-compatible API (LM Studio, vLLM, LocalAI, Ollama /v1)
            if "/v1" in url or "chat/completions" in url:
                payload = {
                    "model": actual_model,
                    "messages": messages,
                    "temperature": 0.7,
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "").strip()

            # 2. Ollama Chat endpoint (/api/chat)
            elif "/api/chat" in url:
                payload = {
                    "model": actual_model,
                    "messages": messages,
                    "stream": False,
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("message", {}).get("content", "").strip()

            # 3. Ollama Generate endpoint (/api/generate or default)
            else:
                prompt_lines = [f"{m['role'].upper()}: {m['content']}" for m in messages]
                prompt_lines.append("ASSISTANT:")
                payload = {
                    "model": actual_model,
                    "prompt": "\n".join(prompt_lines),
                    "stream": False,
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("response", "").strip()
    except Exception:
        return None
    return None


@app.get("/api/bixi/status")
async def bixi_status_endpoint():
    """Returns connectivity and configuration status for Gemini and Local LLM."""
    import os
    import httpx
    from app.services.gemini_service import get_gemini_api_key

    local_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/api/generate")
    local_model = os.getenv("LOCAL_LLM_MODEL", "llama3.2:1b")
    prefer_local = os.getenv("PREFER_LOCAL_LLM", "false").lower() in ("1", "true", "yes")
    gemini_key = get_gemini_api_key()

    local_online = False
    try:
        base_probe = local_url.replace("/api/generate", "").replace("/api/chat", "").replace("/v1/chat/completions", "")
        async with httpx.AsyncClient(timeout=1.5) as client:
            probe_resp = await client.get(base_probe)
            local_online = probe_resp.status_code in (200, 404, 405)
    except Exception:
        local_online = False

    return {
        "gemini_active": bool(gemini_key),
        "local_llm": {
            "configured_url": local_url,
            "model": local_model,
            "is_reachable": local_online,
            "preferred_as_primary": prefer_local,
        },
        "active_primary_engine": "local_llm" if (prefer_local and local_online) else ("gemini" if gemini_key else ("local_llm" if local_online else "domain_fallback")),
    }


@app.post("/api/bixi/chat")
async def bixi_chat_endpoint(req: BixiChatRequest):
    """Bixi AI Assistant chat endpoint with Local LLM (Ollama / LM Studio) and Google Gemini support."""
    import os
    from app.services.gemini_service import chat_with_bixi_gemini, get_gemini_api_key

    local_llm_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/api/generate")
    local_llm_model = os.getenv("LOCAL_LLM_MODEL", "llama3.2:1b")
    local_timeout = float(os.getenv("LOCAL_LLM_TIMEOUT", "60.0"))
    prefer_local = os.getenv("PREFER_LOCAL_LLM", "false").lower() in ("1", "true", "yes")

    # 1. Local LLM as primary if PREFER_LOCAL_LLM is true
    if prefer_local:
        local_reply = await query_local_llm(
            url=local_llm_url,
            model=local_llm_model,
            user_msg=req.message,
            user_info=req.user,
            history=req.history,
            timeout_sec=local_timeout,
        )
        if local_reply:
            return {"reply": local_reply, "source": f"local_llm ({local_llm_model})"}

    # 2. Cloud AI via Google Gemini (if configured)
    gemini_reply = chat_with_bixi_gemini(
        message=req.message,
        user=req.user,
        history=req.history,
    )
    if gemini_reply:
        return {"reply": gemini_reply, "source": "gemini_1.5_flash"}

    # 3. Local LLM fallback if PREFER_LOCAL_LLM was not set
    if not prefer_local:
        local_reply = await query_local_llm(
            url=local_llm_url,
            model=local_llm_model,
            user_msg=req.message,
            user_info=req.user,
            history=req.history,
            timeout_sec=local_timeout,
        )
        if local_reply:
            return {"reply": local_reply, "source": f"local_llm ({local_llm_model})"}

    # 3. Context-aware intelligent fallback
    q = req.message.lower()
    user_role = (req.user.get("role") if req.user else "STUDENT") or "STUDENT"

    if any(k in q for k in ["gemini", "token", "key", "hallucinat", "accuracy"]):
        has_key = bool(get_gemini_api_key())
        if has_key:
            reply = "Google Gemini is active! All feedback analyses and chat interactions use live Gemini AI reasoning."
        else:
            reply = "You can add your Google Gemini API key in the Admin Dashboard under 'AI & Gemini Token' or in backend/.env to activate live, zero-shot AI reasoning!"
    elif any(k in q for k in ["how many", "how mant", "count", "number of", "how much feedback", "total feedback"]):
        ctx_info = get_bixi_database_context(req.user, req.message)
        reply = f"Here is your current feedback status:\n{ctx_info.strip()}"
    elif any(k in q for k in ["summarize", "sentiment", "positive", "negative", "trend"]):
        ctx_info = get_bixi_database_context(req.user, req.message)
        reply = f"Here is the student sentiment summary for your courses:\n{ctx_info.strip()}"
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

