<template>
  <div v-if="isOpen && report" class="modal-overlay active" id="report-detail-modal" @click.self="closeModal">
    <div class="modal-card modal-detail-card">
      <button class="modal-close-btn" type="button" @click="closeModal" aria-label="Tutup modal"></button>

      <div class="detail-header-bar">
        <div>
          <span class="detail-ticket-code" id="modal-ticket-no">
            {{ report.ticket_number || report.complaint_id }}
          </span>
          <h3 id="modal-finding-title">{{ report.description?.slice(0, 60) || 'Detail Laporan Keselamatan Kerja' }}</h3>
        </div>
        <div class="detail-header-badges">
          <span :class="['status-badge', getStatusBadgeClass(report.status)]">
            {{ report.status || 'Open' }}
          </span>
          <span :class="['urgency-badge', getUrgencyBadgeClass(report.urgency)]">
            {{ report.urgency || 'Sedang' }}
          </span>
        </div>
      </div>

      <div class="detail-grid">
        <!-- LEFT COLUMN: Report Info -->
        <div class="detail-info-col">
          <div class="detail-info-group">
            <span class="detail-label">Tanggal Kejadian</span>
            <strong>{{ formatDate(report.occurrence_date || report.created_at) }}</strong>
          </div>

          <div class="detail-info-group">
            <span class="detail-label">Lokasi Temuan</span>
            <strong>{{ report.location || '-' }}</strong>
          </div>

          <div class="detail-info-group">
            <span class="detail-label">Pelapor &amp; Fungsi</span>
            <strong>{{ report.reporter_name || '-' }} ({{ report.division || '-' }})</strong>
          </div>

          <div class="detail-info-group">
            <span class="detail-label">Kategori Bahaya</span>
            <strong>{{ report.category || '-' }}</strong>
          </div>

          <div class="detail-info-group">
            <span class="detail-label">Jenis Temuan</span>
            <strong>{{ report.finding_type || 'Unsafe Condition' }}</strong>
          </div>

          <div class="detail-info-group">
            <span class="detail-label">Petugas Ditugaskan</span>
            <strong>{{ report.assigned_to || report.assigned_engineer || 'Belum Ditugaskan' }}</strong>
          </div>

          <div class="detail-info-group">
            <span class="detail-label">Sumber Laporan</span>
            <span>{{ report.source || 'Portal Publik' }}</span>
          </div>

          <div v-if="report.chat_session_id" class="detail-info-group">
            <span class="detail-label">ID Sesi Chatbot</span>
            <code style="font-size:0.78rem; color: var(--text-muted, #94a3b8);">{{ report.chat_session_id }}</code>
          </div>

          <div class="detail-desc-box">
            <span class="detail-label">Deskripsi Kondisi Bahaya</span>
            <p>{{ report.description || report.complaint_description || '-' }}</p>
          </div>
        </div>

        <!-- RIGHT COLUMN: Update Action & Audit Trail -->
        <div class="detail-action-col">
          <div class="admin-action-box">
            <div class="action-box-title">Pembaruan Status &amp; Tindak Lanjut</div>

            <form @submit.prevent="submitUpdate">
              <div class="form-group">
                <label for="update-status-select">Status Laporan <span class="field-required">*</span></label>
                <select id="update-status-select" v-model="updateForm.status" class="form-input" required>
                  <option value="Open">Open (Masuk antrean)</option>
                  <option value="In Progress">In Progress (Sedang ditindaklanjuti)</option>
                  <option value="Closed / Resolved">Closed / Resolved (Investigasi &amp; Mitigasi Selesai)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="update-assigned-officer">Disposisikan ke HSSE Officer</label>
                <select id="update-assigned-officer" v-model="updateForm.assigned_officer" class="form-input">
                  <option value="">— Pilih HSSE Officer —</option>
                  <option value="M. Solihin">M. Solihin — Superintendent HSSE (Umum)</option>
                  <option value="Juni Trihardiyanto">Juni Trihardiyanto — Senior Safety Lead (APD, JSA)</option>
                  <option value="Dr. Irsyad Yoga">Dr. Irsyad Yoga — Chief Medical Officer (Kesehatan)</option>
                  <option value="Jayadi">Jayadi — Chief Security Officer (Keamanan)</option>
                  <option value="Ronny Pribadi">Ronny Pribadi — Environmental Specialist (Lingkungan)</option>
                  <option value="Andre & Della">Andre &amp; Della — HSSE Finance &amp; Administrasi</option>
                </select>
              </div>

              <div class="form-group">
                <label for="update-follow-up-notes">Catatan Tindak Lanjut / Mitigasi</label>
                <textarea
                  id="update-follow-up-notes"
                  v-model="updateForm.follow_up_notes"
                  class="form-input"
                  rows="3"
                  placeholder="Tuliskan tindakan perbaikan, hasil investigasi, atau catatan penyelesaian..."
                ></textarea>
              </div>

              <div class="form-group">
                <label for="update-admin-message" style="display:flex;align-items:center;gap:6px;">
                  <span>💬 Pesan untuk Pelapor</span>
                  <span style="font-size:11px;font-weight:400;color:#64748b;">(Tampil di Cek Status Tiket publik)</span>
                </label>
                <textarea
                  id="update-admin-message"
                  v-model="updateForm.admin_message"
                  class="form-input"
                  rows="3"
                  placeholder="Contoh: Laporan Anda sudah kami terima dan sedang dalam proses penanganan. Terima kasih atas kepedulian Anda terhadap keselamatan kerja."
                ></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block" :disabled="isSaving">
                {{ isSaving ? 'Menyimpan...' : 'Simpan Pembaruan Laporan' }}
              </button>
            </form>
          </div>

          <!-- AUDIT TRAIL TIMELINE -->
          <div class="audit-trail-box" style="margin-top: 20px;">
            <div class="audit-trail-title">Riwayat Perubahan (Audit Trail)</div>
            <div class="audit-timeline" style="margin-top: 10px;">
              <div v-if="report.history && report.history.length > 0">
                <div v-for="(h, i) in report.history" :key="i" class="audit-item" style="display:flex; gap:10px; margin-bottom:12px;">
                  <div style="width:8px; height:8px; border-radius:50%; background:#38bdf8; margin-top:4px;"></div>
                  <div style="flex:1; font-size:12px;">
                    <div style="color:#94a3b8;">{{ formatDateTime(h.timestamp) }} &bull; <strong>{{ h.actor || 'Sistem' }}</strong></div>
                    <div style="font-weight:600; color:#0f172a;">{{ h.action || h.status }}</div>
                    <div v-if="h.notes" style="color:#64748b; font-style:italic;">{{ h.notes }}</div>
                  </div>
                </div>
              </div>
              <div v-else style="font-size:12px; color:#94a3b8;">Belum ada riwayat perubahan.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions mt-3" style="margin-top: 20px;">
        <button class="btn btn-secondary" type="button" @click="closeModal">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { updateAdminReport } from '../../services/api';
