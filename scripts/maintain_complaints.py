"""Skrip pemeliharaan database laporan keluhan/temuan HSSE (complaints.json).

Memastikan seluruh data keluhan:
1. Menggunakan 27 kategori resmi SIGAP HSSE PT Pertamina EP Lirik Field.
2. Memperbaiki penamaan kategori non-standar (contoh: 'Bahan Kimia B3' -> 'Bahan Kimia & B3').
3. Memutakhirkan 17 entri peninggalan lawas (IT CMP) menjadi temuan bahaya HSSE realistis.
4. Menyelaraskan data/storage/complaints.json dan backend/data/storage/complaints.json.
"""

import json
import os
import shutil

HSSE_REPLACEMENTS = [
    {
        "id": "HSE-20260901-D009",
        "ticket_number": "HSE-20260901-D009",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Rian Hidayat",
        "division": "Produksi",
        "location": "Separator Pit SP 2 Lirik",
        "occurrence_date": "2026-09-01",
        "category": "Lingkungan Kerja",
        "categories": ["Lingkungan Kerja"],
        "finding_type": "Unsafe Condition",
        "description": "Lampu penerangan di area separator pit SP 2 mati total. Visibilitas malam hari sangat rendah dan berisiko memicu pekerja terperosok ke grating selokan.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "Closed / Resolved",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "Lampu sorot LED explosion-proof telah diganti oleh teknisi kelistrikan. Pengujian pencahayaan malam hari menunjukkan lux meter sudah sesuai standar (>100 lux).",
        "admin_message": "Saudara Rian, lampu explosion-proof di separator pit SP 2 telah diganti baru. Terima kasih atas laporan kewaspadaan Anda.",
        "history": [
            {"timestamp": "2026-09-01T08:15:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Rian Hidayat", "notes": "Laporan kondisi bahaya berhasil disampaikan ke sistem SIGAP HSE."},
            {"timestamp": "2026-09-01T08:45:00.000000", "action": "Tiket didisposisikan ke: Juni Trihardiyanto", "previous_status": "Open", "status": "Open", "actor": "Admin HSSE", "notes": "Tanggung jawab tiket dialihkan ke Juni Trihardiyanto."},
            {"timestamp": "2026-09-01T09:00:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Admin HSSE", "notes": "Penggantian modul lampu LED explosion-proof sedang dilakukan."},
            {"timestamp": "2026-09-01T15:30:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "Admin HSSE", "notes": "Lampu baru terpasang dan lux meter terverifikasi."}
        ],
        "created_at": "2026-09-01T08:15:00.000000",
        "updated_at": "2026-09-01T15:30:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260901-D010",
        "ticket_number": "HSE-20260901-D010",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Bambang Sudiro",
        "division": "Logistik & Pergudangan",
        "location": "Gudang Material Lirik",
        "occurrence_date": "2026-09-01",
        "category": "Ergonomi",
        "categories": ["Ergonomi"],
        "finding_type": "Unsafe Act",
        "description": "Dua pekerja memindahkan valve besi 4 inch seberat ±45 kg secara manual tanpa alat bantu angkut (hand pallet / crane gantri), membungkuk dengan postur tubuh berisiko cedera punggung.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "Closed / Resolved",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "Pekerja diberikan coaching teknik manual handling dan diwajibkan menggunakan crane overhead atau forklift mini untuk beban di atas 25 kg.",
        "admin_message": "Saudara Bambang, pekerja terkait telah diberikan pembinaan manual handling aman dan fasilitas alat angkat di gudang telah difungsikan. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-01T10:00:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Bambang Sudiro", "notes": "Laporan tindakan tidak aman berhasil disampaikan ke sistem SIGAP HSE."},
            {"timestamp": "2026-09-01T10:30:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Admin HSSE", "notes": "Superintendent gudang memberikan pengarahan manual handling."},
            {"timestamp": "2026-09-01T14:00:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "Admin HSSE", "notes": "Pelatihan singkat postur angkat beban dan pengoperasian hand pallet selesai."}
        ],
        "created_at": "2026-09-01T10:00:00.000000",
        "updated_at": "2026-09-01T14:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260902-D011",
        "ticket_number": "HSE-20260902-D011",
        "source": "chatbot_escalation",
        "chat_session_id": "SESS-20260902-F101",
        "reporter_name": "Dedi Kurniawan",
        "division": "Operasi Lapangan",
        "location": "Stasiun Pengumpul Buatan",
        "occurrence_date": "2026-09-02",
        "category": "Kelelahan & Jam Kerja",
        "categories": ["Kelelahan & Jam Kerja"],
        "finding_type": "Unsafe Condition",
        "description": "Operator shift malam di SP Buatan bekerja 16 jam berturut-turut karena pengganti shift pagi berhalangan hadir. Tingkat kelelahan berisiko memicu hilangnya konsentrasi saat pemantauan tekanan boiler.",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Closed / Resolved",
        "assigned_to": "M. Solihin",
        "assigned_engineer": "M. Solihin",
        "follow_up_notes": "Relief operator cadangan segera dikerahkan ke lokasi. Operator yang bertugas 16 jam diistirahatkan wajib tidur. Manajemen jadwal shift dievaluasi.",
        "admin_message": "Laporan kelelahan jam kerja telah ditindaklanjuti segera. Operator relief telah bertugas dan jadwal jaga telah disesuaikan dengan regulasi jam kerja aman. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-02T06:30:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Dedi Kurniawan", "notes": "Eskalasi darurat chatbot mengenai fatigue jam kerja."},
            {"timestamp": "2026-09-02T06:50:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "M. Solihin", "notes": "Relief operator diberangkatkan ke SP Buatan."},
            {"timestamp": "2026-09-02T08:15:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "M. Solihin", "notes": "Handover selesai, operator lama dipulangkan untuk istirahat pemulihan."}
        ],
        "created_at": "2026-09-02T06:30:00.000000",
        "updated_at": "2026-09-02T08:15:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260902-D012",
        "ticket_number": "HSE-20260902-D012",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Hendri Saputra",
        "division": "Pemeliharaan Sipil",
        "location": "Wellpad L-09",
        "occurrence_date": "2026-09-02",
        "category": "Penggunaan Tangga",
        "categories": ["Penggunaan Tangga"],
        "finding_type": "Unsafe Condition",
        "description": "Tangga portable aluminium yang digunakan mengecat tangki penampung tidak diikat pada struktur penopang kokoh dan diletakkan pada permukaan tanah yang gembur tanpa landasan papan.",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Closed / Resolved",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "Pekerjaan dihentikan. Disediakan base plate kayu keras serta tali tambatan tangga di sisi atas. Pekerja mengenakan full body harness tersangkut lifeline.",
        "admin_message": "Saudara Hendri, kondisi tangga kerja di Wellpad L-09 telah dipasang safety tie-off dan base pad kokoh. Terima kasih atas kepedulian keselamatan kerja Anda.",
        "history": [
            {"timestamp": "2026-09-02T09:10:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Hendri Saputra", "notes": "Laporan kondisi bahaya berhasil disampaikan ke sistem SIGAP HSE."},
            {"timestamp": "2026-09-02T09:30:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Admin HSSE", "notes": "Safety officer mengamankan tangga dan memasang tali pengikat."},
            {"timestamp": "2026-09-02T11:00:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "Admin HSSE", "notes": "Verifikasi kestabilan tangga selesai dan pekerjaan dilanjutkan aman."}
        ],
        "created_at": "2026-09-02T09:10:00.000000",
        "updated_at": "2026-09-02T11:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260902-D013",
        "ticket_number": "HSE-20260902-D013",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Agus Salim",
        "division": "Workshop Mekanik TOPSIP",
        "location": "Bengkel TOPSIP Lirik",
        "occurrence_date": "2026-09-02",
        "category": "Peralatan Kerja",
        "categories": ["Peralatan Kerja"],
        "finding_type": "Unsafe Condition",
        "description": "Batu gerinda tangan 4 inch ditemukan dalam kondisi retak halus di dekat ring pengunci, namun masih terpasang pada mesin gerinda tanpa penutup pelindung (guard).",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Closed / Resolved",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "Batu gerinda yang retak langsung dilepas, dirusak agar tidak terpakai lagi, dan diganti batu baru bersertifikat. Guard penutup wajib dipasang sebelum alat dioperasikan.",
        "admin_message": "Saudara Agus, batu gerinda berbahaya telah disita dan dimusnahkan. Mesin telah dilengkapi cover guard pelindung penuh. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-02T11:20:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Agus Salim", "notes": "Laporan kondisi bahaya berhasil disampaikan ke sistem SIGAP HSE."},
            {"timestamp": "2026-09-02T11:40:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Admin HSSE", "notes": "Isolasi alat dan penggantian batu gerinda dengan guard baru."},
            {"timestamp": "2026-09-02T13:15:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "Admin HSSE", "notes": "Inspeksi alat kerja bengkel TOPSIP dinyatakan tuntas."}
        ],
        "created_at": "2026-09-02T11:20:00.000000",
        "updated_at": "2026-09-02T13:15:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260902-D014",
        "ticket_number": "HSE-20260902-D014",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Rahmat Darmawan",
        "division": "Produksi",
        "location": "Jalur Pipa Gathering SP 3",
        "occurrence_date": "2026-09-02",
        "category": "Investigasi & Insiden",
        "categories": ["Investigasi & Insiden"],
        "finding_type": "Unsafe Condition",
        "description": "Laporan Kejadian Nyaris Celaka (Near Miss): Pekerja patroli pipa tergelincir di jembatan titian penyeberangan pipa karena lumpur licin tanpa anti-slip. Pekerja tidak jatuh ke parit pipa.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "Closed / Resolved",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "Jembatan titian pipa telah dibersihkan dari lumpur dan dipasangi grating baja anti-slip serrated serta handrail pengaman sisi kanan-kiri.",
        "admin_message": "Saudara Rahmat, laporan Near Miss telah ditindaklanjuti dengan pemasangan grating anti-slip dan handrail pada titian pipa. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-02T14:10:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Rahmat Darmawan", "notes": "Laporan Near Miss berhasil disampaikan ke sistem SIGAP HSE."},
            {"timestamp": "2026-09-02T14:35:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Admin HSSE", "notes": "Pembersihan lumpur dan fabrikasi grating anti-slip."},
            {"timestamp": "2026-09-02T17:00:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "Admin HSSE", "notes": "Pemasangan grating anti-slip dan handrail selesai diverifikasi."}
        ],
        "created_at": "2026-09-02T14:10:00.000000",
        "updated_at": "2026-09-02T17:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260902-D015",
        "ticket_number": "HSE-20260902-D015",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Siti Nurhaliza",
        "division": "General Affairs",
        "location": "Kantin Mess Karyawan Lirik",
        "occurrence_date": "2026-09-02",
        "category": "Higienitas & Konsumsi",
        "categories": ["Higienitas & Konsumsi"],
        "finding_type": "Unsafe Condition",
        "description": "Dispenser air minum galon di ruang makan mess ditemukan tidak diganti filternya selama 4 bulan dan terdapat lumut pada selang sanitasi internal.",
        "urgency": "Rendah",
        "risk_level": "Rendah",
        "status": "Closed / Resolved",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "Dispenser telah dikuras dan disterilisasi dengan food-grade sanitizing agent. Selang internal diganti baru dan jadwal inspeksi sanitasi bulanan ditetapkan.",
        "admin_message": "Saudari Siti, dispenser air minum telah disterilisasi penuh dan selang diganti baru. Kualitas air minum terjaga. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-02T15:30:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Siti Nurhaliza", "notes": "Laporan higienitas air minum dicatat di sistem."},
            {"timestamp": "2026-09-02T16:00:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Admin HSSE", "notes": "Sterilisasi dispenser dan pergantian selang sanitasi."},
            {"timestamp": "2026-09-02T18:00:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "Admin HSSE", "notes": "Pemeriksaan sanitasi air minum tuntas dan aman dikonsumsi."}
        ],
        "created_at": "2026-09-02T15:30:00.000000",
        "updated_at": "2026-09-02T18:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260902-D016",
        "ticket_number": "HSE-20260902-D016",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Taufik Ismail",
        "division": "Operasi Rig",
        "location": "Wellpad L-14",
        "occurrence_date": "2026-09-02",
        "category": "Pelatihan & Kompetensi",
        "categories": ["Pelatihan & Kompetensi"],
        "finding_type": "Unsafe Act",
        "description": "Petugas rigger pembantu pada aktivitas pengangkatan separator baru belum memiliki sertifikat kompetensi Rigger Migas yang masih berlaku (masa berlaku habis 2 bulan lalu).",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Closed / Resolved",
        "assigned_to": "M. Solihin",
        "assigned_engineer": "M. Solihin",
        "follow_up_notes": "Rigger terkait digantikan oleh personel bersertifikat aktif. Personel yang masa berlakunya habis didaftarkan ke program re-sertifikasi BNSP Migas.",
        "admin_message": "Saudara Taufik, penggantian personel rigger bersertifikat aktif telah dilakukan di lokasi dan jadwal ujian sertifikasi ulang telah diagendakan. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-02T16:45:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Taufik Ismail", "notes": "Laporan gap sertifikasi kompetensi rigger."},
            {"timestamp": "2026-09-02T17:05:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "M. Solihin", "notes": "Disposisi rigger bersertifikat aktif dari pool tenaga kerja."},
            {"timestamp": "2026-09-02T18:30:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "M. Solihin", "notes": "Penggantian personel tuntas, pekerjaan lifting dapat dilanjutkan."}
        ],
        "created_at": "2026-09-02T16:45:00.000000",
        "updated_at": "2026-09-02T18:30:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D017",
        "ticket_number": "HSE-20260903-D017",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Bayu Nugroho",
        "division": "Keamanan & Pengamanan",
        "location": "Area Parkir Tangki T-01 Lirik",
        "occurrence_date": "2026-09-03",
        "category": "Perilaku & Disiplin Kerja",
        "categories": ["Perilaku & Disiplin Kerja"],
        "finding_type": "Unsafe Act",
        "description": "Ditemukan oknum pekerja kontraktor merokok di dekat batas pagar area tangki T-01 (di luar designated smoking area resmi yang berjarak 50 meter).",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Closed / Resolved",
        "assigned_to": "M. Solihin",
        "assigned_engineer": "M. Solihin",
        "follow_up_notes": "Rokok segera dimatikan. Pekerja diberikan Surat Peringatan (SP) dan diwajibkan mengikuti induksi ulang Corporate Life Saving Rules (CLSR) No Smoking.",
        "admin_message": "Saudara Bayu, tindakan penegakan disiplin CLSR telah diambil tegas terhadap pelanggar. Lokasi aman dari sumber api terbuka. Terima kasih atas ketegasan Anda.",
        "history": [
            {"timestamp": "2026-09-03T07:45:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Bayu Nugroho", "notes": "Laporan pelanggaran CLSR merokok di area terbatas."},
            {"timestamp": "2026-09-03T08:00:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "M. Solihin", "notes": "Pemeriksaan identitas dan penerbitan sanksi disiplin CLSR."},
            {"timestamp": "2026-09-03T10:00:00.000000", "action": "Status diubah dari 'In Progress' menjadi 'Closed / Resolved'", "previous_status": "In Progress", "status": "Closed / Resolved", "actor": "M. Solihin", "notes": "Induksi ulang CLSR dan surat teguran kontraktor diterbitkan."}
        ],
        "created_at": "2026-09-03T07:45:00.000000",
        "updated_at": "2026-09-03T10:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D018",
        "ticket_number": "HSE-20260903-D018",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Arif Wibisono",
        "division": "Operasi Lapangan",
        "location": "Wellpad L-03",
        "occurrence_date": "2026-09-03",
        "category": "Koordinasi & SIMOPS",
        "categories": ["Koordinasi & SIMOPS"],
        "finding_type": "Unsafe Condition",
        "description": "Aktivitas pengangkatan pipa dengan mobile crane berjalan bersamaan (SIMOPS) dengan pekerjaan panas gerinda pada jarak 8 meter tanpa ada SIMOPS permit dan komunikasi radio aktif.",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "In Progress",
        "assigned_to": "M. Solihin",
        "assigned_engineer": "M. Solihin",
        "follow_up_notes": "Kedua pekerjaan dihentikan sementara oleh Safety Lead. Rapat koordinasi SIMOPS sedang dilakukan untuk menentukan pembagian jam kerja dan safety zone.",
        "admin_message": "Saudara Arif, pekerjaan SIMOPS di Wellpad L-03 telah dihentikan sementara untuk sinkronisasi izin kerja dan zonasi aman. Terima kasih.",
        "history": [
            {"timestamp": "2026-09-03T08:30:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Arif Wibisono", "notes": "Laporan konflik aktivitas SIMOPS tanpa koordinasi."},
            {"timestamp": "2026-09-03T08:50:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "M. Solihin", "notes": "Pekerjaan dijeda, pengawas kedua tim dipanggil untuk koordinasi SIMOPS."}
        ],
        "created_at": "2026-09-03T08:30:00.000000",
        "updated_at": "2026-09-03T08:50:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D019",
        "ticket_number": "HSE-20260903-D019",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Luki Hermawan",
        "division": "Gudang B3",
        "location": "Gudang Bahan Kimia SP 1",
        "occurrence_date": "2026-09-03",
        "category": "Standar & Regulasi",
        "categories": ["Standar & Regulasi"],
        "finding_type": "Unsafe Condition",
        "description": "Lembar Data Keselamatan Bahan (MSDS / SDS) untuk chemical demulsifier dan corrosion inhibitor tidak terpasang di papan informasi gudang kimia.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "In Progress",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "File SDS resmi dari pabrikan sedang dicetak ulang laminasi dan dipasang di pintu masuk gudang serta dekat rak penyimpanan.",
        "admin_message": "Saudara Luki, dokumen SDS terbaru sedang dipasang di papan informasi gudang kimia. Terima kasih atas pengawasan regulasi Anda.",
        "history": [
            {"timestamp": "2026-09-03T09:15:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Luki Hermawan", "notes": "Laporan kelengkapan dokumen SDS/MSDS B3."},
            {"timestamp": "2026-09-03T09:40:00.000000", "action": "Status diubah dari 'Open' menjadi 'In Progress'", "previous_status": "Open", "status": "In Progress", "actor": "Juni Trihardiyanto", "notes": "Pencetakan SDS versi bahasa Indonesia dan laminasi tahan cuaca."}
        ],
        "created_at": "2026-09-03T09:15:00.000000",
        "updated_at": "2026-09-03T09:40:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D020",
        "ticket_number": "HSE-20260903-D020",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Dani Prasetya",
        "division": "Pemeliharaan Mekanik",
        "location": "Workshop TOPSIP",
        "occurrence_date": "2026-09-03",
        "category": "Budaya Keselamatan",
        "categories": ["Budaya Keselamatan"],
        "finding_type": "Unsafe Condition",
        "description": "Housekeeping buruk di area walkway workshop: ceceran pelumas oli pelat lantai tidak langsung dibersihkan dan serbuk gergaji penyerap dibiarkan berserakan lebih dari 24 jam.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "Open",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "",
        "admin_message": "",
        "history": [
            {"timestamp": "2026-09-03T10:05:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Dani Prasetya", "notes": "Laporan housekeeping dan bahaya terpeleset di workshop."}
        ],
        "created_at": "2026-09-03T10:05:00.000000",
        "updated_at": "2026-09-03T10:05:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D021",
        "ticket_number": "HSE-20260903-D021",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Rudi Hartono",
        "division": "Operasi Lapangan",
        "location": "Manifold Wellpad L-07",
        "occurrence_date": "2026-09-03",
        "category": "Manajemen Risiko",
        "categories": ["Manajemen Risiko"],
        "finding_type": "Unsafe Act",
        "description": "Pekerjaan flushing pipa injeksi dimulai tanpa Job Safety Analysis (JSA) yang telah ditandatangani oleh Pengawas Lapangan dan Safety Officer.",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Open",
        "assigned_to": "M. Solihin",
        "assigned_engineer": "M. Solihin",
        "follow_up_notes": "",
        "admin_message": "",
        "history": [
            {"timestamp": "2026-09-03T10:25:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Rudi Hartono", "notes": "Laporan pekerjaan tanpa otorisasi JSA lengkap."}
        ],
        "created_at": "2026-09-03T10:25:00.000000",
        "updated_at": "2026-09-03T10:25:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D022",
        "ticket_number": "HSE-20260903-D022",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Yudi Permana",
        "division": "HSSE Assurance",
        "location": "Kantor Utama Lirik",
        "occurrence_date": "2026-09-03",
        "category": "Audit & Sistem Manajemen K3",
        "categories": ["Audit & Sistem Manajemen K3"],
        "finding_type": "Unsafe Condition",
        "description": "Ditemukan ketidaksesuaian (gap) checklist inspeksi bulanan peralatan keselamatan: catatan inspeksi APAR di gedung administrasi tidak diperbarui selama 2 bulan.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "Open",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "",
        "admin_message": "",
        "history": [
            {"timestamp": "2026-09-03T11:00:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Yudi Permana", "notes": "Temuan audit internal sistem manajemen inspeksi K3."}
        ],
        "created_at": "2026-09-03T11:00:00.000000",
        "updated_at": "2026-09-03T11:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D023",
        "ticket_number": "HSE-20260903-D023",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Agung Laksono",
        "division": "Operasi Komunikasi",
        "location": "Gate 1 Utama Lirik",
        "occurrence_date": "2026-09-03",
        "category": "Komunikasi & Pelaporan",
        "categories": ["Komunikasi & Pelaporan"],
        "finding_type": "Unsafe Condition",
        "description": "Papan informasi nomor darurat HSSE dan jalur evakuasi di dekat pos security gate 1 pudar terkena cuaca panas/hujan sehingga nomor ekstensi darurat tidak terbaca.",
        "urgency": "Rendah",
        "risk_level": "Rendah",
        "status": "Open",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "",
        "admin_message": "",
        "history": [
            {"timestamp": "2026-09-03T11:30:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Agung Laksono", "notes": "Laporan papan signage darurat tidak terbaca."}
        ],
        "created_at": "2026-09-03T11:30:00.000000",
        "updated_at": "2026-09-03T11:30:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D024",
        "ticket_number": "HSE-20260903-D024",
        "source": "direct_form",
        "chat_session_id": None,
        "reporter_name": "Zulkifli",
        "division": "Produksi",
        "location": "Jembatan Penyeberangan Pipa Ukui",
        "occurrence_date": "2026-09-03",
        "category": "Pengawasan & Prosedur",
        "categories": ["Pengawasan & Prosedur"],
        "finding_type": "Unsafe Condition",
        "description": "Rambu peringatan 'Bahaya Pipa Gas Tekanan Tinggi' di dekat jalan perlintasan warga hilang tersapu banjir kecil beberapa hari lalu.",
        "urgency": "Sedang",
        "risk_level": "Sedang",
        "status": "Open",
        "assigned_to": "Juni Trihardiyanto",
        "assigned_engineer": "Juni Trihardiyanto",
        "follow_up_notes": "",
        "admin_message": "",
        "history": [
            {"timestamp": "2026-09-03T12:00:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Zulkifli", "notes": "Laporan rambu bahaya gas hilang di perlintasan umum."}
        ],
        "created_at": "2026-09-03T12:00:00.000000",
        "updated_at": "2026-09-03T12:00:00.000000",
        "attachment": None
    },
    {
        "id": "HSE-20260903-D025",
        "ticket_number": "HSE-20260903-D025",
        "source": "chatbot_escalation",
        "chat_session_id": "SESS-20260903-Z700",
        "reporter_name": "Iwan Falsafah",
        "division": "Fasilitas Produksi",
        "location": "Area Flare Stack Lirik",
        "occurrence_date": "2026-09-03",
        "category": "Pekerjaan Panas (Hot Work)",
        "categories": ["Pekerjaan Panas (Hot Work)"],
        "finding_type": "Unsafe Condition",
        "description": "Ignition sistem otomatis pilot flare kadang gagal menyala saat angin kencang sehingga terjadi potensi penumpukan gas yang belum terbakar di header flare.",
        "urgency": "Tinggi",
        "risk_level": "Tinggi",
        "status": "Open",
        "assigned_to": "M. Solihin",
        "assigned_engineer": "M. Solihin",
        "follow_up_notes": "",
        "admin_message": "",
        "history": [
            {"timestamp": "2026-09-03T13:00:00.000000", "action": "Laporan Dibuat", "status": "Open", "actor": "Iwan Falsafah", "notes": "Laporan kondisi flare stack pilot ignitor intermiten."}
        ],
        "created_at": "2026-09-03T13:00:00.000000",
        "updated_at": "2026-09-03T13:00:00.000000",
        "attachment": None
    }
]

def main():
    target_files = [
        os.path.abspath("data/storage/complaints.json"),
        os.path.abspath("backend/data/storage/complaints.json")
    ]
    
    for file_path in target_files:
        if not os.path.exists(file_path):
            continue
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        print(f"Memproses {file_path}, entri sebelum: {len(data)}")
        
        # 1. Normalisasi nama kategori yang ada pada entri 0-17
        for c in data[:18]:
            cat = c.get("category", "")
            if cat == "Bahan Kimia B3":
                c["category"] = "Bahan Kimia & B3"
                c["categories"] = ["Bahan Kimia & B3"]
            elif cat == "Alat Pemadam Api":
                c["category"] = "Tanggap Darurat"
                c["categories"] = ["Tanggap Darurat"]
            elif cat == "Keamanan (Security)":
                c["category"] = "Pengawasan & Prosedur"
                c["categories"] = ["Pengawasan & Prosedur"]
            elif cat == "Kesehatan Kerja (Medis)":
                c["category"] = "Kondisi Khusus"
                c["categories"] = ["Kondisi Khusus"]
                
        # 2. Ganti entri 18-34 dengan data HSSE yang terstandarisasi
        cleaned_data = data[:18] + HSSE_REPLACEMENTS
        
        print(f"Entri sesudah: {len(cleaned_data)}")
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
            
        print(f"Berhasil memperbarui {file_path}")

if __name__ == "__main__":
    main()
