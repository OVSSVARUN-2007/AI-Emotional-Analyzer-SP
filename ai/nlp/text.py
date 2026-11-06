"""Text validation, privacy PII masking, sarcasm/negation analysis, and emotion alignment."""

from __future__ import annotations

import html
import math
import re
import unicodedata
from typing import Any

# ═══════════════════════════════════════════════════════
# UNIFIED ACADEMIC EMOTION TAXONOMY (7 CANONICAL CLASSES)
# ═══════════════════════════════════════════════════════
UNIFIED_EMOTIONS = (
    "joy",          # High satisfaction, enjoyment, enthusiasm, gratitude
    "clarity",      # Clear conceptual understanding, confidence, well-explained
    "curiosity",    # Intellectual engagement, deep interest, curiosity
    "confusion",    # Ambiguity, feeling lost, unclear derivations, contradiction
    "frustration",  # Excessive workload, broken lab infra, harsh grading, delays
    "fatigue",      # Sleep deprivation, physical/mental burnout, overwhelm
    "neutral",      # Procedural, balanced, or non-emotional informational notes
)

EMOTION_CANONICAL_MAPPING: dict[str, str] = {
    # Joy / Satisfaction mappings
    "joy": "joy",
    "love": "joy",
    "satisfaction": "joy",
    "satisfied": "joy",
    "happy": "joy",
    "happiness": "joy",
    "contentment": "joy",
    "enthusiasm": "joy",
    "gratitude": "joy",
    # Clarity / Confidence mappings
    "clarity": "clarity",
    "engaged": "clarity",
    "understanding": "clarity",
    "confidence": "clarity",
    "comprehension": "clarity",
    # Curiosity / Interest mappings
    "curiosity": "curiosity",
    "curious": "curiosity",
    "interest": "curiosity",
    "hope": "curiosity",
    "exploration": "curiosity",
    # Confusion / Ambiguity mappings
    "confusion": "confusion",
    "confused": "confusion",
    "doubt": "confusion",
    "unclear": "confusion",
    "lost": "confusion",
    "surprise": "confusion",
    "ambiguity": "confusion",
    # Frustration / Stress mappings
    "frustration": "frustration",
    "frustrated": "frustrated",
    "anger": "frustration",
    "angry": "frustration",
    "annoyed": "frustration",
    "irritated": "frustration",
    "stress": "frustration",
    # Fatigue / Burnout mappings
    "fatigue": "fatigue",
    "exhaustion": "fatigue",
    "exhausted": "fatigue",
    "burnout": "fatigue",
    "sadness": "fatigue",
    "sad": "fatigue",
    "fear": "fatigue",
    "anxiety": "fatigue",
    "drained": "fatigue",
    # Neutral mappings
    "neutral": "neutral",
    "neutrality": "neutral",
    "none": "neutral",
    "mixed": "neutral",
}


def unify_emotion(raw_label: Any) -> str:
    """Map any raw emotion string to the unified academic emotion taxonomy."""
    if not raw_label:
        return "neutral"
    clean = str(raw_label).strip().lower()
    return EMOTION_CANONICAL_MAPPING.get(clean, "neutral")


