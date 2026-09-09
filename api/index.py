"""Entrypoint Vercel Serverless Function untuk API Flask SIGAP-HSSE."""

import os
import sys
from pathlib import Path

# Nonaktifkan semantic search berat (PyTorch / SentenceTransformer) di lingkungan serverless
os.environ.setdefault("SIGAP_DISABLE_SEMANTIC_SEARCH", "1")

# Backend harus diprioritaskan di sys.path. Root repository juga memiliki
# salinan kompatibilitas lama (`routes/`, `services/`, dll.); jika root berada
# di depan, Vercel dapat memuat salinan tersebut dan melewatkan perbaikan
# storage/tiket yang ada di `backend/`.
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p in sys.path:
        sys.path.remove(p)
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from app import app  # noqa: E402, F401
