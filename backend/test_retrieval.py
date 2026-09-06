"""
╔══════════════════════════════════════════════════════════╗
║   SIGAP-HSE — Skrip Pengujian Retrieval & Hybrid Ranking ║
║   Jalankan dari folder backend/:                         ║
║     python test_retrieval.py                             ║
╚══════════════════════════════════════════════════════════╝
"""
import sys
import os
from pathlib import Path

# ── Pastikan folder backend/ ada di sys.path ─────────────
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Reconfigure stdout agar emoji & karakter unicode tampil di Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass

# ── Import service ────────────────────────────────────────
from services.retrieval_service import retrieval_service  # noqa

# ══════════════════════════════════════════════════════════
# DAFTAR QUERY UJI — bisa tambah/ganti sesuai kebutuhan
# ══════════════════════════════════════════════════════════
QUERIES_UJI = [
    "Pekerja bekerja tanpa APD di area berbahaya",
    "Tidak tersedia alat pemadam api di area produksi",
    "Pekerja menggunakan alat tanpa manual kerja yang jelas",
    "Scaffolding tanpa handrail di ketinggian",
    "Tumpahan bahan kimia B3 di area kerja",
]

SEPARATOR = "═" * 65


def cetak_header(judul: str):
    print(f"\n{SEPARATOR}")
    print(f"  {judul}")
    print(SEPARATOR)


def jalankan_pengujian(query: str, nomor: int):
    print(f"\n{'─'*65}")
    print(f"  QUERY #{nomor}: \"{query}\"")
    print(f"{'─'*65}")

    # Panggil retrieve — [AI TRACE] akan otomatis tercetak oleh retrieval_service
    hasil = retrieval_service.retrieve(query, top_k=5)

    # ── Tampilkan top_entry secara eksplisit ──────────────
    top = hasil.get("top_entry")
    confidence = hasil.get("confidence", 0)
    relevance = hasil.get("relevance_level", "-")

    print(f"\n  📌 HASIL AKHIR:")
    print(f"     Top Entry  : {top.get('judul', 'Tidak ditemukan') if top else '❌ Tidak ada entry relevan'}")
    print(f"     Confidence : {confidence:.4f}")
    print(f"     Relevansi  : {relevance.upper()}")

    # ── Tampilkan semua kandidat ──────────────────────────
    candidates = hasil.get("candidates", [])
    if candidates:
        print(f"\n  📊 SEMUA KANDIDAT (Top {len(candidates)}):")
        for i, c in enumerate(candidates, 1):
            judul = c["entry"].get("judul", "?")
            sem = c["similarity_score"]
            tit = c["title_score"]
            kw  = c["keyword_score"]
            hyb = c["hybrid_score"]
            print(f"     [{i}] {judul}")
            print(f"         Semantic={sem:.4f} | Title={tit:.4f} | Keyword={kw:.4f} | Hybrid={hyb:.4f}")


def main():
    print("\n")
    print("  ███████╗██╗ ██████╗  █████╗ ██████╗ ")
    print("  ██╔════╝██║██╔════╝ ██╔══██╗██╔══██╗")
    print("  ███████╗██║██║  ███╗███████║██████╔╝")
    print("  ╚════██║██║██║   ██║██╔══██║██╔═══╝ ")
    print("  ███████║██║╚██████╔╝██║  ██║██║     ")
    print("  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ")
    print("\n  🔬 Pengujian Sistem Retrieval & Hybrid Ranking")
    print(f"  📂 Backend Dir: {BACKEND_DIR}")

    cetak_header("KONFIGURASI BOBOT HYBRID RANKING")
    print("  • Semantic Similarity (FAISS)  : 45%")
    print("  • Title Match Score            : 30%")
    print("  • Keyword Match Score          : 25%")
    print("  • Bonus: Exact Title Match     : +25%")
    print("  • Bonus: Category Match        : +8%")
    print("  • Bonus: Active KB Match       : +5%")

    cetak_header(f"MEMULAI PENGUJIAN — {len(QUERIES_UJI)} Query")

    for i, query in enumerate(QUERIES_UJI, 1):
        jalankan_pengujian(query, i)

    cetak_header("PENGUJIAN SELESAI ✅")
    print("  Log [AI TRACE] di atas merupakan bukti kerja mekanisme:")
    print("  1) FAISS Embedding Retrieval (Semantic)")
    print("  2) Hybrid Ranking (Semantic + Title + Keyword)")
    print()


if __name__ == "__main__":
    main()
