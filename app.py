"""Entrypoint Flask untuk platform hosting dari root repository (Vercel) dan lokal."""

import os
import sys
from pathlib import Path

# Di lingkungan standar atau Vercel, prioritaskan mode leksikal cepat kecuali jika ditentukan lain
os.environ.setdefault("SIGAP_DISABLE_SEMANTIC_SEARCH", "1")

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p in sys.path:
        sys.path.remove(p)
    sys.path.insert(0, p)
sys.path.insert(0, str(ROOT_DIR))

from backend.app import app  # noqa: E402,F401

if __name__ == "__main__":
    from config.settings import SYSTEM_NAME
    from utils.logger import logger
    logger.info(f"Memulai {SYSTEM_NAME} Backend Service di http://127.0.0.1:5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
