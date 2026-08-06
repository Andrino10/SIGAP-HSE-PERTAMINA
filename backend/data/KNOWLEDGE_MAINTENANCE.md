# Maintenance Knowledge Base HSE

`knowledge.json` adalah sumber tunggal artikel untuk pencarian chatbot dan
Direktori Knowledge Base. Backend memeriksa waktu perubahan file pada setiap
request dan memuat ulang artikel serta indeks pencarian secara otomatis setelah
file disimpan dalam keadaan valid.

## Struktur artikel wajib

Setiap artikel harus berisi:

- `id`: ID unik dan stabil, misalnya `HSE-LISTRIK-015`.
- `kategori`: nama kategori lengkap dan konsisten.
- `judul`: kondisi bahaya yang spesifik.
- `kata_kunci`: array frasa yang mungkin digunakan pelapor.
- `tingkat_risiko`: hanya `rendah`, `sedang`, atau `tinggi`.
- `penjelasan_risiko`: dampak yang spesifik terhadap kondisi tersebut.
- `solusi`: tiga tindakan berurutan yang dipisahkan dengan baris baru. Langkah
  pertama wajib berupa tindakan segera yang spesifik terhadap kondisi pada
  artikel; jangan memakai kalimat generik yang sama untuk bahaya berbeda.
- `referensi`: minimal dua object berisi `judul` dan URL `https://` menuju
  sumber resmi yang relevan dan masih berlaku.
- `tag`: array label ringkas untuk pencarian direktori.

Validator juga mensyaratkan format ID `HSE-KATEGORI-001`, sedikitnya tiga kata
kunci, sedikitnya dua tag, penjelasan risiko minimal 500 karakter, serta minimal
tiga langkah solusi yang bernomor urut. Langkah pertama wajib diawali
`1. Tindakan Segera:` dan akan ditolak bila masih memakai boilerplate generik.
Singkatan keselamatan umum seperti K3, APD, SOP, LOTO, dan MSDS dinormalisasi
oleh perintah `--fix`.

Setiap kategori dipertahankan pada sedikitnya 20 artikel. Penambahan artikel
harus membahas kondisi yang berbeda secara nyata, bukan menggandakan judul lama
atau sekadar mengganti lokasi dan shift. Referensi regulasi harus diperiksa pada
JDIH resmi sebelum dimasukkan atau diubah.

Tindakan segera harus menyebut respons awal yang benar-benar dapat dilakukan
untuk masalah tersebut, misalnya menghentikan sumber energi dari titik aman,
mengevakuasi pekerja dari paparan, menurunkan beban secara terkendali, atau
menahan izin kerja sampai persyaratannya terpenuhi. Jangan mengarahkan pekerja
yang tidak berwenang untuk menyentuh sumber listrik, bahan kimia, mesin, atau
peralatan berenergi.

## Alur penambahan artikel

1. Tambahkan object baru ke `knowledge.json` dan gunakan ID yang belum pernah
   dipakai.
2. Pastikan isi teknis dan tingkat risiko telah ditinjau personel HSE berwenang.
3. Jalankan validasi dari direktori proyek:

   ```powershell
   python backend/scripts/maintain_knowledge.py --check
   ```

4. Jika status `VALID`, buka ulang direktori atau kirim request baru. Backend
   akan memakai versi baru tanpa restart.

Perapihan mekanis dapat dijalankan dengan `--fix`. Perintah tersebut tidak
menulis pengetahuan teknis baru dan bukan pengganti tinjauan HSE.

## Kontrak kategori Asisten HSE

Asisten HSE menerima `categories` sebagai array berisi satu sampai lima nama
kategori yang tersedia di `knowledge.json`. Elemen pertama menjadi kategori
utama untuk penugasan awal petugas, sedangkan pencarian artikel dibatasi ke
seluruh kategori dalam array. Kategori `Umum` harus dipilih sendiri dan tidak
boleh digabungkan dengan kategori khusus.

Field lama `category` tetap diterima untuk kompatibilitas. Respons chatbot
mengembalikan keduanya: `category` sebagai kategori utama dan `categories`
sebagai daftar lengkap. Pesan WhatsApp menuliskan setiap kategori terpilih
tanpa menyertakan nomor tiket internal.

## Endpoint pemeriksaan

- `GET /api/knowledge`: seluruh artikel tanpa pembatasan jumlah.
- `GET /api/knowledge/categories`: seluruh kategori beserta jumlah artikel.
- `GET /api/knowledge/metadata`: status validasi, versi muat, dan ringkasan data.
- `GET /api/knowledge/<ID>`: satu artikel berdasarkan ID.

Jika perubahan JSON tidak valid, sistem mempertahankan versi valid terakhir dan
menampilkan kesalahan validasi melalui endpoint metadata.

Status `valid` menunjukkan kelengkapan struktur dan konsistensi mekanis. Status
tersebut bukan pengesahan teknis; perubahan dampak, tingkat risiko, standar, atau
langkah pengendalian tetap harus ditinjau dan disetujui personel HSE berwenang.
