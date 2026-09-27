"""Clean raw student feedback and create deterministic sentiment splits."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

AI_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_DIR))

from nlp.text import normalize_text
from nlp.training import RANDOM_STATE, SENTIMENT_LABELS


def preprocess(raw_path: Path, output_dir: Path) -> dict[str, int]:
    """Validate, clean, deduplicate, and write 80/10/10 stratified splits."""
    raw = pd.read_csv(raw_path)
    required = {"feedback_text", "sentiment"}
    if not required.issubset(raw.columns):
        raise ValueError(f"expected columns {sorted(required)}, got {raw.columns.tolist()}")

    frame = raw.loc[:, ["feedback_text", "sentiment"]].dropna().copy()
    frame["feedback_text"] = frame["feedback_text"].map(normalize_text)
    frame["sentiment"] = frame["sentiment"].astype(str).str.strip().str.lower()
    frame = frame.loc[frame["feedback_text"].ne("") & frame["sentiment"].isin(SENTIMENT_LABELS)]
    frame = frame.drop_duplicates(subset=["feedback_text", "sentiment"]).reset_index(drop=True)
    if set(frame["sentiment"].unique()) != set(SENTIMENT_LABELS):
        raise ValueError(f"expected labels {list(SENTIMENT_LABELS)}, got {sorted(frame['sentiment'].unique())}")

    train, holdout = train_test_split(frame, test_size=0.20, random_state=RANDOM_STATE, stratify=frame["sentiment"])
    validation, test = train_test_split(holdout, test_size=0.50, random_state=RANDOM_STATE, stratify=holdout["sentiment"])
    output_dir.mkdir(parents=True, exist_ok=True)
    frame.to_csv(output_dir / "sentiment_clean.csv", index=False)
    splits = {"train": train, "validation": validation, "test": test}
    for name, split in splits.items():
        split.sort_index().to_csv(output_dir / f"sentiment_{name}.csv", index=False)
    manifest = {
        "random_state": RANDOM_STATE,
        "source_file": str(raw_path),
        "labels": list(SENTIMENT_LABELS),
        "split_rows": {name: len(split) for name, split in splits.items()},
        "cleaning": "HTML unescape, Unicode normalization, lowercase, whitespace normalization, and exact text-label deduplication.",
    }
    (output_dir / "sentiment_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return {name: len(split) for name, split in splits.items()}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-path", type=Path, default=AI_DIR / "datasets" / "student_feedback_sentiment_dataset.csv")
    parser.add_argument("--output-dir", type=Path, default=AI_DIR / "datasets" / "processed")
    args = parser.parse_args()
    print(preprocess(args.raw_path, args.output_dir))


if __name__ == "__main__":
    main()
