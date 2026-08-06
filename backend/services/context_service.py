import re
from repositories.conversation_repository import conversation_repo
from utils.text_normalizer import normalisasi_teks

KATA_KUNCI_KATEGORI = {
    "Alat Pelindung Diri (APD)": ["helm", "sepatu safety", "sarung tangan", "kacamata safety", "pelindung wajah", "masker", "rompi", "apd", "pelindung", "penyumbat telinga", "penutup telinga"],
    "Pekerjaan di Ketinggian": ["ketinggian", "harness", "tali pengaman", "atap", "perancah", "pagar pengaman", "jatuh dari atas"],
    "Penggunaan Tangga": ["tangga", "anak tangga", "tangga rusak"],
    "Kelistrikan": ["listrik", "kabel", "sengatan", "loto", "pembumian", "panel listrik", "korsleting", "generator", "stop kontak", "mcb"],
    "Alat Berat & Kendaraan": ["alat berat", "excavator", "crane", "forklift", "operator", "tertabrak", "kendaraan", "dump truck"],
    "Bahan Kimia & B3": ["kimia", "b3", "msds", "bahan berbahaya", "tumpahan", "iritasi", "keracunan", "mudah terbakar"],
    "Ruang Terbatas (Confined Space)": ["ruang terbatas", "ruang tertutup", "oksigen", "pengujian gas", "petugas siaga"],
    "Pekerjaan Panas (Hot Work)": ["las", "pengelasan", "pekerjaan panas", "pengawas api", "percikan api", "tabung gas", "penggerindaan"],
    "Pengangkatan & Rigging": ["pengangkatan", "rigging", "sling", "crane", "beban", "angkat", "juru ikat"],
    "Ergonomi": ["ergonomi", "angkat beban", "postur", "punggung", "membungkuk", "gerakan berulang", "penanganan manual"],
    "Tanggap Darurat": ["darurat", "evakuasi", "apar", "kebakaran", "api", "p3k", "alarm", "titik kumpul"],
    "Lingkungan Kerja": ["licin", "basah", "hujan", "pencahayaan", "gelap", "panas", "dingin", "ventilasi", "kebisingan", "kotor"],
    "Pengawasan & Prosedur": ["sop", "briefing", "inspeksi", "supervisor", "pengawasan", "prosedur"],
    "Manajemen Risiko": ["risiko", "identifikasi bahaya", "izin kerja", "penilaian risiko"],
    "Budaya Keselamatan": ["budaya keselamatan", "utamakan keselamatan", "kesadaran"],
    "Komunikasi & Pelaporan": ["komunikasi", "laporan", "hampir celaka", "pelaporan", "briefing"],
    "Pelatihan & Kompetensi": ["pelatihan", "induksi", "sertifikasi", "kompetensi"],
    "Higienitas & Konsumsi": ["makan", "minum", "kantin", "cuci tangan", "area makan", "makanan", "air minum"]
}

PERTANYAAN_AMBIGU = [
    "bahaya", "berbahaya", "tidak aman", "risiko", "masalah", "tolong", "bantuan", "ada masalah", "gak aman", "tidak aman"
]

