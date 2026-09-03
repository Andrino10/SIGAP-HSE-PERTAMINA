<template>
  <main class="view-panel active" id="view-home">
    <!-- 1. HERO SECTION -->
    <section class="hero-card" aria-labelledby="hero-title">
      <div class="hero-content">
        <div class="hero-badge"><span class="hero-badge-dot"></span> SISTEM HSSE DIGITAL · LIRIK FIELD</div>
        <h1 class="hero-title" id="hero-title">Keselamatan kerja, ditangani lebih cepat dan tepat.</h1>
        <p class="hero-desc">
          Laporkan kondisi bahaya, dapatkan analisis berbasis Knowledge Base K3 internal, dan eskalasikan langsung ke Tim HSSE. Tersedia tanpa login untuk seluruh pekerja.
        </p>
        <div class="hero-btn-group">
          <button class="btn btn-primary" @click="openConsultationModal">
            Laporkan kondisi bahaya
          </button>
          <router-link to="/chatbot" class="btn btn-secondary">
            Konsultasi dengan Asisten HSSE
          </router-link>
        </div>
        <div class="hero-quick-links" aria-label="Akses cepat">
          <router-link to="/ticket" style="color: #0284c7; font-weight: 600; text-decoration: none;">
            🔍 Cek Status Tiket
          </router-link>
          <span aria-hidden="true"></span>
          <button type="button" @click="openWhatsAppModal()">Hubungi Tim HSSE</button>
          <span aria-hidden="true"></span>
          <router-link
            to="/admin/login"
            style="color: var(--text-muted, #94a3b8); text-decoration: none; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"
            title="Buka Portal Pengelolaan Admin"
          >
            🔒 Portal Admin HSSE
          </router-link>
        </div>
        <div class="hero-safety-note">
          <strong>Kondisi darurat:</strong> hentikan pekerjaan, amankan area, lalu hubungi Tim HSSE.
        </div>
      </div>

      <!-- Hero Graphic Illustration -->
      <div class="hero-graphic" aria-hidden="true">
        <div class="hero-graphic-label">HSSE OPERATIONS</div>
        <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L3 7v6c0 5 4 9.5 9 10.5 5-1 9-5.5 9-10.5V7l-9-5z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <div class="hero-graphic-status"><span></span> Knowledge Base terhubung</div>
      </div>
    </section>

    <!-- HERO STATS COUNTER BAR -->
    <section class="hero-stats" aria-label="Ringkasan sistem">
      <div class="stat-box">
        <span class="stat-icon" aria-hidden="true"></span>
        <span class="stat-copy">
          <strong class="stat-value">540+</strong>
          <span class="stat-label">Artikel HSSE terstruktur</span>
        </span>
      </div>
      <div class="stat-box">
        <span class="stat-icon" aria-hidden="true"></span>
        <span class="stat-copy">
          <strong class="stat-value">27</strong>
          <span class="stat-label">Kategori bahaya K3</span>
        </span>
      </div>
      <div class="stat-box">
        <span class="stat-icon" aria-hidden="true"></span>
        <span class="stat-copy">
          <strong class="stat-value">6 Officer</strong>
          <span class="stat-label">Tim HSSE terdedikasi</span>
        </span>
      </div>
      <div class="stat-box">
        <span class="stat-icon" aria-hidden="true"></span>
        <span class="stat-copy">
          <strong class="stat-value">Tanpa login</strong>
          <span class="stat-label">Akses langsung bagi pekerja</span>
        </span>
      </div>
    </section>

    <!-- 2. PANDUAN 4 LANGKAH PELAPORAN & KONSULTASI K3 -->
    <section class="home-section">
      <div class="section-header">
        <span class="section-kicker">ALUR PENANGANAN</span>
        <h2>Dari temuan lapangan ke tindakan yang terarah</h2>
        <p>Empat langkah ringkas untuk mengidentifikasi bahaya dan mendapatkan dukungan K3 dengan cepat.</p>
      </div>
      <div class="home-guide-grid">
        <div class="guide-step-card">
          <div class="guide-step-num">1</div>
          <div class="guide-step-icon" aria-hidden="true">✍️</div>
          <h4>Tulis temuan atau pilih kategori</h4>
          <p>Tuliskan kondisi yang Anda temukan. Jika perlu, pilih satu kategori utama yang paling mendekati.</p>
        </div>
        <div class="guide-step-card">
          <div class="guide-step-num">2</div>
          <div class="guide-step-icon" aria-hidden="true">🔍</div>
          <h4>Dapatkan analisis berbasis referensi</h4>
          <p>Sistem mencocokkan 540 artikel dari knowledge base dan menampilkan referensi relevan pada setiap analisis.</p>
        </div>
        <div class="guide-step-card">
          <div class="guide-step-num">3</div>
          <div class="guide-step-icon" aria-hidden="true">🛡️</div>
          <h4>Terapkan pengendalian K3</h4>
          <p>Ikuti tindakan segera, pengendalian spesifik, serta verifikasi Supervisor atau Tim HSSE yang tercantum.</p>
        </div>
        <div class="guide-step-card">
          <div class="guide-step-num">4</div>
          <div class="guide-step-icon" aria-hidden="true">📲</div>
          <h4>Eskalasi kepada Tim HSSE</h4>
          <p>Jika kondisi berisiko tinggi, sistem otomatis menerbitkan tiket resmi dan menyusun draf laporan WhatsApp.</p>
        </div>
      </div>
    </section>

    <!-- 3. KATEGORI BAHAYA -->
    <section class="home-section" id="section-services">
      <div class="section-header">
        <span class="section-kicker">CAKUPAN KESELAMATAN</span>
        <h2>Pilih kategori utama</h2>
        <p>Pilih yang paling sesuai dengan kondisi di lapangan. Jika ragu, langsung tulis laporan dan sistem akan membantu.</p>
      </div>

      <div class="category-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div
          v-for="group in categoryGroups"
          :key="group.id"
          class="category-card"
          @click="selectCategoryGroup(group)"
          style="cursor: pointer;"
        >
          <div class="category-card-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 24px;">{{ getCategoryIcon(group.id) }}</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700;">{{ group.nama }}</h3>
              <small style="color: var(--text-muted, #94a3b8);">{{ group.kategori.length }} sub-kategori</small>
            </div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary, #cbd5e1); line-height: 1.5; margin: 0;">{{ group.deskripsi }}</p>
        </div>
      </div>

      <div class="category-toolbar">
        <span>Pilih kategori yang paling sesuai, atau langsung tulis laporan jika belum yakin.</span>
        <router-link to="/knowledge" class="btn btn-secondary" style="text-decoration: none;">
          📖 Buka Knowledge Base
        </router-link>
      </div>
    </section>

    <!-- 4. PERTAMINA CORPORATE GOLDEN RULES -->
    <section class="home-section">
      <div class="section-header">
        <span class="section-kicker">BUDAYA KESELAMATAN</span>
        <h2>Golden Rules: patuhi, peduli, dan berani mengintervensi</h2>
        <p>Prinsip budaya keselamatan kerja utama yang wajib diterapkan oleh seluruh pekerja dan kontraktor</p>
      </div>
      <div class="golden-rules-grid">
        <div class="golden-rule-card">
          <div class="rule-badge-header rule-comply">COMPLY (PATUHI)</div>
          <h4>Kepatuhan Prosedur K3</h4>
          <p>Patuhi seluruh regulasi K3, Standar Operasional Prosedur (SOP), Sistem Izin Kerja (PTW), dan instruksi keselamatan di seluruh area kerja tanpa kompromi.</p>
        </div>
        <div class="golden-rule-card">
          <div class="rule-badge-header rule-listen">LISTEN (PEDULI)</div>
          <h4>Kepedulian Lingkungan Kerja</h4>
          <p>Peduli terhadap kondisi lingkungan sekitar, dengarkan pengarahan Safety Briefing / Toolbox Meeting (TBM), dan aktif melaporkan temuan bahaya/near miss.</p>
        </div>
        <div class="golden-rule-card">
          <div class="rule-badge-header rule-intervene">INTERVENE (TEGUR)</div>
          <h4>Wewenang Hentikan Pekerjaan</h4>
          <p>Berani menegur dan menghentikan pekerjaan secara langsung (Stop Work Authority) apabila menemukan tindakan atau kondisi tidak aman di lapangan.</p>
        </div>
      </div>
    </section>

    <!-- 5. MATRIKS RISIKO K3 -->
    <section class="home-section">
      <div class="section-header">
        <span class="section-kicker">PRIORITAS TINDAKAN</span>
        <h2>Kenali tingkat risiko sebelum menentukan tindakan</h2>
        <p>Klasifikasi tingkat risiko kondisi bahaya beserta prosedur pengendalian K3 yang dipersyaratkan</p>
      </div>
      <div class="risk-matrix-grid">
        <div class="risk-card-info high">
          <div class="risk-card-header">
            <span class="risk-badge-label high">RISIKO TINGGI (HIGH RISK)</span>
          </div>
          <h4>Potensi Cedera Fatal / Kerusakan Berat</h4>
          <p>Kondisi yang berpotensi memicu cedera serius, cacat permanen, fatality, ledakan, atau pencemaran lingkungan berat.</p>
          <div class="risk-actions-list">
            <strong>Prosedur Kendali K3:</strong>
            <ul>
              <li>Hentikan Pekerjaan Seketika (Stop Work)</li>
              <li>Wajibkan Izin Kerja Khusus &amp; Pendampingan HSSE</li>
              <li>Eskalasi Langsung ke Tim HSSE Officer via WA</li>
            </ul>
          </div>
        </div>

        <div class="risk-card-info medium">
          <div class="risk-card-header">
            <span class="risk-badge-label medium">RISIKO SEDANG (MEDIUM RISK)</span>
          </div>
          <h4>Potensi Cedera Ringan / Gangguan Alat</h4>
          <p>Kondisi bahaya yang dapat memicu luka fisik ringan, pusing, iritasi, atau kecelakaan kerja yang memerlukan P3K.</p>
          <div class="risk-actions-list">
            <strong>Prosedur Kendali K3:</strong>
            <ul>
              <li>Lakukan Pengendalian Teknis &amp; Kelengkapan APD</li>
              <li>Lakukan Pengecekan oleh Supervisor K3</li>
              <li>Terapkan Prosedur Kerja Aman Sesuai SOP</li>
            </ul>
          </div>
        </div>

        <div class="risk-card-info low">
          <div class="risk-card-header">
            <span class="risk-badge-label low">RISIKO RENDAH (LOW RISK)</span>
          </div>
          <h4>Potensi Bahaya Ringan / Kerapian Area</h4>
          <p>Kondisi bahaya yang memiliki dampak minimal terhadap keselamatan dan dapat diatasi dengan tindakan mandiri.</p>
          <div class="risk-actions-list">
            <strong>Prosedur Kendali K3:</strong>
            <ul>
              <li>Perbaiki Langsung &amp; Rapikan Tempat Kerja</li>
              <li>Pertahankan Budaya Kebersihan (Housekeeping)</li>
              <li>Lakukan Pemantauan Rutin Setiap Shift</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. OFFICIAL ROSTER TIM HSSE -->
    <section class="home-section">
      <div class="section-header">
        <span class="section-kicker">TIM PENDAMPING</span>
        <h2>Tim HSSE Pertamina EP Lirik Field</h2>
        <p>Personel &amp; Divisi Keselamatan Kerja resmi yang siap mendampingi, mengawasi, dan menerima eskalasi WhatsApp</p>
      </div>
      <div class="roster-grid">
        <div v-for="officer in rosterList" :key="officer.nama" class="roster-card">
          <div class="roster-avatar">👷</div>
          <h4>{{ officer.nama }}</h4>
          <div class="roster-role">{{ officer.jabatan }}</div>
          <div class="roster-spec">{{ officer.spec }}</div>
          <button class="btn btn-sm btn-primary roster-contact-btn" @click="openWhatsAppModal({ officer: officer.nama })">
            Hubungi via WhatsApp
          </button>
        </div>
      </div>
    </section>

    <!-- 7. DEDICATED LAYANAN WHATSAPP -->
    <section class="home-section">
      <div class="wa-showcase-card">
        <div class="wa-showcase-header">
          <div class="wa-badge">INTEGRASI WHATSAPP REAL-TIME — 24/7</div>
          <h2>Layanan Pengaduan &amp; Eskalasi WhatsApp Tim HSSE</h2>
          <p>
            Setiap laporan kondisi bahaya, temuan tidak aman, atau konsultasi K3 dapat langsung dieskalasikan secara otomatis ke ponsel Tim HSSE Officer melalui WhatsApp resmi PT Pertamina EP Lirik Field.
          </p>
        </div>
        <div class="wa-features-grid">
          <div class="wa-feat-item">
            <div class="wa-feat-icon">🎯</div>
            <h4>Kontak Sesuai Penanggung Jawab</h4>
            <p>Terhubung ke HSSE Officer atau Supervisor yang relevan dengan kategori temuan lapangan.</p>
          </div>
          <div class="wa-feat-item">
            <div class="wa-feat-icon">📝</div>
            <h4>Draf Laporan Terisi Otomatis</h4>
            <p>Formulir sistem menyusun draf pesan rapi berisi Nama, Divisi, Lokasi, Kategori, &amp; Urgensi tanpa ketik ulang.</p>
          </div>
          <div class="wa-feat-item">
            <div class="wa-feat-icon">⚡</div>
            <h4>Tindakan Lapangan Seketika</h4>
            <p>Pesan langsung dibaca petugas di ponsel mereka untuk verifikasi Stop Work Authority atau inspeksi K3.</p>
          </div>
          <div class="wa-feat-item">
            <div class="wa-feat-icon">🛡️</div>
            <h4>Identitas Pelapor Jelas</h4>
            <p>Nama pelapor dicantumkan agar Tim HSSE dapat melakukan verifikasi dan tindak lanjut laporan secara tepat.</p>
          </div>
        </div>
        <div class="wa-showcase-actions">
          <button class="btn btn-whatsapp wa-showcase-primary" @click="openWhatsAppModal()">
            Hubungi WhatsApp Tim HSSE Sekarang
          </button>
          <button class="btn btn-secondary wa-showcase-secondary" @click="openConsultationModal">
            Susun Draf Laporan WhatsApp
          </button>
        </div>
      </div>
    </section>

    <!-- 8. FAQ PELAPORAN KESELAMATAN -->
    <section class="home-section">
      <div class="section-header">
        <span class="section-kicker">INFORMASI PENTING</span>
        <h2>Pertanyaan umum seputar pelaporan keselamatan</h2>
        <p>Jawaban cepat atas pertanyaan umum mengenai penggunaan sistem SIGAP-AI HSSE Companion</p>
      </div>
      <div class="home-faq-grid">
        <details class="faq-disclosure" open>
          <summary>Apakah saya perlu mendaftar akun untuk melaporkan bahaya?</summary>
          <p><strong>Tidak perlu.</strong> SIGAP-AI dapat langsung digunakan tanpa login agar pekerja bisa melaporkan kondisi bahaya saat itu juga.</p>
        </details>
        <details class="faq-disclosure">
          <summary>Apa yang harus dilakukan untuk kondisi berisiko tinggi?</summary>
          <p>Hentikan pekerjaan bila diperlukan, amankan area, lalu gunakan eskalasi WhatsApp untuk menghubungi HSSE Officer beserta draf laporan otomatis.</p>
        </details>
        <details class="faq-disclosure">
          <summary>Dari mana rekomendasi Asisten HSSE dihasilkan?</summary>
          <p>Rekomendasi dicocokkan dengan 540 artikel dari knowledge base. Kode artikel dan nilai kecocokannya ditampilkan secara transparan; verifikasi lapangan tetap wajib dilakukan.</p>
        </details>
        <details class="faq-disclosure">
          <summary>Apakah laporan WhatsApp dapat disesuaikan?</summary>
          <p>Ya. Nama pelapor, divisi, lokasi, tanggal kejadian, kategori, urgensi, dan deskripsi kondisi bahaya wajib dilengkapi sebelum pesan dapat dikirim.</p>
        </details>
      </div>
    </section>

    <!-- 9. CTA BANNER -->
    <section class="cta-banner-card">
      <div class="cta-banner-content">
        <h2>Temukan bahaya? Ambil tindakan sekarang.</h2>
        <p>Menemukan kondisi atau potensi bahaya di lokasi operasional Anda? Konsultasikan atau laporkan seketika kepada Tim HSSE.</p>
        <div class="cta-btn-group">
          <button class="btn btn-primary cta-primary" @click="openConsultationModal">
            Laporkan kondisi bahaya
          </button>
          <router-link to="/chatbot" class="btn btn-secondary cta-secondary" style="text-decoration: none;">
            Buka Chatbot AI HSSE
          </router-link>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useModal } from '../composables/useModal';

