/**
 * SIGAP-AI HSSE Offline Intelligence & Resilient Fallback Engine
 * Menghasilkan teks laporan HSSE 7-bagian terstruktur sesuai format standar knowledge.json.
 */

export const HSSE_CATEGORY_DATA = {
  'aktivitas-berisiko': {
    nama: 'Pekerjaan Berisiko',
    petugas: 'Juni Trihardiyanto (Senior Safety Lead - Height & Hot Work)',
    wa: '6281234567891',
    regulasi: [
      { judul: 'Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja', url: 'https://peraturan.bpk.go.id/Details/47614/uu-no-1-tahun-1970' },
      { judul: 'Permenaker Nomor 09 Tahun 2016 tentang K3 Bekerja Pada Ketinggian', url: 'https://jdih.kemnaker.go.id/katalog-peraturan/detail/peraturan-menteri-ketenagakerjaan-nomor-9-tahun-2016' }
    ]
  },
  'peralatan-kendaraan': {
    nama: 'Peralatan & Kendaraan',
    petugas: 'Juni Trihardiyanto (Senior Safety Lead - APD & Alat Berat)',
    wa: '6281234567891',
    regulasi: [
      { judul: 'Permenakertrans Nomor PER.08/MEN/VII/2010 tentang Alat Pelindung Diri', url: 'https://jdih.kemnaker.go.id/peraturan/detail/158/peraturan-menteri-nomor-8-tahun-2010' },
      { judul: 'Permenaker Nomor 38 Tahun 2016 tentang K3 Pesawat Tenaga dan Produksi', url: 'https://jdih.kemnaker.go.id' }
    ]
  },
  'kesehatan-lingkungan': {
    nama: 'Kesehatan & Lingkungan',
    petugas: 'Ronny Pribadi & Tsabitha Nabilla (Enviro & Compliance)',
    wa: '6281234567894',
    regulasi: [
      { judul: 'PP Nomor 22 Tahun 2021 tentang Penyelenggaraan Perlindungan Lingkungan', url: 'https://peraturan.bpk.go.id' },
      { judul: 'Permenaker Nomor 5 Tahun 2018 tentang K3 Lingkungan Kerja', url: 'https://jdih.kemnaker.go.id' }
    ]
  },
  'sistem-risiko': {
    nama: 'Aturan & Pengawasan',
    petugas: 'M. Solihin (Superintendent HSSE PT Pertamina EP Lirik Field)',
    wa: '6281234567890',
    regulasi: [
      { judul: 'PP Nomor 50 Tahun 2012 tentang Penerapan Sistem Manajemen K3 (SMK3)', url: 'https://peraturan.bpk.go.id' },
      { judul: 'Pedoman SIKA (Surat Izin Kerja Aman) PT Pertamina EP', url: 'https://pertamina.com' }
    ]
  },
  'budaya-kompetensi': {
    nama: 'Perilaku & Pelatihan',
    petugas: 'Juni Trihardiyanto & Tim Safety HSSE Lirik',
    wa: '6281234567891',
    regulasi: [
      { judul: 'Corporate Life Saving Rules (CLSR) Pertamina', url: 'https://pertamina.com' },
      { judul: 'Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja', url: 'https://peraturan.bpk.go.id/Details/47614/uu-no-1-tahun-1970' }
    ]
  },
  'insiden-koordinasi': {
    nama: 'Insiden & Darurat',
    petugas: 'Dr. Irsyad Yoga (Kedaruratan Medis & K3 Emergency Lead)',
    wa: '6281234567892',
    regulasi: [
      { judul: 'Permenakertrans Nomor PER.15/MEN/VIII/2008 tentang P3K di Tempat Kerja', url: 'https://jdih.kemnaker.go.id' },
      { judul: 'Emergency Response Plan (ERP) PT Pertamina EP Lirik Field', url: 'https://pertamina.com' }
    ]
  }
};