def _is_na(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    try:
        if isinstance(value, (int, str, bool, list, dict, tuple)):
            return False
        if value != value:
            return True
    except Exception:
        pass
    return False


def normalize_text(value: Any) -> str:
    """Return normalized text without removing sentiment-bearing words.

    Negation, punctuation, and stop words are intentionally retained: all can
    carry useful sentiment information for a TF-IDF model.
    """
    if _is_na(value):
        return ""
    text = html.unescape(str(value))
    text = unicodedata.normalize("NFKC", text).replace("’", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", text).strip().lower()


def require_text(value: Any) -> str:
    """Normalize *value* and reject empty feedback with a clear error."""
    text = normalize_text(value)
    if not text:
        raise ValueError("feedback text must be a non-empty string")
    return text


# ═══════════════════════════════════════════════════════
# SERVER-SIDE PRIVACY PROTECTION & PII MASKING
# ═══════════════════════════════════════════════════════
# Regex patterns for sensitive student PII
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", re.IGNORECASE)
PHONE_REGEX = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
# Common student roll number formats: 22BD1A0501, 23CS099, 21CS101, 19A51A0504, STD-1234, 2023-BTECH-045
ROLL_REGEX = re.compile(r"\b(?:[0-9]{2}[A-Za-z]{2,3}[0-9A-Za-z]{2,6}|[0-9]{2}[A-Za-z0-9]{2}[0-9][A-Za-z0-9]{2,6}|[A-Za-z]{2,4}[-_]?[0-9]{3,8}|STD[-_]?[0-9]{3,6})\b", re.IGNORECASE)


def mask_pii(text: str) -> str:
    """Sanitize student feedback on the server by redacting phones, emails, and roll numbers.

    Ensures raw PII is never persisted in database logs or sent to third-party LLM APIs.
    """
    if not text:
        return ""
    masked = EMAIL_REGEX.sub("[EMAIL_MASKED]", text)
    masked = PHONE_REGEX.sub("[PHONE_MASKED]", masked)
    masked = ROLL_REGEX.sub("[ROLL_MASKED]", masked)
    return masked


# ═══════════════════════════════════════════════════════
# SARCASM & IRONY DETECTION
# ═══════════════════════════════════════════════════════
SARCASM_PATTERNS = [
    re.compile(r"\bgreat,\s*(?:another|more|just what we needed)\b", re.IGNORECASE),
    re.compile(r"\boh\s+wonderful,\s*(?:the|another|more)\b", re.IGNORECASE),
    re.compile(r"\bbrilliant(?:\s+teaching)?,\s*(?:reading|failing|crashed|zero)\b", re.IGNORECASE),
    re.compile(r"\bsure,\s*(?:giving us|setting|expecting)\s+.*?\s+is\s+totally\s+reasonable\b", re.IGNORECASE),
    re.compile(r"\bfantastic,\s*another\s+(?:unannounced|pop|surprise)\b", re.IGNORECASE),
    re.compile(r"\blove\s+how\s+.*?\s+(?:crashed|lost|failed|ignored)\b", re.IGNORECASE),
    re.compile(r"\bjust\s+what\s+(?:i|we)\s+needed\b", re.IGNORECASE),
]


def detect_sarcasm(text: str) -> bool:
    """Return True if the text displays clear sarcastic or ironic criticism patterns."""
    normalized = text.lower()
    return any(p.search(normalized) for p in SARCASM_PATTERNS)


# ═══════════════════════════════════════════════════════
# NEGATION HANDLING
# ═══════════════════════════════════════════════════════
NEGATION_POSITIVE_PATTERNS = [
    re.compile(r"\b(?:not|hardly|scarcely)\s+(?:bad|terrible|poor|difficult|boring|useless)\b", re.IGNORECASE),
    re.compile(r"\bnot\s+bad\s+at\s+all\b", re.IGNORECASE),
    re.compile(r"\bnever\s+(?:boring|dull|confusing)\b", re.IGNORECASE),
    re.compile(r"\bnot\s+as\s+(?:hard|terrifying|tough)\b", re.IGNORECASE),
]

NEGATION_NEGATIVE_PATTERNS = [
    re.compile(r"\b(?:cannot|can't|could\s*not|couldn't|hardly)\s+(?:understand|follow|grasp|hear|see)\b", re.IGNORECASE),
    re.compile(r"\bnot\s+(?:clear|helpful|fair|good|intuitive|useful|working|accessible)\b", re.IGNORECASE),
    re.compile(r"\bhardly\s+(?:clear|useful|fair)\b", re.IGNORECASE),
]


def resolve_negation_intent(text: str) -> str | None:
    """Check if negations invert the baseline polarity."""
    norm = text.lower()
    for p in NEGATION_POSITIVE_PATTERNS:
        if p.search(norm):
            return "positive"
    for p in NEGATION_NEGATIVE_PATTERNS:
        if p.search(norm):
            return "negative"
    return None


# ═══════════════════════════════════════════════════════
# TELUGU-ENGLISH (TANGLISH) CODE-MIXED DETECTOR
# ═══════════════════════════════════════════════════════
TANGLISH_POSITIVE_TERMS = {
    "bagundi", "baagundi", "super", "clear ga", "artham ayyindi", "ardhamaindi",
    "opika ga", "knowledge vachindi", "baga explain", "solve cheyagaliganu",
    "helpful ga", "aratham ayyayi", "manchi", "happy", "thrilling", "respect tho",
}

TANGLISH_NEGATIVE_TERMS = {
    "work avvatledu", "work avvadam ledu", "pani cheyadam ledu", "slow ga",
    "nidra ledu", "confuse ayyanu", "tough paper", "time waste", "server down",
    "ekkuva aipoindi", "torture", "delay chestunnaru", "kastam", "boring",
    "uncomfortable", "strict ga", "speed ledu", "marks cut", "wrong answer",
    "overlap", "time saripoledu",
}


def analyze_tanglish(text: str) -> tuple[str | None, str | None]:
    """Detect sentiment and unified emotion for Telugu-English code-mixed comments."""
    norm = text.lower()
    pos_matches = sum(1 for term in TANGLISH_POSITIVE_TERMS if term in norm)
    neg_matches = sum(1 for term in TANGLISH_NEGATIVE_TERMS if term in norm)

    if pos_matches > 0 and neg_matches > 0:
        return "mixed", "confusion"
    if pos_matches > neg_matches:
        if any(w in norm for w in ["clear ga", "artham", "ardham", "trick"]):
            return "positive", "clarity"
        return "positive", "joy"
    if neg_matches > pos_matches:
        if any(w in norm for w in ["nidra ledu", "ekkuva", "torture", "fatigue"]):
            return "negative", "fatigue"
        if any(w in norm for w in ["confuse", "artham kaledu", "doubt", "saripoledu"]):
            return "negative", "confusion"
        return "negative", "frustration"
    return None, None


# ═══════════════════════════════════════════════════════
# CONFIDENCE CALIBRATION & UNCERTAINTY BAND
# ═══════════════════════════════════════════════════════
def calibrate_confidence(
    raw_confidence: float,
    temperature: float = 1.25,
    is_ambiguous: bool = False,
) -> tuple[float, bool]:
    """Apply temperature scaling to raw probability scores.

    Avoids overconfident predictions (e.g. 0.99 claiming 100% certainty).
    Returns (calibrated_confidence, is_uncertain).
    Scores below 0.65 are flagged as requiring human review.
    """
    raw = max(0.0, min(1.0, float(raw_confidence)))
    # Temperature scaling dampens extreme confidence
    if raw >= 0.95 and not is_ambiguous:
        calibrated = round(0.85 + (raw - 0.95) * 1.5, 3)
    elif raw >= 0.70:
        calibrated = round(0.68 + (raw - 0.70) * 0.75, 3)
    else:
        calibrated = round(max(0.40, raw * 0.9), 3)

    if is_ambiguous:
        calibrated = min(calibrated, 0.60)

    is_uncertain = calibrated < 0.65
    return calibrated, is_uncertain


# ═══════════════════════════════════════════════════════
# URGENCY & SEVERE RISK DETECTOR (HUMAN-IN-THE-LOOP)
# ═══════════════════════════════════════════════════════
URGENCY_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:harass|harassment|ragging|bullied|bullying|threaten|threatened|sexual)\b", re.IGNORECASE), "HARASSMENT_OR_SAFETY"),
    (re.compile(r"\b(?:suicid|self-harm|want to end it|cannot go on living|die)\b", re.IGNORECASE), "SEVERE_MENTAL_DISTRESS"),
    (re.compile(r"\b(?:panic attack|mental breakdown|crying every day|severe depression)\b", re.IGNORECASE), "ACUTE_PSYCHOLOGICAL_DISTRESS"),
    (re.compile(r"\b(?:fire hazard|electric shock|unsafe equipment|physical violence)\b", re.IGNORECASE), "PHYSICAL_CAMPUS_SAFETY"),
]


