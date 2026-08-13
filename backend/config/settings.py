import os
import tempfile


def _nilai_env_hsse(nama_baru, nama_lama, nilai_default):
    """Utamakan nama konfigurasi HSSE tanpa memutus konfigurasi HSE lama."""
    return os.getenv(nama_baru) or os.getenv(nama_lama) or nilai_default

# Identitas Sistem
NAMA_SISTEM = "SIGAP-AI HSSE COMPANION"
NAMA_AREA = "Area Kerja Konstruksi"

# Identitas Legacy Compatibility
SYSTEM_NAME = NAMA_SISTEM
ASSET_NAME = NAMA_AREA

# Jalur Direktori Utama
DIREKTORI_UTAMA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIREKTORI_DATA = os.path.join(DIREKTORI_UTAMA, "data")
JALUR_KNOWLEDGE_JSON = os.path.join(DIREKTORI_DATA, "knowledge.json")
BERJALAN_DI_VERCEL = bool(os.getenv("VERCEL"))
DIREKTORI_PENYIMPANAN = os.getenv("SIGAP_STORAGE_DIR") or (
    os.path.join(tempfile.gettempdir(), "sigap-ai-hsse", "storage")
    if BERJALAN_DI_VERCEL
    else os.path.join(DIREKTORI_DATA, "storage")
)

# Path Legacy Compatibility
BASE_DIR = DIREKTORI_UTAMA
DATA_DIR = DIREKTORI_DATA
KNOWLEDGE_JSON_PATH = JALUR_KNOWLEDGE_JSON
STORAGE_DIR = DIREKTORI_PENYIMPANAN

# Buat direktori jika belum ada
os.makedirs(DIREKTORI_DATA, exist_ok=True)
os.makedirs(DIREKTORI_PENYIMPANAN, exist_ok=True)

# Nomor Hotline Utama HSSE WhatsApp
NOMOR_WHATSAPP_HSSE = _nilai_env_hsse(
    "WHATSAPP_HSSE_NUMBER", "WHATSAPP_HSE_NUMBER", "6281234567890"
)
WHATSAPP_HSSE_NUMBER = NOMOR_WHATSAPP_HSSE

