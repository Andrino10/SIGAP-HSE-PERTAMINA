"""Entrypoint Vercel Serverless Function untuk API Flask SIGAP-HSSE."""

import os
import sys
from pathlib import Path

# Nonaktifkan semantic search berat (PyTorch / SentenceTransformer) di lingkungan serverless
os.environ.setdefault("SIGAP_DISABLE_SEMANTIC_SEARCH", "1")

# Pastikan root direktori dan backend terdaftar di sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p in sys.path:
        sys.path.remove(p)
    sys.path.insert(0, p)
sys.path.insert(0, str(ROOT_DIR))

from backend.app import app  # noqa: E402, F401
