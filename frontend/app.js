/**
 * SIGAP-AI HSSE Companion — Application Script
 * Sistem Pendamping Keselamatan Kerja berbasis AI (Tanpa Login + Dedicated HSSE Officers + Rich Response)
 * Variabel & Fungsi dalam Bahasa Indonesia
 */

'use strict';

const HOST_API = window.location.hostname || 'localhost';
const PROTOKOL_API = window.location.protocol === 'https:' ? 'https:' : 'http:';
const ASAL_APLIKASI = window.location.origin
  || `${PROTOKOL_API}//${HOST_API}${window.location.port ? `:${window.location.port}` : ''}`;
const URL_DASAR_API = String(window.SIGAP_API_URL || `${ASAL_APLIKASI}/api`).replace(/\/+$/, '');
const API_BASE_URL = URL_DASAR_API;

function buatIdSesiChat() {
  return 'SESI-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

let idSesiSaatIni = buatIdSesiChat();
let currentSessionId = idSesiSaatIni;

let daftarEntriFaq = [];
let daftarPetugasHsse = [];
let petugasTerpilihSaatIni = null;
let tautanWhatsAppTerakhir = null;
let pesanWhatsAppTerakhir = null;
let muatanKonsultasiTertunda = null;
let pembuatPemberhentiDebounce = null;
let kategoriTerpilih = [];
let kelompokKategoriTerpilih = null;
const MAKSIMAL_KATEGORI_TERPILIH = 5;
const KUNCI_RIWAYAT_CHAT = 'sigap_hsse_chat_sessions_v1';
const KUNCI_SESI_CHAT_AKTIF = 'sigap_hsse_active_chat_v1';
const ATURAN_DETEKSI_KATEGORI = [
  ['Kelistrikan', ['listrik', 'kabel', 'tegangan', 'panel', 'stop kontak', 'korsleting', 'setrum']],
  ['Alat Pelindung Diri (APD)', ['apd', 'helm', 'safety shoes', 'sarung tangan', 'goggles', 'masker', 'rompi']],
  ['Pekerjaan di Ketinggian', ['ketinggian', 'harness', 'scaffolding', 'perancah', 'atap', 'lifeline']],
  ['Pekerjaan Panas (Hot Work)', ['pengelasan', 'mengelas', 'gerinda', 'hot work', 'percikan api', 'fire watcher']],
  ['Ruang Terbatas (Confined Space)', ['ruang terbatas', 'confined space', 'manhole', 'tangki', 'h2s', 'gas detector']],
  ['Pengangkatan & Rigging', ['crane', 'rigging', 'sling', 'lifting', 'rigger', 'beban gantung']],
  ['Alat Berat & Kendaraan', ['alat berat', 'kendaraan', 'forklift', 'excavator', 'dump truck', 'blind spot']],
  ['Bahan Kimia & B3', ['bahan kimia', 'b3', 'tumpahan', 'msds', 'asam', 'gas bocor', 'limbah kimia']],
  ['Tanggap Darurat', ['darurat', 'kebakaran', 'apar', 'evakuasi', 'p3k', 'assembly point', 'korban']],
  ['Lingkungan Kerja', ['licin', 'pencahayaan', 'kebisingan', 'ventilasi', 'housekeeping', 'berdebu']],
  ['Penggunaan Tangga', ['tangga', 'ladder']],
  ['Peralatan Kerja', ['alat kerja', 'mesin', 'guarding', 'perkakas', 'equipment']],
  ['Ergonomi', ['ergonomi', 'postur', 'mengangkat manual', 'nyeri punggung', 'repetitif']],
  ['Kelelahan & Jam Kerja', ['kelelahan', 'mengantuk', 'lembur', 'jam kerja', 'fatigue']],
  ['Pengawasan & Prosedur', ['sop', 'prosedur', 'izin kerja', 'permit', 'toolbox meeting', 'pengawasan']],
  ['Investigasi & Insiden', ['insiden', 'kecelakaan', 'near miss', 'hampir celaka', 'investigasi']],
  ['Koordinasi & SIMOPS', ['simops', 'pekerjaan bersamaan', 'koordinasi', 'tumpang tindih']],
  ['Pelatihan & Kompetensi', ['pelatihan', 'kompetensi', 'sertifikat', 'belum terlatih']],
  ['Komunikasi & Pelaporan', ['pelaporan', 'komunikasi', 'laporan bahaya', 'informasi keselamatan']],
  ['Perilaku & Disiplin Kerja', ['melanggar', 'tidak disiplin', 'bercanda', 'unsafe act', 'perilaku tidak aman']],
  ['Manajemen Risiko', ['hiradc', 'jsa', 'risk assessment', 'matriks risiko', 'residual risk']],
  ['Standar & Regulasi', ['regulasi', 'peraturan', 'standar', 'kepatuhan hukum']],
  ['Audit & Sistem Manajemen K3', ['audit', 'smk3', 'sistem manajemen', 'temuan audit']],
  ['Budaya Keselamatan', ['budaya keselamatan', 'safety culture', 'intervensi keselamatan']],
  ['Higienitas & Konsumsi', ['higienitas', 'makanan', 'air minum', 'kantin', 'keracunan makanan']],
  ['Kondisi Khusus', ['hamil', 'disabilitas', 'kondisi medis', 'pekerja rentan']]
];
let kategoriSaranSaatIni = null;
let daftarSesiChatLokal = [];
let sedangMemulihkanSesiChat = false;
let pengirimanChatBerlangsung = false;
let indukPanelKategoriChat = null;
let elemenSetelahPanelKategoriChat = null;
let pemulihPanelKategoriTimeout = null;
const KELOMPOK_KATEGORI_UI = [
  {
    id: 'aktivitas-berisiko',
    nama: 'Pekerjaan Berisiko',
    deskripsi: 'Kegiatan kerja yang memiliki bahaya tinggi',
    ikon: 'alert',
    kategori: [
      'Pekerjaan di Ketinggian',
      'Pekerjaan Panas (Hot Work)',
      'Ruang Terbatas (Confined Space)',
      'Kelistrikan',
      'Pengangkatan & Rigging',
      'Penggunaan Tangga'
    ]
  },
  {
    id: 'peralatan-kendaraan',
    nama: 'Peralatan & Kendaraan',
    deskripsi: 'Alat pelindung, alat kerja, kendaraan, atau alat berat',
    ikon: 'truck',
    kategori: [
      'Alat Berat & Kendaraan',
      'Peralatan Kerja',
      'Alat Pelindung Diri (APD)'
    ]
  },
  {
    id: 'kesehatan-lingkungan',
    nama: 'Kesehatan & Lingkungan',
    deskripsi: 'Kondisi kesehatan pekerja dan lingkungan kerja',
    ikon: 'leaf',
    kategori: [
      'Bahan Kimia & B3',
      'Lingkungan Kerja',
      'Ergonomi',
      'Higienitas & Konsumsi',
      'Kelelahan & Jam Kerja',
      'Kondisi Khusus'
    ]
  },
  {
    id: 'sistem-risiko',
    nama: 'Aturan & Pengawasan',
    deskripsi: 'Prosedur kerja, izin, audit, atau pengawasan',
    ikon: 'clipboard',
    kategori: [
      'Audit & Sistem Manajemen K3',
      'Manajemen Risiko',
      'Pengawasan & Prosedur',
      'Standar & Regulasi',
      'Umum'
    ]
  },
  {
    id: 'budaya-kompetensi',
    nama: 'Perilaku & Pelatihan',
    deskripsi: 'Perilaku aman, komunikasi, dan kemampuan pekerja',
    ikon: 'users',
    kategori: [
      'Budaya Keselamatan',
      'Pelatihan & Kompetensi',
      'Komunikasi & Pelaporan',
      'Perilaku & Disiplin Kerja'
    ]
  },
  {
    id: 'insiden-koordinasi',
    nama: 'Insiden & Darurat',
    deskripsi: 'Kecelakaan, hampir celaka, atau keadaan darurat',
    ikon: 'siren',
    kategori: [
      'Investigasi & Insiden',
      'Tanggap Darurat',
      'Koordinasi & SIMOPS'
    ]
  }
];
const KATEGORI_DEFAULT_KELOMPOK = Object.freeze({
  'aktivitas-berisiko': 'Pekerjaan di Ketinggian',
  'peralatan-kendaraan': 'Peralatan Kerja',
  'kesehatan-lingkungan': 'Lingkungan Kerja',
  'sistem-risiko': 'Umum',
  'budaya-kompetensi': 'Budaya Keselamatan',
  'insiden-koordinasi': 'Tanggap Darurat'
});
let pemicuModalTerakhir = null;
let pemuatanFaqBerlangsung = false;
let metadataKnowledge = null;
let detailKategoriKnowledge = [];
let percobaanKesehatanBackend = 0;

const KONFIGURASI_KOLOM_WHATSAPP = [
  { id: 'wa-tech-select', label: 'HSSE Officer tujuan', jenis: 'petugas' },
  { id: 'wa-input-name', label: 'Nama pelapor', min: 2, larangan: ['pelapor anonim', 'anonim'] },
  { id: 'wa-input-division', label: 'Fungsi / Divisi', min: 2 },
  { id: 'wa-input-location', label: 'Lokasi temuan', min: 3 },
  { id: 'wa-input-category', label: 'Kategori utama' },
  { id: 'wa-input-device', label: 'Detail temuan', min: 3 },
  { id: 'wa-input-urgency', label: 'Tingkat urgensi' },
  { id: 'wa-input-description', label: 'Deskripsi kondisi bahaya', min: 10 }
];

let faqGlobalEntries = daftarEntriFaq;
let technicianRoster = daftarPetugasHsse;
let currentAssignedTech = petugasTerpilihSaatIni;
let lastWhatsAppUrl = tautanWhatsAppTerakhir;
let lastWhatsAppMessage = pesanWhatsAppTerakhir;
let pendingConsultationPayload = muatanKonsultasiTertunda;

function daftarKategoriTerpilih() {
  return Array.isArray(kategoriTerpilih)
    ? kategoriTerpilih.filter(Boolean)
    : (kategoriTerpilih ? [kategoriTerpilih] : []);
}

function kategoriUtamaTerpilih() {
  return daftarKategoriTerpilih()[0] || null;
}

function adaKategoriTerpilih() {
  return daftarKategoriTerpilih().length > 0;
}

function dapatkanKelompokKategori(idKelompok) {
  return KELOMPOK_KATEGORI_UI.find(group => group.id === idKelompok) || null;
}

function dapatkanKelompokDariKategori(namaKategori) {
  return KELOMPOK_KATEGORI_UI.find(group => group.kategori.includes(namaKategori)) || null;
}

function deteksiKategoriDariPesan(teks, idKelompok = kelompokKategoriTerpilih) {
  const nilai = String(teks || '').toLocaleLowerCase('id-ID').replace(/\s+/g, ' ').trim();
  if (nilai.length < 3) return null;
  const kelompok = dapatkanKelompokKategori(idKelompok);
  const hasilSkor = ATURAN_DETEKSI_KATEGORI.map(([kategori, keywords]) => {
    const skor = keywords.reduce((total, keyword) => {
      if (!nilai.includes(keyword)) return total;
      return total + (keyword.includes(' ') ? 3 : 2);
    }, 0);
    return { kategori, skor };
  }).filter(item => item.skor > 0);
  if (hasilSkor.length === 0) return null;
  hasilSkor.sort((a, b) => b.skor - a.skor);
  const hasilDalamKelompok = kelompok
    ? hasilSkor.find(item => kelompok.kategori.includes(item.kategori))
    : null;
  return (hasilDalamKelompok || hasilSkor[0]).kategori;
}

function idKelompokDariPilihan(nilai) {
  if (dapatkanKelompokKategori(nilai)) return nilai;
  return dapatkanKelompokDariKategori(nilai)?.id || '';
}

function namaKelompokKategori(nilai) {
  const idKelompok = idKelompokDariPilihan(nilai);
  return dapatkanKelompokKategori(idKelompok)?.nama || '';
}

function tentukanKategoriRinci(idKelompok, teks = '') {
  const idValid = idKelompokDariPilihan(idKelompok);
  return deteksiKategoriDariPesan(teks, idValid)
    || KATEGORI_DEFAULT_KELOMPOK[idValid]
    || 'Umum';
}

function teksRingkasanKategori() {
  const kelompok = dapatkanKelompokKategori(kelompokKategoriTerpilih);
  if (kelompok) return kelompok.nama;
  const kelompokKategori = dapatkanKelompokDariKategori(kategoriUtamaTerpilih());
  if (kelompokKategori) return kelompokKategori.nama;
  return 'Otomatis dari laporan';
}

function perbaruiSaranKategoriDariInput() {
  const input = document.getElementById('chat-input');
  const summary = document.getElementById('mobile-category-summary');
  const bar = document.querySelector('.chat-mobile-category-bar');
  kategoriSaranSaatIni = deteksiKategoriDariPesan(
    input?.value || '',
    kelompokKategoriTerpilih
  );
  const kelompokSaran = dapatkanKelompokDariKategori(kategoriSaranSaatIni);
  if (kelompokSaran && kelompokSaran.id !== kelompokKategoriTerpilih) {
    kelompokKategoriTerpilih = kelompokSaran.id;
    kategoriTerpilih = [];
    perbaruiTampilanKategoriTerpilih();
    perbaruiKategoriPadaSesiChat();
    tampilkanKelompokKategoriBeranda();
  }
  if (summary) {
    summary.textContent = teksRingkasanKategori();
    summary.title = dapatkanKelompokKategori(kelompokKategoriTerpilih)?.nama || '';
  }
  bar?.classList.toggle('has-suggestion', Boolean(kategoriSaranSaatIni));
}

function kelompokkanDetailKategori(categories) {
  const details = (Array.isArray(categories) ? categories : [])
    .map(item => typeof item === 'string' ? { nama: item, jumlah: null } : item)
    .filter(item => item && item.nama);
  const belumDikelompokkan = new Map(details.map(item => [item.nama, item]));
  const groups = KELOMPOK_KATEGORI_UI.map(group => ({
    ...group,
    items: group.kategori
      .map(category => belumDikelompokkan.get(category))
      .filter(Boolean)
  })).filter(group => group.items.length > 0);

  KELOMPOK_KATEGORI_UI.forEach(group => {
    group.kategori.forEach(category => belumDikelompokkan.delete(category));
  });
  if (belumDikelompokkan.size > 0) {
    groups.push({
      id: 'kategori-lainnya',
      nama: 'Kategori Lainnya',
      deskripsi: 'Kategori tambahan dari Knowledge Base',
      ikon: 'grid',
      kategori: [...belumDikelompokkan.keys()],
      items: [...belumDikelompokkan.values()]
    });
  }
  return groups;
}

function buatOpsiKategoriTerkelompok(categories, nilaiAwal, labelAwal, tampilkanJumlah = false) {
  const groups = kelompokkanDetailKategori(categories);
  const options = [`<option value="${sanitasiHtml(nilaiAwal)}">${sanitasiHtml(labelAwal)}</option>`];
  groups.forEach(group => {
    options.push(`<optgroup label="${sanitasiHtml(group.nama)} (${group.items.length})">`);
    group.items.forEach(item => {
      const count = Number(item.jumlah) || 0;
      const suffix = tampilkanJumlah ? ` (${count})` : '';
      options.push(`<option value="${sanitasiHtml(item.nama)}">${sanitasiHtml(item.nama)}${suffix}</option>`);
    });
    options.push('</optgroup>');
  });
  return options.join('');
}

function buatOpsiKelompokKategori(nilaiAwal = '', labelAwal = '-- Pilih kategori utama --') {
  return [
    `<option value="${sanitasiHtml(nilaiAwal)}">${sanitasiHtml(labelAwal)}</option>`,
    ...KELOMPOK_KATEGORI_UI.map(group => (
      `<option value="${sanitasiHtml(group.id)}">${sanitasiHtml(group.nama)}</option>`
    ))
  ].join('');
}

const DAFTAR_PETUGAS_HSSE_FALLBACK = [
  { nama: 'M. Solihin', peran: 'Superintendent HSSE PT Pertamina EP Lirik Field', nomor: '6281234567890' },
  { nama: 'Juni Trihardiyanto', peran: 'Senior Safety Lead (SIKA, JSA & APD)', nomor: '6281234567891' },
  { nama: 'Dr. Irsyad Yoga', peran: 'Chief Medical Officer & Health Lead', nomor: '6281234567892' },
  { nama: 'Jayadi', peran: 'Chief Security Officer (SIML & Keamanan Field)', nomor: '6281234567893' },
  { nama: 'Ronny Pribadi', peran: 'Senior Environmental & Compliance Specialist', nomor: '6281234567894' },
  { nama: 'Andre & Della', peran: 'Finance dan Administrasi HSSE', nomor: '6281234567895' }
];

const PETA_PETUGAS_KATEGORI = {
  'Alat Pelindung Diri (APD)': 'Juni Trihardiyanto',
  'Pekerjaan di Ketinggian': 'Juni Trihardiyanto',
  'Kelistrikan': 'Juni Trihardiyanto',
  'Alat Berat & Kendaraan': 'Juni Trihardiyanto',
  'Pengangkatan & Rigging': 'Juni Trihardiyanto',
  'Ruang Terbatas (Confined Space)': 'Juni Trihardiyanto',
  'Pekerjaan Panas (Hot Work)': 'Juni Trihardiyanto',
  'Bahan Kimia & B3': 'Ronny Pribadi',
  'Lingkungan Kerja': 'Ronny Pribadi',
  'Tanggap Darurat': 'Dr. Irsyad Yoga',
  'Pengawasan & Prosedur': 'M. Solihin',
  'Umum': 'M. Solihin'
};

// Ikon antarmuka berbasis SVG agar visual konsisten di seluruh perangkat.
const DEFINISI_IKON_UI = {
  home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bot: '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 3h6M12 3v4M8 12h.01M16 12h.01M9 16h6"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.7 9.7 0 0 1-4-.8L3 21l1.7-4.3A8.5 8.5 0 1 1 21 11.5Z"/>',
  alert: '<path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  shield: '<path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  hardhat: '<path d="M4 14a8 8 0 0 1 16 0M2 14h20v4H2zM9 14V7m6 7V7"/>',
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  bolt: '<path d="m13 2-9 12h8l-1 8 9-12h-8Z"/>',
  truck: '<path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M8 15h8"/>',
  siren: '<path d="M6 15v-4a6 6 0 0 1 12 0v4M4 15h16v4H4zM12 2v2M3.5 5.5l2 2M20.5 5.5l-2 2"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 12H2a10 10 0 0 0 20 0h-3M8 12h8"/>',
  door: '<path d="M5 21V3h13v18M9 21V7h6v14M12 13h.01"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.5-4.5-8 .1 2-1 3.5-2 4.5C11 9 9 6.5 9.5 3 6 5.5 5 9 5 13c0 5 3 9 7 9Z"/>',
  leaf: '<path d="M20 4C10 4 5 9 5 17c6 0 12-3 15-13Z"/><path d="M4 21c2-5 6-9 12-13"/>',
  process: '<path d="M5 4h14v5H5zM5 15h14v5H5zM8 9v6M16 9v6"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 12M5.5 15A7 7 0 0 0 18 17.5l2-5.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M21 12h-2M12 21v-2M3 12h2"/>',
  file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>'
};

function buatIkonAntarmuka(namaIkon, kelasTambahan = '') {
  const bentuk = DEFINISI_IKON_UI[namaIkon] || DEFINISI_IKON_UI.shield;
  return `<svg class="ui-icon ${kelasTambahan}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${bentuk}</svg>`;
}

function isiIkonAntarmuka(elemen, namaIkon) {
  if (elemen) elemen.innerHTML = buatIkonAntarmuka(namaIkon);
}

function tambahkanIkonTombol(elemen, namaIkon) {
  if (!elemen || elemen.querySelector(':scope > .ui-icon')) return;
  elemen.insertAdjacentHTML('afterbegin', buatIkonAntarmuka(namaIkon));
}

function terapkanIkonAntarmuka() {
  const ikonNav = { home: 'home', services: 'book', chatbot: 'bot', contact: 'message' };
  document.querySelectorAll('.nav-link').forEach(elemen => isiIkonAntarmuka(elemen.querySelector('.nav-icon'), ikonNav[elemen.dataset.view]));

  ['book', 'grid', 'users', 'lock'].forEach((ikon, indeks) => isiIkonAntarmuka(document.querySelectorAll('.stat-icon')[indeks], ikon));
  ['clipboard', 'search', 'shield', 'phone'].forEach((ikon, indeks) => isiIkonAntarmuka(document.querySelectorAll('.guide-step-icon')[indeks], ikon));

  const ikonKategori = {
    'icon-apd': 'hardhat', 'icon-ketinggian': 'activity', 'icon-kelistrikan': 'bolt',
    'icon-alatberat': 'truck', 'icon-kimia': 'flask', 'icon-darurat': 'siren',
    'icon-rigging': 'anchor', 'icon-confined': 'door', 'icon-hotwork': 'flame',
    'icon-lingkungan': 'leaf', 'icon-prosedur': 'clipboard', 'icon-umum': 'process'
  };
  Object.entries(ikonKategori).forEach(([kelas, ikon]) => isiIkonAntarmuka(document.querySelector(`.${kelas}`), ikon));

  const ikonKategoriPilihan = {
    'Alat Pelindung Diri (APD)': 'hardhat', 'Pekerjaan di Ketinggian': 'activity',
    'Kelistrikan': 'bolt', 'Alat Berat & Kendaraan': 'truck', 'Bahan Kimia & B3': 'flask',
    'Tanggap Darurat': 'siren', 'Lingkungan Kerja': 'leaf', 'Pengawasan & Prosedur': 'clipboard',
    'Umum': 'process'
  };
  document.querySelectorAll('.guided-cat-card').forEach(kartu => isiIkonAntarmuka(kartu.querySelector('.gcat-icon'), ikonKategoriPilihan[kartu.dataset.cat] || 'shield'));

  document.querySelectorAll('.roster-avatar, .tech-avatar').forEach(elemen => isiIkonAntarmuka(elemen, 'user'));
  document.querySelectorAll('[data-choice-icon]').forEach(elemen => isiIkonAntarmuka(elemen, elemen.dataset.choiceIcon));
  document.querySelectorAll('[data-ui-icon]').forEach(elemen => tambahkanIkonTombol(elemen, elemen.dataset.uiIcon));
  ['phone', 'file', 'timer', 'lock'].forEach((ikon, indeks) => isiIkonAntarmuka(document.querySelectorAll('.wa-feat-icon')[indeks], ikon));
  ['bolt', 'search', 'users', 'message', 'phone', 'lock'].forEach((ikon, indeks) => isiIkonAntarmuka(document.querySelectorAll('.feature-icon')[indeks], ikon));
  isiIkonAntarmuka(document.querySelector('.chat-icon-badge'), 'bot');

  document.querySelectorAll('.btn[onclick="openConsultationModal()"]').forEach(elemen => tambahkanIkonTombol(elemen, 'alert'));
  document.querySelectorAll('.btn[onclick^="openDirectWhatsApp"]').forEach(elemen => tambahkanIkonTombol(elemen, 'message'));
  document.querySelectorAll('.btn[onclick="switchView(\'chatbot\')"]').forEach(elemen => tambahkanIkonTombol(elemen, 'bot'));
  document.querySelectorAll('.btn[onclick="switchView(\'services\')"]').forEach(elemen => tambahkanIkonTombol(elemen, 'book'));
  document.querySelectorAll('.btn-clear-cat').forEach(elemen => tambahkanIkonTombol(elemen, 'refresh'));
  document.querySelectorAll('.btn[onclick="resetChatConversation()"]').forEach(elemen => tambahkanIkonTombol(elemen, 'trash'));
  document.querySelectorAll('#btn-send-chat').forEach(elemen => tambahkanIkonTombol(elemen, 'send'));
  document.querySelectorAll('.modal-close-btn').forEach(elemen => {
    elemen.textContent = '';
    isiIkonAntarmuka(elemen, 'close');
    elemen.setAttribute('aria-label', 'Tutup dialog');
  });
  document.querySelectorAll('.btn-success').forEach(elemen => tambahkanIkonTombol(elemen, 'message'));
  document.querySelector('.nav-link.active')?.setAttribute('aria-current', 'page');
}

function terapkanAksesibilitasAntarmuka() {
  document.querySelectorAll('button:not([type])').forEach(tombol => tombol.type = 'button');
  document.querySelectorAll('.cat-card, .roster-card').forEach(kartu => {
    if (!kartu.hasAttribute('onclick')) return;
    if (kartu.matches('button, a')) return;
    kartu.setAttribute('role', 'button');
    kartu.setAttribute('tabindex', '0');
    kartu.addEventListener('keydown', peristiwa => {
      if (peristiwa.key === 'Enter' || peristiwa.key === ' ') {
        peristiwa.preventDefault();
        kartu.click();
      }
    });
  });
  document.querySelectorAll('.guided-cat-card').forEach(kartu => kartu.setAttribute('aria-pressed', String(kartu.classList.contains('active'))));

  const modalSemua = document.querySelectorAll('.modal-overlay');
  modalSemua.forEach(modal => {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', String(!modal.classList.contains('active')));
    const pengamat = new MutationObserver(() => {
      const aktif = modal.classList.contains('active');
      modal.setAttribute('aria-hidden', String(!aktif));
      document.body.classList.toggle('modal-open', Boolean(document.querySelector('.modal-overlay.active')));
      if (aktif) {
        if (!document.activeElement?.closest?.('.modal-overlay')) pemicuModalTerakhir = document.activeElement;
        setTimeout(() => modal.querySelector('[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), .handling-choice, button:not(.modal-close-btn), a[href]')?.focus(), 50);
      } else if (!document.querySelector('.modal-overlay.active') && pemicuModalTerakhir instanceof HTMLElement) {
        pemicuModalTerakhir.focus({ preventScroll: true });
      }
    });
    pengamat.observe(modal, { attributes: true, attributeFilter: ['class'] });
    modal.addEventListener('mousedown', peristiwa => {
      if (peristiwa.target === modal) modal.querySelector('.modal-close-btn')?.click();
    });
  });

  document.addEventListener('keydown', peristiwa => {
    const modalAktif = document.querySelector('.modal-overlay.active');
    if (!modalAktif) return;
    if (peristiwa.key === 'Escape') {
      modalAktif.querySelector('.modal-close-btn')?.click();
      return;
    }
    if (peristiwa.key !== 'Tab') return;
    const fokusTersedia = [...modalAktif.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(elemen => elemen.offsetParent !== null);
    if (fokusTersedia.length === 0) return;
    const pertama = fokusTersedia[0];
    const terakhir = fokusTersedia[fokusTersedia.length - 1];
    if (peristiwa.shiftKey && document.activeElement === pertama) {
      peristiwa.preventDefault();
      terakhir.focus();
    } else if (!peristiwa.shiftKey && document.activeElement === terakhir) {
      peristiwa.preventDefault();
      pertama.focus();
    }
  });

  document.addEventListener('click', peristiwa => {
    const menu = document.getElementById('nav-menu');
    const navigasi = document.querySelector('.navbar');
    if (!menu?.classList.contains('active') || navigasi?.contains(peristiwa.target)) return;
    menu.classList.remove('active');
    document.querySelector('.mobile-toggle')?.setAttribute('aria-expanded', 'false');
  });
}

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', () => {
  tampilkanKelompokKategoriBeranda();
  tampilkanSeluruhKategoriChat(
    KELOMPOK_KATEGORI_UI.flatMap(group => group.kategori.map(nama => ({ nama, jumlah: null })))
  );
  pasangOverlayChatPadaBody();
  inisialisasiRiwayatSesiChat();
  terapkanIkonAntarmuka();
  terapkanAksesibilitasAntarmuka();
  inisialisasiModeChatSeluler();
  inisialisasiValidasiWhatsApp();
  periksaKesehatanBackend();
  muatPertanyaanAwal();
  muatRosterPetugas();
});

