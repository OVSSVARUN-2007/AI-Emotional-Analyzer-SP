"""Transparent and semantic topic & aspect extraction for student feedback."""

from __future__ import annotations

import re
from collections.abc import Iterable


# Domain rules are intentionally explicit so that they can be reviewed and
# extended with institution-specific vocabulary without retraining a model.
TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "teaching": (
        "teacher", "teachers", "professor", "professors", "instructor", "instructors",
        "lecture", "lectures", "explain", "explains", "explanation", "explanations",
        "teaching", "faculty", "pedagogy", "teach", "teaching style",
        "explanation quality", "recitation", "speaking pace", "pacing", "whiteboard",
        "artham", "ardhamaindi", "super ga", "sir", "madam",
    ),
    "assignments": (
        "assignment", "assignments", "homework", "homeworks", "project", "projects",
        "submission", "submissions", "task", "tasks", "problem set", "problem sets",
        "coding challenge", "starter code", "rubric",
    ),
    "examinations": (
        "exam", "exams", "examination", "examinations", "quiz", "quizzes",
        "test", "tests", "assessment", "assessments", "midterm", "midterms",
        "final", "finals", "paper", "evaluation", "pop quiz", "gate exam",
    ),
    "workload": (
        "workload", "workloads", "busy", "overload", "too much work", "heavy workload",
        "stressful", "overwhelming", "pressure", "time-consuming", "exhausting",
        "sleep deprivation", "burnout", "breathing room", "nidra ledu", "torture", "ekkuva",
    ),
    "deadlines": (
        "deadline", "deadlines", "due date", "due dates", "time limit", "time limits",
        "late submission", "schedule", "timeline", "sunday midnight", "3 am",
    ),
    "course_content": (
        "syllabus", "syllabi", "course content", "curriculum", "module", "modules",
        "topic", "topics", "subject", "subjects", "material", "study material",
        "notes", "slides", "case studies", "proof", "derivation", "theory",
    ),
    "laboratories": (
        "lab", "labs", "laboratory", "laboratories", "practical", "practicals",
        "equipment", "lab manual", "experiment", "experiments", "software", "hardware",
        "cuda", "gpu", "ubuntu",
    ),
    "infrastructure": (
        "wifi", "internet", "classroom", "classrooms", "facility", "facilities",
        "library", "libraries", "canteen", "canteens", "bench", "benches",
        "projector", "ac", "air conditioning", "lab computers", "building",
        "server down", "server memory", "portal", "crashed",
    ),
    "attendance": (
        "attendance", "absent", "present", "proxy", "mandatory attendance",
        "attendance policy", "leaves", "75%",
    ),
    "grading": (
        "grade", "grades", "grading", "mark", "marks", "marking", "score", "scores",
        "scoring", "result", "results", "partial marking", "fair grading", "strict grading",
        "evaluation logic", "deducted",
    ),
    "support": (
        "doubt", "doubts", "help", "support", "guidance", "feedback", "response",
        "clearance", "office hours", "query", "queries", "assistance",
        "ta", "teaching assistant", "mentor", "mentoring",
    ),
}

# Contextual learned phrase patterns for aspect detection
CONTEXTUAL_ASPECT_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:pace was brutal|rushed through|skipped the proof|spoke too quietly)\b", re.IGNORECASE), "teaching"),
    (re.compile(r"\b(?:could not follow|completely lost|contradictory instructions)\b", re.IGNORECASE), "teaching"),
    (re.compile(r"\b(?:barely getting sleep|need breathing room|back-to-back)\b", re.IGNORECASE), "workload"),
    (re.compile(r"\b(?:server (?:crashed|down|wiped)|cuda out of memory|machines kept freezing)\b", re.IGNORECASE), "infrastructure"),
    (re.compile(r"\b(?:overly harsh|no rubric|arbitrary grading|marks were deducted)\b", re.IGNORECASE), "grading"),
    (re.compile(r"\b(?:3 am deadline|festive weekend|sunday 11:59)\b", re.IGNORECASE), "deadlines"),
]


def extract_topics(text: str, keywords: dict[str, Iterable[str]] | None = None) -> list[str]:
    """Return every configured topic mentioned by keyword or contextual semantic match."""
    normalized = text.lower()
    vocabulary = keywords or TOPIC_KEYWORDS
    detected: list[str] = []

    # 1. Whole-word keyword matching (preserving vocabulary order)
    for topic, terms in vocabulary.items():
        for term in terms:
            term_clean = term.lower()
            pattern = rf"(?<!\w){re.escape(term_clean)}(?!\w)"
            if re.search(pattern, normalized):
                detected.append(topic)
                break

    # 2. Contextual idiom / phrase patterns
    for pattern, aspect in CONTEXTUAL_ASPECT_PATTERNS:
        if pattern.search(normalized) and aspect not in detected:
            detected.append(aspect)

    return detected
