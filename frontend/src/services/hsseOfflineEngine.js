/**
 * SIGAP-AI HSSE Offline Intelligence & Resilient Fallback Engine
 * Menyediakan analisis K3 instan dan komprehensif ketika server/edge offline atau mengalami kendala.
 * Mengacu pada Pertamina Golden Rules (Patuh, Peduli, Tanggap) dan Regulasi K3 Nasional.
 */

export const HSSE_CATEGORY_DATA = {
  'aktivitas-berisiko': {
    nama: 'Pekerjaan Berisiko',
    petugas: 'Juni Trihardiyanto (Senior Safety Lead - Height, Scaffolding & Hot Work)',
    wa: '6281234567891',
    regulasi: [
      'Undang-Undang No. 1 Tahun 1970 tentang Keselamatan Kerja',
      'Permenaker No. 09 Tahun 2016 tentang K3 Bekerja Pada Ketinggian',
      'Kepmen ESDM No. 1827 K/30/MEM/2018 tentang Kaidah Pertambangan & Migas'
    ]
  },
  'peralatan-kendaraan': {
    nama: 'Peralatan & Kendaraan',
    petugas: 'Juni Trihardiyanto (Senior Safety Lead - APD & Sertifikasi Peralatan)',
    wa: '6281234567891',
    regulasi: [
      'Permenakertrans No. PER.08/MEN/VII/2010 tentang Alat Pelindung Diri',
      'Permenaker No. 38 Tahun 2016 tentang K3 Pesawat Tenaga dan Produksi',
      'Permenaker No. 08 Tahun 2020 tentang Keselamatan & Kesehatan Kerja Pesawat Angkat & Angkut'
    ]
  },
  'kesehatan-lingkungan': {
    nama: 'Kesehatan & Lingkungan',
    petugas: 'Ronny Pribadi & Tsabitha Nabilla (Environmental & Compliance Specialists)',
    wa: '6281234567894',
    regulasi: [
      'PP No. 22 Tahun 2021 tentang Penyelenggaraan Perlindungan dan Pengelolaan Lingkungan Hidup',
      'Permenaker No. 5 Tahun 2018 tentang K3 Lingkungan Kerja',
      'Permenkes No. 48 Tahun 2016 tentang Standar Keselamatan dan Kesehatan Kerja Perkantoran'
    ]
  },
  'sistem-risiko': {
    nama: 'Aturan & Pengawasan',
    petugas: 'M. Solihin (Superintendent HSSE PT Pertamina EP Lirik Field)',
    wa: '6281234567890',
    regulasi: [
      'PP No. 50 Tahun 2012 tentang Penerapan Sistem Manajemen K3 (SMK3)',
      'Pertamina Golden Rules: Patuh, Peduli, Tanggap',
      'Pedoman SIKA (Surat Izin Kerja Aman) Pertamina EP'
    ]
  },
  'budaya-kompetensi': {
    nama: 'Perilaku & Pelatihan',
    petugas: 'Juni Trihardiyanto & Tim Safety HSSE Lirik',
    wa: '6281234567891',
    regulasi: [
      'Corporate Life Saving Rules (CLSR) Pertamina',
      'Permenaker No. 04 Tahun 1995 tentang Perusahaan Jasa K3',
      'Prosedur Pelatihan & Induksi K3 Pertamina EP Lirik'
    ]
  },
  'insiden-koordinasi': {
    nama: 'Insiden & Darurat',
    petugas: 'Dr. Irsyad Yoga (Kedaruratan Medis & K3 Emergency Lead)',
    wa: '6281234567892',
    regulasi: [
      'Permenakertrans No. PER.03/MEN/1998 tentang Tata Cara Pelaporan dan Pemeriksaan Kecelakaan',
      'Permenakertrans No. PER.15/MEN/VIII/2008 tentang P3K di Tempat Kerja',
      'Emergency Response Plan (ERP) PT Pertamina EP Lirik Field'
    ]
  }
};

/**
 * Menganalisis teks laporan bahaya secara cerdas dan menghasilkan format rekomendasi K3 resmi
 */
