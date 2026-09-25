"""Inference facade for the final local NLP models; no backend required."""

from __future__ import annotations

from pathlib import Path
import re
from typing import Any

import joblib

from .text import require_text
from .topics import extract_topics


class FeedbackAnalyzer:
    """Load local models once and return a JSON-friendly feedback analysis."""

    def __init__(
        self,
        sentiment_model: str | Path | Any,
        emotion_model: str | Path | Any | None = None,
    ) -> None:
        if isinstance(sentiment_model, (str, Path)):
            self.sentiment_model = joblib.load(sentiment_model)
        else:
            self.sentiment_model = sentiment_model

        if emotion_model is None:
            self.emotion_model = None
        elif isinstance(emotion_model, (str, Path)):
            path = Path(emotion_model)
            self.emotion_model = joblib.load(path) if path.exists() else None
        else:
            self.emotion_model = emotion_model

    @staticmethod
    def _prediction(model: Any, text: str) -> dict[str, Any]:
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba([text])[0]
            scores = {
                label: round(float(score), 4)
                for label, score in zip(model.classes_, probabilities, strict=True)
            }
            label = max(scores, key=scores.get)
            return {"label": label, "confidence": scores[label], "scores": scores}

        prediction = model.predict([text])[0]
        return {"label": str(prediction), "confidence": 1.0, "scores": {str(prediction): 1.0}}

    def _extract_aspects(self, text: str) -> list[dict[str, Any]]:
        """Perform aspect-based sentiment analysis by clause decomposition."""
        clauses = [c.strip() for c in re.split(r"[.!?;\n]|\b(?:but|however|although|whereas)\b", text, flags=re.IGNORECASE) if c.strip()]
        aspects: list[dict[str, Any]] = []

        for clause in clauses:
            topics = extract_topics(clause)
            if topics:
                clause_sentiment = self._prediction(self.sentiment_model, clause)
                for topic in topics:
                    aspects.append(
                        {
                            "topic": topic,
                            "sentiment": clause_sentiment["label"],
                            "confidence": clause_sentiment["confidence"],
                            "segment": clause,
                        }
                    )

        return aspects

    def analyze(self, feedback: str) -> dict[str, Any]:
        text = require_text(feedback)
        sentiment_res = self._prediction(self.sentiment_model, text)
        aspects = self._extract_aspects(text)

        aspect_sentiments = {a["sentiment"] for a in aspects}
        overall_label = sentiment_res["label"]
        if "positive" in aspect_sentiments and "negative" in aspect_sentiments:
            overall_label = "mixed"

        result: dict[str, Any] = {
            "text": text,
            "sentiment": {
                "label": overall_label,
                "confidence": sentiment_res["confidence"],
                "scores": sentiment_res["scores"],
            },
            "topics": extract_topics(text),
            "aspects": aspects,
        }

        if self.emotion_model is not None:
            result["emotion"] = self._prediction(self.emotion_model, text)

        return result