class LayananKonteks:
    @staticmethod
    def _daftar_kategori(kategori):
        if isinstance(kategori, str):
            kategori = [kategori]
        if not isinstance(kategori, list):
            return []
        hasil = []
        for item in kategori:
            nama = item.strip() if isinstance(item, str) else ""
            if nama and nama not in hasil:
                hasil.append(nama)
        return hasil

    def ekstrak_kategori(self, pertanyaan):
        teks_normal = normalisasi_teks(pertanyaan)
        teks_berbatas = f" {teks_normal} "
        kandidat = []
        for cat, daftar_kw in KATA_KUNCI_KATEGORI.items():
            cocok = []
            for kw in daftar_kw:
                kw_normal = normalisasi_teks(kw)
                if kw_normal and f" {kw_normal} " in teks_berbatas:
                    cocok.append(kw_normal)
            if cocok:
                kandidat.append(
                    (
                        len(cocok),
                        sum(len(item.split()) for item in cocok),
                        max(len(item) for item in cocok),
                        cat,
                    )
                )
        if not kandidat:
            return None
        kandidat.sort(reverse=True)
        return kandidat[0][3]

    def proses_pesan_pengguna(self, id_sesi, teks_pesan, kategori_eksplisit=None):
        sesi = conversation_repo.get_session(id_sesi)
        konteks_saat_ini = sesi["context"]
        teks_normal = normalisasi_teks(teks_pesan)

        kategori_sebelumnya = self._daftar_kategori(
            konteks_saat_ini.get("categories")
            or konteks_saat_ini.get("kategori_list")
            or konteks_saat_ini.get("category")
            or konteks_saat_ini.get("kategori")
        )
        kategori_eksplisit_list = self._daftar_kategori(kategori_eksplisit)
        if kategori_eksplisit_list:
            if kategori_sebelumnya and kategori_sebelumnya != kategori_eksplisit_list:
                konteks_saat_ini["kb_id"] = None
                konteks_saat_ini["assigned_category"] = None
            konteks_saat_ini["categories"] = kategori_eksplisit_list
            konteks_saat_ini["kategori_list"] = kategori_eksplisit_list
            konteks_saat_ini["category"] = kategori_eksplisit_list[0]
            konteks_saat_ini["kategori"] = kategori_eksplisit_list[0]
            konteks_saat_ini["category_source"] = "explicit"
        else:
            kategori_baru = self.ekstrak_kategori(teks_normal)
            if kategori_baru:
                if kategori_sebelumnya and kategori_sebelumnya != [kategori_baru]:
                    konteks_saat_ini["kb_id"] = None
                    konteks_saat_ini["assigned_category"] = None
                konteks_saat_ini["categories"] = [kategori_baru]
                konteks_saat_ini["kategori_list"] = [kategori_baru]
                konteks_saat_ini["category"] = kategori_baru
                konteks_saat_ini["kategori"] = kategori_baru
                konteks_saat_ini["category_source"] = "inferred"

        if not konteks_saat_ini.get("initial_description"):
            konteks_saat_ini["initial_description"] = teks_pesan
        konteks_saat_ini["last_user_message"] = teks_pesan

        indikator_bahaya = {
            "tanpa helm": "tidak pakai helm",
            "tanpa harness": "tidak pakai harness",
            "licin": "area licin",
            "kabel terbuka": "kabel listrik terbuka",
            "tanpa apd": "tidak menggunakan APD",
            "jatuh": "potensi jatuh",
            "kebakaran": "risiko kebakaran",
            "tumpahan": "tumpahan bahan berbahaya",
            "tidak ada rambu": "rambu keselamatan tidak ada",
            "tanpa izin": "bekerja tanpa izin kerja"
        }
        for indikator, gejala in indikator_bahaya.items():
            if indikator in teks_normal and gejala not in konteks_saat_ini["symptoms"]:
                konteks_saat_ini["symptoms"].append(gejala)

        if any(w in teks_normal for w in ["sudah", "telah", "bisa", "gagal", "tetap", "masih"]):
            konteks_saat_ini["steps_tried"].append(teks_pesan)

        conversation_repo.update_context(id_sesi, konteks_saat_ini)

        pertanyaan_terenkaya = self.dapatkan_pertanyaan_terenkaya(teks_pesan, konteks_saat_ini)
        perlu_klarifikasi, petunjuk_klarifikasi = self.evaluasi_klarifikasi(konteks_saat_ini, teks_pesan)
        
        return {
            "session_id": id_sesi,
            "context": konteks_saat_ini,
            "enriched_query": pertanyaan_terenkaya,
            "needs_clarification": perlu_klarifikasi,
            "clarification_prompt": petunjuk_klarifikasi
        }

    def dapatkan_pertanyaan_terenkaya(self, pesan_asli, konteks):
        kategori_list = self._daftar_kategori(
            konteks.get("categories")
            or konteks.get("kategori_list")
            or konteks.get("category")
            or konteks.get("kategori")
        )
        sumber_kategori = konteks.get("category_source")
        gejala = " ".join(konteks.get("symptoms", []))
        
        if kategori_list and sumber_kategori in {"explicit", "knowledge_match"}:
            if len(pesan_asli.split()) <= 6 or any(w in pesan_asli.lower() for w in ["tetap", "masih", "gagal", "bagaimana", "cara", "sudah"]):
                return f"{' '.join(kategori_list)} {gejala} {pesan_asli}".strip()
        return pesan_asli

    def evaluasi_klarifikasi(self, konteks, pesan_asli):
        teks_normal = normalisasi_teks(pesan_asli)
        kata_kata = teks_normal.split()

        if len(kata_kata) <= 3 and any(w in teks_normal for w in PERTANYAAN_AMBIGU) and not self._daftar_kategori(
            konteks.get("categories")
            or konteks.get("kategori_list")
            or konteks.get("category")
            or konteks.get("kategori")
        ):
            petunjuk = (
                "Untuk membantu memberikan analisis keselamatan yang tepat, mohon sampaikan detail berikut:\n"
                "1. Kondisi bahaya apa yang terjadi? (contoh: pekerja tanpa helm, kabel terbuka, area licin)\n"
                "2. Di area kerja mana kondisi ini ditemukan?\n"
                "3. Apakah ada pekerja yang terdampak langsung?"
            )
            return True, petunjuk

        return False, None

layanan_konteks = LayananKonteks()
context_service = layanan_konteks
