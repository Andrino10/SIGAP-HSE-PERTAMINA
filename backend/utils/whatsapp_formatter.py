import urllib.parse
import datetime
from config.settings import NAMA_SISTEM, dapatkan_petugas_per_kategori, DAFTAR_PETUGAS_HSSE

NAMA_BULAN_INDONESIA = (
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
)


def format_tanggal_kejadian(value):
    """Ubah tanggal ISO menjadi tanggal Indonesia yang jelas untuk WhatsApp."""
    try:
        tanggal = datetime.date.fromisoformat(str(value or "").strip())
    except ValueError:
        return "Belum dicantumkan"
    return f"{tanggal.day} {NAMA_BULAN_INDONESIA[tanggal.month - 1]} {tanggal.year}"

def susun_pesan_whatsapp(konteks, umpan_balik=None, nomor_petugas_pilihan=None):
    """Menyusun teks pesan otomatis WhatsApp untuk dilaporkan ke Petugas HSSE."""
    if not isinstance(konteks, dict):
        konteks = {}

    raw_categories = (
        konteks.get("categories")
        or konteks.get("kategori_list")
        or konteks.get("category")
        or konteks.get("kategori")
        or "Keselamatan Kerja"
    )
    if isinstance(raw_categories, str):
        raw_categories = [raw_categories]
    categories = []
    if isinstance(raw_categories, list):
        for item in raw_categories:
            category = item.strip() if isinstance(item, str) else ""
            if category and category not in categories:
                categories.append(category)
    if not categories:
        categories = ["Keselamatan Kerja"]

    kategori = categories[0]
    teks_kategori = (
        kategori
        if len(categories) == 1
        else "\n".join(
            f"{index}. {category}"
            for index, category in enumerate(categories, start=1)
        )
    )
    kategori_penugasan = str(konteks.get("assigned_category") or kategori)
    petugas_ditunjuk = dapatkan_petugas_per_kategori(kategori_penugasan)

    nomor_tujuan = nomor_petugas_pilihan or petugas_ditunjuk.get("nomor") or petugas_ditunjuk.get("number")
    nama_tujuan = petugas_ditunjuk.get("nama") or petugas_ditunjuk.get("name")
    peran_tujuan = petugas_ditunjuk.get("peran") or petugas_ditunjuk.get("role")

    if nomor_petugas_pilihan:
        for petugas in DAFTAR_PETUGAS_HSSE.values():
            no = petugas.get("nomor") or petugas.get("number")
            if no == nomor_petugas_pilihan:
                nama_tujuan = petugas.get("nama") or petugas.get("name")
                peran_tujuan = petugas.get("peran") or petugas.get("role")
                break

    nama_pelapor = str(konteks.get("reporter_name") or konteks.get("nama_pelapor") or "Belum dicantumkan")
    divisi = str(konteks.get("division") or konteks.get("divisi") or "Umum")
    lokasi = str(konteks.get("location") or konteks.get("lokasi") or "Area Kerja")
    tanggal_kejadian = format_tanggal_kejadian(
        konteks.get("occurrence_date") or konteks.get("tanggal_kejadian")
    )
    deskripsi = str(
        konteks.get("description")
        or konteks.get("deskripsi")
        or konteks.get("initial_description")
        or konteks.get("last_user_message")
        or "Kondisi bahaya di area kerja"
    )
    urgensi = str(konteks.get("urgency") or konteks.get("urgensi") or "Sedang")
    daftar_gejala = konteks.get("symptoms") or konteks.get("gejala") or []
    if isinstance(daftar_gejala, list) and len(daftar_gejala) > 0:
        teks_gejala = ", ".join([str(g) for g in daftar_gejala if g])
    else:
        teks_gejala = kategori

    daftar_langkah = konteks.get("steps_tried") or konteks.get("langkah_dicoba") or []

    baris_pesan = [
        f"Halo {nama_tujuan} ({peran_tujuan}),",
        "",
        f"Saya melaporkan kondisi bahaya/temuan keselamatan melalui {NAMA_SISTEM}.",
        "",
        "Nama Pelapor:",
        nama_pelapor,
        "",
        "Fungsi/Divisi:",
        divisi,
        "",
        "Lokasi Temuan:",
        lokasi,
        "",
        "Tanggal Kejadian:",
        tanggal_kejadian,
        "",
        "Kategori Bahaya:",
        teks_kategori,
        "",
        "Deskripsi Kondisi Bahaya:",
        deskripsi,
        "",
        "Kondisi Bahaya yang Teridentifikasi Sistem:",
        teks_gejala,
        "",
        "Tindakan yang Sudah Dilakukan:"
    ]

    if isinstance(daftar_langkah, list) and len(daftar_langkah) > 0:
        for idx, langkah in enumerate(daftar_langkah[:3], 1):
            baris_pesan.append(f"{idx}. {str(langkah)}")
    else:
        baris_pesan.append("1. Konsultasi awal dan analisis mandiri SIGAP-AI HSSE")

    baris_pesan.extend([
        "",
        "Hasil:",
        str(umpan_balik or "Kondisi bahaya memerlukan penanganan langsung oleh Tim HSSE"),
        "",
        "Tingkat Urgensi:",
        urgensi,
        "",
        "Mohon tindak lanjut untuk memastikan keselamatan pekerja. Terima kasih."
    ])

    teks_mentah = "\n".join(baris_pesan)
    teks_tersandi = urllib.parse.quote(teks_mentah)
    
    nomor_bersih = "".join(filter(str.isdigit, str(nomor_tujuan)))
    if nomor_bersih.startswith("0"):
        nomor_bersih = "62" + nomor_bersih[1:]

    tautan_whatsapp = f"https://wa.me/{nomor_bersih}?text={teks_tersandi}"
    return teks_mentah, tautan_whatsapp, petugas_ditunjuk

def build_whatsapp_message(context, user_feedback=None, selected_tech_number=None):
    return susun_pesan_whatsapp(context, user_feedback, selected_tech_number)
