"""Text validation and minimal, meaning-preserving normalization."""

from __future__ import annotations

import html
import math
import re
import unicodedata
from typing import Any

import pandas as pd


def normalize_text(value: Any) -> str:
    """Return normalized text without removing sentiment-bearing words.

    Negation, punctuation, and stop words are intentionally retained: all can
    carry useful sentiment information for a TF-IDF model.
    """
    if value is None or pd.isna(value):
        return ""
    if isinstance(value, float) and math.isnan(value):
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
