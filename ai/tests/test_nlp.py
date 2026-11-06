"""Fast checks for the reusable NLP layer."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
pd = pytest.importorskip("pandas")

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


def test_external_feedback_analyzer() -> None:
    from nlp.analyzer import ExternalFeedbackAnalyzer

    analyzer = ExternalFeedbackAnalyzer()
    res = analyzer.analyze("The teaching is excellent, but assignments are extremely difficult.")
    assert "External" in res["engine"]
    assert res["sentiment"]["label"] in ("mixed", "negative", "positive", "neutral")
    assert "topics" in res
    assert "aspects" in res
    assert "emotion" in res


def test_get_analyzer_factory() -> None:
    from nlp.analyzer import BertFeedbackAnalyzer, ExternalFeedbackAnalyzer, FeedbackAnalyzer, get_analyzer

    assert isinstance(get_analyzer("tfidf", sentiment_model="dummy"), FeedbackAnalyzer)
    assert isinstance(get_analyzer("external"), ExternalFeedbackAnalyzer)
    assert isinstance(get_analyzer("gemini"), ExternalFeedbackAnalyzer)


def test_sarcasm_and_negation_handling() -> None:
    from nlp.text import detect_sarcasm, resolve_negation_intent

    # Sarcasm
    assert detect_sarcasm("Great, another 3 AM deadline right before the exam.") is True
    assert detect_sarcasm("Oh wonderful, the lab server crashed again.") is True
    assert detect_sarcasm("The lecture was clear and engaging.") is False

    # Negation
    assert resolve_negation_intent("The explanation was not bad at all.") == "positive"
    assert resolve_negation_intent("The lecture was never boring.") == "positive"
    assert resolve_negation_intent("I cannot understand the derivation.") == "negative"


def test_server_side_pii_masking() -> None:
    from nlp.text import mask_pii

    raw = "My phone is 987-654-3210, email is student@university.edu and roll number is 22BD1A0501."
    masked = mask_pii(raw)
    assert "987-654-3210" not in masked
    assert "student@university.edu" not in masked
    assert "22BD1A0501" not in masked
    assert "[PHONE_MASKED]" in masked
    assert "[EMAIL_MASKED]" in masked
    assert "[ROLL_MASKED]" in masked


def test_tanglish_sentiment_and_emotion() -> None:
    from nlp.text import analyze_tanglish

    sent, em = analyze_tanglish("Sir explanation chala clear ga undi, concepts super ga artham ayyayi.")
    assert sent == "positive"
    assert em in ("clarity", "joy")

    sent_neg, em_neg = analyze_tanglish("Lab computers asalu work avvatledu, internet speed chala slow.")
    assert sent_neg == "negative"
    assert em_neg == "frustration"


def test_urgency_and_helpfulness_scoring() -> None:
    from nlp.text import detect_urgency_risk, calculate_helpfulness_score

    # Urgency
    urgent, category, _ = detect_urgency_risk("A group of seniors were ragging and harassing students in the hostel.")
    assert urgent is True
    assert category == "HARASSMENT_OR_SAFETY"

    normal_urgent, _, _ = detect_urgency_risk("The textbook is available in the library.")
    assert normal_urgent is False

    # Helpfulness
    brief = calculate_helpfulness_score("good")
    detailed = calculate_helpfulness_score("The professor explained backprop well, but I suggest providing a starter Colab notebook because setting up PyTorch on Windows was difficult.")
    assert detailed["score"] > brief["score"]
    assert detailed["quality_tier"] == "High"

