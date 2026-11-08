import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"

backend_app_path = str(BACKEND_DIR / "app")
if backend_app_path not in __path__:
    __path__.append(backend_app_path)

for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)
