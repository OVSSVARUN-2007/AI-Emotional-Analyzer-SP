"""Fallback runner if user runs python run.py inside frontend directory."""

from pathlib import Path

ROOT_RUN = Path(__file__).resolve().parents[1] / "run.py"

if ROOT_RUN.exists():
    with open(ROOT_RUN, "r", encoding="utf-8") as f:
        exec(f.read(), {"__name__": "__main__", "__file__": str(ROOT_RUN)})
else:
    print(f"Error: Could not locate {ROOT_RUN}")
