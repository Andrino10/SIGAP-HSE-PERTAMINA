"""Penyusun jawaban deterministik berbasis Knowledge Base HSSE.

Modul ini tidak mengarang prosedur. Kondisi, risiko, dan solusi utama diambil
langsung dari artikel ``knowledge.json`` yang lolos ambang relevansi.
"""

import re

from config.settings import dapatkan_petugas_per_kategori
from services.scenario_analysis_service import layanan_analisis_skenario


URUTAN_RISIKO = {"rendah": 1, "sedang": 2, "tinggi": 3}


class LayananAI:
    @staticmethod
    def _ringkas_pesan_pengguna(pesan_pengguna, batas=360):
        pesan = " ".join(str(pesan_pengguna or "").split()).strip()
        if len(pesan) <= batas:
            return pesan
        return pesan[: batas - 3].rstrip() + "..."

    @staticmethod
    def _kalimat_pertama(teks, batas=320):
        teks_bersih = " ".join(str(teks or "").split()).strip()
        if not teks_bersih:
            return ""
        kalimat = re.split(r"(?<=[.!?])\s+", teks_bersih, maxsplit=1)[0]
        if len(kalimat) <= batas:
            return kalimat
        return kalimat[: batas - 3].rstrip() + "..."

    @staticmethod
    def _tindakan_pertama(entry):
        for baris in str(entry.get("solusi", "")).splitlines():
            tindakan = baris.strip()
            if not tindakan:
                continue
            tindakan = re.sub(r"^\d+[.)]\s*", "", tindakan)
            tindakan = re.sub(r"^Tindakan\s+Segera\s*:\s*", "", tindakan, flags=re.I)
            return tindakan
        return "Ikuti tindakan pengendalian pada artikel rujukan dan verifikasi dengan Supervisor."

    def _buat_jawaban_langsung(self, pesan_pengguna, entries, kb_matched):
        if not kb_matched or not entries:
            return (
                "Informasi pada pertanyaan belum cukup untuk memberikan jawaban teknis yang tepat. "
                "Sebutkan aktivitas, sumber bahaya, lokasi, kondisi peralatan atau APD, dan pekerja "
                "yang terpapar agar jawaban dapat dicocokkan dengan artikel HSSE yang relevan."
            )

        pesan_normal = " ".join(str(pesan_pengguna or "").lower().split())
        if len(entries) > 1:
            daftar_kondisi = ", ".join(entry["judul"] for entry in entries)
            tindakan = "; ".join(
                f"{entry['judul']}: {self._tindakan_pertama(entry)}"
                for entry in entries
            )
            return (
                f"Pertanyaan memuat beberapa kondisi yang saling terkait: {daftar_kondisi}. "
                f"Tindakan awal yang sesuai adalah {tindakan}"
            )

        entry = entries[0]
        judul = entry["judul"]
        tindakan = self._tindakan_pertama(entry)
        penjelasan = self._kalimat_pertama(entry.get("penjelasan_risiko"))

        if re.search(r"\b(apakah|bolehkah|bisakah|aman)\b", pesan_normal):
            return (
                f"Kondisi tersebut belum dapat dinyatakan aman sebelum pengendaliannya diverifikasi. "
                f"Rujukan yang paling sesuai adalah '{judul}'. Tindakan pertama: {tindakan}"
            )
        if re.search(r"\b(bagaimana|cara|solusi|tindakan|mengatasi)\b", pesan_normal):
            return f"Untuk menangani '{judul}', tindakan pertama yang sesuai adalah: {tindakan}"
        if re.search(r"\b(mengapa|kenapa)\b", pesan_normal):
            return f"'{judul}' perlu dikendalikan karena {penjelasan} Tindakan pertama: {tindakan}"
        if re.search(r"\b(apa|risiko|bahaya)\b", pesan_normal):
            return f"Kondisi yang paling sesuai adalah '{judul}'. {penjelasan} Tindakan pertama: {tindakan}"
        return (
            f"Laporan paling sesuai dengan kondisi '{judul}'. "
            f"Tindakan pertama yang perlu dilakukan: {tindakan}"
        )

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

    @staticmethod
    def _referensi_unik(entries):
        hasil = []
        url_terlihat = set()
        for entry in entries:
            for reference in entry.get("referensi", []):
                url = str(reference.get("url", "")).strip()
                if url and url not in url_terlihat:
                    url_terlihat.add(url)
                    hasil.append(reference)
        return hasil

    def _buat_jawaban_pekerjaan_jaringan(
        self,
        pesan_pengguna,
        entries,
        konteks,
        hasil_pencarian,
        analisis_skenario,
    ):
        """Jawaban khusus rack/server yang membedakan LAN, PoE, dan listrik utama."""
        lines = [
            "PERTANYAAN / LAPORAN ANDA",
            self._ringkas_pesan_pengguna(pesan_pengguna),
            "",
            "JAWABAN LANGSUNG",
            (
                "Jeda pekerjaan dan verifikasi apakah kabel/port menggunakan PoE serta apakah "
                "ada bagian daya server atau rack yang terbuka. Kabel LAN tidak boleh langsung "
                "dianggap sebagai kabel listrik tegangan utama; APD harus mengikuti bahaya aktual "
                "dan JSA/SOP pekerjaan."
            ),
            "",
            "KONDISI TERIDENTIFIKASI",
        ]
        lines.extend(analisis_skenario.get("fakta") or [])
        hal_belum_diketahui = analisis_skenario.get("hal_yang_belum_diketahui") or []
        if hal_belum_diketahui:
            lines.append(
                "Belum dapat dipastikan dari laporan: "
                + "; ".join(hal_belum_diketahui)
                + "."
            )
        lines.append("")

        tingkat = analisis_skenario.get("tingkat_risiko_sementara") or "sedang"
        lines.append("TINGKAT RISIKO")
        if tingkat == "tinggi":
            lines.append(
                "RISIKO TINGGI - terdapat indikasi bahaya listrik atau kerusakan yang "
                "memerlukan penghentian pekerjaan, pengamanan area, dan verifikasi personel berwenang."
            )
        else:
            lines.append(
                "RISIKO SEDANG (SEMENTARA) - pekerjaan perlu dijeda sampai sumber energi, "
                "status PoE, batas pekerjaan, dan kebutuhan APD diverifikasi."
            )
        lines.append("")

        lines.append("PENJELASAN RISIKO")
        lines.append(analisis_skenario["penjelasan"])
        lines.append("")

        lines.append("SOLUSI & TINDAKAN")
        lines.extend(analisis_skenario.get("tindakan") or [])
        lines.append("")

        category = (
            entries[0].get("kategori")
            if entries
            else konteks.get("assigned_category")
            or konteks.get("category")
            or "Umum"
        )
        officer = dapatkan_petugas_per_kategori(category)
        lines.append("REKOMENDASI K3")
        lines.append(
            f"1. Penanggung jawab rujukan: {officer.get('nama', 'Tim HSSE')} "
            f"({officer.get('peran', 'HSSE Officer')})."
        )
        lines.append(
            "2. APD harus dipilih dari bahaya yang benar-benar ada, bukan dari istilah "
            "'APD lengkap' saja; verifikasi daftar APD pada JSA/SOP pekerjaan jaringan dan server."
        )
        lines.append(
            "3. Bila pekerjaan ternyata melibatkan bagian listrik terbuka atau bertegangan, "
            "hanya personel kompeten dan berwenang yang boleh melanjutkan sesuai prosedur kelistrikan/LOTO."
        )
        lines.append(
            "4. Bila hanya menyambungkan kabel LAN tanpa paparan listrik dan area sudah aman, "
            "pekerjaan dapat dilanjutkan setelah APD serta izin kerja dikonfirmasi oleh pengawas."
        )
        lines.append("")

        lines.append("REFERENSI KNOWLEDGE BASE")
        match_by_id = {
            match["entry"]["id"]: match
            for match in (hasil_pencarian or {}).get("all_matches", [])
            if match.get("entry")
        }
        if entries:
            for number, entry in enumerate(entries, start=1):
                match = match_by_id.get(entry["id"], {})
                score = match.get(
                    "hybrid_score", (hasil_pencarian or {}).get("confidence", 0.0)
                )
                lines.append(
                    f"{number}. {entry['id']} - {entry['judul']} "
                    f"({entry['kategori']}); kecocokan {round(float(score) * 100)}%."
                )
            for reference in self._referensi_unik(entries):
                lines.append(
                    f"Regulasi resmi - {reference['judul']}: {reference['url']}"
                )
        else:
            lines.append(
                "Tidak ada artikel yang cukup relevan untuk dijadikan dasar prosedur teknis."
            )
        if analisis_skenario.get("catatan_kb"):
            lines.append("Catatan konteks - " + analisis_skenario["catatan_kb"])
        lines.append("")

        lines.append("STATUS PENANGANAN")
        if tingkat == "tinggi":
            lines.append(
                "Hentikan pekerjaan dan koordinasikan segera dengan Supervisor, personel IT, "
                "serta Tim HSSE sebelum menyentuh peralatan."
            )
        else:
            lines.append(
                "Jeda dan verifikasi terlebih dahulu. Pekerjaan dapat dilanjutkan setelah "
                "sumber energi, kondisi area, APD, dan kewenangan kerja dinyatakan sesuai."
            )
        return "\n".join(lines)

    def buat_jawaban(
        self,
        pesan_pengguna,
        entri_teratas,
        tingkat_relevansi,
        konteks,
        hasil_eskalasi=None,
        hasil_pencarian=None,
        analisis_skenario=None,
    ):
        lines = []
        entries = self._daftar_entri(entri_teratas, hasil_pencarian)
        analisis_skenario = analisis_skenario or layanan_analisis_skenario.analisis(
            pesan_pengguna
        )
        if analisis_skenario.get("jenis") == "pekerjaan_jaringan_server":
            return self._buat_jawaban_pekerjaan_jaringan(
                pesan_pengguna,
                entries,
                konteks,
                hasil_pencarian,
                analisis_skenario,
            )
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

        lines.append("PERTANYAAN / LAPORAN ANDA")
        lines.append(self._ringkas_pesan_pengguna(pesan_pengguna))
        lines.append("")

        lines.append("JAWABAN LANGSUNG")
        lines.append(self._buat_jawaban_langsung(pesan_pengguna, entries, kb_matched))
        lines.append("")

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
                "bahaya segera, amankan area, dan minta verifikasi Tim HSSE."
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
                "3. Minta Supervisor atau Tim HSSE melakukan identifikasi bahaya dan menentukan "
                "pengendalian yang sesuai sebelum pekerjaan dilanjutkan."
            )
        lines.append("")

        lines.append("REKOMENDASI K3")
        lines.append(
            f"1. Penanggung jawab rujukan: {officer.get('nama', 'Tim HSSE')} "
            f"({officer.get('peran', 'HSSE Officer')})."
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
            lines.append("Perlu verifikasi langsung oleh Supervisor atau Tim HSSE.")
        elif needs_escalation or highest_risk == "tinggi":
            lines.append("Perlu tindakan lapangan segera dan koordinasi dengan Tim HSSE.")
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
        analisis_skenario=None,
    ):
        return self.buat_jawaban(
            user_message,
            top_entry,
            relevance_level,
            context,
            escalation_res,
            hasil_pencarian,
            analisis_skenario,
        )


layanan_ai = LayananAI()
ai_service = layanan_ai
