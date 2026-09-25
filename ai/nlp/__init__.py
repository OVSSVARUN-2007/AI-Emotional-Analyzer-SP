"""Reusable NLP components for student-feedback analysis.

This package deliberately has no web-framework dependency.  It can be used by
notebooks, a command-line workflow, or a future application layer.
"""

from .analyzer import FeedbackAnalyzer

__all__ = ["FeedbackAnalyzer"]
