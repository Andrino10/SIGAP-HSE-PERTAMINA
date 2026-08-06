"""Penyusun jawaban deterministik berbasis Knowledge Base HSE.

Modul ini tidak mengarang prosedur. Kondisi, risiko, dan solusi utama diambil
langsung dari artikel ``knowledge.json`` yang lolos ambang relevansi.
"""

from config.settings import dapatkan_petugas_per_kategori


URUTAN_RISIKO = {"rendah": 1, "sedang": 2, "tinggi": 3}


class LayananAI:
    @staticmethod
    def _daftar_entri(entri_teratas, hasil_pencarian):
        matches = (hasil_pencarian or {}).get("all_matches") or []
        entries = []
        for match in matches:
            entry = match.get("entry")
            if entry and all(existing.get("id") != entry.get("id") for existing in entries):
                entries.append(entry)
        if not entries and entri_teratas:
            entries.append(entri_teratas)
        return entries

    @staticmethod
    def _risiko_tertinggi(entries):
        if not entries:
            return None
        return max(
            (entry.get("tingkat_risiko", "sedang").lower() for entry in entries),
            key=lambda value: URUTAN_RISIKO.get(value, 0),
        )

    def buat_jawaban(
        self,
        pesan_pengguna,
        entri_teratas,
        tingkat_relevansi,
        konteks,
        hasil_eskalasi=None,
        hasil_pencarian=None,
    ):
        lines = []
        entries = self._daftar_entri(entri_teratas, hasil_pencarian)
        kb_matched = bool(
            entri_teratas
            and entries
            and tingkat_relevansi in {"tinggi", "sedang"}
        )
        category = (
            entri_teratas.get("kategori")
            if entri_teratas
            else konteks.get("category") or konteks.get("kategori") or "Umum"
        )
        officer = dapatkan_petugas_per_kategori(category)

        lines.append("KONDISI TERIDENTIFIKASI")
        if kb_matched and len(entries) == 1:
            entry = entries[0]
            lines.append(
                f"{entry['judul']} [Kategori: {entry['kategori']}] "
                f"[Kode KB: {entry['id']}]."
            )
        elif kb_matched:
            lines.append(
                f"Ditemukan {len(entries)} kondisi yang disebutkan secara cukup jelas "
                "dalam laporan:"
            )
            for number, entry in enumerate(entries, start=1):
                lines.append(
                    f"• Kondisi #{number}: {entry['judul']} "
                    f"[Kategori: {entry['kategori']}] [Kode KB: {entry['id']}]"
                )
        else:
            lines.append(
                f"Laporan diterima: '{pesan_pengguna}'. Belum ada artikel knowledge.json "
                "yang mencapai tingkat kecocokan minimum untuk menetapkan kondisi secara pasti."
            )
        lines.append("")

        lines.append("TINGKAT RISIKO")
        highest_risk = self._risiko_tertinggi(entries) if kb_matched else None
        if highest_risk == "tinggi":
            lines.append(
                "RISIKO TINGGI — hentikan aktivitas bila terdapat paparan langsung atau "
                "bahaya segera, amankan area, dan minta verifikasi Tim HSE."
            )
        elif highest_risk == "sedang":
            lines.append(
                "RISIKO SEDANG — lakukan tindakan korektif dan verifikasi pengawas sebelum "
                "aktivitas dilanjutkan."
            )
        elif highest_risk == "rendah":
            lines.append(
                "RISIKO RENDAH — tetap lakukan koreksi, pemantauan, dan pencatatan temuan."
            )
        else:
            lines.append(
                "BELUM DAPAT DIPASTIKAN — tingkat risiko harus diverifikasi dari kondisi "
                "aktual, lokasi, paparan, dan pekerja yang terdampak."
            )
        lines.append("")

        lines.append("PENJELASAN RISIKO")
        if kb_matched:
            for number, entry in enumerate(entries, start=1):
                prefix = f"Kondisi #{number}: " if len(entries) > 1 else ""
                lines.append(prefix + entry["penjelasan_risiko"])
            if len(entries) > 1:
                lines.append(
                    "Seluruh kondisi di atas perlu dikendalikan bersamaan; prioritas tindakan "
                    "mengikuti tingkat risiko tertinggi."
                )
        else:
            lines.append(
                "Sistem tidak menggunakan kandidat artikel yang lemah sebagai dasar analisis. "
                "Lengkapi jenis bahaya, aktivitas, lokasi, kondisi peralatan/APD, dan dampak "
                "yang sudah terlihat agar pencocokan berikutnya lebih tepat."
            )
        lines.append("")

        lines.append("SOLUSI & TINDAKAN")
        if kb_matched:
            for number, entry in enumerate(entries, start=1):
                if len(entries) > 1:
                    lines.append(f"--- Kondisi #{number}: {entry['judul']} ---")
                solution_lines = [
                    line.strip()
                    for line in entry["solusi"].splitlines()
                    if line.strip()
                ]
                lines.extend(solution_lines)
        else:
            lines.append(
                "1. Jangan mengambil tindakan teknis berdasarkan tebakan; batasi akses ke area "
                "bila terdapat potensi paparan."
            )
            lines.append(
                "2. Catat lokasi, aktivitas, sumber bahaya, pekerja yang terdampak, dan foto "
                "temuan jika aman dilakukan."
            )
            lines.append(
                "3. Minta Supervisor atau Tim HSE melakukan identifikasi bahaya dan menentukan "
                "pengendalian yang sesuai sebelum pekerjaan dilanjutkan."
            )
        lines.append("")

        lines.append("REKOMENDASI K3")
        lines.append(
            f"1. Penanggung jawab rujukan: {officer.get('nama', 'Tim HSE')} "
            f"({officer.get('peran', 'HSE Officer')})."
        )
        lines.append(
            "2. Cocokkan tindakan dengan JSA, SOP, dan izin kerja yang berlaku untuk aktivitas "
            "serta lokasi aktual."
        )
        lines.append(
            "3. Supervisor wajib memverifikasi pengendalian di lapangan; jawaban sistem tidak "
            "menggantikan inspeksi dan otorisasi kerja."
        )
        lines.append("")

        lines.append("REFERENSI KNOWLEDGE BASE")
        if kb_matched:
            match_by_id = {
                match["entry"]["id"]: match
                for match in (hasil_pencarian or {}).get("all_matches", [])
                if match.get("entry")
            }
            for number, entry in enumerate(entries, start=1):
                match = match_by_id.get(entry["id"], {})
                score = match.get(
                    "hybrid_score", (hasil_pencarian or {}).get("confidence", 0.0)
                )
                lines.append(
                    f"{number}. {entry['id']} — {entry['judul']} "
                    f"({entry['kategori']}); kecocokan {round(float(score) * 100)}%."
                )
            unique_references = []
            seen_reference_urls = set()
            for entry in entries:
                for reference in entry.get("referensi", []):
                    reference_url = str(reference.get("url", "")).strip()
                    if reference_url and reference_url not in seen_reference_urls:
                        seen_reference_urls.add(reference_url)
                        unique_references.append(reference)
            for reference in unique_references:
                lines.append(
                    f"Regulasi resmi — {reference['judul']}: {reference['url']}"
                )
        else:
            lines.append(
                "Tidak ada artikel yang dicantumkan karena kecocokan belum memadai. "
                "Status ini mencegah referensi yang tidak relevan ditampilkan sebagai fakta."
            )
        lines.append("")

        lines.append("STATUS PENANGANAN")
        needs_escalation = bool(
            hasil_eskalasi and hasil_eskalasi.get("needs_escalation")
        )
        if not kb_matched:
            lines.append("Perlu verifikasi langsung oleh Supervisor atau Tim HSE.")
        elif needs_escalation or highest_risk == "tinggi":
            lines.append("Perlu tindakan lapangan segera dan koordinasi dengan Tim HSE.")
        else:
            lines.append(
                "Dapat ditindaklanjuti oleh Supervisor dengan pengawasan K3 dan verifikasi "
                "sebelum pekerjaan dilanjutkan."
            )

        return "\n".join(lines)

    def generate_response(
        self,
        user_message,
        top_entry,
        relevance_level,
        context,
        escalation_res=None,
        hasil_pencarian=None,
    ):
        return self.buat_jawaban(
            user_message,
            top_entry,
            relevance_level,
            context,
            escalation_res,
            hasil_pencarian,
        )


layanan_ai = LayananAI()
ai_service = layanan_ai
