/**
 * Data Master Contoh Laporan Bahaya Cepat (Quick Report Starters)
 * Terorganisir lengkap per 6 Kategori Utama Operasional HSSE Pertamina EP Lirik Field.
 */

export const HSSE_QUICK_REPORTS = {
  // 1. Tampilan Default (Koleksi Pilihan Paling Populer Lintas Kategori)
  'default': [
    {
      id: 'DEF-01',
      icon: '🧗',
      title: 'Scaffolding Ketinggian',
      text: 'Pekerja berada di atas scaffolding lantai 2 tanpa safety harness dan belum ada guardrail lengkap',
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
      icon: '🧪',
      title: 'Tumpahan Kimia B3',
      text: 'Terdapat ceceran solar dan bahan kimia B3 di area lantai workshop dekat saluran pembuangan',
      kategori: 'Bahan Kimia & B3',
      groupId: 'kesehatan-lingkungan',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-04',
      icon: '⚡',
      title: 'Kabel Listrik Terkelupas',
      text: 'Kabel daya pada panel pompa terkelupas dan berada di area basah tergenang air',
      kategori: 'Kelistrikan',
      groupId: 'aktivitas-berisiko',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-05',
      icon: '🧯',
      title: 'APAR Tekanan Drop',
      text: 'Tabung APAR di pos keamanan jarum indikator tekanannya berada di zona merah (tekanan kosong)',
      kategori: 'Peralatan Kerja',
      groupId: 'peralatan-kendaraan',
      risk: 'Sedang'
    },
    {
      id: 'DEF-06',
      icon: '📋',
      title: 'Kerja Panas Tanpa SIKA',
      text: 'Aktivitas pengelasan pipa (hot work) berjalan tanpa Surat Izin Kerja Aman (SIKA) yang disahkan',
      kategori: 'Pengawasan & Prosedur',
      groupId: 'sistem-risiko',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-07',
      icon: '🚪',
      title: 'Jalur Evakuasi Terhalang',
      text: 'Pintu keluar darurat dan jalur evakuasi tertutup tumpukan palet barang dan drum bekas',
      kategori: 'Tanggap Darurat',
      groupId: 'insiden-koordinasi',
      risk: 'Tinggi'
    },
    {
      id: 'DEF-08',
      icon: '🏃',
      title: 'Shortcut Melompati Pipa',
      text: 'Pekerja melompati instalasi pipa minyak aktif sebagai jalan pintas bukan melalui crossing bridge',
      kategori: 'Perilaku & Disiplin Kerja',
      groupId: 'budaya-kompetensi',
      risk: 'Sedang'
    }
  ],

  // 2. Kategori: Pekerjaan Berisiko (aktivitas-berisiko)
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
      icon: '🕳️',
      title: 'Confined Space Tanpa Gas Test',
      text: 'Pekerja masuk ke dalam manhole bejana tangki minyak tanpa pengujian gas atmosfer dan standby man',
      kategori: 'Ruang Terbatas (Confined Space)',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-03',
      icon: '🔥',
      title: 'Hot Work Dekat Pipa Gas',
      text: 'Pekerjaan pengelasan dan pemotongan pipa dilakukan tanpa fire blanket dan tidak ada APAR standby',
      kategori: 'Pekerjaan Panas (Hot Work)',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-04',
      icon: '⚡',
      title: 'Kabel Pompa 380V Terkelupas',
      text: 'Kabel isolasi pompa transfer terkelupas dengan serabut tembaga terlihat dan terendam genangan air',
      kategori: 'Kelistrikan',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-05',
      icon: '🏗️',
      title: 'Rigging Crane Tanpa Tagline',
      text: 'Mobile crane sedang mengangkat pipa berat melintasi area orang berjalan tanpa tali pemandu (tagline)',
      kategori: 'Pengangkatan & Rigging',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-06',
      icon: '🪜',
      title: 'Tangga Lipat Rusak & Goyang',
      text: 'Pekerja mengecat struktur menggunakan tangga lipat yang kendor bautnya dan anak tangga licin',
      kategori: 'Penggunaan Tangga',
      risk: 'Sedang'
    },
    {
      id: 'RISK-07',
      icon: '⛏️',
      title: 'Galian 2m Tanpa Shoring',
      text: 'Pekerjaan galian tanah pipa sedalam 2 meter tanpa dipasang dinding penahan (shoring) rawan longsor',
      kategori: 'Pekerjaan Berisiko',
      risk: 'Tinggi'
    },
    {
      id: 'RISK-08',
      icon: '🔗',
      title: 'Anchor Point Belum Diinspeksi',
      text: 'Titik tambat (anchor point) safety harness dipasang pada pipa conduit kecil yang tidak tersertifikasi',
      kategori: 'Pekerjaan di Ketinggian',
      risk: 'Tinggi'
    }
  ],

  // 3. Kategori: Peralatan & Kendaraan (peralatan-kendaraan)
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
      icon: '🪢',
      title: 'Lanyard Harness Terurai/Sobek',
      text: 'Tali lanyard body harness ditemukan berserabut robek namun tetap dipaksakan dipakai pekerja',
      kategori: 'Alat Pelindung Diri (APD)',
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
      icon: '⚙️',
      title: 'Gerinda Tanpa Safety Guard',
      text: 'Mesin gerinda potong tangan digunakan tanpa cover pelindung batu gerinda dan pegangan samping',
      kategori: 'Peralatan Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'EQUIP-05',
      icon: '🧯',
      title: 'APAR Kadaluwarsa / Zona Merah',
      text: 'Tabung APAR 6kg di area stasiun pompa jarum manometer menunjukkan tekanan turun di zona merah',
      kategori: 'Peralatan Kerja',
      risk: 'Sedang'
    },
    {
      id: 'EQUIP-06',
      icon: '🚙',
      title: 'Ban Mobil Operasional Gundul',
      text: 'Kendaraan operasional double cabin LV bannya gundul melewati batas TWI dipakai ke jalan berlumpur',
      kategori: 'Alat Berat & Kendaraan',
      risk: 'Sedang'
    },
    {
      id: 'EQUIP-07',
      icon: '🛡️',
      title: 'Cover V-Belt Kompresor Terbuka',
      text: 'Pulley dan v-belt motor kompresor berputar kencang tanpa tutup pelindung jaring pengaman',
      kategori: 'Peralatan Kerja',
      risk: 'Sedang'
    },
    {
      id: 'EQUIP-08',
      icon: '👟',
      title: 'Sepatu Safety Tidak Digunakan',
      text: 'Pekerja masuk area workshop konstruksi menggunakan sepatu kasual kets bukan safety boots bertulang baja',
      kategori: 'Alat Pelindung Diri (APD)',
      risk: 'Sedang'
    }
  ],

  // 4. Kategori: Kesehatan & Lingkungan (kesehatan-lingkungan)
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
      icon: '📦',
      title: 'Manual Handling Melebihi Batas',
      text: 'Pekerja mengangkat beban pipa dan karung seberat 35 kg sendirian secara berulang tanpa alat bantu',
      kategori: 'Ergonomi',
      risk: 'Sedang'
    },
    {
      id: 'ENV-04',
      icon: '😴',
      title: 'Operator Bekerja > 14 Jam',
      text: 'Operator rig bekerja lembur berturut-turut melebihi 14 jam menunjukkan tanda kelelahan ekstrem (fatigue)',
      kategori: 'Kelelahan & Jam Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'ENV-05',
      icon: '📢',
      title: 'Kebisingan Genset Tanpa Earplug',
      text: 'Tingkat kebisingan di ruang genset melebihi 90 dB namun pekerja tidak dibekali sumbat telinga (ear plug)',
      kategori: 'Lingkungan Kerja',
      risk: 'Sedang'
    },
    {
      id: 'ENV-06',
      icon: '☀️',
      title: 'Gejala Heat Stroke / Dehidrasi',
      text: 'Pekerja konstruksi di area terbuka mengalami pusing, mual, dan lemas akibat terik matahari ekstrem',
      kategori: 'Kondisi Khusus',
      risk: 'Sedang'
    },
    {
      id: 'ENV-07',
      icon: '🗑️',
      title: 'Pencampuran Sampah Majun B3',
      text: 'Kain majun bekas pembersih minyak dibuang bercampur di tempat sampah domestik non-B3',
      kategori: 'Bahan Kimia & B3',
      risk: 'Rendah'
    },
    {
      id: 'ENV-08',
      icon: '🚰',
      title: 'Air Bersih Mess Tercemar',
      text: 'Fasilitas air minum dan sanitasi untuk pekerja lapangan keruh dan berbau tidak memenuhi standar higienitas',
      kategori: 'Higienitas & Konsumsi',
      risk: 'Sedang'
    }
  ],

  // 5. Kategori: Aturan & Pengawasan (sistem-risiko)
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
      icon: '📑',
      title: 'JSA Belum Disosialisasikan',
      text: 'Kru lapangan belum membaca atau mendapatkan briefing Job Safety Analysis (JSA) sebelum memulai pekerjaan',
      kategori: 'Manajemen Risiko',
      risk: 'Sedang'
    },
    {
      id: 'SYS-03',
      icon: '🔒',
      title: 'Isolasi Energi Tanpa Gembok LOTO',
      text: 'Teknisi memperbaiki panel switchboard listrik tanpa memasang gembok Lockout dan label Tagout',
      kategori: 'Pengawasan & Prosedur',
      risk: 'Tinggi'
    },
    {
      id: 'SYS-04',
      icon: '👷',
      title: 'Pekerja Vendor Tanpa Pengawas',
      text: 'Pekerja dari pihak ketiga/subkontraktor beraktivitas di area berbahaya tanpa didampingi Safety Officer',
      kategori: 'Pengawasan & Prosedur',
      risk: 'Sedang'
    },
    {
      id: 'SYS-05',
      icon: '⛔',
      title: 'Rambu Bahaya Tegangan Hilang',
      text: 'Rambu peringatan bahaya listrik tegangan tinggi dan dilarang merokok di gardu trafo rusak dan hilang',
      kategori: 'Standar & Regulasi',
      risk: 'Sedang'
    },
    {
      id: 'SYS-06',
      icon: '⌛',
      title: 'SIKA Kadaluwarsa Masih Dipakai',
      text: 'Pekerjaan diteruskan hingga pukul 21:00 malam padahal masa izin kerja SIKA hanya berlaku hingga 17:00',
      kategori: 'Pengawasan & Prosedur',
      risk: 'Tinggi'
    },
    {
      id: 'SYS-07',
      icon: '🚧',
      title: 'Lubang Terbuka Tanpa Barikade',
      text: 'Lubang galian terbuka di samping jalan lintasan pekerja tidak dipasangi pita barikade atau penutup',
      kategori: 'Manajemen Risiko',
      risk: 'Sedang'
    },
    {
      id: 'SYS-08',
      icon: '🎯',
      title: 'Audit SMK3 Temuan Belum Close',
      text: 'Rekomendasi temuan audit keselamatan kerja bulan lalu pada tangki penampung belum ditindaklanjuti',
      kategori: 'Audit & Sistem Manajemen K3',
      risk: 'Sedang'
    }
  ],

  // 6. Kategori: Perilaku & Pelatihan (budaya-kompetensi)
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
      title: 'Toolbox Meeting (TBM) Dilewati',
      text: 'Pekerjaan langsung dimulai tanpa safety talk atau Tool Box Meeting untuk mengidentifikasi bahaya harian',
      kategori: 'Komunikasi & Pelaporan',
      risk: 'Sedang'
    },
    {
      id: 'BEH-03',
      icon: '📜',
      title: 'Operator Tanpa Sertifikat SIO',
      text: 'Pekerja mengoperasikan boom crane 25 ton tanpa memiliki Surat Izin Operator (SIO) yang masih berlaku',
      kategori: 'Pelatihan & Kompetensi',
      risk: 'Tinggi'
    },
    {
      id: 'BEH-04',
      icon: '🚭',
      title: 'Merokok di Zona Bahaya OGS',
      text: 'Ditemukan puntung rokok dan pekerja merokok di area zona 1 bahaya ledakan Oil Gathering Station',
      kategori: 'Perilaku & Disiplin Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'BEH-05',
      icon: '🤼',
      title: 'Bercanda Berlebihan di Ketinggian',
      text: 'Pekerja saling dorong dan bermain-main (horseplay) di dekat tepi lantai kerja platform scaffolding',
      kategori: 'Perilaku & Disiplin Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'BEH-06',
      icon: '🙅',
      title: 'Menolak APD Karena Pengalaman',
      text: 'Pekerja senior menolak menggunakan kacamata pelindung dengan alasan sudah bertahun-tahun bekerja aman',
      kategori: 'Budaya Keselamatan',
      risk: 'Sedang'
    },
    {
      id: 'BEH-07',
      icon: '📱',
      title: 'Main HP Saat Mengemudi Truk',
      text: 'Driver mobil tangki crude oil mengoperasikan ponsel saat menyetir di jalan tanah operasi lapangan',
      kategori: 'Perilaku & Disiplin Kerja',
      risk: 'Tinggi'
    },
    {
      id: 'BEH-08',
      icon: '🤐',
      title: 'Menutupi Bahaya / Takut Lapor',
      text: 'Pekerja mendapati sambungan selang udara retak namun enggan melapor karena khawatir ditegur atasan',
      kategori: 'Komunikasi & Pelaporan',
      risk: 'Sedang'
    }
  ],

  // 7. Kategori: Insiden & Darurat (insiden-koordinasi)
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
      icon: '🚨',
      title: 'Sirine Darurat Berbunyi',
      text: 'Alarm darurat di stasiun pengumpul berbunyi terus menerus dan pekerja membutuhkan arahan evakuasi',
      kategori: 'Tanggap Darurat',
      risk: 'Tinggi'
    },
    {
      id: 'EMG-05',
      icon: '🔀',
      title: 'SIMOPS Pengelasan & Pipa Minyak',
      text: 'Aktivitas pengelasan hot work berjalan tepat di sebelah jalur pipa bertekanan yang sedang di-purging',
      kategori: 'Koordinasi & SIMOPS',
      risk: 'Tinggi'
    },
    {
      id: 'EMG-06',
      icon: '🩹',
      title: 'Kotak P3K Kosong & Terkunci',
      text: 'Kotak pertolongan pertama (P3K) di bengkel kerja kosong tidak berisi perban, kassa steril, maupun antiseptik',
      kategori: 'Tanggap Darurat',
      risk: 'Sedang'
    },
    {
      id: 'EMG-07',
      icon: '🚿',
      title: 'Eyewash Darurat Tidak Berfungsi',
      text: 'Stasiun pencuci mata darurat (emergency eye wash) tidak mengeluarkan aliran air saat ditarik tuasnya',
      kategori: 'Tanggap Darurat',
      risk: 'Tinggi'
    },
    {
      id: 'EMG-08',
      icon: '🩹',
      title: 'Luka Sayat Akibat Plat Tajam',
      text: 'Tangan pekerja tergores plat besi tajam hingga berdarah karena menggunakan sarung tangan kain tipis',
      kategori: 'Investigasi & Insiden',
      risk: 'Sedang'
    }
  ]
};
