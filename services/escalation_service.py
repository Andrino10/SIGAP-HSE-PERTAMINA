import datetime
from utils.text_normalizer import normalisasi_teks

KATA_KUNCI_KRITIS = [
    "kebakaran", "api", "ledakan", "meledak", "jatuh", "terjatuh",
    "sengatan listrik", "tersengat", "keracunan", "tumpahan kimia",
    "runtuh", "roboh", "tertimpa", "tertabrak", "terjepit",
    "kekurangan oksigen", "sesak napas", "luka bakar", "patah tulang",
    "heat stroke", "tidak sadar", "pingsan", "darurat", "emergency",
    "evakuasi", "kebocoran gas", "korsleting", "longsor"
]

CRITICAL_KEYWORDS = KATA_KUNCI_KRITIS

class LayananEskalasi:
    def periksa_eskalasi(self, teks_pertanyaan, konteks, entri_kb=None, tingkat_relevansi=None, langkah_gagal=False, permintaan_langsung=False):
        alasan = []
        perlu_eskalasi = False

        pertanyaan_kecil = normalisasi_teks(teks_pertanyaan)
        pertanyaan_berbatas = f" {pertanyaan_kecil} "

        # 1. Pengecekan kata kunci kritis
        for kw in KATA_KUNCI_KRITIS:
            kw_normal = normalisasi_teks(kw)
            if kw_normal and f" {kw_normal} " in pertanyaan_berbatas:
                perlu_eskalasi = True
                alasan.append(f"Terdeteksi potensi bahaya kritis/keselamatan: '{kw}'")

        # 2. Pengecekan tingkat risiko entri KB
        tingkat_risiko = ""
        if entri_kb:
            tingkat_risiko = (entri_kb.get("tingkat_risiko") or entri_kb.get("risk_level") or "").lower()
        
        if tingkat_risiko == "tinggi":
            perlu_eskalasi = True
            alasan.append("Tingkat risiko dalam Knowledge Base dikategorikan TINGGI")

        # 3. Entri KB tidak ditemukan atau relevansi rendah
        if not entri_kb or tingkat_relevansi in ["rendah", "tidak_ditemukan"]:
            perlu_eskalasi = True
            alasan.append("Kondisi bahaya tidak ditemukan dalam Knowledge Base HSE (Pengalihan Otomatis ke Tim HSE)")

        # 4. Langkah awal gagal
        if langkah_gagal:
            perlu_eskalasi = True
            alasan.append("Tindakan korektif awal belum berhasil mengatasi kondisi bahaya")

        # 5. Permintaan langsung dari pengguna
        permintaan_eksplisit = any(
            f" {normalisasi_teks(frasa)} " in pertanyaan_berbatas
            for frasa in ["eskalasi", "hubungi safety", "butuh hse", "safety officer", "darurat"]
        )
        if permintaan_langsung or permintaan_eksplisit:
            perlu_eskalasi = True
            alasan.append("Pelapor meminta eskalasi langsung ke Tim HSE")

        if not perlu_eskalasi:
            return {
                "needs_escalation": False,
                "escalation_data": None
            }

        categories = (
            konteks.get("categories")
            or konteks.get("kategori_list")
            or [konteks.get("category") or konteks.get("kategori") or "Umum"]
        )
        if isinstance(categories, str):
            categories = [categories]
        data_eskalasi = {
            "reason": " | ".join(alasan),
            "problem_summary": konteks.get("symptoms") or [teks_pertanyaan],
            "category": categories[0],
            "categories": categories,
            "location": konteks.get("location") or konteks.get("lokasi") or "-",
            "steps_tried": konteks.get("steps_tried") or [],
            "urgency": "Tinggi" if any("kritis" in r.lower() or "tinggi" in r.lower() for r in alasan) else "Sedang",
            "timestamp": datetime.datetime.now().isoformat(),
            "target_unit": "Tim HSE / Safety Officer"
        }

        return {
            "needs_escalation": True,
            "escalation_data": data_eskalasi
        }

    def check_escalation(self, query_text, context, kb_entry=None, relevance_level=None, steps_failed=False, explicit_request=False):
        return self.periksa_eskalasi(query_text, context, kb_entry, relevance_level, steps_failed, explicit_request)

layanan_eskalasi = LayananEskalasi()
escalation_service = layanan_eskalasi
