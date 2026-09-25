"""Transparent topic and aspect extraction for student feedback."""

from __future__ import annotations

import re
from collections.abc import Iterable


# Domain rules are intentionally explicit so that they can be reviewed and
# extended with institution-specific vocabulary without retraining a model.
TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "teaching": ("teacher", "professor", "instructor", "lecture", "explain", "teaching"),
    "assignments": ("assignment", "homework", "project", "submission"),
    "examinations": ("exam", "examination", "quiz", "test", "assessment"),
    "workload": ("workload", "busy", "overload", "too much work", "heavy workload"),
    "deadlines": ("deadline", "due date", "time limit", "late submission"),
    "course_content": ("syllabus", "course content", "curriculum", "module", "topic"),
    "laboratories": ("lab", "laboratory", "practical", "equipment"),
    "infrastructure": ("wifi", "internet", "classroom", "facility", "library", "canteen"),
    "attendance": ("attendance", "absent", "present", "proxy"),
}


def extract_topics(text: str, keywords: dict[str, Iterable[str]] | None = None) -> list[str]:
    """Return every configured topic mentioned by whole-word keyword match."""
    normalized = text.lower()
    vocabulary = keywords or TOPIC_KEYWORDS
    return [
        topic
        for topic, terms in vocabulary.items()
        if any(re.search(rf"(?<!\w){re.escape(term.lower())}(?!\w)", normalized) for term in terms)
    ]