const router = useRouter();
const { openConsultationModal, openWhatsAppModal } = useModal();

const categoryGroups = [
  {
    id: 'aktivitas-berisiko',
    nama: 'Pekerjaan Berisiko',
    deskripsi: 'Kegiatan kerja yang memiliki bahaya tinggi (Ketinggian, Hot Work, Confined Space, Listrik, Rigging)',
    kategori: ['Ketinggian', 'Hot Work', 'Confined Space', 'Kelistrikan', 'Rigging']
  },
  {
    id: 'peralatan-kendaraan',
    nama: 'Peralatan & Kendaraan',
    deskripsi: 'Alat pelindung diri (APD), perkakas mesin, peralatan kerja, kendaraan, dan alat berat',
    kategori: ['Alat Berat', 'Peralatan Kerja', 'APD']
  },
  {
    id: 'kesehatan-lingkungan',
    nama: 'Kesehatan & Lingkungan',
    deskripsi: 'Kondisi kesehatan pekerja, Bahan Kimia B3, ergonomi, higienitas, dan sanitasi lingkungan',
    kategori: ['Bahan Kimia & B3', 'Lingkungan Kerja', 'Ergonomi']
  },
  {
    id: 'sistem-risiko',
    nama: 'Aturan & Pengawasan',
    deskripsi: 'Prosedur kerja aman, izin kerja (PTW), audit keselamatan, dan sistem manajemen K3',
    kategori: ['Audit K3', 'Manajemen Risiko', 'Pengawasan & SOP']
  },
  {
    id: 'budaya-kompetensi',
    nama: 'Perilaku & Pelatihan',
    deskripsi: 'Perilaku aman di lapangan, kepatuhan disiplin, komunikasi, dan sertifikasi kompetensi',
    kategori: ['Budaya Keselamatan', 'Pelatihan', 'Komunikasi']
  },
  {
    id: 'insiden-koordinasi',
    nama: 'Insiden & Darurat',
    deskripsi: 'Kejadian kecelakaan, temuan near miss, tanggap darurat, dan koordinasi SIMOPS',
    kategori: ['Investigasi Insiden', 'Tanggap Darurat', 'SIMOPS']
  }
];