// Fungsi Utilitas Debounce
function tundaEksekusi(fungsi, waktuTunggu = 300) {
  return function(...argumen) {
    clearTimeout(pembuatPemberhentiDebounce);
    pembuatPemberhentiDebounce = setTimeout(() => fungsi.apply(this, argumen), waktuTunggu);
  };
}
function debounce(func, wait = 300) { return tundaEksekusi(func, wait); }

async function fetchDenganBatasWaktu(url, opsi = {}, batasMs = 15000) {
  const pengontrol = new AbortController();
  const timer = setTimeout(() => pengontrol.abort(), batasMs);
  try {
    return await fetch(url, { ...opsi, signal: pengontrol.signal });
  } finally {
    clearTimeout(timer);
  }
}

function tampilkanNotifikasi(pesan, jenis = 'info') {
  const wilayah = document.getElementById('toast-region');
  if (!wilayah) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${jenis}`;
  toast.setAttribute('role', jenis === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="toast-indicator" aria-hidden="true"></span>
    <span>${sanitasiHtml(pesan)}</span>
    <button type="button" aria-label="Tutup notifikasi">${buatIkonAntarmuka('close')}</button>
  `;
  const hapus = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 180);
  };
  toast.querySelector('button').addEventListener('click', hapus);
  wilayah.appendChild(toast);
  setTimeout(hapus, 5500);
}

function petugasBerdasarkanNama(nama) {
  if (!nama) return null;
  const target = nama.toLowerCase();
  return daftarPetugasHsse.find(p => String(p.nama || p.name || '').toLowerCase() === target)
    || DAFTAR_PETUGAS_HSSE_FALLBACK.find(p => p.nama.toLowerCase() === target)
    || null;
}

function petugasBerdasarkanKategori(kategori) {
  const dariApi = daftarPetugasHsse.find(p => String(p.kategori || p.category || '').toLowerCase() === String(kategori || '').toLowerCase());
  return dariApi || petugasBerdasarkanNama(PETA_PETUGAS_KATEGORI[kategori]) || DAFTAR_PETUGAS_HSSE_FALLBACK[0];
}

function daftarKontakHsse() {
  return DAFTAR_PETUGAS_HSSE_FALLBACK.map(petugas => {
    const versiApi = petugasBerdasarkanNama(petugas.nama);
    return versiApi ? { ...petugas, ...versiApi } : petugas;
  });
}

// ==========================================================================
// 1. Pengalih Tampilan SPA
// ==========================================================================
function alihkanTampilan(namaTampilan) {
  const panelPanel = document.querySelectorAll('.view-panel');
  panelPanel.forEach(p => p.classList.remove('active'));

  if (namaTampilan === 'services') namaTampilan = 'services-panel';
  document.body.dataset.activeView = namaTampilan === 'services-panel' ? 'services' : namaTampilan;
  const tautanLewati = document.querySelector('.skip-link');
  if (tautanLewati) tautanLewati.href = `#view-${namaTampilan}`;

  const panelAktif = document.getElementById('view-' + namaTampilan);
  if (panelAktif) panelAktif.classList.add('active');

  if (namaTampilan === 'services-panel') {
    muatDataFaq();
  }

  const tautanNavigasi = document.querySelectorAll('.nav-link');
  tautanNavigasi.forEach(l => {
    const aktif = l.dataset.view === namaTampilan || (namaTampilan === 'services-panel' && l.dataset.view === 'services');
    l.classList.toggle('active', aktif);
    if (aktif) l.setAttribute('aria-current', 'page');
    else l.removeAttribute('aria-current');
  });

  const menu = document.getElementById('nav-menu');
  if (menu) menu.classList.remove('active');
  document.querySelector('.mobile-toggle')?.setAttribute('aria-expanded', 'false');

  if (namaTampilan !== 'chatbot') {
    tutupPemilihKategoriMobile(false);
    tutupDrawerChat(false);
    document.body.classList.remove('chat-keyboard-open', 'chat-composer-active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function switchView(viewName) { alihkanTampilan(viewName); }

function sakelarMenuSeluler() {
  const menu = document.getElementById('nav-menu');
  if (menu) {
    const aktif = menu.classList.toggle('active');
    document.querySelector('.mobile-toggle')?.setAttribute('aria-expanded', String(aktif));
  }
}
function toggleMobileMenu() { sakelarMenuSeluler(); }

function apakahChatMobile() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 820px)').matches;
}

function pasangOverlayChatPadaBody() {
  const panelKategori = document.getElementById('category-selector-bar');
  if (panelKategori && !indukPanelKategoriChat) {
    indukPanelKategoriChat = panelKategori.parentElement;
    elemenSetelahPanelKategoriChat = panelKategori.nextSibling;
  }
  [
    document.getElementById('mobile-category-backdrop'),
    document.getElementById('chat-drawer-backdrop'),
    document.getElementById('chat-session-drawer')
  ].forEach(element => {
    if (element && element.parentElement !== document.body) document.body.appendChild(element);
  });
}

function pasangPanelKategoriPadaBody() {
  const panel = document.getElementById('category-selector-bar');
  if (!panel || !apakahChatMobile()) return;
  if (pemulihPanelKategoriTimeout) {
    window.clearTimeout(pemulihPanelKategoriTimeout);
    pemulihPanelKategoriTimeout = null;
  }
  if (!indukPanelKategoriChat) {
    indukPanelKategoriChat = panel.parentElement;
    elemenSetelahPanelKategoriChat = panel.nextSibling;
  }
  if (panel.parentElement !== document.body) document.body.appendChild(panel);
}

function pulihkanPosisiPanelKategori() {
  const panel = document.getElementById('category-selector-bar');
  if (!panel || !indukPanelKategoriChat || panel.parentElement === indukPanelKategoriChat) return;
  if (elemenSetelahPanelKategoriChat?.parentElement === indukPanelKategoriChat) {
    indukPanelKategoriChat.insertBefore(panel, elemenSetelahPanelKategoriChat);
  } else {
    indukPanelKategoriChat.appendChild(panel);
  }
  if (!apakahChatMobile()) {
    const title = panel.querySelector('.guided-cat-title');
    const help = panel.querySelector('.guided-cat-help');
    if (title) title.textContent = 'Pilih kategori utama';
    if (help) help.textContent = 'Pilih yang paling sesuai. Jika ragu, langsung tulis laporan.';
  }
}

function siapkanPanelKategoriMobile(panel) {
  if (!panel || !apakahChatMobile()) return;
  const title = panel.querySelector('.guided-cat-title');
  const help = panel.querySelector('.guided-cat-help');
  if (title) title.textContent = 'Pilih kategori utama';
  if (help) help.textContent = 'Pilih yang paling sesuai dengan kondisi yang Anda temukan.';
}

function tampilkanKategoriInlineMobile() {
  const container = document.getElementById('mobile-inline-category-options');
  if (!container) return;
  const groups = KELOMPOK_KATEGORI_UI;
  const buatTombol = group => {
    const active = kelompokKategoriTerpilih === group.id;
    return `
      <button class="mobile-category-option mobile-category-group-option ${active ? 'active' : ''}" type="button"
        data-category-group="${sanitasiHtml(group.id)}" aria-pressed="${active}">
        <span class="mobile-category-group-icon" aria-hidden="true">${buatIkonAntarmuka(group.ikon)}</span>
        <span class="mobile-category-group-copy">
          <strong>${sanitasiHtml(group.nama)}</strong>
          <small>${sanitasiHtml(group.deskripsi)}</small>
        </span>
        <span class="mobile-category-group-state">${active ? 'Dipilih' : 'Pilih'}</span>
      </button>
    `;
  };

  container.innerHTML = `
    <section class="mobile-category-quick" aria-label="Kategori utama laporan">
      <div class="mobile-category-section-label">
        <strong>Pilih satu kategori</strong>
        <span>Gunakan pilihan yang paling mendekati kondisi di lapangan</span>
      </div>
      <div class="mobile-inline-group-grid">
        ${groups.map(buatTombol).join('')}
      </div>
    </section>
  `;

  container.querySelectorAll('[data-category-group]').forEach(button => {
    button.addEventListener('click', () => pilihKelompokKategori(button.dataset.categoryGroup));
  });
}

function gulirKePesanChatTerbaru() {
  const aliran = document.getElementById('chat-messages');
  if (aliran) aliran.scrollTop = aliran.scrollHeight;
}

function bukaPemilihKategoriMobile() {
  const panel = document.getElementById('category-selector-bar');
  if (!panel) return;
  const inlinePicker = document.getElementById('mobile-inline-category-picker');
  if (apakahChatMobile() && inlinePicker) {
    tutupDrawerChat(false);
    inlinePicker.classList.add('open');
    inlinePicker.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-inline-category-open');
    document.body.classList.remove('mobile-category-open');
    const backdrop = document.getElementById('mobile-category-backdrop');
    if (backdrop) backdrop.hidden = true;
    document.getElementById('mobile-category-trigger')?.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => {
      const active = inlinePicker.querySelector('.mobile-category-option.active');
      const options = document.getElementById('mobile-inline-category-options');
      if (active && options) options.scrollTop = Math.max(0, active.offsetTop - 70);
    });
    return;
  }
  if (!apakahChatMobile()) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const backdrop = document.getElementById('mobile-category-backdrop');
  tutupDrawerChat(false);
  pasangPanelKategoriPadaBody();
  siapkanPanelKategoriMobile(panel);
  panel.classList.add('mobile-open');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add('mobile-category-open');
  document.getElementById('mobile-category-trigger')?.setAttribute('aria-expanded', 'true');

  const selectedCard = panel.querySelector('.guided-cat-group-card.active');
  window.setTimeout(() => {
    (selectedCard || panel.querySelector('.guided-cat-group-card, .mobile-category-close'))?.focus({ preventScroll: true });
  }, 80);
}
function openMobileCategoryPanel() { bukaPemilihKategoriMobile(); }

