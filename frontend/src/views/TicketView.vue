<template>
  <main class="view-panel active" id="view-ticket">
    <div class="panel-header">
      <span class="section-kicker">TRACKING LAPORAN</span>
      <h2>Cek Perkembangan Tiket</h2>
      <p>Masukkan Nomor Tiket untuk melacak status dan riwayat penanganan laporan bahaya Anda secara <em>real-time</em>.</p>
    </div>

    <!-- SEARCH BOX -->
    <div class="ticket-page-search-wrap">
      <div class="ticket-page-search-card">
        <div class="ticket-page-search-label">🔍 Nomor Tiket</div>
        <div class="ticket-page-search-row">
          <input
            type="text"
            v-model="ticketInput"
            class="form-input ticket-page-input"
            placeholder="Contoh: HSE-20260903-0001"
            @keydown.enter="searchTicket"
          />
          <button class="btn btn-primary" id="btn-ticket-page-search" @click="searchTicket" :disabled="isLoading">
            {{ isLoading ? 'Mencari...' : 'Cari Tiket' }}
          </button>
        </div>
        <div class="ticket-page-hint">
          💡 Nomor tiket terdapat pada konfirmasi saat laporan dikirimkan. Contoh data:
          <button type="button" class="ticket-sample-btn" @click="setSample('HSE-20260903-DEMO2')">HSE-20260903-DEMO2</button> ·
          <button type="button" class="ticket-sample-btn" @click="setSample('HSE-20260903-DEMO3')">HSE-20260903-DEMO3</button>
        </div>
      </div>

      <!-- Status Legend -->
      <div class="ticket-page-legend">
        <span class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span> Open</span>
        <span class="legend-sep">·</span>
        <span class="legend-item"><span class="legend-dot" style="background:#3b82f6;"></span> In Progress</span>
        <span class="legend-sep">·</span>
        <span class="legend-item"><span class="legend-dot" style="background:#10b981;"></span> Closed / Resolved</span>
      </div>
    </div>

    <!-- ERROR BOX -->
    <div v-if="errorMessage" class="ticket-page-error">
      {{ errorMessage }}
    </div>

    <!-- RESULT CONTAINER -->
    <div v-if="ticket" class="ticket-page-result">
      <!-- SECTION 1: DASHBOARD -->
      <div class="ticket-page-section">
        <div class="tp-status-banner" :style="{ background: statusMeta.bg, borderColor: statusMeta.border }">
          <div class="tp-status-icon">{{ statusMeta.icon }}</div>
          <div>
            <div class="tp-status-label" :style="{ color: statusMeta.color }">STATUS LAPORAN</div>
            <div class="tp-status-value" :style="{ color: statusMeta.color }">{{ statusMeta.label }}</div>
            <div class="tp-status-ticket" :style="{ color: statusMeta.color }">
              Tiket: <strong>{{ ticket.ticket_number || ticket.complaint_id }}</strong>
            </div>
          </div>
        </div>

        <div class="ticket-page-section-header" style="margin-bottom:14px;">
          <span class="ticket-page-section-icon">📊</span>
          <div>
            <div class="ticket-page-section-title">Dashboard Laporan</div>
            <div class="ticket-page-section-sub">Ringkasan informasi laporan bahaya yang telah diterima sistem.</div>
          </div>
        </div>

        <div class="tp-info-grid">
          <div class="tp-info-card">
            <div class="tp-info-label">📅 Tanggal Kejadian</div>
            <div class="tp-info-value">{{ formatDateShort(ticket.occurrence_date) }}</div>
          </div>
          <div class="tp-info-card">
            <div class="tp-info-label">📍 Lokasi</div>
            <div class="tp-info-value">{{ ticket.location || '-' }}</div>
          </div>
          <div class="tp-info-card">
            <div class="tp-info-label">🏷️ Kategori Bahaya</div>
            <div class="tp-info-value">{{ ticket.category || '-' }}</div>
          </div>
          <div class="tp-info-card">
            <div class="tp-info-label">⚠️ Tingkat Urgensi</div>
            <div class="tp-info-value" :style="{ color: getUrgencyColor(ticket.urgency), fontWeight: '700' }">
              {{ ticket.urgency || '-' }}
            </div>
          </div>
          <div class="tp-info-card">
            <div class="tp-info-label">👤 Pelapor</div>
            <div class="tp-info-value">
              {{ ticket.reporter_name || '-' }}
              <span style="font-size:11px; color:#64748b;">({{ ticket.division || '-' }})</span>
            </div>
          </div>
          <div class="tp-info-card">
            <div class="tp-info-label">👷 Petugas Penanganan</div>
            <div class="tp-info-value">{{ ticket.assigned_to || ticket.assigned_engineer || 'Belum Ditugaskan' }}</div>
          </div>
        </div>

        <div class="tp-description-box">
          <div class="tp-description-label">📝 Deskripsi Laporan</div>
          <div class="tp-description-text">{{ ticket.description || ticket.complaint_description || '-' }}</div>
        </div>

        <!-- Admin Message -->
        <div v-if="ticket.admin_message" class="tp-admin-message">
          <div class="tp-admin-message-label">💬 Pesan dari Tim HSSE</div>
          <div class="tp-admin-message-body">{{ ticket.admin_message }}</div>
        </div>
      </div>

      <!-- SECTION 2: DAFTAR RIWAYAT LAPORAN -->
      <div class="ticket-page-section">
        <div class="ticket-page-section-header">
          <span class="ticket-page-section-icon">📋</span>
          <div>
            <div class="ticket-page-section-title">Daftar Riwayat Laporan</div>
            <div class="ticket-page-section-sub">Kronologis setiap pembaruan status yang dilakukan oleh Tim HSSE.</div>
          </div>
        </div>

        <div class="tp-timeline-wrap" style="margin-top: 14px;">
          <div v-if="ticket.history && ticket.history.length > 0">
            <div
              v-for="(h, i) in ticket.history"
              :key="i"
              class="tp-tl-item"
            >
              <div class="tp-tl-left">
                <div
                  class="tp-tl-dot"
                  :style="{ background: getTimelineDotColor(h.status), boxShadow: `0 0 0 3px ${getTimelineDotColor(h.status)}22` }"
                ></div>
                <div v-if="i < ticket.history.length - 1" class="tp-tl-line"></div>
              </div>
              <div class="tp-tl-body">
                <div class="tp-tl-meta">
                  {{ formatDateLong(h.timestamp) }} &bull; <strong>{{ h.actor || 'Sistem' }}</strong>
                </div>
                <div class="tp-tl-action">{{ h.action || h.status }}</div>
                <span
                  class="tp-tl-badge"
                  :style="{ background: `${getTimelineDotColor(h.status)}18`, color: getTimelineDotColor(h.status) }"
                >
                  {{ h.status }}
                </span>
                <div v-if="h.notes" class="tp-tl-notes">{{ h.notes }}</div>
              </div>
            </div>
          </div>
          <div v-else style="color:#64748b; font-size:14px; padding:8px 0;">
            Belum ada riwayat perubahan.
          </div>
        </div>
      </div>

      <!-- SECTION 3: REKAPITULASI -->
      <div class="ticket-page-section">
        <div class="ticket-page-section-header" style="margin-bottom:14px;">
          <span class="ticket-page-section-icon">📈</span>
          <div>
            <div class="ticket-page-section-title">Rekapitulasi</div>
            <div class="ticket-page-section-sub">Ringkasan akhir proses penanganan laporan ini.</div>
          </div>
        </div>

        <div class="tp-rekap-grid">
          <div class="tp-rekap-card">
            <div class="tp-rekap-val" style="color:#0284c7;">{{ (ticket.history && ticket.history.length) || 1 }}</div>
            <div class="tp-rekap-lbl">Tahap Proses</div>
          </div>
          <div class="tp-rekap-card">
            <div class="tp-rekap-val">{{ calculateDuration(ticket.created_at, ticket.updated_at) }}</div>
            <div class="tp-rekap-lbl">Durasi Penanganan</div>
          </div>
          <div class="tp-rekap-card">
            <div class="tp-rekap-val" :style="{ color: statusMeta.badgeBg }">{{ ticket.status || 'Open' }}</div>
            <div class="tp-rekap-lbl">Status Akhir</div>
          </div>
        </div>

        <div v-if="ticket.follow_up_notes" class="tp-followup-box">
          <div class="tp-followup-label">📋 Catatan Tindak Lanjut Akhir</div>
          <div class="tp-followup-text">{{ ticket.follow_up_notes }}</div>
        </div>
      </div>

      <!-- CTA FOOTER -->
      <div class="ticket-page-cta">
        <p>Ada kondisi bahaya lain yang perlu dilaporkan?</p>
        <button class="btn btn-primary" @click="openConsultationModal">
          + Buat Laporan Baru
        </button>
        <router-link to="/chatbot" class="btn btn-secondary" style="text-decoration: none;">
          Konsultasi Asisten HSSE
        </router-link>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-else class="ticket-page-empty-state">
      <div class="ticket-empty-icon">🎫</div>
      <h3>Lacak Laporan Anda</h3>
      <p>
        Setelah Anda mengirimkan laporan bahaya, sistem akan menerbitkan <strong>Nomor Tiket</strong> unik. Masukkan nomor tersebut di atas untuk melihat status penanganan secara transparan.
      </p>
      <div class="ticket-empty-steps">
        <div class="ticket-step">
          <div class="ticket-step-num">1</div>
          <div class="ticket-step-text">Pelapor mengisi form laporan atau konsultasi via chatbot</div>
        </div>
        <div class="ticket-step">
          <div class="ticket-step-num">2</div>
          <div class="ticket-step-text">Sistem menerbitkan Nomor Tiket unik secara otomatis</div>
        </div>
        <div class="ticket-step">
          <div class="ticket-step-num">3</div>
          <div class="ticket-step-text">Admin HSSE memproses dan mengupdate status tiket</div>
        </div>
        <div class="ticket-step">
          <div class="ticket-step-num">4</div>
          <div class="ticket-step-text">Pelapor cek perkembangan tiket kapan saja di halaman ini</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useModal } from '../composables/useModal';
