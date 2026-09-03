<template>
  <div v-if="isTicketCheckOpen" class="modal-overlay active" id="ticket-check-modal" @click.self="closeTicketCheckModal">
    <div class="modal-container" style="max-width: 640px; max-height: 90vh; overflow-y: auto; background: var(--card-bg, #1e293b); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; color: var(--text-primary, #f8fafc);">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 class="modal-title" style="margin: 0; font-size: 18px; font-weight: 700; color: #38bdf8;">🔍 Cek Status Tiket</h2>
        <button class="modal-close" type="button" @click="closeTicketCheckModal" aria-label="Tutup modal" style="background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer;">&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-sub" style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">
          Masukkan Nomor Tiket Anda untuk melihat status dan perkembangan penanganan laporan bahaya secara real-time.
        </p>

        <!-- Input Pencarian -->
        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
          <input
            type="text"
            v-model="ticketQuery"
            class="form-input"
            placeholder="Contoh: HSE-20260903-DEMO2"
            style="flex: 1; font-family: monospace;"
            @keydown.enter="handleSearch"
          />
          <button class="btn btn-primary" @click="handleSearch" :disabled="isLoading">
            {{ isLoading ? 'Mencari...' : 'Cari Tiket' }}
          </button>
        </div>

        <div style="font-size: 11.5px; color: #64748b; margin-bottom: 16px;">
          💡 <em>Contoh data demo:</em>
          <button type="button" @click="setDemo('HSE-20260903-DEMO2')" style="background:none; border:1px solid rgba(56,189,248,0.3); color:#38bdf8; padding:1px 6px; border-radius:4px; margin:0 4px; cursor:pointer;">DEMO2</button>
          <button type="button" @click="setDemo('HSE-20260903-DEMO3')" style="background:none; border:1px solid rgba(56,189,248,0.3); color:#38bdf8; padding:1px 6px; border-radius:4px; margin:0 4px; cursor:pointer;">DEMO3</button>
        </div>

        <!-- Error Box -->
        <div v-if="errorMessage" style="background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
          {{ errorMessage }}
        </div>

        <!-- Hasil Pencarian -->
        <div v-if="ticketData" style="margin-top: 16px;">
          <!-- Section 1: Dashboard -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Nomor Tiket</span>
                <div style="font-family: monospace; font-size: 16px; font-weight: 700; color: #38bdf8;">
                  {{ ticketData.ticket_number || ticketData.complaint_id }}
                </div>
              </div>
              <span :class="['status-badge', getStatusClass(ticketData.status)]" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                {{ ticketData.status || 'Open' }}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
              <div><span style="color:#94a3b8;">Lokasi:</span> <strong>{{ ticketData.location || '-' }}</strong></div>
              <div><span style="color:#94a3b8;">Kategori:</span> <strong>{{ ticketData.category || '-' }}</strong></div>
              <div><span style="color:#94a3b8;">Pelapor:</span> <strong>{{ ticketData.reporter_name || '-' }} ({{ ticketData.division || '-' }})</strong></div>
              <div><span style="color:#94a3b8;">Urgensi:</span> <strong :style="{ color: getUrgencyColor(ticketData.urgency) }">{{ ticketData.urgency || '-' }}</strong></div>
              <div><span style="color:#94a3b8;">Petugas:</span> <strong>{{ ticketData.assigned_to || ticketData.assigned_engineer || 'Tim HSSE Lapangan' }}</strong></div>
            </div>

            <div v-if="ticketData.admin_message" style="margin-top: 12px; background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; padding: 10px 12px; border-radius: 6px;">
              <div style="font-size: 11px; font-weight: 700; color: #10b981; margin-bottom: 2px;">💬 Pesan dari Tim HSSE:</div>
              <div style="font-size: 13px;">{{ ticketData.admin_message }}</div>
            </div>
          </div>

          <!-- Section 2: Timeline -->
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #f8fafc;">📋 Daftar Riwayat Laporan</h4>
            <div v-if="ticketData.history && ticketData.history.length > 0">
              <div v-for="(h, idx) in ticketData.history" :key="idx" style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #0284c7; margin-top: 4px;"></div>
                  <div v-if="idx < ticketData.history.length - 1" style="width: 2px; flex: 1; background: rgba(255,255,255,0.1); margin-top: 4px;"></div>
                </div>
                <div style="flex: 1; font-size: 13px;">
                  <div style="color: #94a3b8; font-size: 11px;">{{ formatDate(h.timestamp) }} &bull; {{ h.actor || 'Sistem' }}</div>
                  <div style="font-weight: 600; color: #f8fafc;">{{ h.action || h.status }}</div>
                  <div v-if="h.notes" style="color: #cbd5e1; font-size: 12px; margin-top: 2px;">{{ h.notes }}</div>
                </div>
              </div>
            </div>
            <div v-else style="font-size: 12px; color: #64748b;">Belum ada riwayat tercatat.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useModal } from '../../composables/useModal';
import { getComplaintByTicket } from '../../services/api';

const { isTicketCheckOpen, closeTicketCheckModal } = useModal();

const ticketQuery = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const ticketData = ref(null);

function setDemo(ticketNo) {
  ticketQuery.value = ticketNo;
  handleSearch();
}

async function handleSearch() {
  const query = ticketQuery.value.trim();
  if (!query) {
    errorMessage.value = 'Harap masukkan nomor tiket.';
    ticketData.value = null;
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  ticketData.value = null;

  try {
    const res = await getComplaintByTicket(query);
    if (res && res.success && res.data) {
      ticketData.value = res.data.complaint || res.data;
    } else {
      throw new Error(res?.message || 'Tiket tidak ditemukan.');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Tiket tidak ditemukan. Periksa kembali nomor tiket Anda.';
  } finally {
    isLoading.value = false;
  }
}

function getStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('closed') || s.includes('resolved') || s.includes('selesai')) return 'status-closed';
  if (s.includes('progress') || s.includes('diproses')) return 'status-in-progress';
  return 'status-open';
}

function getUrgencyColor(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u.includes('tinggi') || u.includes('berat')) return '#ef4444';
  if (u.includes('sedang')) return '#f59e0b';
  return '#10b981';
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>
