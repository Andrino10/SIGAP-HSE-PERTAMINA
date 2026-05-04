/**
 * ═══════════════════════════════════════════════════
 *  SIGAP AI — app.js
 *  Sistem Intelijen Garda Ancaman Pekerjaan
 *
 *  Tanggung jawab file ini:
 *  ✅ Interaksi UI (input, loading, animasi, render)
 *  ✅ Dummy data untuk demo / presentasi
 *  ✅ Fungsi analyzeReport() siap dihubungkan ke
 *     Python backend via fetch('/api/analyze')
 *
 *  CARA HUBUNGKAN KE BACKEND PYTHON:
 *  → Uncomment blok "OPTION A — Backend"
 *  → Comment blok  "OPTION B — Demo Mode"
 *  → Pastikan Python Flask berjalan di port yang sesuai
 * ═══════════════════════════════════════════════════
 */

'use strict';

// ═══════════════════════════════════════════════════
//  DUMMY DATA — Untuk demo presentasi (tanpa backend)
// ═══════════════════════════════════════════════════

const SAMPLE_REPORT =
  'Pekerja melakukan pengelasan di ketinggian 12 meter tanpa menggunakan harness dan helm pengaman. ' +
  'Lantai scaffolding dalam kondisi licin akibat tumpahan oli. ' +
  'Tidak tersedia APAR di sekitar lokasi kerja. ' +
  'Beberapa kabel listrik tampak tidak berselubung di dekat area kerja. ' +
  'Pengawas lapangan tidak berada di lokasi saat aktivitas berlangsung.';

const DUMMY_RESULTS = {
  tinggi: {
    level: 'TINGGI',
    caption: 'Risiko sangat tinggi — tindakan segera diperlukan',
    score: 90,
    findings: [
      'Pekerja tidak menggunakan helm dan harness saat bekerja di ketinggian',
      'Lantai scaffolding licin — risiko terpeleset dan jatuh dari ketinggian',
      'Tidak tersedia APAR di area kerja panas (hot work)',
      'Kabel listrik tidak berselubung di dekat area pengelasan',
      'Absennya pengawas lapangan saat aktivitas berisiko tinggi berlangsung',
    ],
    cause:
      'Terdapat pelanggaran serius terhadap regulasi K3 yang berlaku. ' +
      'Kombinasi antara pekerjaan di ketinggian tanpa APD, permukaan licin, ' +
      'dan absennya pengawas merupakan pola risiko yang sering menjadi penyebab ' +
      'kecelakaan fatal di industri konstruksi dan manufaktur. ' +
      'Faktor utama: ketidakpatuhan prosedur, kurangnya pengawasan, dan kondisi lingkungan yang tidak terkontrol.',
    recommendations: [
      'Hentikan seluruh aktivitas kerja sampai kondisi aman dipenuhi',
      'Wajibkan pemakaian full-body harness, helm, dan APD lengkap untuk semua pekerja di ketinggian >1.8m',
      'Bersihkan tumpahan oli dan pasang material anti-slip di lantai scaffolding',
      'Sediakan minimal 2 unit APAR tipe CO2 dan terbitkan Hot Work Permit sebelum pengelasan',
      'Ganti atau lindungi kabel listrik terbuka sebelum aktivitas dilanjutkan',
      'Tunjuk pengawas K3 bersertifikat untuk mendampingi pekerjaan berisiko tinggi',
    ],
    references: [
      {
        text: 'Permenaker No.9/2016: Pekerjaan pada ketinggian wajib menggunakan full-body harness dan safety lanyard.',
        source: 'Permenaker No. 9 Tahun 2016',
      },
      {
        text: 'Permenaker No.4/1980: Setiap tempat kerja wajib dilengkapi Alat Pemadam Api Ringan (APAR).',
        source: 'Permenaker No. 4 Tahun 1980',
      },
      {
        text: 'SNI ISO 45001:2018: Identifikasi bahaya dan penilaian risiko wajib dilakukan secara sistematis.',
        source: 'SNI ISO 45001:2018',
      },
    ],
  },
  sedang: {
    level: 'SEDANG',
    caption: 'Risiko moderat — pengendalian segera dibutuhkan',
    score: 58,
    findings: [
      'Kondisi lantai area kerja licin atau basah',
      'Tidak ada tanda peringatan atau barrier di area berbahaya',
      'Ventilasi area kerja kurang memadai',
    ],
    cause:
      'Kondisi lingkungan kerja yang tidak optimal meningkatkan probabilitas kecelakaan. ' +
      'Permukaan licin merupakan penyebab utama insiden terpeleset yang dapat menyebabkan ' +
      'cedera serius. Absennya rambu peringatan memperparah kondisi ini.',
    recommendations: [
      'Pasang tanda peringatan "Lantai Licin" segera di seluruh area terdampak',
      'Gunakan alas karet anti-slip atau material pengikat di area kerja',
      'Pastikan semua pekerja menggunakan safety shoes berstandar anti-slip',
      'Perbaiki sistem drainase dan bersihkan tumpahan secara berkala',
      'Lakukan inspeksi kondisi lantai setiap awal dan akhir shift',
    ],
    references: [
      {
        text: 'OSHA 1926.502: Permukaan kerja licin wajib diberi tanda peringatan dan ditangani segera.',
        source: 'OSHA Standard 1926.502',
      },
      {
        text: 'Permenaker No.5/1996: Setiap pekerja wajib menggunakan Alat Pelindung Diri yang sesuai.',
        source: 'Permenaker No. 5 Tahun 1996',
      },
    ],
  },
  rendah: {
    level: 'RENDAH',
    caption: 'Risiko rendah — pertahankan kondisi dan monitoring rutin',
    score: 18,
    findings: [
      'Tidak ditemukan indikator bahaya signifikan dalam laporan',
      'Kondisi kerja dalam batas normal dan terkontrol',
      'APD dan prosedur K3 tampak dipatuhi',
    ],
    cause:
      'Berdasarkan analisis teks laporan, tidak teridentifikasi faktor risiko tinggi yang ' +
      'memerlukan tindakan segera. Aktivitas berjalan sesuai prosedur standar K3 yang berlaku.',
    recommendations: [
      'Pertahankan dan tingkatkan budaya keselamatan yang sudah berjalan baik',
      'Lakukan toolbox meeting K3 harian sebelum memulai aktivitas kerja',
      'Dokumentasikan setiap near-miss sebagai bahan pembelajaran dan perbaikan',
      'Jadwalkan pelatihan penyegaran K3 secara berkala untuk semua pekerja',
      'Pastikan sertifikasi K3 semua pekerja masih berlaku dan diperbarui tepat waktu',
    ],
    references: [
      {
        text: 'SNI ISO 45001:2018: Sistem Manajemen K3 yang baik mencakup pemantauan dan tinjauan berkala.',
        source: 'SNI ISO 45001:2018',
      },
      {
        text: 'UU No.1 Tahun 1970: Pengusaha wajib memelihara kondisi lingkungan kerja yang aman dan sehat.',
        source: 'UU No. 1 Tahun 1970',
      },
    ],
  },
};

