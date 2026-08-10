import json
import os
import re
import threading
from collections import Counter
from datetime import datetime, timezone


SEMANTIC_SEARCH_DISABLED = os.getenv(
    "SIGAP_DISABLE_SEMANTIC_SEARCH", ""
).strip().lower() in {"1", "true", "yes", "on"} or bool(os.getenv("VERCEL"))

faiss = None
np = None
SentenceTransformer = None
SEMANTIC_IMPORT_ERROR = None

if SEMANTIC_SEARCH_DISABLED:
    SEMANTIC_IMPORT_ERROR = "Semantic search dinonaktifkan melalui konfigurasi."
else:
    try:
        import faiss
        import numpy as np
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        # Deployment serverless memakai pencarian leksikal agar bundle tidak
        # membawa PyTorch, Transformers, SciPy, dan model embedding berukuran GB.
        SEMANTIC_IMPORT_ERROR = str(exc)

from config.settings import EMBEDDING_MODEL_NAME, KNOWLEDGE_JSON_PATH
from utils.text_normalizer import normalisasi_teks


FIELD_WAJIB = (
    "id",
    "kategori",
    "judul",
    "kata_kunci",
    "tingkat_risiko",
    "penjelasan_risiko",
    "solusi",
    "referensi",
    "tag",
)
TINGKAT_RISIKO_VALID = {"rendah", "sedang", "tinggi"}
POLA_ID = re.compile(r"^HSE-[A-Z0-9]+-\d{3}$")
FRAGMEN_TINDAKAN_SEGERA_GENERIK = (
    "hentikan pekerjaan sementara jika berisiko tinggi",
    "kendalikan paparan yang sedang berlangsung",
)


def tindakan_segera_spesifik(solution):
    lines = str(solution).splitlines()
    if not lines:
        return False
    first_line = lines[0].strip()
    return (
        first_line.startswith("1. Tindakan Segera: ")
        and not any(
            fragment in first_line.casefold()
            for fragment in FRAGMEN_TINDAKAN_SEGERA_GENERIK
        )
    )


