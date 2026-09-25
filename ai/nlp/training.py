"""Reproducible, framework-free training utilities."""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline

from .text import normalize_text

RANDOM_STATE = 42
SENTIMENT_LABELS = ("negative", "neutral", "positive")
EMOTION_LABELS = ("sadness", "joy", "love", "anger", "fear", "surprise")


@dataclass(frozen=True)
class TrainingResult:
    """Serializable summary for a trained classifier."""

    model_name: str
    labels: list[str]
    train_rows: int
    validation_rows: int
    test_rows: int
    best_cv_macro_f1: float
    validation_macro_f1: float
    test_macro_f1: float
    best_params: dict[str, Any]
    validation_report: dict[str, Any]
    test_report: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def build_classifier() -> Pipeline:
    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(sublinear_tf=True, strip_accents="unicode", ngram_range=(1, 2))),
            ("classifier", LogisticRegression(max_iter=2_000, class_weight="balanced", random_state=RANDOM_STATE)),
        ]
    )


def _validate_frame(frame: pd.DataFrame, text_column: str, label_column: str) -> pd.DataFrame:
    missing = {text_column, label_column} - set(frame.columns)
    if missing:
        raise ValueError(f"missing columns: {sorted(missing)}")
    clean = frame.loc[:, [text_column, label_column]].dropna().copy()
    clean[text_column] = clean[text_column].map(normalize_text)
    clean[label_column] = clean[label_column].astype(str).str.strip().str.lower()
    clean = clean.loc[clean[text_column].ne("")].drop_duplicates().reset_index(drop=True)
    if clean.empty:
        raise ValueError("no valid training rows remain after cleaning")
    return clean


def train_classifier(
    train: pd.DataFrame,
    validation: pd.DataFrame,
    test: pd.DataFrame,
    *,
    text_column: str = "feedback_text",
    label_column: str = "sentiment",
    tune: bool = True,
) -> tuple[Pipeline, TrainingResult]:
    """Fit on train only, tune by CV, then evaluate validation and test once."""
    train = _validate_frame(train, text_column, label_column)
    validation = _validate_frame(validation, text_column, label_column)
    test = _validate_frame(test, text_column, label_column)
    labels = sorted(train[label_column].unique())
    if set(validation[label_column]) - set(labels) or set(test[label_column]) - set(labels):
        raise ValueError("validation/test contain labels not present in training data")

    estimator: Pipeline = build_classifier()
    minimum_class_size = int(train[label_column].value_counts().min())
    if tune and minimum_class_size >= 2:
        folds = min(5, minimum_class_size)
        search = GridSearchCV(
            estimator,
            {
                "tfidf__ngram_range": [(1, 1), (1, 2)],
                "tfidf__min_df": [1, 2],
                "classifier__C": [0.5, 1.0, 2.0],
            },
            scoring="f1_macro",
            cv=folds,
            n_jobs=-1,
            refit=True,
        )
        search.fit(train[text_column], train[label_column])
        model, best_score, best_params = search.best_estimator_, float(search.best_score_), search.best_params_
    else:
        model = estimator.fit(train[text_column], train[label_column])
        best_score, best_params = float("nan"), {}

    def evaluate(part: pd.DataFrame) -> tuple[float, dict[str, Any]]:
        predicted = model.predict(part[text_column])
        return (
            float(f1_score(part[label_column], predicted, average="macro")),
            classification_report(part[label_column], predicted, labels=labels, output_dict=True, zero_division=0),
        )

    validation_f1, validation_report = evaluate(validation)
    test_f1, test_report = evaluate(test)
    return model, TrainingResult(
        model_name="TF-IDF + LogisticRegression",
        labels=labels,
        train_rows=len(train), validation_rows=len(validation), test_rows=len(test),
        best_cv_macro_f1=best_score, validation_macro_f1=validation_f1, test_macro_f1=test_f1,
        best_params=best_params, validation_report=validation_report, test_report=test_report,
    )


def save_model(model: Pipeline, result: TrainingResult, output_directory: Path, stem: str) -> tuple[Path, Path]:
    """Persist a pipeline and its metrics side-by-side."""
    output_directory.mkdir(parents=True, exist_ok=True)
    model_path = output_directory / f"{stem}.joblib"
    metrics_path = output_directory / f"{stem}_metrics.json"
    joblib.dump(model, model_path)
    metrics = result.to_dict()
    # A skipped search has no CV score; JSON represents that honestly as null.
    if math.isnan(metrics["best_cv_macro_f1"]):
        metrics["best_cv_macro_f1"] = None
    metrics_path.write_text(json.dumps(metrics, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    return model_path, metrics_path
