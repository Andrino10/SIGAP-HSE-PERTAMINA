import re

from config.settings import RELEVANCE_HIGH, RELEVANCE_MEDIUM
from repositories.knowledge_repository import knowledge_repo
from utils.text_normalizer import normalisasi_teks


KATA_UMUM = {
    "ada", "agar", "atau", "bagaimana", "bahaya", "dan", "dari", "dengan",
    "di", "ini", "itu", "ke", "kerja", "kondisi", "pada", "pekerja", "saat",
    "serta", "tidak", "untuk", "yang",
}


class LayananPencarian:
    @staticmethod
    def _token_signifikan(teks):
        return {
            token
            for token in normalisasi_teks(teks).split()
            if len(token) > 2 and token not in KATA_UMUM
        }

    @staticmethod
    def _cocok_kategori(kategori_entri, petunjuk_kategori):
        if not petunjuk_kategori:
            return False
        entry = normalisasi_teks(kategori_entri)
        hint = normalisasi_teks(petunjuk_kategori)
        if entry == hint:
            return True

        alias = {
            "apd": "alat pelindung diri apd",
            "ketinggian": "pekerjaan di ketinggian",
            "listrik": "kelistrikan",
            "alat berat": "alat berat kendaraan",
            "kimia b3": "bahan kimia b3",
            "rigging": "pengangkatan rigging",
            "confined space": "ruang terbatas confined space",
            "hot work": "pekerjaan panas hot work",
            "darurat": "tanggap darurat",
            "prosedur": "pengawasan prosedur",
        }
        return any(alias_text in entry and alias_key in hint for alias_key, alias_text in alias.items())

    def _skor_leksikal(self, query, entry):
        query_normal = normalisasi_teks(query)
        padded_query = f" {query_normal} "
        query_tokens = self._token_signifikan(query)
        title = entry.get("judul", "")
        title_tokens = self._token_signifikan(title)

        title_matches = query_tokens & title_tokens
        title_score = len(title_matches) / max(1, len(title_tokens))

        keyword_scores = []
        matched_terms = set(title_matches)
        for keyword in entry.get("kata_kunci", []):
            keyword_normal = normalisasi_teks(keyword)
            keyword_tokens = self._token_signifikan(keyword)
            if keyword_normal and f" {keyword_normal} " in padded_query:
                # Frasa yang ditemukan tetap harus dinilai terhadap keseluruhan
                # laporan. Satu kata umum di dalam laporan panjang tidak boleh
                # memperoleh skor sempurna dan dijadikan dasar referensi artikel.
                query_coverage = len(keyword_tokens & query_tokens) / max(
                    1, len(query_tokens)
                )
                keyword_scores.append(0.5 + (0.5 * query_coverage))
                matched_terms.add(keyword)
            elif keyword_tokens:
                overlap = query_tokens & keyword_tokens
                keyword_scores.append(len(overlap) / len(keyword_tokens))
                matched_terms.update(overlap)

        tag_tokens = self._token_signifikan(" ".join(entry.get("tag", [])))
        if tag_tokens:
            tag_overlap = query_tokens & tag_tokens
            if tag_overlap:
                keyword_scores.append(len(tag_overlap) / len(tag_tokens))
                matched_terms.update(tag_overlap)

        keyword_score = max(keyword_scores, default=0.0)
        return min(1.0, title_score), min(1.0, keyword_score), sorted(matched_terms)

    def cari_informasi(self, query_text, category_hint=None, active_kb_id=None, top_k=3):
        # Seluruh artikel menjadi kandidat. Untuk ratusan artikel, pencarian FAISS tetap
        # sangat ringan dan kategori baru tidak akan terlewat dari shortlist.
        total_entries = len(knowledge_repo.get_all())
        vector_results = knowledge_repo.search_vector(
            query_text,
            top_k=max(total_entries, top_k),
        )

        scored_results = []
        raw_category_hints = category_hint if isinstance(category_hint, list) else [category_hint]
        category_hints = [
            item.strip()
            for item in raw_category_hints
            if isinstance(item, str) and item.strip()
        ]
        normalized_category_hints = [normalisasi_teks(item) for item in category_hints]
        general_hints = {"umum", "umum campuran", "semua"}
        enforce_category = any(
            item and item not in general_hints for item in normalized_category_hints
        )
        for idx, (entry, semantic_score) in enumerate(vector_results):
            title_score, keyword_score, matched_terms = self._skor_leksikal(
                query_text, entry
            )
            normalized_query = normalisasi_teks(query_text)
            normalized_title = normalisasi_teks(entry.get("judul", ""))
            exact_title_match = bool(
                normalized_title
                and f" {normalized_title} " in f" {normalized_query} "
            )
            category_match = any(
                self._cocok_kategori(entry.get("kategori", ""), hint)
                for hint in category_hints
            )
            active_match = bool(active_kb_id and active_kb_id == entry.get("id"))

            hybrid_score = (
                semantic_score * 0.45
                + title_score * 0.30
                + keyword_score * 0.25
                + (0.25 if exact_title_match else 0.0)
                + (0.08 if enforce_category and category_match else 0.0)
                + (0.05 if active_match else 0.0)
            )

            # Jangan menjadikan kemiripan embedding yang lemah sebagai fakta.
            lexical_evidence = max(title_score, keyword_score)
            significant_query_tokens = self._token_signifikan(query_text)
            significant_matched_tokens = self._token_signifikan(
                " ".join(matched_terms)
            )
            matched_token_count = len(
                significant_query_tokens & significant_matched_tokens
            )
            has_sufficient_lexical_support = bool(
                exact_title_match
                or active_match
                or len(significant_query_tokens) <= 3
                or matched_token_count >= 2
            )
            if lexical_evidence < 0.20 or not has_sufficient_lexical_support:
                hybrid_score = min(hybrid_score, RELEVANCE_MEDIUM - 0.01)

            scored_results.append(
                {
                    "entry": entry,
                    "similarity_score": round(float(semantic_score), 4),
                    "hybrid_score": round(min(1.0, max(0.0, hybrid_score)), 4),
                    "title_score": round(title_score, 4),
                    "keyword_score": round(keyword_score, 4),
                    "matched_terms": matched_terms,
                    "exact_title_match": exact_title_match,
                    "is_category_match": category_match,
                    "is_active_match": active_match,
                }
            )

        # Kategori eksplisit adalah batas pencarian. Jika kategori valid tersedia,
        # artikel dari kategori lain tidak boleh menyusup ke jawaban.
        if enforce_category:
            category_results = [r for r in scored_results if r["is_category_match"]]
            if category_results:
                scored_results = category_results

        scored_results.sort(key=lambda result: result["hybrid_score"], reverse=True)

        print("\n=== Pengujian Retrieval (FAISS Embedding) ===")
        for res, score in vector_results[:3]:
            judul = res.get("judul", "Tanpa Judul")
            print(f"[AI TRACE] FAISS Retrieval: '{judul}'")
            print(f"  -> Semantic (FAISS) Score : {float(score):.4f}")

        print("\n=== Pengujian Hybrid Ranking ===")
        for res in scored_results[:3]:
            judul = res["entry"].get("judul", "Tanpa Judul")
            semantic = res["similarity_score"]
            title_score = res["title_score"]
            keyword_score = res["keyword_score"]
            hybrid = res["hybrid_score"]
            print(f"\n[AI TRACE] Sedang mengevaluasi artikel: '{judul}'")
            print(f"  -> Semantic Similarity (45%) : {semantic:.4f}")
            print(f"  -> Title Match Score   (30%) : {title_score:.4f}")
            print(f"  -> Keyword Match Score (25%) : {keyword_score:.4f}")
            print(f"  -> Final Hybrid Score        : {hybrid:.4f}")
        print()

        if not scored_results:
            return {
                "top_entry": None,
                "candidate_entry": None,
                "relevance_level": "tidak_ditemukan",
                "confidence": 0.0,
                "all_matches": [],
                "candidates": [],
            }

        top_match = scored_results[0]
        confidence = top_match["hybrid_score"]
        if confidence >= RELEVANCE_HIGH:
            relevance_level = "tinggi"
        elif confidence >= RELEVANCE_MEDIUM:
            relevance_level = "sedang"
        else:
            relevance_level = "rendah"

        accepted_top = top_match["entry"] if relevance_level != "rendah" else None
        relevant_matches = []
        normalized_query_text = normalisasi_teks(query_text)
        normalized_query = f" {normalized_query_text} "
        multi_condition_signal = (
            any(marker in normalized_query for marker in (" dan ", " serta ", " juga ", " sekaligus "))
            or "," in query_text
            or ";" in query_text
        )
        normalized_top_title = normalisasi_teks(top_match["entry"].get("judul", ""))
        prefixed_titles = {
            f"{hint} {normalized_top_title}".strip()
            for hint in normalized_category_hints
            if hint
        }
        exact_single_report = bool(
            top_match.get("exact_title_match")
            and normalized_query_text
            in ({normalized_top_title} | prefixed_titles)
        )
        if exact_single_report:
            multi_condition_signal = False
        if accepted_top:
            if not multi_condition_signal:
                relevant_matches.append(top_match)
            else:
                clauses = [
                    clause.strip()
                    for clause in re.split(
                        r"\b(?:dan|serta|juga|sekaligus)\b|[,;]",
                        query_text,
                        flags=re.IGNORECASE,
                    )
                    if clause.strip()
                ]
                for clause in clauses:
                    clause_candidates = []
                    for result in scored_results:
                        title_score, keyword_score, matched_terms = self._skor_leksikal(
                            clause, result["entry"]
                        )
                        clause_evidence = max(title_score, keyword_score)
                        clause_score = title_score * 0.35 + keyword_score * 0.65
                        clause_candidates.append(
                            (clause_score, clause_evidence, result, matched_terms)
                        )
                    clause_candidates.sort(key=lambda item: item[0], reverse=True)
                    if not clause_candidates:
                        continue
                    clause_score, clause_evidence, result, matched_terms = clause_candidates[0]
                    if clause_evidence < 0.65 or clause_score < 0.55:
                        continue
                    if any(
                        existing["entry"]["id"] == result["entry"]["id"]
                        for existing in relevant_matches
                    ):
                        continue
                    selected = dict(result)
                    selected["matched_terms"] = matched_terms
                    selected["matched_clause"] = clause
                    relevant_matches.append(selected)
                    if len(relevant_matches) >= max(1, top_k):
                        break

                if not relevant_matches:
                    relevant_matches.append(top_match)

        return {
            "top_entry": accepted_top,
            "candidate_entry": top_match["entry"],
            "relevance_level": relevance_level,
            "confidence": confidence,
            "all_matches": relevant_matches,
            "candidates": scored_results[: max(1, top_k)],
        }

    def retrieve(self, query_text, category_hint=None, active_kb_id=None, top_k=3):
        return self.cari_informasi(query_text, category_hint, active_kb_id, top_k)


layanan_pencarian = LayananPencarian()
retrieval_service = layanan_pencarian
