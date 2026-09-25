"""Unit tests for the Model Testing FastAPI Backend."""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Ensure root directory is on sys.path
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "models" in data
    assert "sentiment" in data["models"]


def test_metrics_endpoint() -> None:
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_analyze_single_endpoint() -> None:
    payload = {"feedback": "The professor explains clearly but the assignment deadline is very short."}
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "sentiment" in data
    assert "topics" in data
    assert "aspects" in data
    assert "emotion" in data
    assert data["sentiment"]["label"] in ("positive", "negative", "neutral", "mixed")


def test_analyze_batch_endpoint() -> None:
    payload = {
        "feedbacks": [
            "Great teaching and helpful faculty.",
            "Workload is too heavy and exams are stressful.",
        ]
    }
    response = client.post("/api/analyze/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["results"]) == 2


def test_index_ui_endpoint() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "Student Emotional Analyzer" in response.text