class KnowledgeRepository:
    """Sumber tunggal data HSE yang selalu dibaca dari ``knowledge.json``.

    Versi terakhir yang valid tetap digunakan jika file sedang diedit tetapi belum
    valid. Setelah file disimpan dengan struktur yang benar, indeks akan dimuat
    ulang otomatis pada request berikutnya tanpa perlu me-restart backend.
    """

    def __init__(self):
        self.entries = []
        self.docs = []
        self.embed_model = None
        self.index = None
        self._doc_embeddings = None
        self._lock = threading.RLock()
        self._last_mtime_ns = None
        self._loaded_at = None
        self._validation_error = None
        self._semantic_error = None
        self._reload(force=True, fail_hard=True)

    @staticmethod
    def _validate_entries(raw_entries):
        if not isinstance(raw_entries, list):
            raise ValueError("Akar knowledge.json wajib berupa array JSON.")
        if not raw_entries:
            raise ValueError("knowledge.json belum memiliki artikel.")

        errors = []
        seen_ids = set()
        cleaned_entries = []

        for position, raw_entry in enumerate(raw_entries, start=1):
            if not isinstance(raw_entry, dict):
                errors.append(f"Artikel #{position} wajib berupa object JSON.")
                continue

            entry = dict(raw_entry)
            missing = []
            for field in FIELD_WAJIB:
                value = entry.get(field)
                if value is None or (isinstance(value, str) and not value.strip()):
                    missing.append(field)
                elif field in {"kata_kunci", "tag"} and (
                    not isinstance(value, list) or not value
                ):
                    missing.append(f"{field} (wajib berupa array yang tidak kosong)")

            if missing:
                errors.append(
                    f"Artikel #{position} ({entry.get('id', 'tanpa ID')}) tidak lengkap: "
                    + ", ".join(missing)
                )
                continue

            kb_id = str(entry["id"]).strip()
            if kb_id in seen_ids:
                errors.append(f"ID duplikat: {kb_id}.")
                continue
            seen_ids.add(kb_id)

            if not POLA_ID.fullmatch(kb_id):
                errors.append(
                    f"Artikel {kb_id} memiliki format ID tidak valid; gunakan HSE-KATEGORI-001."
                )
                continue

            risk_level = str(entry["tingkat_risiko"]).strip().lower()
            if risk_level not in TINGKAT_RISIKO_VALID:
                errors.append(
                    f"Artikel {kb_id} memiliki tingkat_risiko tidak valid: "
                    f"'{entry['tingkat_risiko']}'."
                )
                continue

            if len(str(entry["penjelasan_risiko"]).strip()) < 500:
                errors.append(
                    f"Artikel {kb_id} memiliki penjelasan_risiko terlalu singkat."
                )
                continue
            if len(entry["kata_kunci"]) < 3 or len(entry["tag"]) < 2:
                errors.append(
                    f"Artikel {kb_id} wajib memiliki minimal 3 kata_kunci dan 2 tag."
                )
                continue

            references = entry["referensi"]
            if not isinstance(references, list) or len(references) < 2 or any(
                not isinstance(reference, dict)
                or not str(reference.get("judul", "")).strip()
                or not str(reference.get("url", "")).strip().startswith("https://")
                for reference in references
            ):
                errors.append(
                    f"Artikel {kb_id} wajib memiliki minimal 2 referensi resmi "
                    "dengan judul dan URL HTTPS."
                )
                continue

            solution_lines = str(entry["solusi"]).splitlines()
            if len(solution_lines) < 3 or any(
                not line.strip().startswith(f"{number}.")
                for number, line in enumerate(solution_lines, start=1)
            ):
                errors.append(
                    f"Artikel {kb_id} wajib memiliki minimal 3 langkah solusi bernomor urut."
                )
                continue
            if not tindakan_segera_spesifik(entry["solusi"]):
                errors.append(
                    f"Artikel {kb_id} wajib memiliki tindakan segera yang spesifik "
                    "terhadap kondisi bahaya."
                )
                continue

            entry["id"] = kb_id
            entry["kategori"] = str(entry["kategori"]).strip()
            entry["judul"] = str(entry["judul"]).strip()
            entry["tingkat_risiko"] = risk_level
            entry["penjelasan_risiko"] = str(entry["penjelasan_risiko"]).strip()
            entry["solusi"] = str(entry["solusi"]).strip()
            entry["kata_kunci"] = list(
                dict.fromkeys(str(value).strip() for value in entry["kata_kunci"] if str(value).strip())
            )
            entry["tag"] = list(
                dict.fromkeys(str(value).strip() for value in entry["tag"] if str(value).strip())
            )
            entry["referensi"] = [
                {
                    "judul": str(reference["judul"]).strip(),
                    "url": str(reference["url"]).strip(),
                }
                for reference in references
            ]
            cleaned_entries.append(entry)

        if errors:
            preview = " ".join(errors[:10])
            if len(errors) > 10:
                preview += f" Dan {len(errors) - 10} kesalahan lainnya."
            raise ValueError(preview)

        return cleaned_entries

    @staticmethod
    def _make_document(entry):
        title = entry["judul"]
        category = entry["kategori"]
        keywords = " ".join(entry["kata_kunci"])
        tags = " ".join(entry["tag"])
        explanation = entry["penjelasan_risiko"]
        # Judul dan kata kunci diberi bobot tekstual lebih besar daripada uraian.
        return f"{title} {title} {category} {keywords} {keywords} {tags} {explanation}".strip()

    def _build_semantic_index(self, docs):
        if SentenceTransformer is None or faiss is None or np is None:
            self._semantic_error = SEMANTIC_IMPORT_ERROR or (
                "Dependensi semantic search tidak tersedia."
            )
            print(
                "[KnowledgeRepository] Memakai pencarian leksikal: "
                + self._semantic_error
            )
            return None, None

        try:
            if self.embed_model is None:
                print(
                    f"[KnowledgeRepository] Memuat embedding model "
                    f"'{EMBEDDING_MODEL_NAME}'..."
                )
                self.embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

            embeddings = self.embed_model.encode(
                docs,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            embeddings = np.asarray(embeddings, dtype=np.float32)
            index = faiss.IndexFlatIP(embeddings.shape[1])
            index.add(embeddings)
            self._semantic_error = None
            return index, embeddings
        except Exception as exc:
            # Pencarian leksikal tetap membuat KB dapat digunakan saat model
            # embedding belum tersedia di lingkungan deployment.
            self._semantic_error = str(exc)
            print(f"[KnowledgeRepository] Embedding tidak tersedia, memakai pencarian leksikal: {exc}")
            return None, None

    def _reload(self, force=False, fail_hard=False):
        with self._lock:
            if not os.path.exists(KNOWLEDGE_JSON_PATH):
                error = FileNotFoundError(
                    f"Knowledge file tidak ditemukan: {KNOWLEDGE_JSON_PATH}"
                )
                if fail_hard or not self.entries:
                    raise error
                self._validation_error = str(error)
                return False

            current_mtime = os.stat(KNOWLEDGE_JSON_PATH).st_mtime_ns
            if not force and current_mtime == self._last_mtime_ns:
                return False

            try:
                with open(KNOWLEDGE_JSON_PATH, "r", encoding="utf-8") as file:
                    raw_entries = json.load(file)
                entries = self._validate_entries(raw_entries)
                docs = [self._make_document(entry) for entry in entries]
                index, embeddings = self._build_semantic_index(docs)
            except (OSError, json.JSONDecodeError, ValueError) as exc:
                self._validation_error = str(exc)
                if fail_hard or not self.entries:
                    raise
                print(
                    "[KnowledgeRepository] Perubahan knowledge.json belum valid; "
                    "versi valid terakhir tetap digunakan: " + str(exc)
                )
                return False

            self.entries = entries
            self.docs = docs
            self.index = index
            self._doc_embeddings = embeddings
            self._last_mtime_ns = current_mtime
            self._loaded_at = datetime.now(timezone.utc).isoformat()
            self._validation_error = None
            print(
                f"[KnowledgeRepository] {len(entries)} artikel HSE valid dimuat "
                "dari knowledge.json."
            )
            return True

    def ensure_fresh(self):
        self._reload()

    def get_all(self):
        self.ensure_fresh()
        return self.entries

    def get_by_id(self, kb_id):
        self.ensure_fresh()
        normalized_id = str(kb_id or "").strip().lower()
        for entry in self.entries:
            if entry["id"].lower() == normalized_id:
                return entry
        return None

    def get_categories(self):
        self.ensure_fresh()
        counts = Counter(entry["kategori"] for entry in self.entries)
        return [
            {"nama": category, "jumlah": counts[category]}
            for category in sorted(counts, key=str.casefold)
        ]

    def get_metadata(self):
        self.ensure_fresh()
        category_counts = Counter(entry["kategori"] for entry in self.entries)
        risk_counts = Counter(entry["tingkat_risiko"] for entry in self.entries)
        return {
            "source": os.path.basename(KNOWLEDGE_JSON_PATH),
            "schema_version": 3,
            "total": len(self.entries),
            "total_categories": len(category_counts),
            "categories": [
                {"nama": category, "jumlah": category_counts[category]}
                for category in sorted(category_counts, key=str.casefold)
            ],
            "risk_summary": {
                risk: risk_counts.get(risk, 0)
                for risk in ("tinggi", "sedang", "rendah")
            },
            "loaded_at": self._loaded_at,
            "valid": self._validation_error is None,
            "validation_error": self._validation_error,
            "semantic_search_ready": self.index is not None,
            "semantic_error": self._semantic_error,
            "quality_checks": {
                "unique_ids": len({entry["id"] for entry in self.entries}) == len(self.entries),
                "required_fields_complete": True,
                "minimum_three_step_solutions_complete": all(
                    len(entry["solusi"].splitlines()) >= 3 for entry in self.entries
                ),
                "article_specific_immediate_actions_complete": all(
                    tindakan_segera_spesifik(entry["solusi"])
                    for entry in self.entries
                ),
                "minimum_20_articles_per_category": all(
                    count >= 20 for count in category_counts.values()
                ),
                "detailed_risk_explanations_complete": all(
                    len(entry["penjelasan_risiko"]) >= 500 for entry in self.entries
                ),
                "official_references_complete": all(
                    len(entry["referensi"]) >= 2
                    and all(
                        reference["url"].startswith("https://")
                        for reference in entry["referensi"]
                    )
                    for entry in self.entries
                ),
                "minimum_keywords_and_tags_complete": all(
                    len(entry["kata_kunci"]) >= 3 and len(entry["tag"]) >= 2
                    for entry in self.entries
                ),
            },
            "review_notice": (
                "Validasi sistem memeriksa struktur dan konsistensi data. "
                "Perubahan substansi teknis tetap memerlukan tinjauan personel HSE berwenang."
            ),
        }

    @staticmethod
    def _lexical_candidate_score(query_text, document):
        query_tokens = set(normalisasi_teks(query_text).split())
        document_tokens = set(normalisasi_teks(document).split())
        if not query_tokens:
            return 0.0
        return len(query_tokens & document_tokens) / len(query_tokens)

    def search_vector(self, query_text, top_k=3):
        """Mengembalikan kandidat dan skor semantic cosine/IP (0..1)."""
        self.ensure_fresh()
        with self._lock:
            if not self.entries:
                return []

            candidate_count = min(max(int(top_k), 1), len(self.entries))
            if self.index is None or self.embed_model is None:
                scored = [
                    (entry, self._lexical_candidate_score(query_text, document))
                    for entry, document in zip(self.entries, self.docs)
                ]
                scored.sort(key=lambda item: item[1], reverse=True)
                return scored[:candidate_count]

            query_vec = self.embed_model.encode(
                [query_text],
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            similarities, indices = self.index.search(
                np.asarray(query_vec, dtype=np.float32),
                k=candidate_count,
            )

            results = []
            for idx, similarity in zip(indices[0], similarities[0]):
                if 0 <= idx < len(self.entries):
                    # Cosine similarity dapat bernilai negatif; confidence API dibuat 0..1.
                    results.append((self.entries[idx], max(0.0, min(1.0, float(similarity)))))
            return results


# Singleton yang digunakan oleh API, retrieval, dan direktori frontend.
knowledge_repo = KnowledgeRepository()