// ═══════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════

function getTimestamp() {
  return new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════
//  UI EVENT HANDLERS
// ═══════════════════════════════════════════════════

function onInputChange() {
  const val = document.getElementById('report-input').value;
  const badge = document.getElementById('char-badge');
  badge.textContent = val.length + ' karakter';
  badge.classList.toggle('active', val.length >= 20);
}

function clearInput() {
  document.getElementById('report-input').value = '';
  onInputChange();
  document.getElementById('report-input').focus();
}

function loadSample() {
  const ta = document.getElementById('report-input');
  ta.value = '';
  let i = 0;
  const interval = setInterval(() => {
    ta.value += SAMPLE_REPORT[i];
    onInputChange();
    i++;
    if (i >= SAMPLE_REPORT.length) clearInterval(interval);
  }, 14);
}

// Ctrl+Enter shortcut
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyzeReport();
});

// ═══════════════════════════════════════════════════
//  LOADING ANIMATION
// ═══════════════════════════════════════════════════

const STEP_LABELS = [
  'Parsing teks laporan kerja...',
  'Mencari referensi K3 via RAG...',
  'Mendeteksi pola risiko...',
  'Menyusun rekomendasi tindakan...',
];

async function runLoadingSteps() {
  const stepIds = ['step-1', 'step-2', 'step-3', 'step-4'];
  const loaderText = document.getElementById('loader-text');

  for (let i = 0; i < stepIds.length; i++) {
    await delay(420 + i * 480);
    if (i > 0) document.getElementById(stepIds[i - 1]).className = 'pipeline-step done';
    document.getElementById(stepIds[i]).className = 'pipeline-step active';
    loaderText.textContent = STEP_LABELS[i];
  }
  await delay(380);
  document.getElementById(stepIds[stepIds.length - 1]).className = 'pipeline-step done';
}

