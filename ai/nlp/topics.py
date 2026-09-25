"""Transparent topic and aspect extraction for student feedback."""

from __future__ import annotations

import re
from collections.abc import Iterable


# Domain rules are intentionally explicit so that they can be reviewed and
# extended with institution-specific vocabulary without retraining a model.
TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "teaching": ("teacher", "teachers", "professor", "professors", "instructor", "instructors", "lecture", "lectures", "explain", "explains", "explanation", "teaching", "faculty"),
    "assignments": ("assignment", "assignments", "homework", "homeworks", "project", "projects", "submission", "submissions", "task", "tasks"),
    "examinations": ("exam", "exams", "examination", "examinations", "quiz", "quizzes", "test", "tests", "assessment", "assessments"),
    "workload": ("workload", "workloads", "busy", "overload", "too much work", "heavy workload", "stressful"),
    "deadlines": ("deadline", "deadlines", "due date", "due dates", "time limit", "time limits", "late submission"),
    "course_content": ("syllabus", "syllabi", "course content", "curriculum", "module", "modules", "topic", "topics", "subject", "subjects"),
    "laboratories": ("lab", "labs", "laboratory", "laboratories", "practical", "practicals", "equipment"),
    "infrastructure": ("wifi", "internet", "classroom", "classrooms", "facility", "facilities", "library", "libraries", "canteen", "canteens", "bench", "benches"),
    "attendance": ("attendance", "absent", "present", "proxy"),
    "grading": ("grade", "grades", "grading", "mark", "marks", "marking", "score", "scores", "scoring", "result", "results"),
    "support": ("doubt", "doubts", "help", "support", "guidance", "feedback", "response", "clearance"),
}


def extract_topics(text: str, keywords: dict[str, Iterable[str]] | None = None) -> list[str]:
    """Return every configured topic mentioned by whole-word keyword match."""
    normalized = text.lower()
    vocabulary = keywords or TOPIC_KEYWORDS
    detected: list[str] = []
    for topic, terms in vocabulary.items():
        for term in terms:
            term_clean = term.lower()
            pattern = rf"(?<!\w){re.escape(term_clean)}(?!\w)"
            if re.search(pattern, normalized):
                detected.append(topic)
                break
    return detected
