"""Inference facade for the final local NLP models; no backend required."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

from .text import require_text
from .topics import extract_topics


class FeedbackAnalyzer:
    """Load local models once and return a JSON-friendly feedback analysis."""

    def __init__(self, sentiment_model_path: str | Path, emotion_model_path: str | Path | None = None) -> None:
        self.sentiment_model = joblib.load(sentiment_model_path)
        self.emotion_model = joblib.load(emotion_model_path) if emotion_model_path else None

    @staticmethod
    def _prediction(model: Any, text: str) -> dict[str, Any]:
        probabilities = model.predict_proba([text])[0]
        scores = {label: round(float(score), 4) for label, score in zip(model.classes_, probabilities, strict=True)}
        label = max(scores, key=scores.get)
        return {"label": label, "confidence": scores[label], "scores": scores}

    def analyze(self, feedback: str) -> dict[str, Any]:
        text = require_text(feedback)
        result: dict[str, Any] = {
            "text": text,
            "sentiment": self._prediction(self.sentiment_model, text),
            "topics": extract_topics(text),
        }
        if self.emotion_model is not None:
            result["emotion"] = self._prediction(self.emotion_model, text)
        return result
