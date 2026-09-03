<template>
  <div v-if="isChoiceOpen" class="modal-overlay active" id="consultation-choice-modal" @click.self="closeChoiceModal">
    <div class="modal-card modal-choice-card">
      <button class="modal-close-btn" type="button" @click="closeChoiceModal" aria-label="Tutup modal"></button>

      <div id="confirmation-success-block" style="display: block;">
        <div class="confirmation-badge-success" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 166, 81, 0.15); border: 1px solid rgba(0, 166, 81, 0.35); color: #34d399; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 12px;">
          ✓ LAPORAN BERHASIL DISAMPAIKAN
        </div>
        <h3 style="margin: 0 0 10px 0;">Konfirmasi Laporan Keselamatan</h3>

        <div class="confirmation-ticket-box" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; text-align: left; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block;">Nomor Tiket:</span>
            <strong style="font-family: 'JetBrains Mono', monospace; color: #38bdf8; font-size: 16px; font-weight: 700;">
              {{ ticketNumber }}
            </strong>
          </div>
          <div>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block;">Status:</span>
            <span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
              {{ ticketStatus }}
            </span>
          </div>
        </div>
      </div>

      <p class="modal-sub" style="margin-bottom: 18px; font-size: 13px; line-height: 1.5;">
        Laporan Anda telah berhasil diterima oleh sistem SIGAP HSE. Simpan nomor tiket untuk melacak perkembangan penanganan laporan kapan saja.
      </p>

      <div class="handling-choice-grid">
        <button type="button" class="handling-choice option-ai" @click="goToChatbot">
          <span class="handling-choice-icon">🤖</span>
          <span class="handling-choice-label">DISARANKAN</span>
          <strong>Analisis AI HSSE</strong>
          <span>Dapatkan identifikasi risiko dan rekomendasi solusi K3 secara instan.</span>
        </button>

        <button type="button" class="handling-choice option-whatsapp" @click="goToWhatsApp">
          <span class="handling-choice-icon">💬</span>
          <span class="handling-choice-label">KONTAK LANGSUNG</span>
          <strong>WhatsApp Tim HSSE</strong>
          <span>Terhubung langsung ke HSSE Officer penanggung jawab lapangan.</span>
        </button>
      </div>

      <div class="modal-actions modal-actions-centered" style="margin-top: 18px;">
        <button class="btn btn-secondary" @click="closeChoiceModal">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useModal } from '../../composables/useModal';

const router = useRouter();
const { isChoiceOpen, choiceModalData, closeChoiceModal, openWhatsAppModal } = useModal();

const ticketNumber = computed(() => {
  return choiceModalData.value?.ticketNumber || 'HSE-TERDAFTAR';
});

const ticketStatus = computed(() => {
  return choiceModalData.value?.status || 'Open';
});

function goToChatbot() {
  closeChoiceModal();
  router.push('/chatbot');
}

function goToWhatsApp() {
  const data = choiceModalData.value;
  closeChoiceModal();
  openWhatsAppModal(data);
}
</script>