export function generateOfflineHsseAnalysis(inputText, explicitGroupId = null) {
  const query = (inputText || '').toLowerCase();
  
  // 1. Deteksi Kategori Utama
  let groupId = explicitGroupId;
  let subCat = 'Umum';
  let riskLevel = 'Sedang';

  if (!groupId) {
    if (query.match(/tinggi|scaffold|harness|jatuh|tangga|balkon|atap|anjungan/)) {
      groupId = 'aktivitas-berisiko';
      subCat = 'Pekerjaan di Ketinggian';
      riskLevel = 'Tinggi';
    } else if (query.match(/las|hot work|api|percikan|flange|burner|welding/)) {
      groupId = 'aktivitas-berisiko';
      subCat = 'Pekerjaan Panas (Hot Work)';
      riskLevel = 'Tinggi';
    } else if (query.match(/ruang terbatas|confined|tangki|manhole|lubang|sumur|bejana/)) {
      groupId = 'aktivitas-berisiko';
      subCat = 'Ruang Terbatas (Confined Space)';
      riskLevel = 'Tinggi';
    } else if (query.match(/listrik|kabel|panel|trafo|setrum|tegangan|korslet|genset/)) {
      groupId = 'aktivitas-berisiko';
      subCat = 'Kelistrikan';
      riskLevel = 'Tinggi';
    } else if (query.match(/crane|angkat|rigging|sling|beban|hook|tali baja/)) {
      groupId = 'aktivitas-berisiko';
      subCat = 'Pengangkatan & Rigging';
      riskLevel = 'Tinggi';
    } else if (query.match(/helm|kacamata|sepatu|rompi|gloves|sarung tangan|masker|respirator|earplug|apd/)) {
      groupId = 'peralatan-kendaraan';
      subCat = 'Alat Pelindung Diri (APD)';
      riskLevel = query.match(/memaksa|tidak mau|tanpa|ketinggian|b3/) ? 'Tinggi' : 'Sedang';
    } else if (query.match(/gerinda|kompresor|mesin|perkakas|pompa|alat kerja|rusak/)) {
      groupId = 'peralatan-kendaraan';
      subCat = 'Peralatan Kerja';
      riskLevel = 'Sedang';
    } else if (query.match(/mobil|truk|forklift|kendaraan|rem|ban|driver|sopir/)) {
      groupId = 'peralatan-kendaraan';
      subCat = 'Alat Berat & Kendaraan';
      riskLevel = 'Tinggi';
    } else if (query.match(/apar|pemadam|hydrant|kebakaran|tabung pemadam/)) {
      groupId = 'peralatan-kendaraan';
      subCat = 'Alat Proteksi Kebakaran (APAR)';
      riskLevel = 'Sedang';
    } else if (query.match(/kimia|b3|oli|minyak|tumpahan|bocor|limbah|racun|pestisida/)) {
      groupId = 'kesehatan-lingkungan';
      subCat = 'Bahan Kimia & B3';
      riskLevel = 'Tinggi';
    } else if (query.match(/panas|dehidrasi|pusing|bising|ergonomi|angkat berat|fatig|lelah|jam kerja/)) {
      groupId = 'kesehatan-lingkungan';
      subCat = 'Kesehatan Kerja & Ergonomi';
      riskLevel = 'Sedang';
    } else if (query.match(/sika|izin|permit|jsa|sop|prosedur|loto|gembok|aturan|pengawas/)) {
      groupId = 'sistem-risiko';
      subCat = 'Aturan, SIKA & Pengawasan Prosedur';
      riskLevel = 'Tinggi';
    } else if (query.match(/darurat|insiden|kecelakaan|near miss|celaka|gas|h2s|evakuasi|p3k/)) {
      groupId = 'insiden-koordinasi';
      subCat = 'Tanggap Darurat & Insiden';
      riskLevel = 'Tinggi';
    } else {
      groupId = 'budaya-kompetensi';
      subCat = 'Perilaku & Keselamatan Kerja';
      riskLevel = 'Sedang';
    }
  } else {
    // Group already chosen by user
    if (groupId === 'aktivitas-berisiko') {
      subCat = 'Pekerjaan Berisiko Tinggi';
      riskLevel = 'Tinggi';
    } else if (groupId === 'insiden-koordinasi') {
      subCat = 'Tanggap Darurat & Insiden';
      riskLevel = 'Tinggi';
    } else if (groupId === 'peralatan-kendaraan') {
      subCat = query.match(/apd|helm|sepatu/) ? 'Alat Pelindung Diri (APD)' : 'Peralatan & Kendaraan Operasional';
      riskLevel = query.match(/rusak|bahaya|tanpa|jatuh/) ? 'Tinggi' : 'Sedang';
    } else if (groupId === 'kesehatan-lingkungan') {
      subCat = query.match(/tumpahan|kimia|b3/) ? 'Bahan Kimia & B3' : 'Kesehatan & Lingkungan Kerja';
      riskLevel = query.match(/tumpahan|b3|racun/) ? 'Tinggi' : 'Sedang';
    } else if (groupId === 'sistem-risiko') {
      subCat = 'Surat Izin Kerja (SIKA) & Prosedur K3';
      riskLevel = 'Tinggi';
    } else {
      subCat = 'Perilaku & Disiplin Kerja';
      riskLevel = 'Sedang';
    }
  }

  // Jika kondisi berbahaya jelas
  if (query.match(/jatuh|terbakar|meledak|patah|darah|kebocoran|h2s|setrum|mati|kritis|fatal/)) {
    riskLevel = 'Tinggi';
  }

  const catMeta = HSSE_CATEGORY_DATA[groupId] || HSSE_CATEGORY_DATA['aktivitas-berisiko'];

  // 2. Susun Struktur Jawaban Resmi SIGAP-AI
  const responseLines = [
    `**PERTANYAAN / LAPORAN ANDA**`,
    `${inputText}`,
    ``,
    `**KATEGORI & TINGKAT RISIKO**`,
    `• Kategori: **${catMeta.nama}** (${subCat})`,
    `• Tingkat Risiko: **${riskLevel.toUpperCase()}**`,
    ``,
    `**JAWABAN LANGSUNG & ANALISIS RISIKO**`,
    `Kondisi yang dilaporkan menunjukkan potensi bahaya keselamatan kerja yang memerlukan perhatian dan penanganan langsung. Berdasarkan prinsip *Pertamina Golden Rules (Patuh, Peduli, Tanggap)*, setiap aktivitas operasional wajib memiliki mitigasi bahaya yang memadai sebelum dan selama pekerjaan dilaksanakan.`,
    ``,
    `**TINDAKAN SEGERA (IMMEDIATE ACTION)**`,
    `1. **Intervensi Segera**: Terapkan *Stop Work Authority (SWA)* atau hentikan aktivitas di area terkait jika tidak memenuhi persyaratan keselamatan.`,
    `2. **Amankan Lokasi**: Pasang tanda peringatan/barikade batas aman untuk mencegah pekerja lain terpapar bahaya.`,
    `3. **Gunakan Kendali Pelindung**: Pastikan seluruh pekerja dilengkapi APD standar yang sesuai dengan matriks risiko pekerjaan.`,
    ``,
    `**REKOMENDASI PENGENDALIAN (HIERARKI KENDALI K3)**`,
    `• **Rekayasa Teknis**: Periksa integritas peralatan, kelayakan pengaman, dan isolasi energi (LOTO).`,
    `• **Administratif**: Verifikasi kelengkapan dokumen Surat Izin Kerja Aman (SIKA), Job Safety Analysis (JSA), dan lakukan Tool Box Meeting (TBM).`,
    `• **Inspeksi Lapangan**: Dokumentasikan temuan dan laporkan ke Pengawas Lapangan atau Perwira HSSE bertugas.`,
    ``,
    `**REFERENSI REGULASI & STANDAR ACUAN**`,
    ...catMeta.regulasi.map(r => `• ${r}`),
    ``,
    `**PETUGAS HSSE PENANGGUNG JAWAB**`,
    `• Petugas: **${catMeta.petugas}**`,
    `• Kontak Hotline: **+${catMeta.wa}**`
  ];

  return {
    response: responseLines.join('\n'),
    suggested_risk_level: riskLevel,
    category: subCat,
    category_group: groupId,
    show_escalation_prompt: true,
    technician: {
      name: catMeta.petugas,
      phone: catMeta.wa
    }
  };
}
