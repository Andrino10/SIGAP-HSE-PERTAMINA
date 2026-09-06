"""Entrypoint Flask untuk platform hosting dari root repository (Vercel) dan lokal."""

import os
import sys
from pathlib import Path

# Di lingkungan standar atau Vercel, prioritaskan mode leksikal cepat kecuali jika ditentukan lain
os.environ.setdefault("SIGAP_DISABLE_SEMANTIC_SEARCH", "1")

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
backend_path = str(BACKEND_DIR)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.app import app  # noqa: E402,F401

if __name__ == "__main__":
    from config.settings import SYSTEM_NAME
    from utils.logger import logger
    logger.info(f"Memulai {SYSTEM_NAME} Backend Service di http://127.0.0.1:5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
