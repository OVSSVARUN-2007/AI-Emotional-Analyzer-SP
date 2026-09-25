"""Fast checks for the reusable NLP layer."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd

from nlp.text import normalize_text, require_text
from nlp.topics import extract_topics
from nlp.training import train_classifier


def test_normalize_text_preserves_negation() -> None:
    assert normalize_text("  I  don't   like&nbsp;this  ") == "i don't like this"
    try:
        require_text("   ")
    except ValueError:
        pass
    else:
        raise AssertionError("empty text should be rejected")


def test_topics_match_whole_words() -> None:
    assert extract_topics("The professor gave a difficult assignment with a short deadline.") == ["teaching", "assignments", "deadlines"]
    assert "laboratories" not in extract_topics("The collaboration was good.")


def test_normalize_text_nan_and_quotes() -> None:
    assert normalize_text(float("nan")) == ""
    assert normalize_text(None) == ""
    assert normalize_text("“Good” lectures") == '"good" lectures'


def test_training_returns_probability_capable_pipeline() -> None:
    rows = pd.DataFrame({
        "feedback_text": ["great teaching", "excellent class", "bad teaching", "awful course", "okay class", "ordinary lecture"],
        "sentiment": ["positive", "positive", "negative", "negative", "neutral", "neutral"],
    })
    model, result = train_classifier(rows, rows, rows, tune=False)
    assert set(model.predict_proba(["great course"])[0])
    assert result.test_macro_f1 >= 0


def test_aspect_sentiment_analysis() -> None:
    from nlp.analyzer import FeedbackAnalyzer

    rows = pd.DataFrame({
        "feedback_text": ["great teaching", "excellent professor", "bad assignment", "awful homework"],
        "sentiment": ["positive", "positive", "negative", "negative"],
    })
    model, _ = train_classifier(rows, rows, rows, tune=False)
    analyzer = FeedbackAnalyzer(model)

    res = analyzer.analyze("The professor explains clearly, but homework is bad.")
    assert res["sentiment"]["label"] == "mixed"
    assert len(res["aspects"]) >= 2
    topics = [a["topic"] for a in res["aspects"]]
    assert "teaching" in topics
    assert "assignments" in topics
