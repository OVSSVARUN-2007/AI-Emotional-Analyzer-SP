"""Sentio Backend Launcher.

Starts the FastAPI server with hot-reload enabled.
Can be executed from anywhere within the repository.

Usage:
    python run_backend.py
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = REPO_ROOT / "backend"

for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("🚀 Starting Sentio AI Emotional Analyzer Backend")
    print("   URL: http://127.0.0.1:8000")
    print("   Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)

    uvicorn.run(
        "backend.app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
