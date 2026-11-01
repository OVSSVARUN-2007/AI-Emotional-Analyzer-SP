"""Convenience launcher for Sentio Student Emotional Analyzer.

Ensures PYTHONPATH and working directory are correctly configured
regardless of where the command is invoked from.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Resolve absolute project root directory
PROJECT_ROOT = Path(__file__).resolve().parent

# Ensure project root is at front of sys.path and PYTHONPATH
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

os.environ["PYTHONPATH"] = str(PROJECT_ROOT) + (os.pathsep + os.environ["PYTHONPATH"] if "PYTHONPATH" in os.environ else "")
os.chdir(PROJECT_ROOT)

if __name__ == "__main__":
    import uvicorn

    print(f"🚀 Launching Sentio Academic Emotional Analyzer on http://127.0.0.1:8000")
    print(f"📁 Project Root: {PROJECT_ROOT}")
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(PROJECT_ROOT / "backend")],
    )