function tutupPemilihKategoriMobile(kembalikanFokus = true) {
  const panel = document.getElementById('category-selector-bar');
  const backdrop = document.getElementById('mobile-category-backdrop');
  const inlinePicker = document.getElementById('mobile-inline-category-picker');
  inlinePicker?.classList.remove('open');
  inlinePicker?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('mobile-inline-category-open');
  if (panel) {
    panel.classList.remove('mobile-open');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    panel.querySelectorAll('.guided-cat-group > summary').forEach(summary => summary.removeAttribute('tabindex'));
  }
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove('mobile-category-open');
  const trigger = document.getElementById('mobile-category-trigger');
  trigger?.setAttribute('aria-expanded', 'false');
  if (kembalikanFokus && apakahChatMobile()) trigger?.focus({ preventScroll: true });
  pemulihPanelKategoriTimeout = window.setTimeout(() => {
    pulihkanPosisiPanelKategori();
    pemulihPanelKategoriTimeout = null;
  }, 230);
}
function closeMobileCategoryPanel() { tutupPemilihKategoriMobile(true); }

function selesaikanPilihanKategoriMobile() {
  tutupPemilihKategoriMobile(true);
}
function finishMobileCategorySelection() { selesaikanPilihanKategoriMobile(); }

function inisialisasiModeChatSeluler() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const viewport = window.visualViewport;
  let tinggiViewportNormal = Math.round(window.innerHeight || document.documentElement.clientHeight);

  const sinkronkanViewport = () => {
    const tinggiViewport = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight);
    document.documentElement.style.setProperty('--chat-viewport-height', `${tinggiViewport}px`);
    if (!apakahChatMobile()) {
      tutupPemilihKategoriMobile(false);
      tutupDrawerChat(false);
      document.body.classList.remove('chat-keyboard-open', 'chat-composer-active');
      return;
    }
    if (document.activeElement !== input) {
      tinggiViewportNormal = tinggiViewport;
    }
    const selisihViewport = viewport
      ? Math.max(0, Math.round(window.innerHeight - viewport.height))
      : Math.max(0, tinggiViewportNormal - tinggiViewport);
    const keyboardTerbuka = apakahChatMobile()
      && document.activeElement === input
      && selisihViewport > 100;
    document.body.classList.toggle('chat-keyboard-open', keyboardTerbuka);
    document.body.classList.toggle('chat-composer-active', keyboardTerbuka);
    if (keyboardTerbuka) window.requestAnimationFrame(gulirKePesanChatTerbaru);
  };

  input.addEventListener('focus', () => {
    tutupDrawerChat(false);
    tutupPemilihKategoriMobile(false);
    sinkronkanViewport();
    window.setTimeout(() => {
      sinkronkanViewport();
      gulirKePesanChatTerbaru();
    }, 120);
  });
  input.addEventListener('input', perbaruiSaranKategoriDariInput);
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (document.activeElement !== input) {
        document.body.classList.remove('chat-keyboard-open', 'chat-composer-active');
        sinkronkanViewport();
      }
    }, 120);
  });
  viewport?.addEventListener('resize', sinkronkanViewport);
  viewport?.addEventListener('scroll', sinkronkanViewport);
  window.addEventListener('resize', sinkronkanViewport);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (document.body.classList.contains('mobile-category-open')) {
        tutupPemilihKategoriMobile(true);
      } else if (document.body.classList.contains('chat-drawer-open')) {
        tutupDrawerChat(true);
      }
    }
  });
  sinkronkanViewport();
}

function bacaRiwayatChatLokal() {
  try {
    const dataTersimpan = window.localStorage.getItem(KUNCI_RIWAYAT_CHAT) || '[]';
    const data = JSON.parse(dataTersimpan);
    if (!Array.isArray(data)) return [];
    return data
      .filter(item => item && typeof item.id === 'string')
      .map(item => ({
        id: item.id,
        judul: String(item.judul || 'Percakapan baru'),
        dibuat: item.dibuat || new Date().toISOString(),
        diperbarui: item.diperbarui || item.dibuat || new Date().toISOString(),
        kategori: Array.isArray(item.kategori) ? item.kategori.filter(Boolean) : [],
        kelompokKategori: dapatkanKelompokKategori(item.kelompokKategori)
          ? item.kelompokKategori
          : null,
        pesan: Array.isArray(item.pesan)
          ? item.pesan.filter(message => message && typeof message.teks === 'string').map(message => ({
              peran: message.peran === 'user' ? 'user' : 'system',
              pengirim: String(message.pengirim || (message.peran === 'user' ? 'Pelapor' : 'SIGAP-AI HSSE Companion')),
              teks: message.teks,
              terstruktur: Boolean(message.terstruktur),
              waktu: message.waktu || item.diperbarui || new Date().toISOString()
            }))
          : []
      }));
  } catch (error) {
    return [];
  }
}

function simpanRiwayatChatLokal() {
  try {
    window.localStorage.setItem(KUNCI_RIWAYAT_CHAT, JSON.stringify(daftarSesiChatLokal));
    window.localStorage.setItem(KUNCI_SESI_CHAT_AKTIF, idSesiSaatIni);
  } catch (error) {
    // Aplikasi tetap dapat digunakan ketika penyimpanan perangkat dibatasi browser.
  }
}

function buatDataSesiChat(id = buatIdSesiChat()) {
  const sekarang = new Date().toISOString();
  return {
    id,
    judul: 'Percakapan baru',
    dibuat: sekarang,
    diperbarui: sekarang,
    kategori: [],
    kelompokKategori: null,
    pesan: []
  };
}

function dapatkanSesiChatAktif() {
  return daftarSesiChatLokal.find(session => session.id === idSesiSaatIni) || null;
}

function pastikanSesiChatAktif() {
  let session = dapatkanSesiChatAktif();
  if (!session) {
    session = buatDataSesiChat(idSesiSaatIni);
    daftarSesiChatLokal.unshift(session);
  }
  return session;
}

function buatJudulSesiChat(teks) {
  const ringkas = String(teks || '').replace(/\s+/g, ' ').trim();
  if (!ringkas) return 'Percakapan baru';
  return ringkas.length > 46 ? `${ringkas.slice(0, 46).trim()}…` : ringkas;
}

function labelKelompokTanggalSesi(timestamp) {
  const tanggal = new Date(timestamp);
  if (Number.isNaN(tanggal.getTime())) return 'Sebelumnya';
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const hariSesi = new Date(tanggal);
  hariSesi.setHours(0, 0, 0, 0);
  const selisihHari = Math.floor((hariIni - hariSesi) / 86400000);
  if (selisihHari <= 0) return 'Hari ini';
  if (selisihHari === 1) return 'Kemarin';
  if (selisihHari < 7) return '7 hari terakhir';
  return 'Sebelumnya';
}

function formatWaktuSesi(timestamp) {
  const tanggal = new Date(timestamp);
  if (Number.isNaN(tanggal.getTime())) return '';
  const kelompok = labelKelompokTanggalSesi(timestamp);
  if (kelompok === 'Hari ini' || kelompok === 'Kemarin') {
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(tanggal);
  }
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(tanggal);
}

function tampilkanDaftarSesiChat() {
  const container = document.getElementById('chat-session-list');
  if (!container) return;
  const sessions = [...daftarSesiChatLokal]
    .sort((a, b) => new Date(b.diperbarui) - new Date(a.diperbarui));
  if (sessions.length === 0) {
    container.innerHTML = '<div class="chat-drawer-empty">Belum ada riwayat percakapan.</div>';
    return;
  }

  const groups = new Map();
  sessions.forEach(session => {
    const label = labelKelompokTanggalSesi(session.diperbarui);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(session);
  });

  container.innerHTML = [...groups.entries()].map(([label, items]) => `
    <section class="chat-session-group">
      <h4>${sanitasiHtml(label)}</h4>
      ${items.map(session => {
        const kelompok = dapatkanKelompokKategori(session.kelompokKategori);
        const metadata = session.kategori.length > 0
          ? session.kategori.slice(0, 2).join(', ')
          : (kelompok ? `${kelompok.nama} · otomatis` : 'Kategori otomatis');
        return `
          <button class="chat-session-item ${session.id === idSesiSaatIni ? 'active' : ''}" type="button" ${pengirimanChatBerlangsung ? 'disabled' : ''}
            data-session-id="${sanitasiHtml(session.id)}" aria-current="${session.id === idSesiSaatIni ? 'true' : 'false'}">
            <span class="chat-session-item-mark" aria-hidden="true"></span>
            <span class="chat-session-item-copy">
              <strong>${sanitasiHtml(session.judul)}</strong>
              <small>${sanitasiHtml(metadata)}</small>
            </span>
            <time>${sanitasiHtml(formatWaktuSesi(session.diperbarui))}</time>
          </button>
        `;
      }).join('')}
    </section>
  `).join('');

  container.querySelectorAll('[data-session-id]').forEach(button => {
    button.addEventListener('click', () => pilihSesiChat(button.dataset.sessionId));
  });
}

function aturStatusPengirimanChat(aktif) {
  pengirimanChatBerlangsung = Boolean(aktif);
  document.querySelectorAll('.chat-new-button, .chat-drawer-new').forEach(button => {
    button.disabled = pengirimanChatBerlangsung;
  });
  tampilkanDaftarSesiChat();
}

function htmlPembukaChat() {
  return `
    <div class="chat-bubble system-bubble">
      <div class="bubble-sender">SIGAP-AI HSSE Companion</div>
      <div class="bubble-text">Selamat datang di Sistem Pendamping Keselamatan Kerja! Langsung tuliskan kondisi bahaya yang Anda temui. Sistem akan membantu menentukan kategorinya secara otomatis.</div>
    </div>
  `;
}

function tampilkanSesiChat(session) {
  if (!session) return;
  idSesiSaatIni = session.id;
  currentSessionId = idSesiSaatIni;
  kategoriTerpilih = [...session.kategori];
  kelompokKategoriTerpilih = dapatkanKelompokKategori(session.kelompokKategori)
    ? session.kelompokKategori
    : (dapatkanKelompokDariKategori(kategoriTerpilih[0])?.id || null);
  petugasTerpilihSaatIni = kategoriTerpilih.length > 0
    ? petugasBerdasarkanKategori(kategoriTerpilih[0])
    : null;
  tautanWhatsAppTerakhir = null;
  pesanWhatsAppTerakhir = null;
  sembunyikanBilahPenyelesaian();

  const stream = document.getElementById('chat-messages');
  if (stream) stream.innerHTML = session.pesan.length > 0 ? '' : htmlPembukaChat();
  sedangMemulihkanSesiChat = true;
  session.pesan.forEach(message => {
    if (message.terstruktur) {
      tambahkanGelembungChatTerstruktur(message.peran, message.pengirim, message.teks);
    } else {
      tambahkanGelembungChat(message.peran, message.pengirim, message.teks);
    }
  });
  sedangMemulihkanSesiChat = false;

  const input = document.getElementById('chat-input');
  if (input) input.value = '';
  perbaruiTampilanKategoriTerpilih();
  simpanRiwayatChatLokal();
  tampilkanDaftarSesiChat();
  window.requestAnimationFrame(gulirKePesanChatTerbaru);
}

function inisialisasiRiwayatSesiChat() {
  daftarSesiChatLokal = bacaRiwayatChatLokal();
  let idTersimpan = null;
  try {
    idTersimpan = window.localStorage.getItem(KUNCI_SESI_CHAT_AKTIF);
  } catch (error) {}
  const session = daftarSesiChatLokal.find(item => item.id === idTersimpan)
    || daftarSesiChatLokal[0]
    || buatDataSesiChat(idSesiSaatIni);
  if (!daftarSesiChatLokal.some(item => item.id === session.id)) daftarSesiChatLokal.unshift(session);
  tampilkanSesiChat(session);
}

function catatPesanPadaSesiChat(peran, pengirim, teks, terstruktur = false) {
  if (sedangMemulihkanSesiChat) return;
  const session = pastikanSesiChatAktif();
  const sekarang = new Date().toISOString();
  session.pesan.push({ peran, pengirim, teks: String(teks), terstruktur, waktu: sekarang });
  session.kategori = daftarKategoriTerpilih();
  session.kelompokKategori = kelompokKategoriTerpilih;
  session.diperbarui = sekarang;
  if (peran === 'user' && session.judul === 'Percakapan baru') {
    session.judul = buatJudulSesiChat(teks);
  }
  simpanRiwayatChatLokal();
  tampilkanDaftarSesiChat();
}

function perbaruiKategoriPadaSesiChat() {
  const session = pastikanSesiChatAktif();
  session.kategori = daftarKategoriTerpilih();
  session.kelompokKategori = kelompokKategoriTerpilih;
  session.diperbarui = new Date().toISOString();
  simpanRiwayatChatLokal();
  tampilkanDaftarSesiChat();
}

function pilihSesiChat(sessionId) {
  if (pengirimanChatBerlangsung) {
    tampilkanNotifikasi('Tunggu analisis HSSE selesai sebelum berpindah sesi.', 'warning');
    return;
  }
  const session = daftarSesiChatLokal.find(item => item.id === sessionId);
  if (!session) return;
  alihkanTampilan('chatbot');
  tampilkanSesiChat(session);
  tutupDrawerChat(false);
}
function switchChatSession(sessionId) { pilihSesiChat(sessionId); }

function bukaDrawerChat() {
  if (!apakahChatMobile()) return;
  document.getElementById('chat-input')?.blur();
  document.body.classList.remove('chat-keyboard-open', 'chat-composer-active');
  tutupPemilihKategoriMobile(false);
  const drawer = document.getElementById('chat-session-drawer');
  const backdrop = document.getElementById('chat-drawer-backdrop');
  if (drawer) drawer.inert = false;
  drawer?.classList.add('open');
  drawer?.setAttribute('aria-hidden', 'false');
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add('chat-drawer-open');
  document.getElementById('chat-drawer-trigger')?.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => drawer?.querySelector('.chat-drawer-close')?.focus({ preventScroll: true }), 80);
}
function openChatDrawer() { bukaDrawerChat(); }

function tutupDrawerChat(kembalikanFokus = true) {
  const drawer = document.getElementById('chat-session-drawer');
  const backdrop = document.getElementById('chat-drawer-backdrop');
  drawer?.classList.remove('open');
  drawer?.setAttribute('aria-hidden', 'true');
  if (drawer) drawer.inert = true;
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove('chat-drawer-open');
  const trigger = document.getElementById('chat-drawer-trigger');
  trigger?.setAttribute('aria-expanded', 'false');
  if (kembalikanFokus && apakahChatMobile()) trigger?.focus({ preventScroll: true });
}
function closeChatDrawer() { tutupDrawerChat(true); }

