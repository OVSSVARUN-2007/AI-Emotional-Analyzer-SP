"""Train and save the final student-feedback sentiment model."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

AI_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_DIR))

from nlp.training import save_model, train_classifier



def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=AI_DIR / "datasets" / "processed")
    parser.add_argument("--output-dir", type=Path, default=AI_DIR / "models" / "sentiment")
    parser.add_argument("--skip-tuning", action="store_true")
    args = parser.parse_args()
    splits = {name: pd.read_csv(args.data_dir / f"sentiment_{name}.csv") for name in ("train", "validation", "test")}
    model, result = train_classifier(**splits, tune=not args.skip_tuning)
    model_path, metrics_path = save_model(model, result, args.output_dir, "sentiment_tfidf_logreg")
    print(f"Saved model: {model_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Validation macro F1: {result.validation_macro_f1:.3f}")
    print(f"Test macro F1: {result.test_macro_f1:.3f}")


if __name__ == "__main__":
    main()
