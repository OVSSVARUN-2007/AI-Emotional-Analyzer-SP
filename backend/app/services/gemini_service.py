"""Google Gemini Cloud AI Service for Grounded Structured Output, Vision & Evidence-Grounded Assistant."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
from typing import Any, Optional

import httpx
from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT / ".env"
BACKEND_ENV_FILE = PROJECT_ROOT / "backend" / ".env"

try:
    from app.database.connection import engine
except ImportError:
    from backend.app.database.connection import engine


def get_configured_gemini_models() -> list[str]:
    """Retrieve ordered list of Gemini models, prioritizing user-configured model from env or DB."""
    configured = os.getenv("GEMINI_MODEL")
    if not configured:
        try:
            with engine.connect() as conn:
                row = conn.execute(
                    text("SELECT setting_value FROM system_settings WHERE setting_key = 'gemini_model' LIMIT 1")
                ).fetchone()
                if row and row[0] and row[0].strip():
                    configured = row[0].strip()
        except Exception:
            pass

    candidates = [
        configured,
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-1.5-pro",
        "gemini-flash-latest",
    ]
    seen = set()
    result = []
    for m in candidates:
        if m and m not in seen:
            seen.add(m)
            result.append(m)
    return result


def get_gemini_api_key() -> Optional[str]:
    """Retrieve Gemini API Key from database settings, environment, or .env files."""
    # 1. Check system_settings database table
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT setting_value FROM system_settings WHERE setting_key = 'gemini_api_key' LIMIT 1")
            ).fetchone()
            if row and row[0] and row[0].strip():
                return row[0].strip()
    except Exception:
        pass

    # 2. Check process environment
    env_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()

    # 3. Check .env files
    for p in [ENV_FILE, BACKEND_ENV_FILE]:
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val

    return None


def set_gemini_api_key(api_key: str) -> None:
    """Persist Gemini API Key in system_settings."""
    clean_key = api_key.strip()
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO system_settings (setting_key, setting_value, updated_at)
                    VALUES ('gemini_api_key', :val, CURRENT_TIMESTAMP)
                    ON CONFLICT(setting_key) DO UPDATE SET
                        setting_value = :val,
                        updated_at = CURRENT_TIMESTAMP
                """),
                {"val": clean_key},
            )
    except Exception as e:
        print(f"[GeminiService] Error saving key to system_settings: {e}")


def verify_gemini_key(api_key: str) -> tuple[bool, str]:
    """Test validity of a Gemini API Key with a small verification ping across candidate models."""
    clean_key = api_key.strip()
    if not clean_key or len(clean_key) < 10:
        return False, "API key is too short or empty."

    test_payload = {
        "contents": [{"parts": [{"text": "Reply with 'OK'."}]}],
        "generationConfig": {"maxOutputTokens": 5},
    }

    models = get_configured_gemini_models()
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.post(url, json=test_payload)
                if resp.status_code == 200:
                    return True, f"Key verified successfully using {model}"
                if resp.status_code == 400 and "API_KEY_INVALID" in resp.text:
                    return False, "Invalid API key provided."
        except Exception:
            continue

    return False, "Could not reach Gemini endpoint with the provided key."


def _validate_analysis_schema(data: dict[str, Any]) -> bool:
    """Validate that LLM output matches required structured schema."""
    if not isinstance(data, dict):
        return False
    if "sentiment" not in data or "label" not in data["sentiment"]:
        return False
    if "emotion" not in data or "label" not in data["emotion"]:
        return False
    return True