function resetSteps() {
  ['step-1', 'step-2', 'step-3', 'step-4'].forEach(id => {
    document.getElementById(id).className = 'pipeline-step';
  });
}

// ═══════════════════════════════════════════════════
//  MAIN: analyzeReport()
//  Fungsi utama — dieksekusi saat tombol diklik
// ═══════════════════════════════════════════════════

async function analyzeReport() {
  const input = document.getElementById('report-input').value.trim();

  // Validasi minimal karakter
  if (input.length < 20) {
    shakeInputCard();
    return;
  }

  // ── Set state: loading ──
  setUIState('loading');
  resetSteps();
  runLoadingSteps();

  // ─────────────────────────────────────────────────
  //  OPTION A — Hubungkan ke Python Backend
  //  Uncomment blok ini saat backend siap
  //  Expected response:
  //  { level, penyebab, rekomendasi, referensi, temuan }
  // ─────────────────────────────────────────────────
  
  try {
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ laporan: input }),
    });

    if (!response.ok) throw new Error('Server error: ' + response.status);

    const data = await response.json();
    await delay(500); // beri waktu animasi step selesai

    const mappedData = mapBackendResponse(data);
    renderResult(mappedData, input);
    return;

  } catch (err) {
    console.warn('[SIGAP AI] Backend tidak tersedia, fallback ke demo mode:', err.message);
    // Fallback ke demo mode jika backend tidak tersedia
  }
  

  // ─────────────────────────────────────────────────
  //  OPTION B — Demo Mode (aktif secara default)
  //  Menentukan dummy result berdasarkan konten input
  // ─────────────────────────────────────────────────
  //await delay(2400); // simulasi waktu proses

  // const demoResult = determineDemoResult(input);
  // renderResult(demoResult, input);
}

// ═══════════════════════════════════════════════════
//  DEMO RESULT SELECTOR
//  Pilih dummy data berdasarkan keyword sederhana
// ═══════════════════════════════════════════════════

function determineDemoResult(text) {
  const t = text.toLowerCase();

  const highKeywords = [
    'tidak menggunakan helm', 'tanpa helm', 'tanpa harness', 'tanpa apd',
    'ketinggian', 'bahan kimia', 'listrik', 'kabel', 'tidak ada pengawas',
    'pengelasan', 'las', 'api', 'kebakaran',
  ];

  const medKeywords = [
    'licin', 'becek', 'tumpahan', 'basah', 'kurang ventilasi',
    'tidak ada rambu', 'tanpa tanda peringatan',
  ];

  const highMatch = highKeywords.filter(k => t.includes(k)).length;
  const medMatch  = medKeywords.filter(k => t.includes(k)).length;

  if (highMatch >= 1)       return DUMMY_RESULTS.tinggi;
  if (medMatch  >= 1)       return DUMMY_RESULTS.sedang;
  return DUMMY_RESULTS.rendah;
}

// ═══════════════════════════════════════════════════
//  BACKEND RESPONSE MAPPER
//  Konversi format response Python → format UI
// ═══════════════════════════════════════════════════

function mapBackendResponse(data) {
  return {
    level:           data.level,
    caption:         getCaptionForLevel(data.level),
    score:           getScoreForLevel(data.level),
    findings:        Array.isArray(data.temuan) ? data.temuan : ['Lihat analisis penyebab'],
    cause:           data.penyebab || '—',
    recommendations: Array.isArray(data.rekomendasi) ? data.rekomendasi : [data.rekomendasi],
    references:      data.referensi
      ? [{ text: data.referensi, source: 'Knowledge Base RAG' }]
      : [],
  };
}

function getCaptionForLevel(level) {
  const map = {
    TINGGI: 'Risiko sangat tinggi — tindakan segera diperlukan',
    SEDANG: 'Risiko moderat — pengendalian segera dibutuhkan',
    RENDAH: 'Risiko rendah — pertahankan kondisi dan monitoring rutin',
  };
  return map[level] || '—';
}

function getScoreForLevel(level) {
  return { TINGGI: 90, SEDANG: 58, RENDAH: 18 }[level] || 18;
}

// ═══════════════════════════════════════════════════
//  RENDER RESULT
//  Mengisi semua card dengan data hasil analisis
// ═══════════════════════════════════════════════════