function mulaiPercakapanChatBaru() {
  if (pengirimanChatBerlangsung) {
    tampilkanNotifikasi('Tunggu analisis HSSE selesai sebelum membuat percakapan baru.', 'warning');
    return;
  }
  const sessionAktif = dapatkanSesiChatAktif();
  if (sessionAktif && sessionAktif.pesan.length === 0 && sessionAktif.kategori.length === 0 && !sessionAktif.kelompokKategori) {
    tampilkanSesiChat(sessionAktif);
    tutupDrawerChat(false);
    return;
  }
  const session = buatDataSesiChat();
  daftarSesiChatLokal.unshift(session);
  tampilkanSesiChat(session);
  tutupDrawerChat(false);
  tutupPemilihKategoriMobile(false);
  tampilkanNotifikasi('Percakapan baru siap. Tulis kondisi bahaya; kategori akan dideteksi otomatis.', 'info');
}

function startNewChatFromDrawer() { mulaiPercakapanChatBaru(); }

function bukaKnowledgeDariDrawerChat() {
  tutupDrawerChat(false);
  alihkanTampilan('services-panel');
}
function openKnowledgeFromChatDrawer() { bukaKnowledgeDariDrawerChat(); }

function bukaKontakHsseDariDrawerChat() {
  tutupDrawerChat(false);
  bukaWhatsAppLangsung();
}
function openHsseContactFromChatDrawer() { bukaKontakHsseDariDrawerChat(); }

function tampilkanKelompokKategoriBeranda() {
  const container = document.querySelector('#section-services .category-grid');
  if (!container) return;
  container.innerHTML = KELOMPOK_KATEGORI_UI.map(group => `
    <button class="cat-card category-group-card ${kelompokKategoriTerpilih === group.id ? 'active' : ''}" type="button"
      data-category-group="${sanitasiHtml(group.id)}" aria-pressed="${kelompokKategoriTerpilih === group.id}"
      onclick="openChatWithGroup('${group.id}')">
      <div class="cat-card-header">
        <span class="cat-icon" aria-hidden="true">${buatIkonAntarmuka(group.ikon)}</span>
      </div>
      <h3>${sanitasiHtml(group.nama)}</h3>
      <p>${sanitasiHtml(group.deskripsi)}.</p>
      <div class="cat-vendor-tag">Pilih kategori ini</div>
    </button>
  `).join('');

  const toolbar = document.querySelector('#section-services .category-toolbar');
  if (toolbar) {
    toolbar.innerHTML = `
      <span><strong>Pilih kategori yang paling sesuai.</strong> Jika ragu, langsung tulis laporan dan sistem akan membantu.</span>
      <button class="btn btn-secondary" type="button" data-ui-icon="book" onclick="switchView('services-panel')">Buka Knowledge Base</button>
    `;
  }
}

function bukaChatDenganKelompok(idKelompok) {
  pilihKelompokKategori(idKelompok, { tutupPanelMobile: false });
  alihkanTampilan('chatbot');
  window.setTimeout(() => document.getElementById('chat-input')?.focus(), 120);
}
function openChatWithGroup(groupId) { bukaChatDenganKelompok(groupId); }

function pilihKelompokKategori(idKelompok, opsi = {}) {
  const kelompok = dapatkanKelompokKategori(idKelompok);
  if (!kelompok) return;
  kelompokKategoriTerpilih = idKelompok;
  kategoriTerpilih = [];
  kategoriSaranSaatIni = deteksiKategoriDariPesan(
    document.getElementById('chat-input')?.value || '',
    kelompokKategoriTerpilih
  );
  perbaruiTampilanKategoriTerpilih();
  perbaruiKategoriPadaSesiChat();
  tampilkanKelompokKategoriBeranda();
  tampilkanNotifikasi(`${kelompok.nama} dipilih. Silakan tulis kondisi yang ditemukan.`, 'info');
  if (opsi.tutupPanelMobile !== false && apakahChatMobile()) {
    tutupPemilihKategoriMobile(true);
  }
}
function selectCategoryGroup(groupId) { pilihKelompokKategori(groupId); }

// ==========================================================================
// 2. Pemeriksaan Kesehatan Backend & Memuat Petugas
// ==========================================================================
function sinkronkanKategoriFormulir(details) {
  if (!Array.isArray(details) || details.length === 0) return;
  const categories = details
    .map(item => typeof item === 'string' ? { nama: item, jumlah: null } : item)
    .filter(item => item && item.nama)
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  detailKategoriKnowledge = categories;
  const total = categories.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);

  if (total > 0) {
    document.querySelectorAll('[data-knowledge-total]').forEach(element => {
      element.textContent = String(total);
    });
  }

  const consultationSelect = document.getElementById('cons-category');
  if (consultationSelect) {
    const previousValue = idKelompokDariPilihan(consultationSelect.value);
    consultationSelect.innerHTML = buatOpsiKelompokKategori('', '-- Pilih kategori utama --');
    consultationSelect.value = dapatkanKelompokKategori(previousValue) ? previousValue : '';
  }

  const whatsappSelect = document.getElementById('wa-input-category');
  if (whatsappSelect) {
    const previousValue = idKelompokDariPilihan(whatsappSelect.value);
    whatsappSelect.innerHTML = buatOpsiKelompokKategori('', '-- Pilih kategori utama --');
    whatsappSelect.value = dapatkanKelompokKategori(previousValue) ? previousValue : '';
    perbaruiPesanWhatsAppLangsung();
  }

  tampilkanSeluruhKategoriChat(categories);
}

function tampilkanSeluruhKategoriChat(categories = detailKategoriKnowledge) {
  const container = document.querySelector('.guided-cat-grid');
  if (!container) return;
  const groups = KELOMPOK_KATEGORI_UI;
  const title = document.querySelector('.guided-cat-title');
  if (title) title.textContent = 'Pilih kategori utama';
  const help = document.querySelector('.guided-cat-help');
  if (help) help.textContent = 'Pilih yang paling sesuai. Jika ragu, langsung tulis laporan.';

  container.innerHTML = groups.map(group => {
    const active = kelompokKategoriTerpilih === group.id;
    return `
      <button class="guided-cat-group-card ${active ? 'active' : ''}" type="button"
        data-category-group="${sanitasiHtml(group.id)}" aria-pressed="${active}">
        <span class="guided-group-icon" aria-hidden="true">${buatIkonAntarmuka(group.ikon)}</span>
        <span class="guided-group-copy">
          <strong>${sanitasiHtml(group.nama)}</strong>
          <small>${sanitasiHtml(group.deskripsi)}</small>
        </span>
        <span class="guided-group-state">${active ? 'Dipilih' : 'Pilih'}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('[data-category-group]').forEach(card => {
    card.addEventListener('click', () => pilihKelompokKategori(card.dataset.categoryGroup));
  });
  tampilkanKategoriInlineMobile();
}

async function periksaKesehatanBackend() {
  const indikator = document.getElementById('status-indicator');
  try {
    const res = await fetchDenganBatasWaktu(`${URL_DASAR_API}/knowledge/categories`, {}, 5000);
    if (res.ok) {
      const payload = await res.json();
      sinkronkanKategoriFormulir(payload?.data?.details || payload?.data?.categories || []);
      percobaanKesehatanBackend = 0;
      if (indikator) {
        indikator.className = 'status-indicator online';
        indikator.querySelector('.status-label').textContent = 'SISTEM SIAP';
        indikator.title = 'Layanan HSSE terhubung';
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    if (indikator) {
      indikator.className = 'status-indicator offline';
      indikator.querySelector('.status-label').textContent = 'MODE OFFLINE';
      indikator.title = 'Layanan HSSE belum terhubung';
    }
    if (percobaanKesehatanBackend < 3) {
      percobaanKesehatanBackend += 1;
      window.setTimeout(periksaKesehatanBackend, 5000);
    }
  }
}
function checkBackendHealth() { periksaKesehatanBackend(); }

async function muatRosterPetugas() {
  try {
    const res = await fetchDenganBatasWaktu(`${URL_DASAR_API}/knowledge/technicians`, {}, 8000);
    if (!res.ok) throw new Error('Gagal memuat roster HSSE');
    const data = await res.json();
    if (data.success && data.data) {
      daftarPetugasHsse = data.data.petugas || data.data.technicians || [];
      technicianRoster = daftarPetugasHsse;
      tampilkanSeluruhKategoriChat();
    }
  } catch (err) {}
}
function loadTechniciansRoster() { muatRosterPetugas(); }

// ==========================================================================
// 3. Logika Formulir & Modal Konsultasi
// ==========================================================================
function bukaModalKonsultasi() {
  document.getElementById('consultation-modal').classList.add('active');
}
function openConsultationModal() { bukaModalKonsultasi(); }

function tutupModalKonsultasi() {
  document.getElementById('consultation-modal').classList.remove('active');
}
function closeConsultationModal() { tutupModalKonsultasi(); }

async function kirimFormulirKonsultasi() {
  const elemenUrgensi = document.getElementById('cons-urgency');
  const tombolKirim = document.getElementById('btn-submit-consultation');
  const namaPelapor = document.getElementById('cons-name').value.trim() || 'Pelapor Anonim';
  const idKelompok = document.getElementById('cons-category').value;
  const detailTemuan = document.getElementById('cons-device').value.trim();
  const deskripsi = document.getElementById('cons-description').value.trim();
  const kategoriRinci = tentukanKategoriRinci(idKelompok, `${detailTemuan} ${deskripsi}`);
  if (tombolKirim?.disabled) return;
  if (tombolKirim) {
    tombolKirim.disabled = true;
    tombolKirim.setAttribute('aria-busy', 'true');
    tombolKirim.innerHTML = '<span class="button-spinner" aria-hidden="true"></span> Menyimpan laporan';
  }
  muatanKonsultasiTertunda = {
    session_id: idSesiSaatIni,
    id_sesi: idSesiSaatIni,
    reporter_name: namaPelapor,
    nama_pelapor: namaPelapor,
    division: document.getElementById('cons-division').value.trim(),
    divisi: document.getElementById('cons-division').value.trim(),
    location: document.getElementById('cons-location').value.trim(),
    lokasi: document.getElementById('cons-location').value.trim(),
    category_group: idKelompok,
    kelompok_kategori: idKelompok,
    category_group_label: namaKelompokKategori(idKelompok),
    category: kategoriRinci,
    kategori: kategoriRinci,
    device: detailTemuan,
    detail_temuan: detailTemuan,
    description: deskripsi,
    deskripsi,
    urgency: elemenUrgensi ? elemenUrgensi.value : 'Sedang',
    urgensi: elemenUrgensi ? elemenUrgensi.value : 'Sedang'
  };
  pendingConsultationPayload = muatanKonsultasiTertunda;

  let berhasilTersimpan = false;
  try {
    const respons = await fetchDenganBatasWaktu(`${URL_DASAR_API}/consultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(muatanKonsultasiTertunda)
    }, 12000);
    const payloadRespons = await respons.json();
    if (!respons.ok || !payloadRespons.success) throw new Error('Server menolak laporan');
    const nomorTiket = payloadRespons?.data?.ticket_number || payloadRespons?.data?.consultation?.ticket_number;
    if (nomorTiket) {
      muatanKonsultasiTertunda.ticket_number = nomorTiket;
    }
    berhasilTersimpan = true;
  } catch (err) {
    tampilkanNotifikasi('Draf tersimpan di sesi ini, tetapi belum tercatat di server. Anda tetap dapat melanjutkan ke Asisten HSSE atau WhatsApp.', 'warning');
  } finally {
    if (tombolKirim) {
      tombolKirim.disabled = false;
      tombolKirim.removeAttribute('aria-busy');
      tombolKirim.textContent = 'Lanjutkan analisis';
    }
    const pesanPilihan = document.getElementById('consultation-choice-message');
    if (pesanPilihan) {
      pesanPilihan.textContent = berhasilTersimpan
        ? `Laporan telah tersimpan${muatanKonsultasiTertunda?.ticket_number ? ` dengan tiket ${muatanKonsultasiTertunda.ticket_number}` : ''}. Pilih analisis otomatis atau hubungi Tim HSSE secara langsung.`
        : 'Draf laporan tersedia di sesi ini. Pilih metode penanganan untuk melanjutkan.';
    }
    tutupModalKonsultasi();
    document.getElementById('consultation-choice-modal').classList.add('active');
  }
}
function submitConsultationForm() { kirimFormulirKonsultasi(); }

function tutupModalPilihan() {
  document.getElementById('consultation-choice-modal').classList.remove('active');
}
function closeChoiceModal() { tutupModalPilihan(); }

function lanjutkanKeKonsultasiChatbot() {
  tutupModalPilihan();
  alihkanTampilan('chatbot');

  if (muatanKonsultasiTertunda && (muatanKonsultasiTertunda.deskripsi || muatanKonsultasiTertunda.description)) {
    if (muatanKonsultasiTertunda.categories || muatanKonsultasiTertunda.kategori || muatanKonsultasiTertunda.category) {
      kategoriTerpilih = Array.isArray(muatanKonsultasiTertunda.categories)
        ? [...muatanKonsultasiTertunda.categories]
        : [muatanKonsultasiTertunda.kategori || muatanKonsultasiTertunda.category];
      kelompokKategoriTerpilih = muatanKonsultasiTertunda.category_group
        || muatanKonsultasiTertunda.kelompok_kategori
        || idKelompokDariPilihan(kategoriTerpilih[0]);
      perbaruiTampilanKategoriTerpilih();
    }
    const elemenInput = document.getElementById('chat-input');
    if (elemenInput) {
      elemenInput.value = muatanKonsultasiTertunda.deskripsi || muatanKonsultasiTertunda.description;
      kirimPesanChat();
    }
  }
}
function proceedToChatbotConsultation() { lanjutkanKeKonsultasiChatbot(); }

