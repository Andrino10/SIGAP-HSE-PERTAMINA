/**
 * Data Master Contoh Laporan Bahaya Cepat (Quick Report Starters)
 * Tepat 4 Pilihan Utama Terbaik per Kategori untuk Kepraktisan & Kecepatan Pengguna.
 */

export const HSSE_QUICK_REPORTS = {
  // 1. Tampilan Default (4 Pilihan Paling Populer Lintas Kategori)
  'default': [
    {
      id: 'DEF-01',
      icon: '🧗',
      title: 'Scaffolding Ketinggian',
      text: 'Pekerja berada di atas scaffolding lantai 2 tanpa safety harness dan guardrail belum terpasang',
      kategori: 'Pekerjaan di Ketinggian',
      groupId: 'aktivitas-berisiko',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-02',
      icon: '🦺',
      title: 'Pekerja Tanpa APD',
      text: 'Pekerja tidak menggunakan APD lengkap dan tetap memaksa bekerja di area operasional',
      kategori: 'Alat Pelindung Diri (APD)',
      groupId: 'peralatan-kendaraan',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-03',
      icon: '⚡',
      title: 'Kabel Listrik Terkelupas',
      text: 'Kabel daya pada panel pompa terkelupas dan berada di area basah tergenang air',
      kategori: 'Kelistrikan',
      groupId: 'aktivitas-berisiko',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-04',
      icon: '🧪',
      title: 'Tumpahan Kimia B3',
      text: 'Terdapat ceceran solar dan bahan kimia B3 di area lantai workshop dekat saluran pembuangan',
      kategori: 'Bahan Kimia & B3',
      groupId: 'kesehatan-lingkungan',
      risk: 'Tinggi'
    }
  ],

  // 2. Kategori: Pekerjaan Berisiko (4 Pilihan)
  'aktivitas-berisiko': [
    {
      id: 'RISK-01',
      icon: '🧗',
      title: 'Ketinggian Tanpa Harness',
      text: 'Pekerja melakukan perbaikan di atas scaffolding lantai 2 tanpa menggunakan full body harness',
      kategori: 'Pekerjaan di Ketinggian',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-02',
      icon: '🔥',
      title: 'Hot Work Dekat Pipa Gas',
      text: 'Pekerjaan pengelasan dan pemotongan pipa dilakukan tanpa fire blanket dan tidak ada APAR standby',
      kategori: 'Pekerjaan Panas (Hot Work)',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-03',
      icon: '🕳️',
      title: 'Confined Space Tanpa Gas Test',
      text: 'Pekerja masuk ke dalam manhole bejana tangki minyak tanpa pengujian gas atmosfer dan standby man',
      kategori: 'Ruang Terbatas (Confined Space)',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-04',
      icon: '⚡',
      title: 'Kabel Pompa 380V Terkelupas',
      text: 'Kabel isolasi pompa transfer terkelupas dengan serabut tembaga terlihat dan terendam genangan air',
      kategori: 'Kelistrikan',
      risk: 'Tinggi'
    }
  ],

  // 3. Kategori: Peralatan & Kendaraan (4 Pilihan)
  'peralatan-kendaraan': [
    {
      id: 'EQUIP-01',
      icon: '🦺',
      title: 'Pekerja Tanpa Helm & Kacamata',
      text: 'Pekerja di workshop fabrikasi besi tidak mengenakan helm keselamatan dan kacamata safety',
      kategori: 'Alat Pelindung Diri (APD)',
      risk: 'Tinggi'
    },
    {
      id: 'EQUIP-02',
      icon: '⚙️',
      title: 'Gerinda Tanpa Safety Guard',
      text: 'Mesin gerinda potong tangan digunakan tanpa cover pelindung batu gerinda dan pegangan samping',
      kategori: 'Peralatan Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'EQUIP-03',
      icon: '🚜',
      title: 'Alarm Mundur Forklift Mati',
      text: 'Forklift gudang bermanuver mundur tanpa bunyi alarm mundur dan lampu strobo indikator mati',
      kategori: 'Alat Berat & Kendaraan',
      risk: 'Sedang'
    },
    {
      id: 'EQUIP-04',
      icon: '🧯',
      title: 'APAR Kadaluwarsa / Zona Merah',
      text: 'Tabung APAR 6kg di area stasiun pompa jarum manometer menunjukkan tekanan turun di zona merah',
      kategori: 'Peralatan Kerja',
      risk: 'Sedang'
    }
  ],

  // 4. Kategori: Kesehatan & Lingkungan (4 Pilihan)
  'kesehatan-lingkungan': [
    {
      id: 'ENV-01',
      icon: '🛢️',
      title: 'Ceceran Oli & Limbah B3',
      text: 'Terdapat ceceran oli pelumas dan limbah B3 meluber dari bak penampung ke tanah terbuka',
      kategori: 'Bahan Kimia & B3',
      risk: 'Tinggi'
    },
    {
      id: 'ENV-02',
      icon: '🧪',
      title: 'Drum Kimia Tanpa Bundwall',
      text: 'Penyimpanan drum bahan kimia korosif diletakkan di luar ruangan tanpa secondary containment (bundwall)',
      kategori: 'Bahan Kimia & B3',
      risk: 'Sedang'
    },
    {
      id: 'ENV-03',
      icon: '📢',
      title: 'Kebisingan Genset Tanpa Earplug',
      text: 'Tingkat kebisingan di ruang genset melebihi 90 dB namun pekerja tidak dibekali sumbat telinga (ear plug)',
      kategori: 'Lingkungan Kerja',
      risk: 'Sedang'
    },
    {
      id: 'ENV-04',
      icon: '☀️',
      title: 'Gejala Heat Stroke / Dehidrasi',
      text: 'Pekerja konstruksi di area terbuka mengalami pusing, mual, dan lemas akibat terik matahari ekstrem',
      kategori: 'Kondisi Khusus',
      risk: 'Sedang'
    }
  ],

  // 5. Kategori: Aturan & Pengawasan (4 Pilihan)
  'sistem-risiko': [
    {
      id: 'SYS-01',
      icon: '📝',
      title: 'Pekerjaan Dimulai Tanpa SIKA',
      text: 'Pekerjaan perbaikan jalur pipa dimulai di lapangan sebelum Surat Izin Kerja Aman (SIKA) diterbitkan',
      kategori: 'Pengawasan & Prosedur',
      risk: 'Tinggi'
    },
    {
      id: 'SYS-02',
      icon: '🔒',
      title: 'Isolasi Energi Tanpa LOTO',
      text: 'Teknisi memperbaiki panel switchboard listrik tanpa memasang gembok Lockout dan label Tagout',
      kategori: 'Pengawasan & Prosedur',
      risk: 'Tinggi'
    },
    {
      id: 'SYS-03',
      icon: '📑',
      title: 'JSA Belum Disosialisasikan',
      text: 'Kru lapangan belum membaca atau mendapatkan briefing Job Safety Analysis (JSA) sebelum memulai pekerjaan',
      kategori: 'Manajemen Risiko',
      risk: 'Sedang'
    },
    {
      id: 'SYS-04',
      icon: '⌛',
      title: 'SIKA Kadaluwarsa Masih Dipakai',
      text: 'Pekerjaan diteruskan hingga pukul 21:00 malam padahal masa izin kerja SIKA hanya berlaku hingga 17:00',
      kategori: 'Pengawasan & Prosedur',
      risk: 'Tinggi'
    }
  ],

  // 6. Kategori: Perilaku & Pelatihan (4 Pilihan)
  'budaya-kompetensi': [
    {
      id: 'BEH-01',
      icon: '🚷',
      title: 'Melanggar Prosedur / Shortcut',
      text: 'Pekerja melompati pagar pembatas dan pipa bertekanan demi mempersingkat rute jalan kaki',
      kategori: 'Perilaku & Disiplin Kerja',
      risk: 'Sedang'
    },
    {
      id: 'BEH-02',
      icon: '🗣️',
      title: 'Toolbox Meeting Dilewati',
      text: 'Pekerjaan langsung dimulai tanpa safety talk atau Tool Box Meeting untuk mengidentifikasi bahaya harian',
      kategori: 'Komunikasi & Pelaporan',
      risk: 'Sedang'
    },
    {
      id: 'BEH-03',
      icon: '🚭',
      title: 'Merokok di Zona Bahaya OGS',
      text: 'Ditemukan puntung rokok dan pekerja merokok di area zona 1 bahaya ledakan Oil Gathering Station',
      kategori: 'Perilaku & Disiplin Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'BEH-04',
      icon: '📜',
      title: 'Operator Tanpa Sertifikat SIO',
      text: 'Pekerja mengoperasikan boom crane 25 ton tanpa memiliki Surat Izin Operator (SIO) yang masih berlaku',
      kategori: 'Pelatihan & Kompetensi',
      risk: 'Tinggi'
    }
  ],

  // 7. Kategori: Insiden & Darurat (4 Pilihan)
  'insiden-koordinasi': [
    {
      id: 'EMG-01',
      icon: '⚠️',
      title: 'Near Miss Kunci Pipa Jatuh',
      text: 'Kunci pipa ukuran 24 inch jatuh dari ketinggian 6 meter dan nyaris mengenai kepala pekerja di bawah',
      kategori: 'Investigasi & Insiden',
      risk: 'Tinggi'
    },
    {
      id: 'EMG-02',
      icon: '💨',
      title: 'Deteksi Bau Gas H2S',
      text: 'Tercium aroma menyengat telur busuk dan detektor gas H2S berbunyi alarm peringatan di sekitar manifold',
      kategori: 'Tanggap Darurat',
      risk: 'Tinggi'
    },
    {
      id: 'EMG-03',
      icon: '🚪',
      title: 'Pintu Emergency Exit Terkunci',
      text: 'Pintu darurat gedung kontrol terkunci dari luar dan koridor evakuasi terhalang tumpukan kardus',
      kategori: 'Tanggap Darurat',
      risk: 'Tinggi'
    },
    {
      id: 'EMG-04',
      icon: '🔀',
      title: 'SIMOPS Pengelasan & Pipa Minyak',
      text: 'Aktivitas pengelasan hot work berjalan tepat di sebelah jalur pipa bertekanan yang sedang di-purging',
      kategori: 'Koordinasi & SIMOPS',
      risk: 'Tinggi'
    }
  ]
};