# Daftar Official Tim HSSE PT Pertamina EP Lirik Field 2026
DAFTAR_PETUGAS_HSSE = {
    "Superintendent HSSE": {
        "kategori": "Superintendent HSSE",
        "nama": "M. Solihin",
        "peran": "Superintendent HSSE PT Pertamina EP Lirik Field",
        "divisi": "HSSE Leadership",
        "nomor": _nilai_env_hsse("WA_HSSE_SUPERINTENDENT", "WA_HSE_SUPERINTENDENT", "6281234567890")
    },
    "Safety / Keselamatan": {
        "kategori": "Safety / Keselamatan",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead (SIKA, JSA & APD)",
        "divisi": "Safety",
        "tim": ["Defrizon", "Ibnu Zalda", "Iman Khairuddin"],
        "nomor": _nilai_env_hsse("WA_HSSE_SAFETY", "WA_HSE_SAFETY", "6281234567891")
    },
    "Alat Pelindung Diri (APD)": {
        "kategori": "Alat Pelindung Diri (APD)",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead (APD & SIKA/JSA)",
        "divisi": "Safety",
        "tim": ["Defrizon", "Ibnu Zalda", "Iman Khairuddin"],
        "nomor": _nilai_env_hsse("WA_HSSE_APD", "WA_HSE_APD", "6281234567891")
    },
    "Pekerjaan di Ketinggian": {
        "kategori": "Pekerjaan di Ketinggian",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead - Height & Scaffolding",
        "divisi": "Safety",
        "tim": ["Defrizon", "Ibnu Zalda"],
        "nomor": _nilai_env_hsse("WA_HSSE_HEIGHT", "WA_HSE_HEIGHT", "6281234567891")
    },
    "Kelistrikan": {
        "kategori": "Kelistrikan",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead - Electrical & LOTO Safety",
        "divisi": "Safety",
        "tim": ["Iman Khairuddin", "Ibnu Zalda"],
        "nomor": _nilai_env_hsse("WA_HSSE_ELECTRICAL", "WA_HSE_ELECTRICAL", "6281234567891")
    },
    "Alat Berat & Kendaraan": {
        "kategori": "Alat Berat & Kendaraan",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead - Heavy Equipment Safety",
        "divisi": "Safety",
        "tim": ["Defrizon", "Iman Khairuddin"],
        "nomor": _nilai_env_hsse("WA_HSSE_HEAVY", "WA_HSE_HEAVY", "6281234567891")
    },
    "Health / Kesehatan": {
        "kategori": "Health / Kesehatan",
        "nama": "Dr. Irsyad Yoga",
        "peran": "Chief Medical Officer & Health Lead (MCU & Wellness)",
        "divisi": "Health",
        "tim": ["Dr. Fauzan", "Amri", "Yossy", "Diana", "Kiki"],
        "nomor": _nilai_env_hsse("WA_HSSE_HEALTH", "WA_HSE_HEALTH", "6281234567892")
    },
    "Security / Keamanan": {
        "kategori": "Security / Keamanan",
        "nama": "Jayadi",
        "peran": "Chief Security Officer (SIML & Keamanan Field)",
        "divisi": "Security",
        "tim": ["Budi Santoso", "Iwan", "Dudung Triwinarso", "Heris"],
        "nomor": _nilai_env_hsse("WA_HSSE_SECURITY", "WA_HSE_SECURITY", "6281234567893")
    },
    "Bahan Kimia & B3": {
        "kategori": "Bahan Kimia & B3",
        "nama": "Ronny Pribadi",
        "peran": "Senior Environmental & Compliance Specialist",
        "divisi": "Enviro",
        "tim": ["Tsabitha Nabilla"],
        "nomor": _nilai_env_hsse("WA_HSSE_ENVIRO", "WA_HSE_ENVIRO", "6281234567894")
    },
    "Lingkungan Kerja": {
        "kategori": "Lingkungan Kerja",
        "nama": "Ronny Pribadi",
        "peran": "Senior Environmental & Compliance Specialist",
        "divisi": "Enviro",
        "tim": ["Tsabitha Nabilla"],
        "nomor": _nilai_env_hsse("WA_HSSE_ENVIRO", "WA_HSE_ENVIRO", "6281234567894")
    },
    "Ruang Terbatas (Confined Space)": {
        "kategori": "Ruang Terbatas (Confined Space)",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead - Confined Space Safety",
        "divisi": "Safety",
        "tim": ["Defrizon", "Ibnu Zalda"],
        "nomor": _nilai_env_hsse("WA_HSSE_SAFETY", "WA_HSE_SAFETY", "6281234567891")
    },
    "Pekerjaan Panas (Hot Work)": {
        "kategori": "Pekerjaan Panas (Hot Work)",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead - Hot Work Permit & Fire Safety",
        "divisi": "Safety",
        "tim": ["Defrizon", "Iman Khairuddin"],
        "nomor": _nilai_env_hsse("WA_HSSE_SAFETY", "WA_HSE_SAFETY", "6281234567891")
    },
    "Tanggap Darurat": {
        "kategori": "Tanggap Darurat",
        "nama": "Dr. Irsyad Yoga",
        "peran": "Kedaruratan Medis & K3 Emergency Lead",
        "divisi": "Health & Safety",
        "tim": ["Dr. Fauzan", "Juni Trihardiyanto", "Defrizon"],
        "nomor": _nilai_env_hsse("WA_HSSE_EMERGENCY", "WA_HSE_EMERGENCY", "6281234567892")
    },
    "Pengangkatan & Rigging": {
        "kategori": "Pengangkatan & Rigging",
        "nama": "Juni Trihardiyanto",
        "peran": "Senior Safety Lead - Lifting & Rigging",
        "divisi": "Safety",
        "tim": ["Defrizon", "Ibnu Zalda"],
        "nomor": _nilai_env_hsse("WA_HSSE_SAFETY", "WA_HSE_SAFETY", "6281234567891")
    },
    "Pengawasan & Prosedur": {
        "kategori": "Pengawasan & Prosedur",
        "nama": "M. Solihin",
        "peran": "Superintendent HSSE - Pengawasan SOP & Compliance",
        "divisi": "HSSE Leadership",
        "nomor": _nilai_env_hsse("WA_HSSE_SUPERINTENDENT", "WA_HSE_SUPERINTENDENT", "6281234567890")
    },
    "Admin HSSE": {
        "kategori": "Admin HSSE",
        "nama": "Andre & Della",
        "peran": "HSSE Finance & Administrasi Pekerja",
        "divisi": "Admin HSSE",
        "tim": ["Andre (Finance)", "Della (Administrasi Pekerja)"],
        "nomor": _nilai_env_hsse("WA_HSSE_ADMIN", "WA_HSE_ADMIN", "6281234567895")
    },
    "Umum": {
        "kategori": "Umum",
        "nama": "M. Solihin",
        "peran": "Superintendent HSSE PT Pertamina EP Lirik Field",
        "divisi": "HSSE Leadership",
        "nomor": _nilai_env_hsse("WA_HSSE_SUPERINTENDENT", "WA_HSE_SUPERINTENDENT", "6281234567890")
    },
    "Default": {
        "kategori": "Umum",
        "nama": "M. Solihin",
        "peran": "Superintendent HSSE PT Pertamina EP Lirik Field",
        "divisi": "HSSE Leadership",
        "nomor": _nilai_env_hsse("WA_HSSE_SUPERINTENDENT", "WA_HSE_SUPERINTENDENT", "6281234567890")
    }
}

