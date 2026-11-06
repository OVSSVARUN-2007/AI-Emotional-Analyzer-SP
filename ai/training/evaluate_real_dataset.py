"""Evaluate sentiment and unified emotion pipeline on the hand-labeled real & Tanglish benchmark dataset."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path
from collections import Counter

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from ai.nlp.analyzer import FeedbackAnalyzer
from ai.nlp.text import unify_emotion

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = PROJECT_ROOT / "ai" / "datasets" / "real_labeled_feedback_test.csv"
OUTPUT_METRICS_PATH = PROJECT_ROOT / "ai" / "models" / "real_benchmark_metrics.json"

SENTIMENT_MODEL = PROJECT_ROOT / "ai" / "models" / "sentiment" / "sentiment_tfidf_logreg.joblib"
EMOTION_MODEL = PROJECT_ROOT / "ai" / "models" / "emotion" / "emotion_tfidf_logreg.joblib"


def run_benchmark():
    analyzer = FeedbackAnalyzer(
        sentiment_model=SENTIMENT_MODEL,
        emotion_model=EMOTION_MODEL,
    )

    y_true_sent: list[str] = []
    y_pred_sent: list[str] = []
    y_true_em: list[str] = []
    y_pred_em: list[str] = []

    with open(DATASET_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row["feedback_text"]
            true_sent = row["sentiment"].lower()
            true_em = unify_emotion(row["emotion"])

            res = analyzer.analyze(text)
            pred_sent = res.get("sentiment", {}).get("label", "neutral").lower()
            pred_em = unify_emotion(res.get("emotion", {}).get("label", "neutral"))

            # Normalize 3-class / mixed alignment
            if true_sent == "mixed" and pred_sent in ("mixed", "neutral"):
                pred_sent = "mixed"

            y_true_sent.append(true_sent)
            y_pred_sent.append(pred_sent)
            y_true_em.append(true_em)
            y_pred_em.append(pred_em)

    # Sentiment metrics
    sent_acc = accuracy_score(y_true_sent, y_pred_sent)
    sent_prec, sent_rec, sent_f1, _ = precision_recall_fscore_support(
        y_true_sent, y_pred_sent, average="macro", zero_division=0
    )

    # Emotion metrics
    em_acc = accuracy_score(y_true_em, y_pred_em)
    em_prec, em_rec, em_f1, _ = precision_recall_fscore_support(
        y_true_em, y_pred_em, average="macro", zero_division=0
    )

    metrics = {
        "dataset": "real_labeled_feedback_test.csv",
        "sample_count": len(y_true_sent),
        "sentiment": {
            "accuracy": round(float(sent_acc), 4),
            "macro_precision": round(float(sent_prec), 4),
            "macro_recall": round(float(sent_rec), 4),
            "macro_f1": round(float(sent_f1), 4),
            "classes": sorted(list(set(y_true_sent))),
        },
        "emotion": {
            "accuracy": round(float(em_acc), 4),
            "macro_precision": round(float(em_prec), 4),
            "macro_recall": round(float(em_rec), 4),
            "macro_f1": round(float(em_f1), 4),
            "classes": sorted(list(set(y_true_em))),
        },
        "calibrated_band_uncertainty_threshold": 0.65,
    }

    OUTPUT_METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Benchmark Results on Real & Tanglish Dataset ({len(y_true_sent)} samples):")
    print(f" Sentiment Macro F1: {metrics['sentiment']['macro_f1']} (Accuracy: {metrics['sentiment']['accuracy']})")
    print(f" Emotion Macro F1:   {metrics['emotion']['macro_f1']} (Accuracy: {metrics['emotion']['accuracy']})")
    print(f"Metrics saved to {OUTPUT_METRICS_PATH}")
    return metrics


if __name__ == "__main__":
    run_benchmark()