async function lanjutkanKeWhatsAppLangsung() {
  tutupModalPilihan();
  if (muatanKonsultasiTertunda?.categories || muatanKonsultasiTertunda?.category || muatanKonsultasiTertunda?.kategori) {
    kategoriTerpilih = Array.isArray(muatanKonsultasiTertunda.categories)
      ? [...muatanKonsultasiTertunda.categories]
      : [muatanKonsultasiTertunda.category || muatanKonsultasiTertunda.kategori];
    kelompokKategoriTerpilih = muatanKonsultasiTertunda.category_group
      || muatanKonsultasiTertunda.kelompok_kategori
      || idKelompokDariPilihan(kategoriTerpilih[0]);
  }

  try {
    const res = await fetchDenganBatasWaktu(`${URL_DASAR_API}/chatbot/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: idSesiSaatIni,
        id_sesi: idSesiSaatIni,
        resolved: false,
        feedback: 'Laporan langsung ke Tim HSSE via WhatsApp',
        ...(muatanKonsultasiTertunda || {})
      })
    }, 12000);

    const data = await res.json();
    if (res.ok && data.success) {
      petugasTerpilihSaatIni = data.data.assigned_technician || data.data.petugas_ditunjuk;
      tautanWhatsAppTerakhir = data.data.whatsapp_url;
      pesanWhatsAppTerakhir = data.data.whatsapp_message;
      bukaModalWhatsApp(tautanWhatsAppTerakhir, pesanWhatsAppTerakhir);
    } else {
      bukaWhatsAppLangsung();
    }
  } catch (err) {
    bukaWhatsAppLangsung();
  }
}
function proceedToDirectWhatsAppConsultation() { lanjutkanKeWhatsAppLangsung(); }

// ==========================================================================
// 4. Engine Chatbot HSSE & Rendering Respons Terstruktur
// ==========================================================================
const CONTOH_KATEGORI = {
  "Alat Pelindung Diri (APD)": [
    { judul: "Pekerja Tanpa Helm", teks: "Pekerja tidak menggunakan helm di area konstruksi" },
    { judul: "Helm Tidak Terkunci", teks: "Pekerja menggunakan helm tetapi tali pengunci chin strap tidak terpasang" },
    { judul: "Tanpa Sepatu Safety", teks: "Pekerja tidak menggunakan sepatu safety di area kerja" },
    { judul: "Tanpa Sarung Tangan", teks: "Pekerja tidak menggunakan sarung tangan saat menangani material tajam" }
  ],
  "Pekerjaan di Ketinggian": [
    { judul: "Ketinggian Tanpa Harness", teks: "Pekerja bekerja di ketinggian tanpa safety harness" },
    { judul: "Atap Tanpa Lifeline", teks: "Pekerja berada di atas atap tanpa menggunakan lifeline" },
    { judul: "Perancah Tidak Stabil", teks: "Scaffolding / perancah goyah dan tidak stabil saat dinaiki" },
    { judul: "Tanpa Pagar Pengaman", teks: "Tepi area kerja ketinggian tidak dilengkapi guardrail" }
  ],
  "Kelistrikan": [
    { judul: "Kabel Listrik Terbuka", teks: "Kabel listrik terkelupas dan terbuka di area melintas" },
    { judul: "Perbaikan Tanpa LOTO", teks: "Teknisi memperbaiki mesin tanpa menerapkan Lockout Tagout (LOTO)" },
    { judul: "Panel Listrik Terbuka", teks: "Panel listrik utama terbuka tanpa pengaman" },
    { judul: "Listrik di Area Basah", teks: "Peralatan listrik dioperasikan di atas lantai yang tergenang air" }
  ],
  "Alat Berat & Kendaraan": [
    { judul: "Operator Tanpa Sertifikat", teks: "Penggunaan alat berat oleh operator yang tidak memiliki SIO/sertifikasi" },
    { judul: "Forklift Beban Berlebih", teks: "Forklift mengangkut beban melebihi kapasitas standar" },
    { judul: "Pekerja Dekat Alat Berat", teks: "Pekerja berdiri di zona bahaya dekat pergerakan alat berat" },
    { judul: "Alat Berat Tanpa Alarm", teks: "Alat berat beroperasi tanpa alarm mundur dan sirine" }
  ],
  "Bahan Kimia & B3": [
    { judul: "Kimia Tanpa Label MSDS", teks: "Wadah bahan kimia disimpan tanpa label identifikasi dan MSDS" },
    { judul: "Tumpahan Bahan Kimia", teks: "Terdapat tumpahan cairan kimia di lantai kerja yang belum dibersihkan" },
    { judul: "Bahan Flammable Dekat Panas", teks: "Bahan mudah terbakar disimpan dekat sumber panas/las" }
  ],
  "Pengangkatan & Rigging": [
    { judul: "Sling Tidak Layak", teks: "Sling pengangkatan terlihat aus dan belum memiliki tag inspeksi yang berlaku" },
    { judul: "Pekerja di Bawah Beban", teks: "Pekerja berada di bawah beban yang sedang diangkat oleh crane" },
    { judul: "Rigger Tidak Tersertifikasi", teks: "Aktivitas lifting dilakukan tanpa rigger dan signalman yang kompeten" }
  ],
  "Ruang Terbatas (Confined Space)": [
    { judul: "Masuk Tanpa Gas Test", teks: "Pekerja memasuki ruang terbatas tanpa pengujian kadar oksigen dan gas berbahaya" },
    { judul: "Tanpa Standby Man", teks: "Pekerjaan confined space berlangsung tanpa Standby Man di luar area" },
    { judul: "Ventilasi Tidak Memadai", teks: "Sirkulasi udara di dalam tangki tidak memadai selama pekerjaan berlangsung" }
  ],
  "Pekerjaan Panas (Hot Work)": [
    { judul: "Pengelasan Tanpa Permit", teks: "Aktivitas pengelasan dilakukan tanpa Hot Work Permit yang masih berlaku" },
    { judul: "Tanpa Fire Watcher", teks: "Pekerjaan panas berlangsung tanpa Fire Watcher dan APAR yang siap digunakan" },
    { judul: "Bahan Mudah Terbakar", teks: "Material mudah terbakar masih berada di sekitar area pengelasan" }
  ],
  "Tanggap Darurat": [
    { judul: "Tanpa APAR", teks: "Tidak tersedia APAR di area kerja berisiko tinggi kebakaran" },
    { judul: "Jalur Evakuasi Terhalang", teks: "Jalur evakuasi terhalang oleh tumpukan material" },
    { judul: "Pintu Darurat Terkunci", teks: "Pintu keluar darurat dalam kondisi terantai dan terkunci" }
  ],
  "Lingkungan Kerja": [
    { judul: "Lantai Licin Saat Hujan", teks: "Area kerja licin akibat genangan air hujan" },
    { judul: "Pencahayaan Redup", teks: "Pencahayaan di area kerja malam hari sangat minim" },
    { judul: "Material Berserakan", teks: "Sisa material berserakan membahayakan akses pejalan kaki" }
  ],
  "Pengawasan & Prosedur": [
    { judul: "Pekerjaan Tanpa SOP", teks: "Pekerjaan berisiko tinggi dilakukan tanpa mengikuti SOP" },
    { judul: "Tanpa Briefing TBM", teks: "Pekerjaan dimulai tanpa pelaksanaan Toolbox Meeting (TBM)" },
    { judul: "Pengawasan Tidak Ada", teks: "Pekerjaan lapangan berlangsung tanpa pengawasan supervisor HSSE" }
  ],
  "Umum": [
    { judul: "Bahaya Campuran APD & Area Kerja", teks: "Laporan kombinasi pelanggaran APD dan kondisi area kerja tidak aman" },
    { judul: "Regulasi & Standar K3 Umum", teks: "Konsultasi umum regulasi dan standar norma keselamatan kerja di lokasi proyek" },
    { judul: "Pelaporan Insiden & Near Miss", teks: "Prosedur pelaporan insiden, kecelakaan kerja, atau kejadian hampir celaka (near miss)" },
    { judul: "Koordinasi Lintas Tim SIMOPS", teks: "Kurangnya koordinasi antar kontraktor/tim pada pekerjaan bersamaan (SIMOPS)" }
  ]
};

function tampilkanTombolContohKategori(kategoriPilihan) {
  const wadah = document.getElementById('starter-chips');
  const elemenLabel = document.querySelector('.starter-chips-label');
  if (!wadah) return;

  const categories = Array.isArray(kategoriPilihan)
    ? kategoriPilihan.filter(Boolean)
    : (kategoriPilihan ? [kategoriPilihan] : []);

  if (categories.length === 0) {
    if (elemenLabel) elemenLabel.textContent = 'Contoh laporan cepat tersedia setelah kategori dipilih';
    wadah.innerHTML = `
      <span class="starter-empty">
         Pilih satu atau beberapa kategori bahaya untuk melihat contoh laporan yang relevan.
      </span>
    `;
    return;
  }

  const daftarContoh = categories.flatMap(category =>
    (CONTOH_KATEGORI[category] || []).slice(0, 2).map(item => ({
      ...item,
      kategori: category
    }))
  ).slice(0, 8);

  if (daftarContoh.length === 0) {
    if (elemenLabel) elemenLabel.textContent = `${categories.length} kategori dipilih`;
    wadah.innerHTML = `
      <span class="starter-empty">
        Tuliskan kondisi, lokasi, aktivitas, dan sumber bahaya secara spesifik pada kolom laporan.
      </span>
    `;
    return;
  }

  if (elemenLabel) {
    elemenLabel.textContent = `Contoh laporan dari ${categories.length} kategori terpilih`;
  }

  wadah.innerHTML = daftarContoh.map(s => `
    <button class="chip-btn starter-message-action" type="button"
      data-message="${sanitasiHtml(s.teks)}" data-category="${sanitasiHtml(s.kategori)}">
       ${sanitasiHtml(s.judul)}
    </button>
  `).join('');
  wadah.querySelectorAll('.starter-message-action').forEach(button => {
    button.addEventListener('click', () => {
      kirimPesanContoh(button.dataset.message, button.dataset.category);
    });
  });
}

async function muatPertanyaanAwal() {
  try {
    const response = await fetchDenganBatasWaktu(`${URL_DASAR_API}/chatbot/starters`, {}, 10000);
    if (!response.ok) throw new Error('Gagal memuat contoh laporan');
    const payload = await response.json();
    const starters = payload?.data?.starters || [];
    const kelompokDinamis = {};
    starters.forEach(item => {
      const category = item.kategori || item.category;
      const question = item.pertanyaan || item.question || item.judul;
      if (!category || !question) return;
      if (!kelompokDinamis[category]) kelompokDinamis[category] = [];
      kelompokDinamis[category].push({
        judul: item.judul || question,
        teks: question,
        kbId: item.kb_id || null
      });
    });
    Object.entries(kelompokDinamis).forEach(([category, items]) => {
      CONTOH_KATEGORI[category] = items;
    });
  } catch (error) {
    // Contoh statis kategori prioritas tetap tersedia ketika backend offline.
  }
  tampilkanTombolContohKategori(kategoriTerpilih);
}
function loadStarterQuestions() { muatPertanyaanAwal(); }

function perbaruiTampilanKategoriTerpilih() {
  const categories = daftarKategoriTerpilih();
  let kelompokAktif = dapatkanKelompokKategori(kelompokKategoriTerpilih);
  const kelompokKategoriRinci = dapatkanKelompokDariKategori(categories[0]);
  if (kelompokKategoriRinci && !kelompokAktif?.kategori.includes(categories[0])) {
    kelompokKategoriTerpilih = kelompokKategoriRinci.id;
    kelompokAktif = kelompokKategoriRinci;
  }
  document.querySelectorAll('[data-category-group]').forEach(k => {
    const aktif = k.getAttribute('data-category-group') === kelompokKategoriTerpilih;
    k.classList.toggle('active', aktif);
    k.setAttribute('aria-pressed', String(aktif));
    const status = k.querySelector('.guided-group-state, .mobile-category-group-state');
    if (status) status.textContent = aktif ? 'Dipilih' : 'Pilih';
  });

  const tombolBersihkan = document.getElementById('btn-clear-cat');
  if (tombolBersihkan) tombolBersihkan.hidden = !kelompokAktif && categories.length === 0;

  const ringkasanKategoriMobile = document.getElementById('mobile-category-summary');
  const pemicuKategoriMobile = document.getElementById('mobile-category-trigger');
  const barKategoriMobile = document.querySelector('.chat-mobile-category-bar');
  if (ringkasanKategoriMobile) {
    ringkasanKategoriMobile.textContent = teksRingkasanKategori();
    ringkasanKategoriMobile.title = kelompokAktif?.nama || '';
  }
  if (pemicuKategoriMobile) pemicuKategoriMobile.textContent = kelompokAktif ? 'Ubah kategori' : 'Pilih kategori';
  barKategoriMobile?.classList.toggle('has-selection', Boolean(kelompokAktif));
  barKategoriMobile?.classList.toggle('has-suggestion', Boolean(kategoriSaranSaatIni));

  const starterBar = document.getElementById('starter-bar');
  if (starterBar) starterBar.hidden = categories.length === 0;

  tampilkanTombolContohKategori(categories);

  const lencanaLangkah = document.getElementById('guided-step-1');
  if (lencanaLangkah) {
    lencanaLangkah.classList.toggle('step-active', Boolean(kelompokAktif));
    lencanaLangkah.textContent = kelompokAktif
      ? `KATEGORI DIPILIH · ${kelompokAktif.nama.toUpperCase()}`
      : 'KATEGORI OPSIONAL';
  }

  const kategoriUtama = categories[0];
  const cocok = petugasBerdasarkanKategori(kategoriUtama || 'Umum');
  petugasTerpilihSaatIni = categories.length > 0 ? cocok : null;

  const elemenBanner = document.getElementById('cat-req-banner');
  const teksBanner = document.getElementById('cat-req-text');
  if (elemenBanner) {
    elemenBanner.className = kelompokAktif ? 'cat-req-banner selected' : 'cat-req-banner optional';
  }
  if (teksBanner) {
    teksBanner.innerHTML = kelompokAktif
      ? `<div><strong>Kategori dipilih: ${sanitasiHtml(kelompokAktif.nama)}</strong><small>Sekarang ceritakan kondisi, lokasi, dan aktivitas yang sedang berlangsung.</small></div>`
      : '<strong>Kategori tidak wajib dipilih.</strong> Langsung tulis kondisi yang ditemukan jika Anda belum yakin.';
  }

  const elemenInput = document.getElementById('chat-input');
  const tombolKirim = document.getElementById('btn-send-chat');
  if (elemenInput) {
    elemenInput.placeholder = kelompokAktif
      ? `Ceritakan kondisi ${kelompokAktif.nama.toLowerCase()}, lokasi, dan aktivitasnya...`
      : 'Ceritakan kondisi bahaya, lokasi, dan aktivitas yang sedang berlangsung...';
  }
  if (tombolKirim) tombolKirim.disabled = false;
}

function pilihKategori(namaKategori) {
  if (!namaKategori) return;
  let categories = daftarKategoriTerpilih();
  const sudahDipilih = categories.includes(namaKategori);

  if (sudahDipilih) {
    categories = categories.filter(category => category !== namaKategori);
  } else if (namaKategori === 'Umum') {
    categories = ['Umum'];
  } else {
    categories = categories.filter(category => category !== 'Umum');
    if (categories.length >= MAKSIMAL_KATEGORI_TERPILIH) {
      tampilkanNotifikasi(`Maksimal ${MAKSIMAL_KATEGORI_TERPILIH} kategori dapat dipilih.`, 'warning');
      return;
    }
    categories.push(namaKategori);
  }

  kategoriTerpilih = categories;
  const kelompokKategori = dapatkanKelompokDariKategori(categories[0]);
  if (kelompokKategori) kelompokKategoriTerpilih = kelompokKategori.id;
  perbaruiTampilanKategoriTerpilih();
  perbaruiKategoriPadaSesiChat();
}
function selectCategory(catName) { pilihKategori(catName); }

function bersihkanKategoriTerpilih() {
  kategoriTerpilih = [];
  kelompokKategoriTerpilih = null;
  kategoriSaranSaatIni = null;
  perbaruiTampilanKategoriTerpilih();
  perbaruiKategoriPadaSesiChat();
  tampilkanKelompokKategoriBeranda();
}
function clearSelectedCategory() { bersihkanKategoriTerpilih(); }

function kirimPesanContoh(teksPesan, namaKategori) {
  alihkanTampilan('chatbot');
  if (namaKategori && !daftarKategoriTerpilih().includes(namaKategori)) {
    pilihKategori(namaKategori);
  } else if (!adaKategoriTerpilih()) {
    pilihKategori('Alat Pelindung Diri (APD)');
  }
  const elemenInput = document.getElementById('chat-input');
  const tombolKirim = document.getElementById('btn-send-chat');
  if (elemenInput) {
    elemenInput.disabled = false;
    elemenInput.value = teksPesan;
  }
  if (tombolKirim) {
    tombolKirim.disabled = false;
  }
  kirimPesanChat();
}
function sendStarterMessage(msgText, catName) { kirimPesanContoh(msgText, catName); }

function bukaChatDenganKategori(namaKategori) {
  alihkanTampilan('chatbot');
  kategoriTerpilih = [];
  pilihKategori(namaKategori);

  // Sinkronkan filter FAQ Knowledge Base ke kategori yang dipilih
  if (typeof saringKategoriFaq === 'function') {
    saringKategoriFaq(namaKategori, null);
  }

  const elemenInput = document.getElementById('chat-input');
  if (elemenInput) {
    elemenInput.value = '';
    if (!apakahChatMobile()) elemenInput.focus();
  }
}
function openChatWithCategory(categoryName) { bukaChatDenganKategori(categoryName); }

function tanganiTekanTombolInput(peristiwa) {
  if (peristiwa.key === 'Enter' && !peristiwa.shiftKey) {
    peristiwa.preventDefault();
    kirimPesanChat();
  }
}
function handleChatKeyDown(event) { tanganiTekanTombolInput(event); }

async function kirimPesanChat() {
  const elemenInput = document.getElementById('chat-input');
  const tombolKirim = document.getElementById('btn-send-chat');
  const teksPesan = elemenInput.value.trim();

  if (!teksPesan) return;
  const kategoriOtomatis = deteksiKategoriDariPesan(teksPesan, kelompokKategoriTerpilih);
  if (kategoriOtomatis) {
    kategoriTerpilih = [kategoriOtomatis];
    kategoriSaranSaatIni = kategoriOtomatis;
    const kelompokTerdeteksi = dapatkanKelompokDariKategori(kategoriOtomatis);
    if (kelompokTerdeteksi) kelompokKategoriTerpilih = kelompokTerdeteksi.id;
    perbaruiTampilanKategoriTerpilih();
    perbaruiKategoriPadaSesiChat();
  }

  aturStatusPengirimanChat(true);
  sembunyikanBilahPenyelesaian();
  tambahkanGelembungChat('user', 'Pelapor', teksPesan);
  elemenInput.value = '';
  elemenInput.disabled = true;
  if (tombolKirim) {
    tombolKirim.disabled = true;
    tombolKirim.setAttribute('aria-busy', 'true');
  }

  const idPengetikan = tambahkanIndikatorPengetikanKerangka();

  try {
    const categories = daftarKategoriTerpilih();
    const kategoriUtama = categories[0];
    const muatan = {
      session_id: idSesiSaatIni,
      id_sesi: idSesiSaatIni,
      message: teksPesan,
      pesan: teksPesan,
      category_group: kelompokKategoriTerpilih,
      kelompok_kategori: kelompokKategoriTerpilih
    };
    if (kategoriUtama) {
      muatan.category = kategoriUtama;
      muatan.kategori = kategoriUtama;
      muatan.categories = categories;
      muatan.kategori_list = categories;
    }

    const res = await fetchDenganBatasWaktu(`${URL_DASAR_API}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(muatan)
    }, 30000);

    const data = await res.json();
    hapusIndikatorPengetikan(idPengetikan);

    if (res.ok && data.success) {
      tambahkanGelembungChatTerstruktur('system', 'SIGAP-AI HSSE Companion', data.data.response || data.data.jawaban);

      const kategoriRespons = Array.isArray(data.data.categories)
        ? data.data.categories.filter(Boolean)
        : [data.data.category || data.data.kategori].filter(Boolean);
      if (kategoriRespons.length > 0) {
        kategoriTerpilih = kategoriRespons;
        kategoriSaranSaatIni = null;
        const kelompokRespons = dapatkanKelompokDariKategori(kategoriRespons[0]);
        if (kelompokRespons) kelompokKategoriTerpilih = kelompokRespons.id;
        perbaruiTampilanKategoriTerpilih();
        perbaruiKategoriPadaSesiChat();
        tampilkanKelompokKategoriBeranda();
      }

      petugasTerpilihSaatIni = data.data.assigned_technician || data.data.petugas_ditunjuk;
      tautanWhatsAppTerakhir = data.data.whatsapp_url;
      pesanWhatsAppTerakhir = data.data.whatsapp_message;
      if (data.data.technician_roster || data.data.petugas) {
        daftarPetugasHsse = data.data.technician_roster || data.data.petugas;
      }

      tampilkanBilahPenyelesaian();

      if (data.data.needs_escalation || data.data.perlu_eskalasi) {
        tambahkanPetunjukEskalasi(data.data.whatsapp_url);
      }
    } else {
      tambahkanGelembungChat('system', 'SIGAP-AI HSSE Companion', 'Sistem belum dapat menganalisis laporan karena layanan mengalami gangguan. Silakan coba kembali.');
    }
  } catch (err) {
    hapusIndikatorPengetikan(idPengetikan);
    tambahkanGelembungChat('system', 'SIGAP-AI HSSE Companion', 'Layanan analisis belum dapat dihubungi. Coba kembali atau eskalasikan langsung ke Tim HSSE.');
    tampilkanNotifikasi('Layanan analisis belum terhubung.', 'error');
  } finally {
    aturStatusPengirimanChat(false);
    elemenInput.disabled = false;
    if (tombolKirim) {
      tombolKirim.disabled = false;
      tombolKirim.removeAttribute('aria-busy');
    }
    elemenInput.focus();
  }
}
function sendChatMessage() { kirimPesanChat(); }

