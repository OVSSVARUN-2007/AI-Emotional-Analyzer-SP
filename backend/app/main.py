"""FastAPI Backend dedicated ONLY for testing the Student Emotional Analyzer NLP Models."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# Ensure repo root and ai package are on Python path
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ai.nlp import FeedbackAnalyzer

# Paths to trained model artifacts
SENTIMENT_MODEL_PATH = REPO_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg.joblib"
EMOTION_MODEL_PATH = REPO_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg.joblib"
SENTIMENT_METRICS_PATH = REPO_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg_metrics.json"
EMOTION_METRICS_PATH = REPO_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg_metrics.json"

# Initialize FastAPI application
app = FastAPI(
    title="Student Feedback Emotional Analyzer — Testing Backend",
    description="Dedicated backend service for testing trained NLP models (Sentiment, Emotion, Aspect Analysis, Topics).",
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

# Load analyzer once at startup
_analyzer: FeedbackAnalyzer | None = None


def get_analyzer() -> FeedbackAnalyzer:
    global _analyzer
    if _analyzer is None:
        if not SENTIMENT_MODEL_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Sentiment model not found at {SENTIMENT_MODEL_PATH}. Please run training first.",
            )
        emotion_path = EMOTION_MODEL_PATH if EMOTION_MODEL_PATH.exists() else None
        _analyzer = FeedbackAnalyzer(SENTIMENT_MODEL_PATH, emotion_path)
    return _analyzer


# Pydantic Schemas
class FeedbackRequest(BaseModel):
    feedback: str = Field(
        ...,
        description="Student feedback text to analyze.",
        json_schema_extra={"example": "The professor explains concepts very clearly, but assignments are too difficult."},
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
    analyzer = get_analyzer()
    try:
        return analyzer.analyze(payload.feedback)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err


@app.post("/api/analyze/batch", summary="Analyze Batch Student Feedback")
def analyze_batch(payload: BatchFeedbackRequest) -> dict[str, Any]:
    analyzer = get_analyzer()
    results = []
    for text in payload.feedbacks:
        try:
            results.append(analyzer.analyze(text))
        except ValueError as err:
            results.append({"text": text, "error": str(err)})
    return {"total": len(results), "results": results}


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def index_test_ui() -> str:
    """Serve an interactive glassmorphism Web UI for testing the NLP models directly in browser."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Feedback Emotional Analyzer — Testing Playground</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.1);
      --accent-purple: #8b5cf6;
      --accent-pink: #ec4899;
      --accent-blue: #3b82f6;
      --positive-bg: #064e3b;
      --positive-txt: #34d399;
      --negative-bg: #881337;
      --negative-txt: #fb7185;
      --neutral-bg: #365314;
      --neutral-txt: #a3e635;
      --mixed-bg: #78350f;
      --mixed-txt: #fbbf24;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      padding: 2rem 1rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .container {
      max-width: 1050px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    header {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 1.75rem 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    header p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.2rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 0.4rem 0.85rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
    }

    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }

    label {
      font-weight: 600;
      font-size: 1rem;
      color: #e2e8f0;
      margin-bottom: 0.5rem;
      display: block;
    }

    textarea {
      width: 100%;
      height: 110px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.75rem;
      color: var(--text-main);
      padding: 0.85rem 1rem;
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
      transition: all 0.2s ease;
      outline: none;
    }

    textarea:focus {
      border-color: var(--accent-purple);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
    }

    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .presets {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-preset {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text-muted);
      padding: 0.35rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-preset:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    .btn-analyze {
      background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
      border: none;
      color: #fff;
      padding: 0.75rem 1.75rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
      transition: all 0.2s;
    }

    .btn-analyze:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(139, 92, 246, 0.6);
    }

    .grid-results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
      margin-top: 1rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-positive { background: var(--positive-bg); color: var(--positive-txt); border: 1px solid var(--positive-txt); }
    .badge-negative { background: var(--negative-bg); color: var(--negative-txt); border: 1px solid var(--negative-txt); }
    .badge-neutral  { background: var(--neutral-bg);  color: var(--neutral-txt);  border: 1px solid var(--neutral-txt); }
    .badge-mixed    { background: var(--mixed-bg);    color: var(--mixed-txt);    border: 1px solid var(--mixed-txt); }

    .topic-pill {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #93c5fd;
      padding: 0.2rem 0.65rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      margin: 0.2rem;
    }

    .bar-container {
      margin-bottom: 0.6rem;
    }
    .bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 0.2rem;
      color: var(--text-muted);
    }
    .bar-bg {
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-purple), var(--accent-pink));
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
      font-size: 0.85rem;
    }
    th, td {
      padding: 0.6rem 0.8rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    th { color: var(--text-muted); font-weight: 600; }

    pre {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(15, 23, 42, 0.9);
      padding: 1rem;
      border-radius: 0.75rem;
      overflow-x: auto;
      font-size: 0.82rem;
      color: #38bdf8;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🎓 Student Emotional Analyzer</h1>
        <p>Testing Backend API & NLP Playground</p>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        Backend Active (FastAPI)
      </div>
    </header>

    <div class="card">
      <label for="feedbackInput">Test Student Feedback Text</label>
      <textarea id="feedbackInput" placeholder="Enter student feedback to test sentiment, emotion, aspect analysis, and topic extraction..."></textarea>
      
      <div class="controls">
        <div class="presets">
          <span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">Try Samples:</span>
          <button class="btn-preset" onclick="setSample(1)">Mixed Aspect</button>
          <button class="btn-preset" onclick="setSample(2)">High Satisfaction</button>
          <button class="btn-preset" onclick="setSample(3)">Exam Stress</button>
        </div>
        <button class="btn-analyze" onclick="analyzeFeedback()">⚡ Analyze Feedback</button>
      </div>
    </div>

    <div id="resultsArea" class="hidden">
      <div class="grid-results">
        <!-- Sentiment Card -->
        <div class="card">
          <h3 style="margin-bottom:0.75rem; font-size:1.1rem; color:#a78bfa;">Overall Sentiment</h3>
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
            <span id="sentBadge" class="badge">---</span>
            <span style="font-size:0.9rem; color:var(--text-muted);">Confidence: <strong id="sentConf" style="color:#fff;">0%</strong></span>
          </div>
          <div id="sentScores"></div>
        </div>

        <!-- Emotion Card -->
        <div class="card">
          <h3 style="margin-bottom:0.75rem; font-size:1.1rem; color:#f472b6;">Detected Emotion</h3>
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
            <span id="emoBadge" class="badge badge-positive" style="background:rgba(236,72,153,0.2); color:#f472b6; border-color:#f472b6;">---</span>
            <span style="font-size:0.9rem; color:var(--text-muted);">Confidence: <strong id="emoConf" style="color:#fff;">0%</strong></span>
          </div>
          <div id="emoScores"></div>
        </div>

        <!-- Topics Card -->
        <div class="card">
          <h3 style="margin-bottom:0.75rem; font-size:1.1rem; color:#60a5fa;">Extracted Topics</h3>
          <div id="topicsContainer" style="min-height:50px;"></div>
        </div>
      </div>

      <!-- Aspect Breakdown Card -->
      <div class="card" style="margin-top:1.25rem;">
        <h3 style="margin-bottom:0.75rem; font-size:1.1rem; color:#34d399;">Aspect-Based Sentiment Analysis</h3>
        <div id="aspectsContainer"></div>
      </div>

      <!-- Raw JSON Response -->
      <div class="card" style="margin-top:1.25rem;">
        <h3 style="margin-bottom:0.75rem; font-size:1.1rem; color:#94a3b8;">API Output Payload</h3>
        <pre id="jsonViewer"></pre>
      </div>
    </div>
  </div>

  <script>
    const samples = {
      1: "The professor explains concepts very clearly, but the assignments are extremely difficult and deadlines are too short.",
      2: "Fantastic lectures! The lab equipment is brand new and the instructor is very supportive during office hours.",
      3: "Workload is way too heavy this semester, and the quizzes are super stressful with insufficient time."
    };

    function setSample(id) {
      document.getElementById('feedbackInput').value = samples[id];
      analyzeFeedback();
    }

    async function analyzeFeedback() {
      const text = document.getElementById('feedbackInput').value.trim();
      if (!text) return alert('Please enter feedback text to test.');

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback: text })
        });
        const data = await response.json();
        renderResults(data);
      } catch (err) {
        alert('Failed to connect to backend: ' + err.message);
      }
    }

    function renderResults(data) {
      document.getElementById('resultsArea').classList.remove('hidden');

      // Sentiment
      const sent = data.sentiment;
      const sentBadge = document.getElementById('sentBadge');
      sentBadge.innerText = sent.label.toUpperCase();
      sentBadge.className = 'badge badge-' + sent.label.toLowerCase();
      document.getElementById('sentConf').innerText = (sent.confidence * 100).toFixed(1) + '%';
      
      let sentHtml = '';
      for (const [k, v] of Object.entries(sent.scores)) {
        sentHtml += `
          <div class="bar-container">
            <div class="bar-header"><span>${k}</span><span>${(v * 100).toFixed(1)}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width: ${v * 100}%"></div></div>
          </div>`;
      }
      document.getElementById('sentScores').innerHTML = sentHtml;

      // Emotion
      if (data.emotion) {
        const emo = data.emotion;
        document.getElementById('emoBadge').innerText = emo.label.toUpperCase();
        document.getElementById('emoConf').innerText = (emo.confidence * 100).toFixed(1) + '%';
        let emoHtml = '';
        for (const [k, v] of Object.entries(emo.scores)) {
          emoHtml += `
            <div class="bar-container">
              <div class="bar-header"><span>${k}</span><span>${(v * 100).toFixed(1)}%</span></div>
              <div class="bar-bg"><div class="bar-fill" style="width: ${v * 100}%; background:linear-gradient(90deg, #ec4899, #8b5cf6);"></div></div>
            </div>`;
        }
        document.getElementById('emoScores').innerHTML = emoHtml;
      }

      // Topics
      const topicsContainer = document.getElementById('topicsContainer');
      if (data.topics && data.topics.length > 0) {
        topicsContainer.innerHTML = data.topics.map(t => `<span class="topic-pill">#${t}</span>`).join(' ');
      } else {
        topicsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem;">No specific topic keywords detected.</span>';
      }

      // Aspects
      const aspectsContainer = document.getElementById('aspectsContainer');
      if (data.aspects && data.aspects.length > 0) {
        let tableHtml = `<table><thead><tr><th>Topic</th><th>Aspect Sentiment</th><th>Confidence</th><th>Clause Segment</th></tr></thead><tbody>`;
        for (const asp of data.aspects) {
          tableHtml += `<tr>
            <td><span class="topic-pill">#${asp.topic}</span></td>
            <td><span class="badge badge-${asp.sentiment.toLowerCase()}">${asp.sentiment.toUpperCase()}</span></td>
            <td>${(asp.confidence * 100).toFixed(1)}%</td>
            <td style="color:var(--text-muted); font-style:italic;">"${asp.segment}"</td>
          </tr>`;
        }
        tableHtml += `</tbody></table>`;
        aspectsContainer.innerHTML = tableHtml;
      } else {
        aspectsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem;">No multi-aspect clauses detected.</span>';
      }

      // JSON payload
      document.getElementById('jsonViewer').innerText = JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