import { getComplaintByTicket } from '../services/api';

const { openConsultationModal } = useModal();

const ticketInput = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const ticket = ref(null);

function setSample(ticketNo) {
  ticketInput.value = ticketNo;
  searchTicket();
}

async function searchTicket() {
  const q = ticketInput.value.trim();
  if (!q) {
    errorMessage.value = 'Harap masukkan nomor tiket terlebih dahulu.';
    ticket.value = null;
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  ticket.value = null;

  try {
    const res = await getComplaintByTicket(q);
    if (res && res.success && res.data) {
      ticket.value = res.data.complaint || res.data;
    } else {
      throw new Error(res?.message || 'Tiket tidak ditemukan.');
    }
  } catch (err) {
    let msg = err.message || 'Tiket tidak ditemukan.';
    if (msg.includes('tidak ditemukan')) {
      msg += ' Pastikan nomor tiket sudah benar (format: HSE-YYYYMMDD-XXXX).';
    }
    errorMessage.value = msg;
  } finally {
    isLoading.value = false;
  }
}

const statusMeta = computed(() => {
  const s = String(ticket.value?.status || 'Open').toLowerCase();
  if (s.includes('closed') || s.includes('resolved') || s.includes('selesai')) {
    return {
      icon: '✅',
      label: 'Selesai Ditangani',
      bg: '#dcfce7',
      color: '#14532d',
      border: '#86efac',
      badgeBg: '#10b981'
    };
  } else if (s.includes('progress') || s.includes('diproses')) {
    return {
      icon: '⚙️',
      label: 'Sedang Ditangani',
      bg: '#dbeafe',
      color: '#1e3a5f',
      border: '#93c5fd',
      badgeBg: '#3b82f6'
    };
  } else {
    return {
      icon: '🕐',
      label: 'Menunggu Penanganan',
      bg: '#fef3c7',
      color: '#92400e',
      border: '#fcd34d',
      badgeBg: '#f59e0b'
    };
  }
});

function getTimelineDotColor(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('closed') || s.includes('resolved')) return '#10b981';
  if (s.includes('progress')) return '#3b82f6';
  return '#f59e0b';
}

function getUrgencyColor(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u.includes('tinggi') || u.includes('berat')) return '#dc2626';
  if (u.includes('sedang')) return '#d97706';
  return '#16a34a';
}

function formatDateShort(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateDuration(startIso, endIso) {
  if (!startIso) return 'Baru diterima';
  const t1 = new Date(startIso);
  const t2 = endIso ? new Date(endIso) : new Date();
  const ms = t2 - t1;
  if (ms <= 0) return 'Baru diterima';
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return hrs > 0 ? `${hrs} jam ${mins} menit` : `${mins} menit`;
}
</script>
