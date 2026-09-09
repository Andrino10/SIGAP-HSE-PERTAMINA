# SIGAP-AI HSSE Companion
### Sistem Pendamping Keselamatan Kerja Cerdas — PT Pertamina EP Lirik Field

> Platform digital terintegrasi untuk **identifikasi bahaya, konsultasi K3, pelaporan kondisi tidak aman, eskalasi WhatsApp,** dan **pelacakan tiket** secara transparan dan real-time — tanpa login untuk pengguna umum.

---

## 📋 Daftar Isi

- [Gambaran Sistem](#-gambaran-sistem)
- [Tech Stack Frontend](#-tech-stack-frontend)
- [Tech Stack Backend](#-tech-stack-backend)
- [Kecerdasan Buatan AI](#-kecerdasan-buatan-ai)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Alur Penggunaan](#-alur-penggunaan)
- [Portal Admin](#-portal-admin)
- [Menjalankan Lokal](#-menjalankan-lokal)
- [Deploy ke Vercel](#-deploy-ke-vercel)
- [Struktur Direktori](#-struktur-direktori)
- [Catatan Penting](#-catatan-penting)

---

## 🏗️ Gambaran Sistem

SIGAP-AI HSSE Companion adalah aplikasi web fullstack yang dirancang khusus untuk mendukung operasional Health, Safety, Security, and Environment (HSSE) di PT Pertamina EP Lirik Field. Sistem ini memungkinkan pekerja lapangan melaporkan kondisi bahaya, berkonsultasi dengan asisten AI berbasis Knowledge Base K3, dan melacak perkembangan penanganan laporan secara transparan.

**Prinsip utama sistem:**
- Tanpa login untuk pelapor (aksesibel langsung dari lapangan)
- Tiket laporan unik dengan format HSE-YYYYMMDD-XXXX
- Knowledge Base berbasis 540+ artikel HSSE internal Pertamina
- Eskalasi otomatis via WhatsApp ke Tim HSSE Officer
- Portal Admin terpisah dengan autentikasi penuh

---

## 🖥️ Tech Stack Frontend

### Framework & Build Tool

| Teknologi | Versi | Peran |
|-----------|-------|-------|
| **Vue.js 3** | 3.x (Composition API) | Framework utama Single Page Application (SPA) |
| **Vite** | 6.x | Build tool & dev server (HMR super cepat) |
| **Vue Router** | 4.x | Client-side routing tanpa refresh halaman |

### Bahasa & Markup

| Teknologi | Peran |
|-----------|-------|
| **HTML5** | Struktur semantik seluruh halaman |
| **Vanilla CSS** | Desain sistem penuh — gradien, glassmorphism, animasi |
| **JavaScript (ES2022)** | Logic interaktif, API calls, state management |

### Desain & UI

| Komponen | Keterangan |
|----------|------------|
| **Google Fonts** | Outfit (heading), Inter (body) |
| **CSS Custom Properties** | Variabel warna Pertamina: Red #E11D48, Blue #1E40AF, Green #059669 |
| **CSS Grid & Flexbox** | Layout responsif seluruh halaman |
| **Animasi CSS** | Micro-animation, hover effect, fadeInUp, pulse |
| **SVG Icons** | Icon inline (eye toggle password, status indicator, dll) |

### Halaman Utama (SPA Routes)

| Route | Komponen | Fungsi |
|-------|----------|--------|
| `/` | HomeView.vue | Beranda — kategori, Golden Rules, tim HSSE, FAQ |
| `/chatbot` | ChatbotView.vue | Asisten HSSE AI + pilihan cepat + laporan resmi |
| `/knowledge` | KnowledgeView.vue | Knowledge Base 540+ artikel K3 searchable |
| `/ticket` | TicketView.vue | Cek perkembangan tiket laporan real-time |

### Admin Portal (Vanilla HTML/JS)

Terpisah dari SPA Vue, admin portal menggunakan HTML + Vanilla JS murni:
- `frontend/admin.html` — Struktur UI portal admin
- `frontend/admin.js` — Logic login, CRUD tiket, dashboard rekap
- `frontend/admin.css` — Stylesheet enterprise light theme Pertamina

---

## ⚙️ Tech Stack Backend

### Framework Utama

| Teknologi | Versi | Peran |
|-----------|-------|-------|
| **Python** | 3.12 | Bahasa utama backend |
| **Flask** | 3.0.3 | Micro web framework — REST API |
| **Flask-CORS** | 4.0.1 | Cross-Origin Resource Sharing untuk SPA |

### Arsitektur Backend (Layered)

```
backend/
├── app.py               # Flask app factory, registrasi blueprint
├── routes/              # Blueprint routes (consultation, complaint, admin)
├── controllers/         # Request handler & response formatter
├── services/            # Business logic (consultation, complaint)
├── repositories/        # Akses data (JSON file I/O dengan threading.RLock)
├── validators/          # Validasi input request (kategori, urgency, dll)
├── config/              # Settings & konstanta sistem
└── utils/               # Logger, helper functions
```

### Penyimpanan Data

| Jenis Data | Storage | Keterangan |
|------------|---------|------------|
| **Tiket Laporan** | JSON file (data/complaints.json) | CRUD tiket dengan history audit log |
| **Sesi Chat** | JSON file (data/sessions/) | Riwayat percakapan per sesi (TTL 24 jam) |
| **Knowledge Base** | JSON file (data/knowledge.json) | 540+ artikel HSSE terstruktur |
| **Admin Credentials** | Environment Variable | Username & password admin via .env |

> **Catatan Vercel:** Filesystem Vercel bersifat ephemeral (read-only kecuali /tmp). Data tiket dan sesi bisa hilang saat instance di-recycle. Untuk produksi permanen, gunakan database terkelola (PostgreSQL, MongoDB).

---

## 🤖 Kecerdasan Buatan (AI)

SIGAP-AI menggunakan **sistem retrieval berbasis Knowledge Base lokal** — bukan memanggil API AI eksternal berbayar seperti OpenAI GPT atau Google Gemini. Seluruh kecerdasan berjalan **offline/on-premise**.

### Mekanisme AI

#### 1. Pencarian Leksikal (Default / Production)

Digunakan di Vercel dan lingkungan serverless:
- **Algoritma:** TF-IDF inspired keyword matching + category filter
- **Cara kerja:** Query pengguna dipecah menjadi token, lalu dicocokkan dengan artikel di knowledge.json
- **Keunggulan:** Ringan, cepat, tanpa dependensi GPU/ML besar
- **Diaktifkan via:** `SIGAP_DISABLE_SEMANTIC_SEARCH=1` (default)

#### 2. Pencarian Semantik (Opsional / Lokal)

Dapat diaktifkan di lingkungan lokal dengan hardware memadai:

| Library | Versi | Peran |
|---------|-------|-------|
| **sentence-transformers** | 3.0.1 | Model embedding teks (kalimat → vektor numerik) |
| **FAISS** (faiss-cpu) | 1.8.0 | Pencarian vektor cepat (Facebook AI Similarity Search) |
| **PyTorch** | 2.3.1 | Runtime ML untuk model transformer |
| **Transformers** (HuggingFace) | 4.41.2 | Model NLP backbone |
| **NumPy & SciPy** | 1.26.4 / 1.13.1 | Komputasi numerik & statistik |
| **scikit-learn** | >=1.5.0 | Preprocessing teks, normalisasi |

**Cara kerja semantic search:**
1. Setiap artikel di `knowledge.json` diubah menjadi vektor 768 dimensi oleh model sentence-transformer
2. Ketika user bertanya, pertanyaan juga diubah menjadi vektor
3. FAISS mencari artikel dengan **cosine similarity tertinggi** terhadap vektor pertanyaan
4. Hasil teratas dikembalikan sebagai konteks jawaban chatbot

#### 3. Knowledge Base (Prinsip RAG)

Sistem ini menerapkan prinsip **RAG (Retrieval Augmented Generation)** versi sederhana tanpa LLM eksternal:
- Knowledge disimpan lokal di `data/knowledge.json` (540+ artikel HSSE)
- Setiap artikel berisi: id, title, category, content, source, tags, risk_level
- Retrieval dilakukan oleh engine leksikal/semantik
- Response chatbot dirangkai dari hasil retrieval + template respons terstruktur

### Referensi & Acuan K3

Knowledge Base dibangun mengacu pada:

| Dokumen Acuan | Keterangan |
|---------------|------------|
| **UU No. 1 Tahun 1970** | Undang-Undang Keselamatan Kerja Indonesia |
| **Permenaker No. 09 Tahun 2016** | K3 Bekerja Pada Ketinggian |
| **Permenaker No. 04 Tahun 1980** | APAR (Alat Pemadam Api Ringan) |
| **SNI & ISO 45001** | Sistem Manajemen K3 Internasional |
| **Dokumen Internal Pertamina** | SOP, SIMOPS, PTW (Permit to Work), JSA |
| **HSSE-HEI-XXX Series** | Standar HSSE Engineering Internal Pertamina EP |

---

## 🔄 Arsitektur Sistem

```
USER BROWSER
  |
  |-- Vue.js 3 SPA (Vite Build -> /dist)
  |   HomeView | ChatbotView | KnowledgeView | TicketView
  |
  |-- REST API calls -->
  |
  |-- Flask Backend (Python 3.12)
  |   /api/consultation  ->  ConsultationService
  |   /api/complaint     ->  ComplaintService
  |   /api/admin/*       ->  AdminController
  |   /api/knowledge     ->  KnowledgeRepository
  |       |
  |       +-- AI Retrieval Engine
  |           Lexical Search (TF-IDF) OR
  |           Semantic Search (FAISS + sentence-transformers)
  |               |
  |               +-- knowledge.json (540+ artikel HSSE)
  |               +-- complaints.json (tiket laporan)
  |               +-- sessions/ (riwayat chat)

Hosting: Vercel (Serverless Functions untuk Flask, Static untuk Vue dist)
Live: https://sigap-hse-pertamina-01.vercel.app
```

---

## 🛡️ Portal Admin

Admin portal berada di `/admin` dan memerlukan autentikasi.

### Fitur Admin

| Fitur | Keterangan |
|-------|------------|
| **Dashboard** | Statistik total tiket, per-status, per-kategori |
| **Kelola Tiket** | Lihat detail, update status, assign petugas, tambah pesan |
| **Rekapitulasi** | Laporan tiket berdasarkan periode dan kategori |
| **Logout Otomatis** | Sesi JWT kedaluwarsa otomatis untuk keamanan |
| **Toggle Password** | Tombol mata (ikon eye) untuk show/hide password saat login |

### Kredensial Admin

Dikonfigurasi via Environment Variables:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password_rahasia>
ADMIN_JWT_SECRET=<secret_key_panjang>
```

---

## 🚀 Menjalankan Lokal

### Prasyarat
- Python 3.12+
- Node.js 18+
- npm

### 1. Clone & Setup Backend

```powershell
git clone https://github.com/Andrino10/SIGAP-HSE-PERTAMINA.git
cd SIGAP-HSE-PERTAMINA

pip install -r requirements.txt

$env:SIGAP_DISABLE_SEMANTIC_SEARCH='1'
python -m flask --app app run --host 127.0.0.1 --port 5000
```

### 2. Build Frontend (Vue SPA)

```powershell
cd frontend
npm install
npm run build
```

### 3. Dev Mode Frontend (Hot Reload)

```powershell
cd frontend
npm run dev
```

### 4. Aktifkan Semantic Search (Opsional)

```powershell
pip install -r requirements-ai.txt
python -m flask --app app run --host 127.0.0.1 --port 5000
```

---

## ☁️ Deploy ke Vercel

1. Push repository ke GitHub (branch `main`)
2. Import project di vercel.com dengan **Root Directory = root repository** (`SIGAP-HSSE-LIRIK`), bukan `frontend/`. Root repository memuat Function Flask di `api/index.py`; bila root diarahkan ke `frontend/`, semua request `/api/*` akan jatuh ke halaman SPA dan login/tiket tidak dapat bekerja.
3. Set Framework Preset ke _Other_. Build dan output frontend sudah ditentukan oleh `vercel.json`.
4. Set Environment Variables:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password_kuat>
ADMIN_JWT_SECRET=<random_string_64_char>
SIGAP_ADMIN_SESSION_SECRET=<random_string_64_char>
SIGAP_DISABLE_SEMANTIC_SEARCH=1
```

5. Deploy — Vercel otomatis deploy setiap `git push`
6. Verifikasi: `https://<domain>.vercel.app/api/health`

Endpoint tersebut wajib mengembalikan JSON dengan `"success": true`, bukan HTML aplikasi. Setelah itu uji alur: buat laporan → login admin → konfirmasi/update tiket → cek nomor tiket pada halaman publik.

**Live URL:** https://sigap-hse-pertamina-01.vercel.app

---

## 📁 Struktur Direktori

```
SIGAP-HSSE-LIRIK/
|
+-- app.py                    # Entrypoint Flask (production)
+-- requirements.txt          # Dependensi produksi (Flask, CORS)
+-- requirements-ai.txt       # Dependensi AI lokal (PyTorch, FAISS, dll)
+-- vercel.json               # Konfigurasi routing Vercel
+-- runtime.txt               # Python version pin (3.12)
|
+-- backend/                  # Logika server Python
|   +-- app.py                # Flask factory & blueprint registration
|   +-- routes/               # REST API blueprint
|   +-- controllers/          # Request handlers
|   +-- services/             # Business logic & AI retrieval
|   |   +-- consultation_service.py  # Chatbot AI + KB retrieval
|   |   +-- complaint_service.py     # Tiket laporan CRUD
|   +-- repositories/         # Data access layer (JSON I/O thread-safe)
|   +-- validators/           # Input validation & category mapping
|   +-- config/               # Settings, konstanta
|   +-- utils/                # Logger, helpers
|
+-- data/                     # Penyimpanan data JSON
|   +-- knowledge.json        # 540+ artikel HSSE Knowledge Base
|   +-- complaints.json       # Database tiket laporan
|   +-- sessions/             # Riwayat sesi percakapan
|
+-- frontend/                 # Semua kode antarmuka pengguna
    +-- src/                  # Source Vue.js SPA
    |   +-- views/            # Halaman (Home, Chatbot, Knowledge, Ticket)
    |   +-- components/       # Komponen reusable (modal, navbar, dll)
    |   +-- composables/      # Vue composables (useModal, dll)
    |   +-- services/         # API client (fetch calls)
    |   +-- router/           # Vue Router konfigurasi
    |   +-- styles/           # CSS global (style.css, admin.css)
    +-- dist/                 # Build output (di-serve oleh Flask)
    +-- admin.html            # Portal admin (Vanilla HTML)
    +-- admin.js              # Portal admin JavaScript
    +-- admin.css             # Portal admin stylesheet
    +-- vite.config.js        # Konfigurasi Vite builder
```

---

## ⚠️ Catatan Penting

### Keamanan
- Password admin disimpan di Environment Variable, tidak di source code
- Sesi admin menggunakan JWT dengan expiry
- Input pengguna divalidasi di backend melalui validators/request_validator.py
- CORS dikonfigurasi hanya untuk origin yang diizinkan

### Keterbatasan Vercel
- Filesystem Vercel bersifat ephemeral — data di /tmp bisa hilang saat instance di-restart
- Tiket dan sesi yang tersimpan di JSON file tidak persisten di Vercel production
- Untuk data audit permanen, gunakan layanan database eksternal (Supabase, PlanetScale, MongoDB Atlas)

### AI & Privacy
- Sistem AI berjalan sepenuhnya offline — tidak mengirim data ke layanan AI eksternal
- Knowledge Base berbasis dokumen internal Pertamina, tidak bergantung pada model cloud
- Data laporan pekerja tidak keluar dari infrastruktur sistem

---

## 👥 Pengembang

Dikembangkan untuk mendukung operasional HSSE PT Pertamina EP Lirik Field.

**Versi:** 1.0.0
**Tahun:** 2026
**Lisensi:** Internal Use Only — PT Pertamina EP

---

*SIGAP-AI HSSE Companion — Keselamatan kerja, ditangani lebih cepat dan tepat.*
