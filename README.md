# SIGAP-AI HSE Companion

Aplikasi Flask dan frontend statis untuk konsultasi, pelaporan kondisi bahaya, serta eskalasi WhatsApp ke Tim HSE.

## Menjalankan secara lokal

```powershell
$env:SIGAP_DISABLE_SEMANTIC_SEARCH='1'
python -m flask --app app run --host 127.0.0.1 --port 5000
```

Buka `http://127.0.0.1:5000`. Frontend dan API menggunakan origin yang sama.

## Deploy ke Vercel melalui Git

1. Salin `.env.example` sebagai acuan dan isi nomor WhatsApp resmi di Vercel Project Settings → Environment Variables.
2. Push repository ke GitHub, GitLab, atau Bitbucket.
3. Import repository tersebut melalui Vercel.
4. Pastikan Framework Preset terdeteksi sebagai **Flask** dan Root Directory mengarah ke root repository.
5. Biarkan Build Command dan Output Directory kosong, lalu deploy.
6. Setelah deployment selesai, periksa `/api/health`, lalu uji kategori, chatbot, dan formulir WhatsApp.

Entrypoint production berada di `app.py`. Python 3.12 ditetapkan melalui `.python-version`, sedangkan dependency production berada di `requirements.txt`.

## Catatan penyimpanan Vercel

Filesystem Vercel Function bersifat read-only selain direktori sementara `/tmp`. Karena itu, sesi percakapan dan tiket JSON menggunakan storage sementara saat berjalan di Vercel. Data dapat hilang ketika instance di-recycle dan tidak cocok sebagai penyimpanan audit permanen. Gunakan database terkelola jika riwayat laporan harus persisten.

Dependency AI lokal yang berukuran besar dipisahkan ke `requirements-ai.txt` dan tidak disertakan ke bundle Vercel.