import { useToast } from '../../composables/useToast';

const props = defineProps({
  isOpen: Boolean,
  report: Object
});

const emit = defineEmits(['close', 'updated']);
const { showToast } = useToast();

const isSaving = ref(false);
const updateForm = ref({
  status: 'Open',
  assigned_officer: '',
  follow_up_notes: '',
  admin_message: ''
});

watch(
  () => props.report,
  (newReport) => {
    if (newReport) {
      updateForm.value = {
        status: newReport.status || 'Open',
        assigned_officer: newReport.assigned_to || newReport.assigned_engineer || '',
        follow_up_notes: newReport.follow_up_notes || '',
        admin_message: newReport.admin_message || ''
      };
    }
  },
  { immediate: true }
);

function closeModal() {
  emit('close');
}

async function submitUpdate() {
  if (isSaving.value || !props.report) return;
  isSaving.value = true;

  const ticketNo = props.report.ticket_number || props.report.complaint_id;

  try {
    const payload = {
      status: updateForm.value.status,
      assigned_to: updateForm.value.assigned_officer,
      assigned_officer: updateForm.value.assigned_officer,
      follow_up_notes: updateForm.value.follow_up_notes,
      admin_message: updateForm.value.admin_message
    };

    const res = await updateAdminReport(ticketNo, payload);
    if (res && res.success) {
      showToast(`Laporan ${ticketNo} berhasil diperbarui!`, 'success');
      emit('updated');
      closeModal();
    } else {
      throw new Error(res?.message || 'Gagal menyimpan perubahan.');
    }
  } catch (err) {
    showToast(err.message || 'Gagal memperbarui laporan.', 'error');
  } finally {
    isSaving.value = false;
  }
}

function getStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('closed') || s.includes('resolved') || s.includes('selesai')) return 'status-closed';
  if (s.includes('progress') || s.includes('diproses')) return 'status-in-progress';
  return 'status-open';
}

function getUrgencyBadgeClass(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u.includes('tinggi') || u.includes('berat')) return 'urgency-tinggi';
  if (u.includes('sedang')) return 'urgency-sedang';
  return 'urgency-ringan';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(isoStr) {
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