function tampilkanBilahPenyelesaian() {
  const bilah = document.getElementById('resolution-bar');
  if (bilah) bilah.hidden = false;
}
function showResolutionBar() { tampilkanBilahPenyelesaian(); }

function sembunyikanBilahPenyelesaian() {
  const bilah = document.getElementById('resolution-bar');
  if (bilah) bilah.hidden = true;
}
function hideResolutionBar() { sembunyikanBilahPenyelesaian(); }

async function tanganiMasalahSelesai(apakahSelesai) {
  sembunyikanBilahPenyelesaian();

  try {
    const res = await fetchDenganBatasWaktu(`${URL_DASAR_API}/chatbot/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: idSesiSaatIni, id_sesi: idSesiSaatIni, resolved: apakahSelesai })
    }, 12000);

    const data = await res.json();

    if (apakahSelesai) {
      tambahkanGelembungChat('system', 'SIGAP-AI HSSE Companion', 'Laporan telah dicatat dan kondisi bahaya ditangani. Terima kasih telah mengutamakan keselamatan kerja!');
    } else {
      petugasTerpilihSaatIni = data.data.assigned_technician || data.data.petugas_ditunjuk || petugasTerpilihSaatIni;
      tautanWhatsAppTerakhir = data.data.whatsapp_url;
      pesanWhatsAppTerakhir = data.data.whatsapp_message;
      bukaModalWhatsApp(tautanWhatsAppTerakhir, pesanWhatsAppTerakhir);
    }
  } catch (err) {
    if (!apakahSelesai && tautanWhatsAppTerakhir) {
      bukaModalWhatsApp(tautanWhatsAppTerakhir, pesanWhatsAppTerakhir);
    }
  }
}
function handleIssueResolved(isResolved) { tanganiMasalahSelesai(isResolved); }

function pecahKalimatAnalisisRisiko(teks) {
  const nilai = String(teks || '').replace(/\s+/g, ' ').trim();
  const prefixMatch = nilai.match(/^(Kondisi #\d+)\s*:\s*/i);
  const judul = prefixMatch ? prefixMatch[1] : '';
  const isi = prefixMatch ? nilai.slice(prefixMatch[0].length) : nilai;
  const kalimat = (isi.match(/[^.!?]+(?:[.!?]+|$)/g) || [isi])
    .map(item => item.trim())
    .filter(Boolean);
  return { judul, kalimat };
}

function labelPoinAnalisisRisiko(kalimat, indeks) {
  const nilai = String(kalimat || '').toLocaleLowerCase('id-ID');
  if (/verifik|dicocokkan|jsa|sop|izin kerja|sebelum pekerjaan/.test(nilai)) return 'Verifikasi sebelum bekerja';
  if (/faktor|tingkat risiko|durasi|intensitas|jumlah orang|efektivitas barrier/.test(nilai)) return 'Faktor yang memperbesar risiko';
  if (/konsekuensi|dampak|dapat mengalami|cedera|kerusakan|pencemaran/.test(nilai)) return 'Dampak yang dapat terjadi';
  if (/mekanisme|berkaitan|sumber bahaya|kegagalan/.test(nilai)) return 'Mengapa kondisi ini berbahaya';
  if (/tanpa|tidak adanya|meningkatkan kemungkinan|meningkatkan risiko|berisiko/.test(nilai)) return 'Bahaya utama';
  return indeks === 0 ? 'Bahaya utama' : 'Poin penting';
}

function buatDataAnalisisRisiko(teks) {
  const { judul, kalimat } = pecahKalimatAnalisisRisiko(teks);
  if (kalimat.length === 0) return { judul, ringkasan: '', poin: [] };

  return {
    judul,
    ringkasan: kalimat[0],
    poin: kalimat.slice(1).map((isi, indeks) => ({
      label: labelPoinAnalisisRisiko(isi, indeks),
      isi
    }))
  };
}

function buatHtmlAnalisisRisiko(teks, indeksKelompok) {
  const { judul, ringkasan, poin } = buatDataAnalisisRisiko(teks);
  if (!ringkasan) return '';
  const poinHtml = poin.map(item => `
      <div class="res-analysis-point">
        <span>${sanitasiHtml(item.label)}</span>
        <p>${sanitasiHtml(item.isi)}</p>
      </div>
    `).join('');
  return `
    <section class="res-analysis-case">
      ${judul ? `<div class="res-analysis-heading">${sanitasiHtml(judul)}</div>` : (indeksKelompok > 0 ? `<div class="res-analysis-heading">Analisis tambahan</div>` : '')}
      <div class="res-analysis-summary">
        <span aria-hidden="true"></span>
        <p>${sanitasiHtml(ringkasan)}</p>
      </div>
      ${poinHtml ? `<div class="res-analysis-points">${poinHtml}</div>` : ''}
    </section>
  `;
}

function buatHtmlAnalisisRisikoKnowledge(teks) {
  const { ringkasan, poin } = buatDataAnalisisRisiko(teks);
  if (!ringkasan) return '';

  return `
    <div class="knowledge-risk-summary">
      <span>Ringkasan</span>
      <p>${sanitasiHtml(ringkasan)}</p>
    </div>
    ${poin.length > 0 ? `
      <ul class="knowledge-risk-list">
        ${poin.map(item => `
          <li>
            <span class="knowledge-risk-marker" aria-hidden="true"></span>
            <div>
              <strong>${sanitasiHtml(item.label)}</strong>
              <p>${sanitasiHtml(item.isi)}</p>
            </div>
          </li>
        `).join('')}
      </ul>
    ` : ''}
  `;
}

// Format Respons 6-Bagian Analisis HSSE ke HTML Terstruktur (Bebas Tag <br> Mentah & Sangat Rapi)
function formatHtmlResponsTerstruktur(teksMentah) {
  if (!teksMentah) return '';

  const bagian = {
    kondisi: [],
    risiko: '',
    penjelasan: [],
    solusi: [],
    rekomendasi: [],
    referensi: [],
    status: ''
  };

  const barisBaris = teksMentah.split('\n');
  let bagianSaatIni = '';

  barisBaris.forEach(b => {
    const pangkas = b.trim();
    if (!pangkas) return;

    if (pangkas.startsWith('KONDISI TERIDENTIFIKASI')) {
      bagianSaatIni = 'kondisi';
    } else if (pangkas.startsWith('TINGKAT RISIKO')) {
      bagianSaatIni = 'risiko';
    } else if (pangkas.startsWith('PENJELASAN RISIKO')) {
      bagianSaatIni = 'penjelasan';
    } else if (pangkas.startsWith('SOLUSI & TINDAKAN')) {
      bagianSaatIni = 'solusi';
    } else if (pangkas.startsWith('REKOMENDASI K3')) {
      bagianSaatIni = 'rekomendasi';
    } else if (pangkas.startsWith('REFERENSI KNOWLEDGE BASE')) {
      bagianSaatIni = 'referensi';
    } else if (pangkas.startsWith('STATUS PENANGANAN')) {
      bagianSaatIni = 'status';
    } else {
      if (bagianSaatIni === 'kondisi') {
        bagian.kondisi.push(pangkas);
      } else if (bagianSaatIni === 'risiko') {
        bagian.risiko += (bagian.risiko ? ' ' : '') + pangkas;
      } else if (bagianSaatIni === 'penjelasan') {
        bagian.penjelasan.push(pangkas);
      } else if (bagianSaatIni === 'solusi') {
        bagian.solusi.push(pangkas);
      } else if (bagianSaatIni === 'rekomendasi') {
        bagian.rekomendasi.push(pangkas);
      } else if (bagianSaatIni === 'referensi') {
        bagian.referensi.push(pangkas);
      } else if (bagianSaatIni === 'status') {
        bagian.status += (bagian.status ? ' ' : '') + pangkas;
      }
    }
  });

  let html = `<div class="res-card-block">`;

  // 1. Kondisi Teridentifikasi
  if (bagian.kondisi.length > 0) {
    const kondisiTeksHtml = bagian.kondisi.map(k => {
      const kClean = sanitasiHtml(k);
      if (kClean.startsWith('•')) {
        return `<div class="res-condition-item">${kClean}</div>`;
      }
      return `<div>${kClean}</div>`;
    }).join('');

    html += `
      <div class="res-header-badge">
        <span class="res-block-icon">${buatIkonAntarmuka('search')}</span>
        <div>
          <strong>KONDISI TERIDENTIFIKASI</strong>
          <div class="res-block-content">${kondisiTeksHtml}</div>
        </div>
      </div>
    `;
  }

  // 2. Tingkat Risiko
  if (bagian.risiko) {
    const adalahTinggi = bagian.risiko.includes('TINGGI');
    const adalahSedang = bagian.risiko.includes('SEDANG');
    const kelasLencana = adalahTinggi ? 'status-need-tech' : (adalahSedang ? 'status-user-try' : '');
    html += `
      <div class="res-risk-wrap">
        <span class="res-status-badge ${kelasLencana}">
          ${sanitasiHtml(bagian.risiko)}
        </span>
      </div>
    `;
  }

  // 3. Penjelasan Risiko
  if (bagian.penjelasan.length > 0) {
    const pFilt = bagian.penjelasan.filter(p => p.trim() !== '' && p.trim() !== '-');
    if (pFilt.length > 0) {
      const paragrafPenjelasan = pFilt.map(buatHtmlAnalisisRisiko).join('');

      html += `
        <div class="res-analysis-block">
          <div class="res-section-heading">
            <span class="res-section-icon">${buatIkonAntarmuka('alert')}</span>
            <div>
              <div class="res-section-title">Penjelasan risiko</div>
              <small>Ringkasan analisis bahaya berdasarkan Knowledge Base HSSE</small>
            </div>
          </div>
          ${paragrafPenjelasan}
        </div>
      `;
    }
  }

  // 4. Solusi & Tindakan
  if (bagian.solusi.length > 0) {
    const sFilt = bagian.solusi.filter(s => s.trim() !== '' && s.trim() !== '-');
    if (sFilt.length > 0) {
      const itemSolusiHtml = sFilt.map(s => {
        if (s.startsWith('---')) {
          const judulKelompok = sanitasiHtml(s.replace(/^---\s*/, '').replace(/\s*---$/, ''));
          return `<li class="res-solution-heading">${judulKelompok}</li>`;
        }
        const sClean = sanitasiHtml(s);
        return `<li class="res-solution-item">${sClean}</li>`;
      }).join('');

      html += `
        <div class="res-solution-block">
          <div class="res-section-title">Solusi dan tindakan keselamatan</div>
          <ul class="res-causes-list">
            ${itemSolusiHtml}
          </ul>
        </div>
      `;
    }
  }

  // 5. Rekomendasi K3
  if (bagian.rekomendasi.length > 0) {
    const rFilt = bagian.rekomendasi.filter(r => r.trim() !== '' && r.trim() !== '-');
    if (rFilt.length > 0) {
      const itemRekomendasiHtml = rFilt.map(r => `<div class="res-recommendation-item">${sanitasiHtml(r)}</div>`).join('');
      html += `
        <div class="res-rule-callout">
          <strong>Rekomendasi standar K3 dan penanggung jawab</strong>
          <div>${itemRekomendasiHtml}</div>
        </div>
      `;
    }
  }

  // 6. Referensi artikel knowledge.json yang benar-benar digunakan
  if (bagian.referensi.length > 0) {
    const itemReferensi = bagian.referensi
      .filter(item => item.trim() && item.trim() !== '-')
      .map(item => `<li>${formatReferensiHtml(item)}</li>`)
      .join('');
    if (itemReferensi) {
      html += `
        <div class="res-reference-block">
          <div class="res-section-title">Referensi Knowledge Base</div>
          <div class="res-reference-source">Sumber: knowledge.json</div>
          <ol>${itemReferensi}</ol>
        </div>
      `;
    }
  }

  // 7. Status Penanganan
  if (bagian.status) {
    const statusKecil = bagian.status.toLowerCase();
    const butuhHsse = statusKecil.includes('segera') || statusKecil.includes('tim hsse');
    html += `
      <div>
        <span class="res-status-badge ${butuhHsse ? 'status-need-tech' : 'status-user-try'}">
          Status penanganan: ${sanitasiHtml(bagian.status)}
        </span>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}
function formatStructuredResponseHTML(rawText) { return formatHtmlResponsTerstruktur(rawText); }

function tambahkanGelembungChatTerstruktur(peran, namaPengirim, teksMentah) {
  const aliran = document.getElementById('chat-messages');
  if (!aliran) return;

  const gelembung = document.createElement('div');
  gelembung.className = `chat-bubble ${peran === 'user' ? 'user-bubble' : 'system-bubble'}`;

  const kontenTersetruktur = formatHtmlResponsTerstruktur(teksMentah);

  gelembung.innerHTML = `
    <div class="bubble-sender structured-sender">${sanitasiHtml(namaPengirim)}</div>
    ${kontenTersetruktur}
  `;

  aliran.appendChild(gelembung);
  aliran.scrollTop = aliran.scrollHeight;
  catatPesanPadaSesiChat(peran, namaPengirim, teksMentah, true);
}

// ==========================================================================
// 5. Modal WhatsApp & Komposisi Pesan Real-Time
// ==========================================================================
function pesanKesalahanKolomWhatsApp(konfigurasi, nilai) {
  if (!nilai) return `${konfigurasi.label} wajib diisi.`;
  if (konfigurasi.larangan?.includes(nilai.toLowerCase())) {
    return `${konfigurasi.label} harus menggunakan identitas pelapor yang jelas.`;
  }
  if (konfigurasi.min && nilai.length < konfigurasi.min) {
    return `${konfigurasi.label} minimal ${konfigurasi.min} karakter.`;
  }
  if (konfigurasi.jenis === 'petugas' && String(nilai).replace(/\D/g, '').length < 8) {
    return 'Nomor HSSE Officer tujuan tidak valid.';
  }
  return '';
}

function evaluasiFormWhatsApp({ tampilkanKesalahan = false } = {}) {
  const kesalahan = [];

  KONFIGURASI_KOLOM_WHATSAPP.forEach(konfigurasi => {
    const elemen = document.getElementById(konfigurasi.id);
    if (!elemen) {
      kesalahan.push({ ...konfigurasi, elemen: null, pesan: `${konfigurasi.label} tidak tersedia.` });
      return;
    }

    const nilai = String(elemen.value || '').trim();
    const pesan = pesanKesalahanKolomWhatsApp(konfigurasi, nilai);
    elemen.setCustomValidity(pesan);
    elemen.setAttribute('aria-invalid', String(Boolean(pesan)));
    const perluDitandai = Boolean(pesan) && (tampilkanKesalahan || elemen.dataset.waTouched === 'true');
    elemen.classList.toggle('is-invalid', perluDitandai);
    if (pesan) kesalahan.push({ ...konfigurasi, elemen, pesan });
  });

  const status = document.getElementById('wa-form-status');
  if (status) {
    const lengkap = kesalahan.length === 0;
    status.classList.toggle('is-complete', lengkap);
    status.classList.toggle('has-errors', !lengkap);
    status.textContent = lengkap
      ? 'Data lengkap. Pesan siap dikirim ke HSSE Officer melalui WhatsApp.'
      : `Belum lengkap (${kesalahan.length}): ${kesalahan.map(item => item.label).join(', ')}.`;
  }

  return { valid: kesalahan.length === 0, kesalahan };
}

function inisialisasiValidasiWhatsApp() {
  KONFIGURASI_KOLOM_WHATSAPP.forEach(konfigurasi => {
    const elemen = document.getElementById(konfigurasi.id);
    if (!elemen) return;
    elemen.addEventListener('blur', () => {
      elemen.dataset.waTouched = 'true';
      perbaruiPesanWhatsAppLangsung();
    });
  });
  perbaruiPesanWhatsAppLangsung();
}

function perbaruiPesanWhatsAppLangsung(opsiValidasi = {}) {
  const namaVal = (document.getElementById('wa-input-name')?.value || '').trim();
  const divVal = (document.getElementById('wa-input-division')?.value || '').trim();
  const locVal = (document.getElementById('wa-input-location')?.value || '').trim();
  const catVal = (document.getElementById('wa-input-category')?.value || '').trim();
  const devVal = (document.getElementById('wa-input-device')?.value || '').trim();
  const descVal = (document.getElementById('wa-input-description')?.value || '').trim();
  const urgencyVal = (document.getElementById('wa-input-urgency')?.value || '').trim();
  const namaPetugas = petugasTerpilihSaatIni ? (petugasTerpilihSaatIni.nama || petugasTerpilihSaatIni.name) : 'M. Solihin';
  const peranPetugas = petugasTerpilihSaatIni ? (petugasTerpilihSaatIni.peran || petugasTerpilihSaatIni.role) : 'Superintendent HSSE PT Pertamina EP Lirik Field';
  const nomorPetugas = petugasTerpilihSaatIni ? (petugasTerpilihSaatIni.nomor || petugasTerpilihSaatIni.number) : '6281234567890';
  const teksKategori = namaKelompokKategori(catVal) || '[Belum diisi]';
  const tampilkanNilai = nilai => nilai || '[Belum diisi]';

  const barisPesan = [
    `Halo ${namaPetugas} (${peranPetugas}),`,
    ``,
    `Saya melaporkan kondisi bahaya/temuan keselamatan melalui SIGAP-AI HSSE Companion.`,
    ``,
    `Nama Pelapor:`,
    `${tampilkanNilai(namaVal)}`,
    ``,
    `Fungsi/Divisi:`,
    `${tampilkanNilai(divVal)}`,
    ``,
    `Lokasi Temuan:`,
    `${tampilkanNilai(locVal)}`,
    ``,
    `Kategori Bahaya:`,
    `${teksKategori}`,
    ``,
    `Detail Temuan:`,
    `${tampilkanNilai(devVal)}`,
    ``,
    `Deskripsi Kondisi Bahaya:`,
    `${tampilkanNilai(descVal)}`,
    ``,
    `Tingkat Urgensi:`,
    `${tampilkanNilai(urgencyVal)}`,
    ``,
    `Mohon penanganan dan pengawasan lebih lanjut demi keselamatan kerja. Terima kasih.`
  ];

  const teksMentah = barisPesan.join('\n');
  const kotakPratinjau = document.getElementById('wa-preview-text');
  if (kotakPratinjau) kotakPratinjau.textContent = teksMentah;

  const hasilValidasi = evaluasiFormWhatsApp(opsiValidasi);

  let nomorBersih = String(nomorPetugas).replace(/\D/g, '');
  if (nomorBersih.startsWith('0')) nomorBersih = '62' + nomorBersih.substring(1);

  const tautanWa = hasilValidasi.valid
    ? `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teksMentah)}`
    : null;

  const tautanAksi = document.getElementById('wa-action-link');
  if (tautanAksi) {
    tautanAksi.disabled = !hasilValidasi.valid;
    tautanAksi.setAttribute('aria-disabled', String(!hasilValidasi.valid));
  }

  tautanWhatsAppTerakhir = tautanWa;
  pesanWhatsAppTerakhir = hasilValidasi.valid ? teksMentah : null;
  lastWhatsAppUrl = tautanWhatsAppTerakhir;
  lastWhatsAppMessage = pesanWhatsAppTerakhir;
  return hasilValidasi;
}
function updateLiveWhatsAppMessage() { perbaruiPesanWhatsAppLangsung(); }

function kirimLaporanWhatsApp() {
  const hasilValidasi = perbaruiPesanWhatsAppLangsung({ tampilkanKesalahan: true });
  if (!hasilValidasi.valid || !tautanWhatsAppTerakhir) {
    hasilValidasi.kesalahan[0]?.elemen?.focus();
    tampilkanNotifikasi('Lengkapi seluruh data wajib sebelum mengirim laporan ke Tim HSSE.', 'error');
    return;
  }

  const tautanPembuka = document.createElement('a');
  tautanPembuka.href = tautanWhatsAppTerakhir;
  tautanPembuka.target = '_blank';
  tautanPembuka.rel = 'noopener noreferrer';
  document.body.appendChild(tautanPembuka);
  tautanPembuka.click();
  tautanPembuka.remove();
}
function sendWhatsAppReport() { kirimLaporanWhatsApp(); }

function saatKategoriDipilihDiModalWa() {
  const elemenPilih = document.getElementById('wa-input-category');
  if (!elemenPilih) return;
  const idKelompok = elemenPilih.value;
  const konteks = `${document.getElementById('wa-input-device')?.value || ''} ${document.getElementById('wa-input-description')?.value || ''}`;
  const kategoriRinci = idKelompok ? tentukanKategoriRinci(idKelompok, konteks) : null;
  kelompokKategoriTerpilih = idKelompok || null;
  kategoriTerpilih = kategoriRinci ? [kategoriRinci] : [];
  const cocok = petugasBerdasarkanKategori(kategoriRinci || 'Umum');
  petugasTerpilihSaatIni = cocok;
  currentAssignedTech = petugasTerpilihSaatIni;
  const namaEl = document.getElementById('tech-assigned-name');
  const peranEl = document.getElementById('tech-assigned-role');
  if (namaEl) namaEl.textContent = cocok.nama || cocok.name;
  if (peranEl) peranEl.textContent = cocok.peran || cocok.role;

  const elemenPilihanPetugas = document.getElementById('wa-tech-select');
  if (elemenPilihanPetugas) elemenPilihanPetugas.value = cocok.nomor || cocok.number;
  perbaruiPesanWhatsAppLangsung();
}
function onCategorySelectInWaModal() { saatKategoriDipilihDiModalWa(); }

function bukaModalWhatsApp(tautan, teksMentah) {
  const elemenPilih = document.getElementById('wa-tech-select');
  const namaEl = document.getElementById('tech-assigned-name');
  const peranEl = document.getElementById('tech-assigned-role');
  const modal = document.getElementById('whatsapp-modal');
  const daftarKontak = daftarKontakHsse();

  if (!petugasTerpilihSaatIni || !daftarKontak.some(p => (p.nomor || p.number) === (petugasTerpilihSaatIni.nomor || petugasTerpilihSaatIni.number))) {
    petugasTerpilihSaatIni = daftarKontak[0] || null;
  }

  if (elemenPilih) {
    elemenPilih.innerHTML = daftarKontak.map(p => {
      const isSelected = petugasTerpilihSaatIni && ((petugasTerpilihSaatIni.nama || petugasTerpilihSaatIni.name) === (p.nama || p.name));
      const nama = p.nama || p.name;
      const peran = p.peran || p.role;
      const nomor = p.nomor || p.number;
      return `
        <option value="${sanitasiHtml(nomor)}" ${isSelected ? 'selected' : ''}>
          ${sanitasiHtml(nama)} — ${sanitasiHtml(peran)}
        </option>
      `;
    }).join('');
  }

  if (muatanKonsultasiTertunda) {
    const namaDraf = String(muatanKonsultasiTertunda.nama_pelapor || muatanKonsultasiTertunda.reporter_name || '').trim();
    document.getElementById('wa-input-name').value = ['pelapor anonim', 'anonim'].includes(namaDraf.toLowerCase()) ? '' : namaDraf;
    if (muatanKonsultasiTertunda.divisi || muatanKonsultasiTertunda.division) document.getElementById('wa-input-division').value = muatanKonsultasiTertunda.divisi || muatanKonsultasiTertunda.division;
    if (muatanKonsultasiTertunda.lokasi || muatanKonsultasiTertunda.location) document.getElementById('wa-input-location').value = muatanKonsultasiTertunda.lokasi || muatanKonsultasiTertunda.location;
    const idKelompokDraf = muatanKonsultasiTertunda.category_group
      || muatanKonsultasiTertunda.kelompok_kategori
      || idKelompokDariPilihan(muatanKonsultasiTertunda.kategori || muatanKonsultasiTertunda.category);
    if (idKelompokDraf) document.getElementById('wa-input-category').value = idKelompokDraf;
    if (muatanKonsultasiTertunda.detail_temuan || muatanKonsultasiTertunda.device) document.getElementById('wa-input-device').value = muatanKonsultasiTertunda.detail_temuan || muatanKonsultasiTertunda.device;
    if (muatanKonsultasiTertunda.deskripsi || muatanKonsultasiTertunda.description) document.getElementById('wa-input-description').value = muatanKonsultasiTertunda.deskripsi || muatanKonsultasiTertunda.description;
    if ((muatanKonsultasiTertunda.urgensi || muatanKonsultasiTertunda.urgency) && document.getElementById('wa-input-urgency')) document.getElementById('wa-input-urgency').value = muatanKonsultasiTertunda.urgensi || muatanKonsultasiTertunda.urgency;
  } else {
    if ((kelompokKategoriTerpilih || adaKategoriTerpilih()) && document.getElementById('wa-input-category')) {
      document.getElementById('wa-input-category').value = kelompokKategoriTerpilih
        || idKelompokDariPilihan(kategoriUtamaTerpilih());
    }
  }

  KONFIGURASI_KOLOM_WHATSAPP.forEach(konfigurasi => {
    const elemen = document.getElementById(konfigurasi.id);
    if (!elemen) return;
    delete elemen.dataset.waTouched;
    elemen.classList.remove('is-invalid');
  });

  if (petugasTerpilihSaatIni) {
    if (namaEl) namaEl.textContent = petugasTerpilihSaatIni.nama || petugasTerpilihSaatIni.name || 'M. Solihin';
    if (peranEl) peranEl.textContent = petugasTerpilihSaatIni.peran || petugasTerpilihSaatIni.role || 'Superintendent HSSE PT Pertamina EP Lirik Field';
  } else {
    if (namaEl) namaEl.textContent = 'M. Solihin';
    if (peranEl) peranEl.textContent = 'Superintendent HSSE PT Pertamina EP Lirik Field';
  }

  currentAssignedTech = petugasTerpilihSaatIni;

  perbaruiPesanWhatsAppLangsung();

  if (modal) modal.classList.add('active');
}
function openWhatsAppModal(url, rawMessageText) { bukaModalWhatsApp(url, rawMessageText); }

async function saatPetugasDipilih() {
  const elemenPilih = document.getElementById('wa-tech-select');
  if (!elemenPilih) return;

  const nomorDipilih = elemenPilih.value;
  const cocok = daftarKontakHsse().find(p => (p.nomor || p.number) === nomorDipilih);

  if (cocok) {
    petugasTerpilihSaatIni = cocok;
    currentAssignedTech = petugasTerpilihSaatIni;
    document.getElementById('tech-assigned-name').textContent = cocok.nama || cocok.name;
    document.getElementById('tech-assigned-role').textContent = cocok.peran || cocok.role;
    perbaruiPesanWhatsAppLangsung();
  }
}
function onTechnicianSelected() { saatPetugasDipilih(); }

function tutupModalWhatsApp() {
  const modal = document.getElementById('whatsapp-modal');
  if (modal) modal.classList.remove('active');
}
function closeWhatsAppModal() { tutupModalWhatsApp(); }

function bukaWhatsAppLangsung(namaPetugas = null) {
  if (namaPetugas) petugasTerpilihSaatIni = petugasBerdasarkanNama(namaPetugas) || petugasTerpilihSaatIni;
  if (!petugasTerpilihSaatIni) {
    const pilihanKategori = kelompokKategoriTerpilih || document.getElementById('wa-input-category')?.value;
    const konteks = `${document.getElementById('wa-input-device')?.value || ''} ${document.getElementById('wa-input-description')?.value || ''}`;
    const kategoriAktif = kategoriUtamaTerpilih() || tentukanKategoriRinci(pilihanKategori, konteks);
    petugasTerpilihSaatIni = petugasBerdasarkanKategori(kategoriAktif);
  }
  bukaModalWhatsApp(tautanWhatsAppTerakhir, pesanWhatsAppTerakhir || 'Halo Tim HSSE, saya ingin melaporkan temuan kondisi bahaya di area kerja.');
}
function openDirectWhatsApp(officerName = null) { bukaWhatsAppLangsung(officerName); }

function bukaLaporanDariKnowledgeBase(judul, kategori) {
  const kelompok = dapatkanKelompokDariKategori(kategori);
  kategoriTerpilih = [kategori];
  kelompokKategoriTerpilih = kelompok?.id || null;
  petugasTerpilihSaatIni = petugasBerdasarkanKategori(kategori);
  bukaModalWhatsApp(null, null);
  const kategoriInput = document.getElementById('wa-input-category');
  const deskripsiInput = document.getElementById('wa-input-description');
  const detailInput = document.getElementById('wa-input-device');
  if (kategoriInput) kategoriInput.value = kelompok?.id || '';
  if (detailInput) detailInput.value = judul;
  if (deskripsiInput) deskripsiInput.value = `Temuan terkait: ${judul}`;
  perbaruiPesanWhatsAppLangsung();
}
function openWhatsAppReport(title, category) { bukaLaporanDariKnowledgeBase(title, category); }

function tambahkanGelembungChat(peran, namaPengirim, teks) {
  const aliran = document.getElementById('chat-messages');
  if (!aliran) return;

  const gelembung = document.createElement('div');
  gelembung.className = `chat-bubble ${peran === 'user' ? 'user-bubble' : 'system-bubble'}`;

  gelembung.innerHTML = `
    <div class="bubble-sender">${sanitasiHtml(namaPengirim)}</div>
    <div class="bubble-text">${sanitasiHtml(teks)}</div>
  `;

  aliran.appendChild(gelembung);
  aliran.scrollTop = aliran.scrollHeight;
  catatPesanPadaSesiChat(peran, namaPengirim, teks, false);
}
function appendChatBubble(role, senderName, text) { tambahkanGelembungChat(role, senderName, text); }

function tambahkanIndikatorPengetikanKerangka() {
  const aliran = document.getElementById('chat-messages');
  const id = 'typing-' + Date.now();
  const gelembung = document.createElement('div');
  gelembung.className = 'chat-bubble system-bubble skeleton-bubble';
  gelembung.id = id;
  gelembung.innerHTML = `
    <div class="bubble-sender">SIGAP-AI HSSE Companion</div>
    <div class="bubble-text">Menganalisis kondisi bahaya & mencocokkan Knowledge Base HSSE... </div>
  `;
  aliran.appendChild(gelembung);
  aliran.scrollTop = aliran.scrollHeight;
  return id;
}

function hapusIndikatorPengetikan(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
function removeTypingIndicator(id) { hapusIndikatorPengetikan(id); }

function tambahkanPetunjukEskalasi() {
  const aliran = document.getElementById('chat-messages');
  const gelembung = document.createElement('div');
  gelembung.className = 'chat-bubble system-bubble escalation-bubble';

  const namaPetugas = petugasTerpilihSaatIni ? (petugasTerpilihSaatIni.nama || petugasTerpilihSaatIni.name) : 'Safety Officer';
  const peranPetugas = petugasTerpilihSaatIni ? (petugasTerpilihSaatIni.peran || petugasTerpilihSaatIni.role) : 'Tim HSSE';

  gelembung.innerHTML = `
    <div class="bubble-sender escalation-sender">REKOMENDASI PENANGANAN DENGAN TIM HSSE</div>
    <div class="bubble-text">
      Kondisi ini tergolong berisiko tinggi / memerlukan penanganan langsung oleh <strong>${sanitasiHtml(namaPetugas)}</strong> (${sanitasiHtml(peranPetugas)}).
    </div>
    <button class="btn btn-sm btn-primary escalation-action" onclick="bukaModalWhatsApp()">
      ${buatIkonAntarmuka('message')} Hubungi ${sanitasiHtml(namaPetugas)} via WhatsApp
    </button>
  `;

  aliran.appendChild(gelembung);
  aliran.scrollTop = aliran.scrollHeight;
}

async function resetPercakapanChat() { mulaiPercakapanChatBaru(); }
function resetChatConversation() { resetPercakapanChat(); }

// ==========================================================================
// 6. Pencarian FAQ & Filter
// ==========================================================================
let kategoriFaqAktif = 'Semua';

function cariKelompokDariFilterFaq(filter) {
  if (!String(filter).startsWith('kelompok:')) return null;
  const groupId = String(filter).slice('kelompok:'.length);
  return KELOMPOK_KATEGORI_UI.find(group => group.id === groupId) || null;
}

function eksekusiFilterFaq() {
  const elemenInput = document.getElementById('faq-search-input');
  const kueri = elemenInput ? elemenInput.value.toLowerCase().trim() : '';
  const tokenKueri = kueri.split(/\s+/).filter(Boolean);

  if (!Array.isArray(daftarEntriFaq) || daftarEntriFaq.length === 0) {
    return;
  }

  const terfilter = daftarEntriFaq.filter(item => {
    const judul = (item.judul || item.title || '').toLowerCase();
    const kategori = (item.kategori || item.category || '').toLowerCase();
    const penjelasan = (item.penjelasan_risiko || item.risk_explanation || '').toLowerCase();
    const solusi = (item.solusi || item.solution || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    const kataKunciMentah = item.kata_kunci || item.keywords || [];
    const kataKunci = Array.isArray(kataKunciMentah) ? kataKunciMentah : String(kataKunciMentah).split(',');
    const tagMentah = item.tag || item.tags || [];
    const tag = Array.isArray(tagMentah) ? tagMentah : String(tagMentah).split(',');

    // Category Filter match using precise ID Prefix and Category Name matching
    if (kategoriFaqAktif && kategoriFaqAktif !== 'Semua') {
      const activeGroup = cariKelompokDariFilterFaq(kategoriFaqAktif);
      const itemCategory = item.kategori || item.category || 'Umum';
      const categoryMatches = activeGroup
        ? activeGroup.kategori.includes(itemCategory)
        : apakahCocokKategoriItem(item, kategoriFaqAktif);
      if (!categoryMatches) {
        return false;
      }
    }

    // Text Query Search match
    if (!kueri) return true;

    const teksPencarian = [
      id,
      judul,
      kategori,
      penjelasan,
      solusi,
      ...kataKunci.map(k => String(k).toLowerCase()),
      ...tag.map(k => String(k).toLowerCase())
    ].join(' ');
    return tokenKueri.every(token => teksPencarian.includes(token));
  });

  tampilkanEntriFaq(terfilter);
}

function saringKategoriFaq(namaKategori, elemenTombol) {
  kategoriFaqAktif = namaKategori || 'Semua';

  // Set dropdown select value to match exact selected category
  const elemenSelect = document.getElementById('faq-cat-select');
  if (elemenSelect) {
    let exactValue = 'Semua';
    for (let i = 0; i < elemenSelect.options.length; i++) {
      const optVal = elemenSelect.options[i].value;
      if (optVal.toLowerCase() === kategoriFaqAktif.toLowerCase()) {
        exactValue = optVal;
        break;
      }
    }
    elemenSelect.value = exactValue;
  }

  // Update active status on category chip buttons
  const tombolTombol = document.querySelectorAll('#faq-cat-filters .chip-btn');
  tombolTombol.forEach(b => {
    b.classList.toggle('active', b.dataset.filter === kategoriFaqAktif);
  });

  // Execute filter instantly without delay
  eksekusiFilterFaq();
}

function filterFaqCategory(catName, el) { saringKategoriFaq(catName, el); }
function saatKategoriFaqDipilihDiDropdown(namaKategori) { saringKategoriFaq(namaKategori, null); }
function onFaqSelectCategory(catName) { saatKategoriFaqDipilihDiDropdown(catName); }

function perbaruiKontrolKategoriFaq(entries, metadata = {}) {
  const counts = new Map();
  entries.forEach(item => {
    const category = item.kategori || item.category || 'Umum';
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  const categories = Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'id'));
  const categoryDetails = categories.map(([nama, jumlah]) => ({ nama, jumlah }));
  const groups = kelompokkanDetailKategori(categoryDetails);
  const total = entries.length;

  const select = document.getElementById('faq-cat-select');
  if (select) {
    select.innerHTML = buatOpsiKategoriTerkelompok(
      categoryDetails,
      'Semua',
      `Semua Kategori Bahaya (${total} Artikel)`,
      true
    );
    select.value = counts.has(kategoriFaqAktif) ? kategoriFaqAktif : 'Semua';
  }

  const chipContainer = document.getElementById('faq-cat-filters');
  if (chipContainer) {
    chipContainer.innerHTML = [
      `<button class="chip-btn ${kategoriFaqAktif === 'Semua' ? 'active' : ''}" type="button" data-filter="Semua">Semua (${total})</button>`,
      ...groups.map(group => {
        const filter = `kelompok:${group.id}`;
        const count = group.items.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
        return `<button class="chip-btn ${kategoriFaqAktif === filter ? 'active' : ''}" type="button" data-filter="${sanitasiHtml(filter)}">${sanitasiHtml(group.nama)} (${count})</button>`;
      })
    ].join('');
    chipContainer.querySelectorAll('[data-filter]').forEach(button => {
      button.addEventListener('click', () => saringKategoriFaq(button.dataset.filter, button));
    });
  }

  document.querySelectorAll('[data-knowledge-total]').forEach(element => {
    element.textContent = String(total);
  });
  metadataKnowledge = { ...metadata, total, total_categories: categories.length };
}

async function muatDataFaq(paksaMuatUlang = false) {
  const wadah = document.getElementById('faq-list');
  if (!wadah) return;
  if (pemuatanFaqBerlangsung) return;
  if (!paksaMuatUlang && daftarEntriFaq.length > 0) {
    eksekusiFilterFaq();
    return;
  }

  pemuatanFaqBerlangsung = true;
  wadah.setAttribute('aria-busy', 'true');
  wadah.innerHTML = `
    <div class="knowledge-state knowledge-loading" role="status">
      <span class="button-spinner" aria-hidden="true"></span>
      <strong>Memuat Knowledge Base</strong>
      <span>Menyiapkan panduan keselamatan dari knowledge.json.</span>
    </div>
  `;
  try {
    const res = await fetchDenganBatasWaktu(`${URL_DASAR_API}/knowledge`, {}, 45000);
    if (!res.ok) throw new Error('Gagal memuat Knowledge Base');
    const responseJson = await res.json();

    if (res.ok && responseJson.data) {
      const entriKB = responseJson.data.knowledge_base || responseJson.data.entri || responseJson.data.entries || responseJson.data;
      if (Array.isArray(entriKB) && entriKB.length > 0) {
        daftarEntriFaq = entriKB;
        faqGlobalEntries = daftarEntriFaq;
        perbaruiKontrolKategoriFaq(entriKB, responseJson.data.metadata || {});
        // Respect current active category filter!
        eksekusiFilterFaq();
        return;
      }
    }
    wadah.innerHTML = `
      <div class="knowledge-state">
        <strong>Knowledge Base belum tersedia</strong>
        <span>Data sedang diperbarui. Silakan coba kembali beberapa saat lagi.</span>
        <button type="button" class="btn btn-secondary" onclick="loadFaqData(true)">Coba lagi</button>
      </div>
    `;
  } catch (err) {
    wadah.innerHTML = `
      <div class="knowledge-state knowledge-error" role="alert">
        <strong>Knowledge Base tidak dapat dimuat</strong>
        <span>Periksa koneksi layanan, kemudian coba kembali.</span>
        <button type="button" class="btn btn-secondary" onclick="loadFaqData(true)">Coba lagi</button>
      </div>
    `;
  } finally {
    pemuatanFaqBerlangsung = false;
    wadah.removeAttribute('aria-busy');
  }
}
function loadFaqData(forceReload = false) { muatDataFaq(forceReload); }

function tampilkanEntriFaq(daftar) {
  const wadah = document.getElementById('faq-list');
  const elemenCounter = document.getElementById('faq-counter-badge');
  if (!wadah) return;

  if (elemenCounter) {
    const categoryTotal = metadataKnowledge?.total_categories || new Set(daftarEntriFaq.map(item => item.kategori || item.category || 'Umum')).size;
    const source = metadataKnowledge?.source || 'knowledge.json';
    const validity = metadataKnowledge?.valid === false ? 'perlu pemeriksaan' : 'struktur valid';
    elemenCounter.textContent = `Menampilkan ${daftar.length} dari ${daftarEntriFaq.length} artikel • ${categoryTotal} kategori • ${source} ${validity}`;
  }

  if (!Array.isArray(daftar) || daftar.length === 0) {
    wadah.innerHTML = `
      <div class="knowledge-state">
        <strong>Tidak ada artikel yang cocok</strong>
        <span>Coba kata kunci yang lebih umum atau pilih kategori lain.</span>
      </div>
    `;
    return;
  }

  // Kelompokkan artikel per Kategori secara terstruktur
  const kelompokPerKategori = {};
  daftar.forEach(item => {
    const kat = item.kategori || item.category || 'Umum';
    if (!kelompokPerKategori[kat]) {
      kelompokPerKategori[kat] = [];
    }
    kelompokPerKategori[kat].push(item);
  });

  const ikonMap = {
    'Alat Pelindung Diri (APD)': 'hardhat',
    'Pekerjaan di Ketinggian': 'activity',
    'Kelistrikan': 'bolt',
    'Alat Berat & Kendaraan': 'truck',
    'Bahan Kimia & B3': 'flask',
    'Tanggap Darurat': 'siren',
    'Lingkungan Kerja': 'leaf',
    'Pengawasan & Prosedur': 'clipboard',
    'Pengangkatan & Rigging': 'anchor',
    'Ruang Terbatas (Confined Space)': 'door',
    'Pekerjaan Panas (Hot Work)': 'flame',
    'Umum': 'shield'
  };

  let htmlSemua = '';
  let nomorGlobal = 1;

  const kelompokTerurut = Object.entries(kelompokPerKategori)
    .sort(([a], [b]) => a.localeCompare(b, 'id'));

  for (const [namaKategori, daftarArtikelMentah] of kelompokTerurut) {
    const daftarArtikel = [...daftarArtikelMentah]
      .sort((a, b) => String(a.id || '').localeCompare(String(b.id || ''), 'id'));
    const ikon = buatIkonAntarmuka(ikonMap[namaKategori] || 'shield');

    htmlSemua += `
      <section class="faq-category-group">
        <!-- Banner Header Kelompok Kategori -->
        <div class="faq-category-header">
          <div class="faq-category-title-group">
            <span class="faq-category-icon">${ikon}</span>
            <div>
              <h3>
                ${sanitasiHtml(namaKategori)}
              </h3>
              <span>
                Artikel lengkap dari knowledge.json
              </span>
            </div>
          </div>
          <span class="faq-category-count">
            ${daftarArtikel.length} artikel
          </span>
        </div>

        <div class="faq-category-articles">
    `;

    daftarArtikel.forEach(item => {
      const id = item.id || `HSSE-${nomorGlobal}`;
      const judul = item.judul || item.title || '-';
      const kategori = item.kategori || item.category || 'Umum';
      const tingkatRisiko = (item.tingkat_risiko || item.risk_level || 'sedang').toUpperCase();
      const penjelasanRisiko = item.penjelasan_risiko || item.risk_explanation || '-';
      const solusiMentah = String(item.solusi || item.solution || '-');
      const referensiMentah = Array.isArray(item.referensi) ? item.referensi : [];
      const referensi = referensiMentah
        .map(reference => ({
          judul: String(reference?.judul || '').trim(),
          url: sanitasiUrlReferensi(reference?.url)
        }))
        .filter(reference => reference.judul && reference.url);
      const kataKunciMentah = item.kata_kunci || item.keywords || [];
      const kataKunci = Array.isArray(kataKunciMentah) ? kataKunciMentah : String(kataKunciMentah).split(',');
      const tagMentah = item.tag || item.tags || [];
      const tag = Array.isArray(tagMentah) ? tagMentah : String(tagMentah).split(',');
      const labelPencarian = Array.from(new Set([...kataKunci, ...tag].map(k => String(k).trim()).filter(Boolean)));

      const isHigh = tingkatRisiko === 'TINGGI';
      const badgeClass = isHigh ? 'status-risk-high' : (tingkatRisiko === 'SEDANG' ? 'status-risk-medium' : 'status-risk-low');
      const langkahSolusi = solusiMentah.split('\n').map(s => s.trim()).filter(s => s);

      htmlSemua += `
        <article class="faq-item" data-knowledge-id="${sanitasiHtml(id)}">

          <div class="faq-item-meta">
            <div class="faq-item-identifiers">
              <span class="faq-item-category">
                ${sanitasiHtml(kategori)}
              </span>
              <span class="faq-item-id">ID ${sanitasiHtml(id)}</span>
            </div>
            <span class="res-status-badge ${badgeClass}">
              RISIKO ${sanitasiHtml(tingkatRisiko)}
            </span>
          </div>

          <h4 class="faq-item-title">
            ${nomorGlobal}. ${sanitasiHtml(judul)}
          </h4>

          ${penjelasanRisiko && penjelasanRisiko.trim() !== '-' ? `
            <div class="knowledge-detail-block risk-detail">
              <div class="knowledge-detail-heading">
                <div class="knowledge-detail-label">Analisis risiko K3</div>
                <span>Ringkasan dan poin penting untuk memudahkan pemahaman</span>
              </div>
              ${buatHtmlAnalisisRisikoKnowledge(penjelasanRisiko)}
            </div>
          ` : ''}

          ${langkahSolusi.length > 0 ? `
            <div class="knowledge-detail-block solution-detail">
              <div class="knowledge-detail-label">Prosedur solusi dan pengendalian</div>
              <div class="knowledge-solution-list">
                ${langkahSolusi.map(l => `
                  <div>
                    ${sanitasiHtml(l)}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${referensi.length > 0 ? `
            <div class="knowledge-detail-block reference-detail">
              <div class="knowledge-detail-label">Referensi resmi</div>
              <ol class="knowledge-reference-list">
                ${referensi.map(reference => `
                  <li>
                    <a href="${sanitasiHtml(reference.url)}" target="_blank" rel="noopener noreferrer">
                      ${sanitasiHtml(reference.judul)}
                    </a>
                  </li>
                `).join('')}
              </ol>
            </div>
          ` : ''}

          <div class="faq-item-footer">
            <div class="faq-keywords">
              ${labelPencarian.map(k => `
                <span>
                  #${sanitasiHtml(k)}
                </span>
              `).join('')}
            </div>

            <div class="faq-item-actions">
              <button class="btn btn-sm btn-secondary faq-consult-action" data-title="${sanitasiHtml(judul)}" data-category="${sanitasiHtml(kategori)}">
                ${buatIkonAntarmuka('bot')} Konsultasi AI
              </button>
              <button class="btn btn-sm btn-primary faq-report-action" data-title="${sanitasiHtml(judul)}" data-category="${sanitasiHtml(kategori)}">
                ${buatIkonAntarmuka('message')} Laporkan ke HSSE
              </button>
            </div>
          </div>

        </article>
      `;
      nomorGlobal++;
    });

    htmlSemua += `
        </div>
      </section>
    `;
  }

  wadah.innerHTML = htmlSemua;
  wadah.querySelectorAll('.faq-consult-action').forEach(tombol => {
    tombol.addEventListener('click', () => kirimPesanContoh(tombol.dataset.title, tombol.dataset.category));
  });
  wadah.querySelectorAll('.faq-report-action').forEach(tombol => {
    tombol.addEventListener('click', () => bukaLaporanDariKnowledgeBase(tombol.dataset.title, tombol.dataset.category));
  });
}

const PETA_PREFIX_ID_KATEGORI = {
  "alat pelindung diri (apd)": ["hsse-apd", "apd"],
  "pekerjaan di ketinggian": ["hsse-ketinggian", "ketinggian"],
  "kelistrikan": ["hsse-listrik", "listrik", "kelistrikan"],
  "alat berat & kendaraan": ["hsse-alatberat", "alatberat", "alat berat"],
  "bahan kimia & b3": ["hsse-kimia", "kimia", "b3"],
  "ruang terbatas (confined space)": ["hsse-confined", "confined"],
  "pekerjaan panas (hot work)": ["hsse-hotwork", "hotwork", "panas"],
  "pengangkatan & rigging": ["hsse-lifting", "lifting", "rigging"],
  "tanggap darurat": ["hsse-darurat", "darurat"],
  "lingkungan kerja": ["hsse-lingkungan", "lingkungan"],
  "pengawasan & prosedur": ["hsse-pengawasan", "pengawasan", "prosedur"],
  "penggunaan tangga": ["hsse-tangga", "tangga"],
  "ergonomi": ["hsse-ergonomi", "ergonomi"],
  "pelatihan & kompetensi": ["hsse-pelatihan", "pelatihan"],
  "komunikasi & pelaporan": ["hsse-komunikasi", "komunikasi"],
  "investigasi & insiden": ["hsse-insiden", "insiden"],
  "manajemen risiko": ["hsse-risiko", "risiko"],
  "audit & sistem manajemen k3": ["hsse-audit", "audit"],
  "budaya keselamatan": ["hsse-budaya", "budaya"],
  "koordinasi & simops": ["hsse-koordinasi", "koordinasi", "simops"],
  "perilaku & disiplin kerja": ["hsse-perilaku", "perilaku"],
  "higienitas & konsumsi": ["hsse-makanan", "makanan", "higienitas"],
  "kondisi khusus": ["hsse-khusus", "khusus"],
  "peralatan kerja": ["hsse-alat", "peralatan"],
  "standar & regulasi": ["hsse-standar", "standar", "regulasi"],
  "kelelahan & jam kerja": ["hsse-kelelahan", "kelelahan"],
  "umum": ["hsse-umum", "umum"]
};

function apakahCocokKategoriItem(item, targetKategori) {
  if (!targetKategori || targetKategori === 'Semua') return true;

  const targetNorm = targetKategori.toLowerCase().trim();
  const catNorm = (item.kategori || item.category || '').toLowerCase().trim();
  const idNorm = (item.id || '').toLowerCase().trim();

  // 1. Direct string match on Category Name
  if (catNorm === targetNorm || catNorm.includes(targetNorm) || targetNorm.includes(catNorm)) {
    return true;
  }

  // 2. ID Prefix and Keyword Dictionary Match
  for (const [katNama, listPrefix] of Object.entries(PETA_PREFIX_ID_KATEGORI)) {
    if (targetNorm.includes(katNama) || katNama.includes(targetNorm)) {
      if (listPrefix.some(pfx => idNorm.includes(pfx) || catNorm.includes(pfx))) {
        return true;
      }
    }
  }

  // 3. Fallback ID match
  return idNorm.includes(targetNorm);
}

const filterFaqTertunda = tundaEksekusi(() => {
  eksekusiFilterFaq();
}, 250);

function debouncedFilterFaq() { filterFaqTertunda(); }

function sanitasiHtml(teks) {
  if (!teks) return '';
  return String(teks)
    .replace(/[\u{1F000}-\u{1FAFF}\u2300-\u27FF\u20E3\uFE0F\u200D]/gu, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function sanitasiUrlReferensi(nilai) {
  try {
    const url = new URL(String(nilai || '').trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch (_) {
    return '';
  }
}
function formatReferensiHtml(teks) {
  const nilai = String(teks || '').trim();
  const hasil = nilai.match(/https:\/\/[^\s]+$/i);
  if (!hasil) return sanitasiHtml(nilai);
  const url = sanitasiUrlReferensi(hasil[0]);
  if (!url) return sanitasiHtml(nilai);
  const label = nilai.slice(0, hasil.index).trim();
  return `${sanitasiHtml(label)} <a href="${sanitasiHtml(url)}" target="_blank" rel="noopener noreferrer">Buka sumber resmi</a>`;
}
function escapeHtml(text) { return sanitasiHtml(text); }
