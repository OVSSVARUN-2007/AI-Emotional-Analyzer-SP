"""Analyze one feedback message with the locally trained NLP models."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

AI_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_DIR))

from nlp import FeedbackAnalyzer


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feedback")
    parser.add_argument("--sentiment-model", type=Path, default=AI_DIR / "models" / "sentiment" / "sentiment_tfidf_logreg.joblib")
    parser.add_argument("--emotion-model", type=Path, default=AI_DIR / "models" / "emotion" / "emotion_tfidf_logreg.joblib")
    args = parser.parse_args()
    emotion_path = args.emotion_model if args.emotion_model.exists() else None
    print(json.dumps(FeedbackAnalyzer(args.sentiment_model, emotion_path).analyze(args.feedback), indent=2))


if __name__ == "__main__":
    main()