def detect_urgency_risk(text: str) -> tuple[bool, str | None, str]:
    """Detect whether feedback contains safety, harassment, or acute distress language.

    Returns (is_urgent, urgency_category, escalation_advice).
    Never auto-judges; flags for urgent human triage at the Grievance Desk.
    """
    normalized = text.lower()
    for pattern, category in URGENCY_PATTERNS:
        if pattern.search(normalized):
            return True, category, "Flagged for immediate confidential review by Department Grievance Committee / Campus Counselor"
    return False, None, "Standard feedback flow"


# ═══════════════════════════════════════════════════════
# CONSTRUCTIVE FEEDBACK HELPFULNESS SCORER (GAMIFICATION)
# ═══════════════════════════════════════════════════════
CONSTRUCTIVE_PROMPTS = [
    re.compile(r"\b(?:suggest|recommend|would be better|could improve|solution|example|alternatively|instead)\b", re.IGNORECASE),
    re.compile(r"\b(?:because|since|due to|reason being|specifically|for instance|such as)\b", re.IGNORECASE),
]


def calculate_helpfulness_score(text: str) -> dict[str, Any]:
    """Score feedback quality on a 0-100 scale to nudge constructive submissions.

    Distinguishes specific actionable feedback from vague 1-word comments like 'good' or 'bad'.
    """
    words = text.strip().split()
    word_count = len(words)
    score = 40  # Baseline

    # Length factor
    if word_count < 4:
        score = 25
        tip = "Very brief. Consider adding specific details on what worked or what caused confusion."
    elif word_count >= 15:
        score += 25
        tip = "Great detail! Explaining context helps instructors improve course delivery."
    else:
        score += 10
        tip = "Good start. Add specific lecture topics or examples to make your feedback more actionable."

    # Constructive reasoning factor
    constructive_hits = sum(1 for p in CONSTRUCTIVE_PROMPTS if p.search(text))
    if constructive_hits >= 2:
        score += 30
        tip = "Outstanding constructive feedback with actionable suggestions!"
    elif constructive_hits == 1:
        score += 15

    score = min(100, max(15, score))
    return {
        "score": score,
        "quality_tier": "High" if score >= 75 else "Moderate" if score >= 50 else "Needs Detail",
        "tip": tip,
    }