function renderResult(data, inputText) {
  const levelLower = data.level.toLowerCase();
  const colorMap   = { rendah: '#22C55E', sedang: '#F59E0B', tinggi: '#EF4444' };
  const dotClass   = { rendah: 'finding-dot--green', sedang: 'finding-dot--amber', tinggi: 'finding-dot--red' };

  // ── Risk Banner ──
  const badge = document.getElementById('risk-badge-large');
  badge.textContent  = data.level;
  badge.className    = 'risk-badge-large ' + levelLower;

  document.getElementById('risk-caption').textContent = data.caption;

  // Activate correct indicator
  document.querySelectorAll('.risk-indicator').forEach(el => {
    el.classList.toggle('active', el.dataset.level === levelLower);
  });

  // ── Gauge ──
  const track     = document.getElementById('gauge-track');
  const total     = 251; // full arc circumference
  const offset    = total - (data.score / 100) * total;
  track.style.stroke          = colorMap[levelLower];
  track.style.strokeDashoffset = total; // start from 0
  setTimeout(() => { track.style.strokeDashoffset = offset; }, 80);
  document.getElementById('gauge-score').textContent = data.score + '%';

  // ── Findings ──
  document.getElementById('finding-list').innerHTML = data.findings
    .map(f => `
      <li class="finding-item">
        <div class="finding-dot ${dotClass[levelLower]}"></div>
        <span>${f}</span>
      </li>`)
    .join('');

  // ── Cause ──
  document.getElementById('cause-text').textContent = data.cause;

  // ── Recommendations ──
  document.getElementById('reco-list').innerHTML = data.recommendations
    .map((r, i) => `
      <li class="reco-item">
        <div class="reco-num">${i + 1}</div>
        <span>${r}</span>
      </li>`)
    .join('');

  // ── References ──
  document.getElementById('ref-list').innerHTML = data.references
    .map(r => `
      <div class="ref-item">
        <span class="ref-item__icon">📄</span>
        <div>
          ${r.text}
          <span class="ref-item__source">${r.source}</span>
        </div>
      </div>`)
    .join('');

  // ── Meta bar ──
  document.getElementById('meta-time').textContent  = getTimestamp();
  document.getElementById('meta-words').textContent = wordCount(inputText) + ' kata';

  // ── Show result section ──
  setUIState('result');

  setTimeout(() => {
    document.getElementById('result-section').scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 200);
}

// ═══════════════════════════════════════════════════
//  UI STATE MANAGER
// ═══════════════════════════════════════════════════

function setUIState(state) {
  const btnAnalyze     = document.getElementById('analyze-btn');
  const loadingSection = document.getElementById('loading-section');
  const resultSection  = document.getElementById('result-section');
  const statusBadge    = document.querySelector('.status-badge');
  const statusText     = document.querySelector('.status-text');

  switch (state) {
    case 'loading':
      btnAnalyze.disabled = true;
      loadingSection.classList.add('active');
      loadingSection.setAttribute('aria-hidden', 'false');
      resultSection.classList.remove('active');
      resultSection.setAttribute('aria-hidden', 'true');
      statusBadge.classList.add('analyzing');
      statusText.textContent = 'ANALYZING...';
      break;

    case 'result':
      btnAnalyze.disabled = false;
      loadingSection.classList.remove('active');
      loadingSection.setAttribute('aria-hidden', 'true');
      resultSection.classList.add('active');
      resultSection.setAttribute('aria-hidden', 'false');
      statusBadge.classList.remove('analyzing');
      statusText.textContent = 'ANALYSIS COMPLETE';
      break;

    case 'idle':
    default:
      btnAnalyze.disabled = false;
      loadingSection.classList.remove('active');
      resultSection.classList.remove('active');
      statusBadge.classList.remove('analyzing');
      statusText.textContent = 'SYSTEM READY';
      break;
  }
}

function resetToInput() {
  setUIState('idle');
  document.getElementById('input-section').scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

// ═══════════════════════════════════════════════════
//  UX: Shake animation saat validasi gagal
// ═══════════════════════════════════════════════════

function shakeInputCard() {
  const card = document.getElementById('input-card');
  card.style.borderColor = 'var(--red-border)';
  card.style.boxShadow   = '0 0 0 1px rgba(239,68,68,0.15)';

  card.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-7px)' },
    { transform: 'translateX(7px)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(0)' },
  ], { duration: 380, easing: 'ease-in-out' });

  setTimeout(() => {
    card.style.borderColor = '';
    card.style.boxShadow   = '';
  }, 2200);
}