"""Train a six-class emotion model from the local emotion dataset."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

AI_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_DIR))

from nlp.training import EMOTION_LABELS, RANDOM_STATE, save_model, train_classifier


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-path", type=Path, default=AI_DIR / "datasets" / "emotions.csv")
    parser.add_argument("--output-dir", type=Path, default=AI_DIR / "models" / "emotion")
    parser.add_argument("--skip-tuning", action="store_true", help="recommended for the large emotion dataset")
    parser.add_argument("--max-rows", type=int, default=60_000, help="stratified cap for memory-safe local training; use 0 for all rows")
    args = parser.parse_args()

    raw = pd.read_csv(args.data_path)
    if set(raw.columns) != {"text", "label"}:
        raise ValueError("emotion data must contain exactly 'text' and 'label' columns")
    raw = raw.rename(columns={"text": "feedback_text"})
    raw["emotion"] = raw["label"].map(dict(enumerate(EMOTION_LABELS)))
    if raw["emotion"].isna().any():
        raise ValueError("found an emotion label outside 0-5")
    if args.max_rows and len(raw) > args.max_rows:
        raw, _ = train_test_split(raw, train_size=args.max_rows, random_state=RANDOM_STATE, stratify=raw["emotion"])
    train, holdout = train_test_split(raw, test_size=0.20, random_state=RANDOM_STATE, stratify=raw["emotion"])
    validation, test = train_test_split(holdout, test_size=0.50, random_state=RANDOM_STATE, stratify=holdout["emotion"])
    model, result = train_classifier(train, validation, test, label_column="emotion", tune=not args.skip_tuning)
    model_path, metrics_path = save_model(model, result, args.output_dir, "emotion_tfidf_logreg")
    print(f"Saved model: {model_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Validation macro F1: {result.validation_macro_f1:.3f}")
    print(f"Test macro F1: {result.test_macro_f1:.3f}")


if __name__ == "__main__":
    main()