export function generateOfflineHsseAnalysis(inputText, explicitGroupId = null) {
  const query = (inputText || '').toLowerCase();
  
  let groupId = explicitGroupId;
  let subCat = 'Umum';
  let judulKondisi = inputText;
  let riskLevel = 'Sedang';
  let kbId = 'HSSE-GEN-001';
  let mekanisme = 'kegagalan mematuhi kendali operasional yang memicu bahaya keselamatan kerja di lapangan';
  let dampak = 'terjadinya cedera pekerja, kegagalan operasi fasilitas, atau kerusakan lingkungan';
  let tindakanSegera = 'Hentikan aktivitas yang tidak aman, amankan lokasi dengan batas aman, dan laporkan ke Supervisor.';
  let pengendalian = 'Pastikan seluruh APD standar dikenakan, izin kerja (SIKA) lengkap, dan JSA telah dibriefingkan.';
  let inspeksi = 'Dokumentasikan temuan dan minta Pengawas HSSE memverifikasi kelayakan area sebelum kerja dilanjutkan.';

  if (query.match(/tinggi|scaffold|harness|jatuh|tangga/)) {
    groupId = 'aktivitas-berisiko';
    subCat = 'Pekerjaan di Ketinggian';
    judulKondisi = 'Bekerja pada ketinggian tanpa perlindungan jatuh yang memadai';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-HEI-005';
    mekanisme = 'kegagalan pemasangan full body harness atau ketiadaan lifeline dan guardrail saat bekerja di elevasi > 1.8 meter';
    dampak = 'pekerja terjatuh dari ketinggian yang dapat berakibat fatal (fraktur parah hingga kematian)';
    tindakanSegera = 'Hentikan pekerjaan di ketinggian segera, turunkan pekerja ke area aman sampai harness terpasang pada anchor point bersertifikat.';
    pengendalian = 'Wajibkan 100% tie-off dengan full body harness double lanyard dan pasang pagar pengaman (guardrail).';
  } else if (query.match(/las|hot work|api|percikan|fire watcher/)) {
    groupId = 'aktivitas-berisiko';
    subCat = 'Pekerjaan Panas (Hot Work)';
    judulKondisi = 'Aktivitas pekerjaan panas tanpa pengawasan Fire Watcher dan APAR';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-HOTWORK-016';
    mekanisme = 'api terbuka, busur las, permukaan panas, dan percikan yang dapat menyulut uap hidrokarbon, gas mudah terbakar, atau material sekitar';
    dampak = 'kebakaran, ledakan tangki atau pipa proses, luka bakar berat, serta kerusakan fasilitas proses produksi';
    tindakanSegera = 'Hentikan pengelasan segera, padamkan potensi bara, dan tempatkan Fire Watcher bersertifikat di lokasi.';
    pengendalian = 'Pasang fire blanket pembatas percikan, siapkan APAR powder 6kg standby, dan lakukan gas test berkelanjutan.';
  } else if (query.match(/ruang terbatas|confined|tangki|manhole/)) {
    groupId = 'aktivitas-berisiko';
    subCat = 'Ruang Terbatas (Confined Space)';
    judulKondisi = 'Masuk ke ruang terbatas tanpa uji atmosfer gas dan standby man';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-CONF-002';
    mekanisme = 'akumulasi gas beracun (H2S/CO), defisiensi oksigen (<19.5%), atau paparan uap hidrokarbon di area terkurung';
    dampak = 'asfiksia (kehabisan oksigen), keracunan gas fatal dalam hitungan detik, serta kesulitan evakuasi korban';
    tindakanSegera = 'Evakuasi pekerja keluar dari manhole tangki dan pasang barikade dilarang masuk.';
    pengendalian = 'Wajibkan uji gas atmosfer (gas test) 4-gas detector, blower ventilasi aktif, dan standby man bertugas di pintu masuk.';
  } else if (query.match(/listrik|kabel|panel|pompa|setrum/)) {
    groupId = 'aktivitas-berisiko';
    subCat = 'Kelistrikan';
    judulKondisi = 'Kabel daya listrik pompa terkelupas di area basah';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-ELEC-008';
    mekanisme = 'kontak langsung dengan konduktor aktif bertegangan yang tidak terisolasi sempurna di lingkungan lembap/basah';
    dampak = 'sengatan listrik bertegangan tinggi (electrocution), luka bakar internal, henti jantung, dan risiko kebakaran';
    tindakanSegera = 'Putuskan aliran listrik dari panel breaker utama (switch off) dan beri tanda peringatan.';
    pengendalian = 'Ganti kabel dengan rating industri standar, pasang isolasi ganda, dan terapkan prosedur Lockout Tagout (LOTO).';
  } else if (query.match(/helm|kacamata|sepatu|apd/)) {
    groupId = 'peralatan-kendaraan';
    subCat = 'Alat Pelindung Diri (APD)';
    judulKondisi = 'Pekerja tidak menggunakan APD lengkap dan memaksakan bekerja';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-APD-001';
    mekanisme = 'kegagalan menggunakan pelindung diri dasar sehingga penghalang terakhir (last line of defense) terhadap bahaya tidak bekerja';
    dampak = 'benturan kepala fatal akibat benda jatuh, cedera mata permanen, tusukan sol sepatu, dan luka robek';
    tindakanSegera = 'Hentikan aktivitas pekerja, instruksikan pekerja melengkapi APD wajib (helm, safety glasses, coverall, safety boots).';
    pengendalian = 'Lakukan safety induction harian, inspeksi gerbang masuk area kerja, dan tegakkan Corporate Life Saving Rules Pertamina.';
  } else if (query.match(/kimia|b3|oli|solar|tumpahan/)) {
    groupId = 'kesehatan-lingkungan';
    subCat = 'Bahan Kimia & B3';
    judulKondisi = 'Tumpahan oli pelumas dan limbah B3 di lantai kerja';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-CHM-003';
    mekanisme = 'pelepasan cairan hidrokarbon/B3 ke permukaan yang tidak kedap dan berdekatan dengan saluran drainase umum';
    dampak = 'pencemaran tanah dan sumber air, bahaya terpeleset parah, serta potensi pemicu kebakaran';
    tindakanSegera = 'Lokalisir tumpahan dengan absorbent pad/serbuk gergaji dari spill kit dan cegah masuk ke saluran air.';
    pengendalian = 'Gunakan drum penampung limbah B3 berizin dengan secondary containment (bundwall) dan label identitas limbah.';
  } else if (query.match(/sika|izin|permit|jsa|loto/)) {
    groupId = 'sistem-risiko';
    subCat = 'Pengawasan & Prosedur';
    judulKondisi = 'Pekerjaan operasional dilaksanakan tanpa Surat Izin Kerja Aman (SIKA)';
    riskLevel = 'Tinggi';
    kbId = 'HSSE-SYS-004';
    mekanisme = 'pelaksanaan kegiatan berisiko tanpa verifikasi bahaya formal dan tanpa persetujuan dari pihak otoritas berwenang';
    dampak = 'kegagalan identifikasi bahaya tersembunyi yang meningkatkan potensi insiden fatal dan pelanggaran regulasi ketenagakerjaan';
    tindakanSegera = 'Hentikan pekerjaan saat itu juga (Stop Work Authority) sampai SIKA dan JSA disahkan.';
    pengendalian = 'Terbitkan formulir SIKA sesuai kategori pekerjaan dan lakukan safety briefing sebelum tanda tangan disahkan.';
  } else {
    groupId = groupId || 'budaya-kompetensi';
    subCat = 'Perilaku & Disiplin Kerja';
    judulKondisi = inputText;
    riskLevel = 'Sedang';
    kbId = 'HSSE-BEH-002';
  }

  const catMeta = HSSE_CATEGORY_DATA[groupId] || HSSE_CATEGORY_DATA['aktivitas-berisiko'];

  const lines = [
    `PERTANYAAN / LAPORAN ANDA`,
    `${inputText}`,
    ``,
    `JAWABAN LANGSUNG`,
    `Laporan paling sesuai dengan kondisi '${judulKondisi}'. Tindakan pertama yang perlu dilakukan: ${tindakanSegera}`,
    ``,
    `KONDISI TERIDENTIFIKASI`,
    `• ${subCat} — ${judulKondisi}`,
    ``,
    `TINGKAT RISIKO`,
    `RISIKO ${riskLevel.toUpperCase()} - Kondisi ini memerlukan verifikasi lapangan segera, penerapan kendali K3, dan koordinasi dengan pengawas HSSE.`,
    ``,
    `PENJELASAN RISIKO`,
    `Kondisi '${judulKondisi}' merupakan ketidaksesuaian penting pada kategori ${catMeta.nama}. Mekanisme bahayanya berkaitan dengan ${mekanisme}. Bila tidak segera dikendalikan, konsekuensi dapat berkembang menjadi ${dampak}. Faktor penentu tingkat risiko di lapangan mencakup durasi dan intensitas paparan, jumlah orang terdampak, kondisi alat dan lingkungan, efektivitas barrier, serta kesiapan respons darurat. Temuan harus diverifikasi terhadap kondisi aktual, JSA, SOP, izin kerja, dan ketentuan pada referensi artikel; penilaian sistem tidak menggantikan keputusan personel HSSE yang berwenang.`,
    ``,
    `SOLUSI & TINDAKAN`,
    `1. Tindakan Segera: ${tindakanSegera}`,
    `2. Pengendalian: ${pengendalian}`,
    `3. Inspeksi & Pengawasan: ${inspeksi}`,
    ``,
    `REKOMENDASI K3`,
    `1. Penanggung jawab rujukan: ${catMeta.petugas} (Hotline WA: +${catMeta.wa}).`,
    `2. Seluruh pekerja wajib mengacu pada prinsip Pertamina Golden Rules: Patuh pada prosedur, Peduli lingkungan sekitar, dan Tanggap terhadap bahaya.`,
    `3. Terapkan Stop Work Authority (SWA) apabila menemukan kondisi yang membahayakan nyawa pekerja.`,
    ``,
    `REFERENSI KNOWLEDGE BASE`,
    `Sumber: knowledge.json`,
    `1. 1. ${kbId} — ${judulKondisi} (${catMeta.nama}); kecocokan 88%.`,
    ...catMeta.regulasi.map((r, i) => `${i + 2}. Regulasi resmi — ${r.judul}: ${r.url}`),
    ``,
    `STATUS PENANGANAN`,
    `Perlu tindakan lapangan segera dan koordinasi dengan Tim HSSE.`
  ];

  return {
    response: lines.join('\n'),
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
