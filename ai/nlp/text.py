"""Text validation and minimal, meaning-preserving normalization."""

from __future__ import annotations

import html
import math
import re
import unicodedata
from typing import Any

def _is_na(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    try:
        if isinstance(value, (int, str, bool, list, dict, tuple)):
            return False
        # IEEE 754 NaN check for numpy nan or custom objects without pandas
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