const rosterList = [
  {
    nama: 'M. Solihin',
    jabatan: 'Superintendent HSSE',
    spec: 'Penanggung Jawab Utama HSSE PT Pertamina EP Lirik Field'
  },
  {
    nama: 'Juni Trihardiyanto',
    jabatan: 'SAFETY Lead',
    spec: 'Ketersediaan APD, Dokumen SIKA & JSA (Tim: Defrizon, Ibnu Zalda, Iman Khairuddin)'
  },
  {
    nama: 'Dr. Irsyad Yoga',
    jabatan: 'HEALTH Lead',
    spec: 'Prosedur MCU, Medis & Wellness (Tim: Dr. Fauzan, Amri, Yossy, Diana, Kiki)'
  },
  {
    nama: 'Jayadi',
    jabatan: 'SECURITY Lead',
    spec: 'Sistem Keamanan, Izin Masuk SIML (Tim: Budi Santoso, Iwan, Dudung, Heris)'
  },
  {
    nama: 'Ronny Pribadi',
    jabatan: 'ENVIRO Lead',
    spec: 'Dokumen & Compliance Lingkungan B3 (Tim: Tsabitha Nabilla)'
  },
  {
    nama: 'Andre & Della',
    jabatan: 'ADMIN HSSE',
    spec: 'Andre (Finance HSSE) & Della (Administrasi Pekerja Field)'
  }
];

function selectCategoryGroup(group) {
  router.push({
    path: '/chatbot',
    query: { category: group.id }
  });
}

function getCategoryIcon(id) {
  const icons = {
    'aktivitas-berisiko': '⚠️',
    'peralatan-kendaraan': '🚜',
    'kesehatan-lingkungan': '🌿',
    'sistem-risiko': '📋',
    'budaya-kompetensi': '👥',
    'insiden-koordinasi': '🚨'
  };
  return icons[id] || '🛡️';
}
</script>