TECHNICIAN_ROSTER = DAFTAR_PETUGAS_HSSE

# Alias kompatibilitas untuk integrasi yang masih memakai nama konfigurasi HSE.
NOMOR_WHATSAPP_HSE = NOMOR_WHATSAPP_HSSE
WHATSAPP_HSE_NUMBER = WHATSAPP_HSSE_NUMBER
DAFTAR_PETUGAS_HSE = DAFTAR_PETUGAS_HSSE

def dapatkan_petugas_per_kategori(kategori):
    """Mengambil informasi petugas HSSE yang bertanggung jawab untuk kategori tertentu."""
    if not kategori:
        return DAFTAR_PETUGAS_HSSE["Umum"]
    
    for kunci_cat, info_petugas in DAFTAR_PETUGAS_HSSE.items():
        if kunci_cat.lower() in kategori.lower():
            return info_petugas
            
    return DAFTAR_PETUGAS_HSSE["Umum"]

def get_technician_for_category(category):
    return dapatkan_petugas_per_kategori(category)

# Ambang Batas Relevansi Semantic Search
AMBANG_RELEVANSI_TINGGI = 0.55
AMBANG_RELEVANSI_SEDANG = 0.30

RELEVANCE_HIGH = AMBANG_RELEVANSI_TINGGI
RELEVANCE_MEDIUM = AMBANG_RELEVANSI_SEDANG

# Konfigurasi Model
NAMA_MODEL_EMBEDDING = "all-MiniLM-L6-v2"
EMBEDDING_MODEL_NAME = NAMA_MODEL_EMBEDDING

# Pengaturan Unggah Berkas
EKSTENSI_DIIZINKAN = {'png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'}
BATAS_UKURAN_FILE_MB = 10

ALLOWED_EXTENSIONS = EKSTENSI_DIIZINKAN
MAX_FILE_SIZE_MB = BATAS_UKURAN_FILE_MB

# Daftar kategori operasional dibentuk langsung dari knowledge.json. Roster HSSE
# tetap terpisah karena satu petugas dapat menangani beberapa kategori artikel.
def muat_kategori_knowledge():
    try:
        import json
        with open(JALUR_KNOWLEDGE_JSON, "r", encoding="utf-8") as file:
            entries = json.load(file)
        return sorted(
            {
                str(entry.get("kategori", "")).strip()
                for entry in entries
                if isinstance(entry, dict) and str(entry.get("kategori", "")).strip()
            },
            key=str.casefold,
        )
    except (OSError, ValueError, TypeError):
        return ["Umum"]


DAFTAR_KATEGORI = muat_kategori_knowledge()
CATEGORIES = DAFTAR_KATEGORI