def analyze_feedback_with_gemini(
    text_content: str,
    slide_image_base64: Optional[str] = None,
    acoustic_prosody: Optional[dict[str, Any]] = None,
    api_key: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    """Grounded structured output sentiment, acoustic & multimodal slide emotional analysis using Google Gemini."""
    key = api_key or get_gemini_api_key()
    if not key:
        return None

    prosody_info = ""
    if acoustic_prosody:
        prosody_info = (
            f"\nAcoustic vocal prosody metrics captured during speech input: "
            f"Speech Pace: {acoustic_prosody.get('speech_pace', 'Normal')}, "
            f"Vocal Energy: {acoustic_prosody.get('vocal_energy', 0.5)}, "
            f"Tremor/Jitter Indicator: {acoustic_prosody.get('tremor_indicator', 0.02)}."
        )

    system_instruction = (
        "You are an expert educational psychologist and sentiment intelligence AI for university student feedback. "
        "Analyze the provided student text with high accuracy and grounded structured output. "
        "CRITICAL RULES:\n"
        "- If the student expresses confusion or inability to understand, sentiment MUST be 'negative' or 'mixed' and emotion MUST be 'confusion' or 'frustration'.\n"
        "- Support multilingual and regional code-mixing (English, Telugu, Hindi, Tamil, Hinglish, Tanglish) and report detected language.\n"
        "- For sarcasm (e.g. 'Great, another 3 AM deadline'), identify genuine frustration/negative sentiment.\n"
        "- Return ONLY valid JSON matching this schema:\n"
        "{\n"
        '  "sentiment": {\n'
        '    "label": "positive" | "negative" | "neutral" | "mixed",\n'
        '    "confidence": float (0.70 to 0.95),\n'
        '    "scores": {"positive": float, "negative": float, "neutral": float}\n'
        "  },\n"
        '  "emotion": {\n'
        '    "label": "joy" | "clarity" | "curiosity" | "confusion" | "frustration" | "fatigue" | "neutral",\n'
        '    "confidence": float (0.70 to 0.95),\n'
        '    "scores": {"joy": float, "clarity": float, "curiosity": float, "confusion": float, "frustration": float, "fatigue": float, "neutral": float}\n'
        "  },\n"
        '  "topics": ["string", ...],\n'
        '  "aspects": [\n'
        '    {"topic": "string", "sentiment": "positive"|"negative"|"neutral", "confidence": float, "segment": "string"}\n'
        "  ],\n"
        '  "slide_analysis": "Analysis of slide diagram/equations if image provided, or null.",\n'
        '  "detected_language": "English" | "Telugu" | "Hindi" | "Tanglish" | "Hinglish" | "Mixed Vernacular",\n'
        '  "pedagogical_advice": "Actionable, concrete suggestion for the instructor (1-2 sentences).",\n'
        '  "wellbeing_impact": "POSITIVE" | "NEUTRAL" | "HIGH_STRESS"\n'
        "}"
    )

    user_prompt = f"Analyze this student course feedback:\n\n{text_content}{prosody_info}"
    parts: list[dict[str, Any]] = [{"text": f"{system_instruction}\n\n{user_prompt}"}]

    if slide_image_base64 and len(slide_image_base64) > 50:
        img_data = slide_image_base64
        mime_type = "image/png"
        if "," in img_data:
            header, img_data = img_data.split(",", 1)
            if "jpeg" in header or "jpg" in header:
                mime_type = "image/jpeg"
            elif "webp" in header:
                mime_type = "image/webp"
        parts.append({
            "inlineData": {
                "mimeType": mime_type,
                "data": img_data,
            }
        })

    request_data = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }

    models = get_configured_gemini_models()
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        # Retry loop for resilience against invalid output
        for attempt in range(2):
            try:
                with httpx.Client(timeout=14.0) as client:
                    resp = client.post(url, json=request_data)
                    if resp.status_code == 200:
                        body = resp.json()
                        raw_text = body["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if raw_text.startswith("```"):
                            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
                            raw_text = re.sub(r"\n?```$", "", raw_text)
                        parsed = json.loads(raw_text)
                        if _validate_analysis_schema(parsed):
                            parsed["engine"] = f"Google Gemini ({model}) · Grounded Multimodal AI"
                            parsed["text"] = text_content
                            return parsed
            except Exception:
                continue

    return None


def generate_remedial_lesson_plan(
    topic: str,
    confusion_points: Optional[list[str]] = None,
    course_code: str = "AI501",
    course_name: str = "",
    confusion_rate: float = 0.45,
    api_key: Optional[str] = None,
    **kwargs,
) -> dict[str, Any]:
    """Generates an automated 10-minute lecture recap plan with structured pedagogical segments."""
    key = api_key or get_gemini_api_key()
    parsed_plan = None

    if key:
        points_str = "\n".join(f"- {p}" for p in confusion_points) if confusion_points else "General confusion on conceptual derivations."
        system_instruction = (
            "You are an elite university pedagogical designer. Generate an actionable, engaging 10-minute lecture recap session "
            "designed specifically to resolve student confusion on the topic.\n"
            "Return valid JSON matching this schema:\n"
            "{\n"
            '  "title": "Concise session title",\n'
            '  "recap_objective": "1-sentence clarity objective",\n'
            '  "duration_minutes": 10,\n'
            '  "timeline": [\n'
            '    {"minute": "0-3", "segment": "Intuitive Analogy & Real-World Motivation", "guidance": "..."},\n'
            '    {"minute": "4-7", "segment": "Deconstructing Common Misconceptions", "guidance": "..."},\n'
            '    {"minute": "8-10", "segment": "Rapid Interactive Comprehension Check", "guidance": "..."}\n'
            '  ],\n'
            '  "interactive_problem": "1 concrete problem to solve together",\n'
            '  "analogy": "Clear mental model analogy"\n'
            "}"
        )

        request_data = {
            "contents": [{
                "role": "user",
                "parts": [{"text": f"{system_instruction}\n\nCourse: {course_code} ({course_name})\nTopic: {topic}\nConfusion points:\n{points_str}"}]
            }],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }

        models = get_configured_gemini_models()
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            try:
                with httpx.Client(timeout=14.0) as client:
                    resp = client.post(url, json=request_data)
                    if resp.status_code == 200:
                        body = resp.json()
                        raw_text = body["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if raw_text.startswith("```"):
                            raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
                            raw_text = re.sub(r"\n?```$", "", raw_text)
                        parsed_plan = json.loads(raw_text)
                        break
            except Exception:
                continue

    if not parsed_plan:
        parsed_plan = _fallback_remedial_plan(topic, course_code)

    # Normalize fields for backend consumers and test compatibility
    lesson_title = parsed_plan.get("title") or f"10-Minute Rapid Revision: {topic}"
    timeline = parsed_plan.get("timeline", [])
    recap_script = "\n".join([f"{item.get('minute', '')}: {item.get('segment', '')} - {item.get('guidance', '')}" for item in timeline]) if timeline else f"10-minute targeted recap on {topic}"
    interactive_prob = parsed_plan.get("interactive_problem") or f"Worked example solving {topic} on the board."
    curated_res = parsed_plan.get("curated_resources") or [
        f"Visual intuition walkthrough for {topic}",
        f"Step-by-step problem set for {course_code}"
    ]

    parsed_plan["lesson_title"] = lesson_title
    parsed_plan["recap_script"] = recap_script
    parsed_plan["recap_plan"] = recap_script
    parsed_plan["practice_questions"] = [interactive_prob]
    parsed_plan["curated_resources"] = curated_res
    parsed_plan["topic"] = topic
    parsed_plan["course_code"] = course_code
    parsed_plan["course_name"] = course_name

    return parsed_plan


def _fallback_remedial_plan(topic: str, course_code: str) -> dict[str, Any]:
    return {
        "title": f"10-Minute Rapid Revision: {topic}",
        "recap_objective": f"Solidify core intuition and address key hurdles in {topic} for {course_code}.",
        "duration_minutes": 10,
        "timeline": [
            {"minute": "0-3", "segment": "Core Intuition & Motivation", "guidance": "Connect topic to previous lecture and demonstrate practical utility with a whiteboard diagram."},
            {"minute": "4-7", "segment": "Common Stumbling Blocks", "guidance": "Highlight top points of student confusion and solve a minimal worked example step-by-step."},
            {"minute": "8-10", "segment": "Peer Check & Q&A", "guidance": "Conduct a 2-minute 1-question poll to confirm class-wide conceptual alignment."}
        ],
        "interactive_problem": f"Walk through a 1-step numerical calculation of {topic} with student input.",
        "analogy": f"Think of {topic} like a pipeline where each stage must preserve invariant conditions.",
        "curated_resources": [
            f"3Blue1Brown visual intuition for {topic}",
            f"PyTorch Documentation & Implementation Walkthrough for {course_code}"
        ]
    }


def _get_evidence_grounding_context(message: str) -> str:
    """Retrieve actual recent feedback excerpts from the database to ground Bixi's replies."""
    try:
        with engine.connect() as conn:
            # Check for course code mentions e.g. AI501, CS301
            codes = conn.execute(text("SELECT DISTINCT course_code FROM courses")).fetchall()
            mentioned_code = None
            for c in codes:
                if c[0] and c[0].lower() in message.lower():
                    mentioned_code = c[0]
                    break

            if mentioned_code:
                feedbacks = conn.execute(
                    text("""
                        SELECT f.feedback_text, p.sentiment, p.emotion
                        FROM feedback f
                        LEFT JOIN predictions p ON f.feedback_id = p.feedback_id
                        WHERE f.course_code = :cc
                        ORDER BY f.feedback_id DESC
                        LIMIT 5
                    """),
                    {"cc": mentioned_code},
                ).fetchall()
                if feedbacks:
                    snippets = [f"- \"{r[0]}\" (Sentiment: {r[1]}, Emotion: {r[2]})" for r in feedbacks]
                    return f"\nEVIDENCE GROUNDING DATA for {mentioned_code}:\n" + "\n".join(snippets) + "\n(Cite these real student observations in your response.)"
                return f"\nEVIDENCE GROUNDING: No student feedback data is currently recorded for {mentioned_code}. Explicitly inform the user that no submissions exist yet."
    except Exception:
        pass
    return ""


def chat_with_bixi_gemini(
    message: str,
    user: Optional[dict[str, Any]] = None,
    history: Optional[list[dict[str, str]]] = None,
    api_key: Optional[str] = None,
) -> Optional[str]:
    """Generates intelligent, evidence-grounded Bixi conversational replies using Google Gemini."""
    key = api_key or get_gemini_api_key()
    if not key:
        return None

    role = (user.get("role") if user else "STUDENT") or "STUDENT"
    user_name = (user.get("name") if user else "Student") or "Student"
    grounding_data = _get_evidence_grounding_context(message)

    system_instruction = (
        f"You are Bixi ☁️, the friendly, highly intelligent AI academic counselor and sentiment intelligence assistant for Sentio. "
        f"You are speaking with {user_name} whose role is {role}. "
        "Keep your responses warm, concise (1-2 clear, insightful paragraphs), encouraging, and strictly truthful. "
        "GROUNDING RULE: When discussing course performance or sentiment, only cite provided evidence. If no data exists, explicitly state 'No feedback has been recorded for this course yet.' Do not invent student complaints or satisfaction scores.\n"
        f"{grounding_data}"
    )

    contents = []
    if history:
        for h in history[-6:]:
            role_type = "model" if h.get("role") == "assistant" or h.get("sender") == "bixi" else "user"
            contents.append({"role": role_type, "parts": [{"text": h.get("text") or h.get("content", "")}]})
    contents.append({"role": "user", "parts": [{"text": f"System Directive: {system_instruction}\n\nUser Question: {message}"}]})

    request_data = {
        "contents": contents,
        "generationConfig": {"temperature": 0.35, "maxOutputTokens": 450},
    }

    models = get_configured_gemini_models()
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        try:
            with httpx.Client(timeout=12.0) as client:
                resp = client.post(url, json=request_data)
                if resp.status_code == 200:
                    body = resp.json()
                    return body["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            continue

    return None
