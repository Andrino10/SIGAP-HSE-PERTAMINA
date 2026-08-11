"""Analisis konteks laporan agar jawaban HSE tidak hanya mengikuti kata kunci.

Layanan ini tidak menggantikan penilaian risiko lapangan. Tujuannya adalah
memisahkan fakta yang benar-benar ditulis pengguna, asumsi yang belum boleh
ditetapkan, dan pengendalian yang proporsional terhadap skenario.
"""

import re

from utils.text_normalizer import normalisasi_teks


class LayananAnalisisSkenario:
    KATA_KUNCI_JARINGAN = (
        "kabel lan",
        "ethernet",
        "kabel utp",
        "rj45",
        "server",
        "switch jaringan",
        "patch panel",
    )
    INDIKASI_BAHAYA_LISTRIK = (
        "kabel listrik",
        "kabel power",
        "konduktor terbuka",
        "bagian bertegangan",
        "panel terbuka",
        "isolasi terkelupas",
        "terkelupas",
        "tersengat",
        "sengatan",
        "korsleting",
        "percikan listrik",
        "bau terbakar",
        "asap",
    )
    INDIKASI_APD_TIDAK_LENGKAP = (
        "apd tidak lengkap",
        "tidak memakai apd lengkap",
        "tidak menggunakan apd lengkap",
        "tanpa apd lengkap",
        "tidak pakai apd",
        "tanpa apd",
    )
    INDIKASI_TANPA_SARUNG_TANGAN = (
        "tidak memakai sarung tangan",
        "tidak menggunakan sarung tangan",
        "tidak pakai sarung tangan",
        "tanpa sarung tangan",
    )

    @staticmethod
    def _memuat_salah_satu(teks, daftar_frasa):
        return any(frasa in teks for frasa in daftar_frasa)

    @staticmethod
    def _nama_rekan(teks):
        pola = (
            r"\bsaya\s+dan\s+([a-z][a-z0-9_-]{1,30})\b",
            r"\bbersama\s+([a-z][a-z0-9_-]{1,30})\b",
        )
        kata_dikecualikan = {
            "seorang", "teman", "rekan", "pekerja", "tim", "teknisi"
        }
        for pola_nama in pola:
            cocok = re.search(pola_nama, teks)
            if cocok and cocok.group(1) not in kata_dikecualikan:
                return cocok.group(1).capitalize()
        return None

    def analisis(self, pesan_pengguna):
        teks = normalisasi_teks(pesan_pengguna)
        adalah_jaringan = self._memuat_salah_satu(
            teks, self.KATA_KUNCI_JARINGAN
        )
        ada_bahaya_listrik_eksplisit = self._memuat_salah_satu(
            teks, self.INDIKASI_BAHAYA_LISTRIK
        )
        apd_tidak_lengkap = self._memuat_salah_satu(
            teks, self.INDIKASI_APD_TIDAK_LENGKAP
        )
        tanpa_sarung_tangan = self._memuat_salah_satu(
            teks, self.INDIKASI_TANPA_SARUNG_TANGAN
        )
        # Tangkap negasi bersama, misalnya "tidak memakai sarung tangan dan
        # APD lengkap"; kata "tidak memakai" berlaku pada kedua objek.
        if re.search(
            r"\btidak\s+(?:memakai|menggunakan|pakai)\b.{0,80}"
            r"\bsarung tangan\b.{0,40}\bdan\s+apd lengkap\b",
            teks,
        ):
            apd_tidak_lengkap = True
        nama_rekan = self._nama_rekan(teks)

        hasil = {
            "jenis": "umum",
            "nama_rekan": nama_rekan,
            "fakta": [],
            "hal_yang_belum_diketahui": [],
            "petunjuk_kategori": [],
            "tingkat_risiko_sementara": None,
            "penjelasan": None,
            "tindakan": [],
            "catatan_kb": None,
        }

        if not adalah_jaringan:
            return hasil

        hasil["jenis"] = "pekerjaan_jaringan_server"
        subjek = nama_rekan or "rekan kerja"
        hasil["fakta"].append(
            f"Aktivitas yang dilaporkan: Anda dan {subjek} sedang memperbaiki "
            "sambungan kabel LAN pada perangkat/server."
        )
        if tanpa_sarung_tangan:
            hasil["fakta"].append(
                f"Temuan APD: {subjek} dilaporkan tidak memakai sarung tangan."
            )
        if apd_tidak_lengkap:
            hasil["fakta"].append(
                f"Temuan kepatuhan: APD {subjek} dilaporkan belum lengkap."
            )

        hasil["hal_yang_belum_diketahui"] = [
            "apakah port jaringan menggunakan Power over Ethernet (PoE)",
            "apakah pekerjaan hanya pada konektor LAN atau juga membuka bagian daya server/rack",
            "apakah ada bagian listrik terbuka, kerusakan kabel daya, panas, bau terbakar, atau percikan",
            "jenis APD yang diwajibkan oleh JSA/SOP dan kondisi fisik area kerja",
        ]

        hasil["petunjuk_kategori"] = ["Alat Pelindung Diri (APD)", "Kelistrikan"]
        hasil["tingkat_risiko_sementara"] = (
            "tinggi" if ada_bahaya_listrik_eksplisit else "sedang"
        )
        hasil["penjelasan"] = (
            "Kabel LAN adalah media jaringan dan tidak boleh langsung diperlakukan sebagai "
            "kabel listrik tegangan utama. Namun, sebagian port Ethernet dapat membawa daya "
            "PoE dan pekerjaan di rack/server tetap dapat berdekatan dengan catu daya yang "
            "berenergi. Dampak potensial mencakup luka pada tangan akibat tepi tajam atau alat, "
            "kontak tidak sengaja dengan bagian listrik di rack, kabel menjadi bahaya tersandung, "
            "kerusakan konektor/perangkat, gangguan layanan, dan pelepasan muatan statis ke "
            "komponen. Tingkat risiko sementara ditetapkan dari informasi yang tersedia dan "
            "harus dinaikkan bila ditemukan bagian listrik terbuka, panas, asap, percikan, atau "
            "paparan langsung. Pemilihan sarung tangan dan APD harus mengikuti hasil identifikasi "
            "bahaya, JSA/SOP, serta instruksi peralatan; sarung tangan isolasi listrik hanya tepat "
            "bila memang ada pekerjaan pada atau dekat bagian bertegangan dan harus sesuai ratingnya."
        )
        hasil["tindakan"] = [
            "1. Tindakan segera: Jeda pekerjaan, amankan kabel yang lepas agar tidak tertarik atau menjadi bahaya tersandung, dan jangan memasukkan tangan ke bagian rack/server yang terbuka atau berenergi.",
            "2. Verifikasi energi: Identifikasi kedua ujung kabel dan portnya, periksa apakah port menggunakan PoE, serta pastikan pekerjaan tidak menyentuh kabel daya atau komponen listrik. Isolasi sumber yang relevan sesuai SOP/LOTO bila ada paparan listrik.",
            "3. APD sesuai bahaya: Lengkapi APD yang diwajibkan JSA/SOP. Gunakan sarung tangan kerja yang sesuai bila ada risiko sayatan atau abrasi; jangan otomatis menggantinya dengan sarung tangan isolasi listrik tanpa penilaian tegangan dan kompetensi kerja listrik.",
            "4. Perlindungan perangkat: Terapkan pengendalian ESD yang disetujui prosedur/vendor dan pastikan pengendalian tersebut tidak menambah risiko ketika terdapat bagian listrik berenergi.",
            "5. Perbaikan dan pengujian: Pasang kembali atau ganti kabel/konektor yang rusak, rapikan jalur serta strain relief, lalu uji koneksi dan layanan tanpa meninggalkan kabel longgar.",
            "6. Verifikasi akhir: Supervisor atau personel IT/HSE berwenang memeriksa APD, kondisi rack, jalur kabel, dan hasil pengujian sebelum pekerjaan dinyatakan selesai.",
        ]
        hasil["catatan_kb"] = (
            "Artikel APD/kelistrikan digunakan sebagai rujukan pengendalian. Artikel tersebut "
            "bukan bukti bahwa kabel LAN pada laporan ini merupakan konduktor listrik tegangan utama."
        )
        return hasil


layanan_analisis_skenario = LayananAnalisisSkenario()
