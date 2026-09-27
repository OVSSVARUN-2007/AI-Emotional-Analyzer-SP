from pathlib import Path

from ai.nlp.analyzer import FeedbackAnalyzer


PROJECT_ROOT = Path(__file__).resolve().parents[3]

SENTIMENT_MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "sentiment"
    / "sentiment_tfidf_logreg.joblib"
)

EMOTION_MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "emotion"
    / "emotion_tfidf_logreg.joblib"
)


analyzer = FeedbackAnalyzer(
    sentiment_model=SENTIMENT_MODEL_PATH,
    emotion_model=EMOTION_MODEL_PATH,
)


def analyze_feedback(text: str) -> dict:
    """Analyze student feedback using the trained AI models."""
    return analyzer.analyze(text)