<template>
  <main class="view-panel active" id="view-chatbot">
    <!-- Category Selector Section -->
    <div class="guided-cat-section" id="category-selector-bar">
      <div class="guided-cat-header">
        <span class="guided-step-badge">KATEGORI OPSIONAL</span>
        <span class="guided-cat-title">Pilih kategori utama</span>
        <button
          v-if="selectedGroup"
          class="btn-clear-cat btn btn-sm btn-secondary"
          type="button"
          @click="clearGroup"
        >
          Hapus Pilihan ({{ selectedGroupName }})
        </button>
      </div>
      <p class="guided-cat-help">Pilih yang paling sesuai. Pilihan cepat di bawah akan menyesuaikan otomatis.</p>

      <div class="guided-cat-grid">
        <button
          v-for="group in groups"
          :key="group.id"
          class="guided-cat-group-card"
          :class="{ active: selectedGroup === group.id }"
          type="button"
          @click="selectGroup(group.id)"
        >
          <span class="gcat-icon" style="font-size: 20px;">{{ getIcon(group.id) }}</span>
          <div class="gcat-info">
            <span class="gcat-name">{{ group.nama }}</span>
            <span class="gcat-tech">{{ group.deskripsi }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Main Chat Console Container -->
    <div class="chat-container">
      <!-- Chat Header Bar -->
      <div class="chat-header">
        <div class="chat-title-group">
          <div class="chat-icon-badge">🤖</div>
          <div>
            <h3>SIGAP-AI HSSE Companion</h3>
            <div class="chat-subtitle">Sistem Pendamping Keselamatan Kerja Cerdas berbasis Knowledge Base</div>
          </div>
        </div>
        <button class="chat-new-button btn btn-sm btn-secondary" type="button" @click="resetConversation" title="Mulai Percakapan Baru">
          🔄 Baru
        </button>
      </div>

      <!-- Starter Chips (Dynamic per Category: Tepat 4 Pilihan) -->
      <div class="starter-chips-section" id="starter-bar" v-if="activeStarters.length > 0">
        <div class="starter-chips-header">
          <div class="starter-chips-label">
            <span>⚡ CONTOH LAPORAN BAHAYA CEPAT:</span>
            <span class="starter-chips-badge">
              {{ selectedGroup ? selectedGroupName : 'Semua Kategori' }} (4 Pilihan)
            </span>
          </div>
          <button
            v-if="selectedGroup"
            class="btn-clear-cat btn btn-xs btn-secondary"
            type="button"
            @click="clearGroup"
            style="font-size: 11px; padding: 3px 10px; border-radius: 12px;"
          >
            Tampilkan Semua Kategori
          </button>
        </div>
        <div class="starter-chips-wrapper">
          <button
            v-for="(chip, i) in activeStarters"
            :key="chip.id || i"
            class="starter-chip"
            type="button"
            :title="chip.text || chip.judul || chip.title"
            @click="useStarter(chip)"
          >
            <span class="starter-chip-icon" v-if="chip.icon">{{ chip.icon }}</span>
            <span>{{ chip.title || chip.judul || chip.pertanyaan || chip }}</span>
            <span
              v-if="chip.risk || chip.tingkat_risiko"
              :class="['starter-chip-risk-dot', (chip.risk || chip.tingkat_risiko).toLowerCase()]"
              :title="'Tingkat Risiko: ' + (chip.risk || chip.tingkat_risiko)"
            ></span>
          </button>
        </div>
      </div>

      <!-- Chat Messages Stream -->
      <div class="chat-messages-stream" id="chat-messages" ref="chatStreamRef">
        <!-- Message Bubbles -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['chat-bubble', msg.sender === 'user' ? 'user-bubble' : 'system-bubble']"
        >
          <div class="bubble-sender">{{ msg.sender === 'user' ? 'Pelapor' : 'SIGAP-AI HSSE' }}</div>
          <div
            class="bubble-text"
            :style="msg.sender === 'user' ? 'white-space: pre-wrap;' : ''"
            v-html="formatMessage(msg.text, msg.sender)"
          ></div>

        </div>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="chat-bubble system-bubble" style="opacity: 0.85;">
          <div class="bubble-sender">SIGAP-AI HSSE</div>
          <div class="bubble-text" style="display: flex; align-items: center; gap: 8px;">
            <span class="button-spinner" style="width: 14px; height: 14px;"></span>
            <span>Menganalisis bahaya dengan Knowledge Base K3 internal...</span>
          </div>
        </div>
      </div>

      <!-- Resolution Bar -->
      <div v-if="showResolutionBar" class="resolution-bar" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #f8fafc; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;">
        <span class="res-bar-label" style="font-size: 13px; color: #334155; font-weight: 500;">
          Apakah analisis dan solusi K3 di atas membantu menangani kondisi bahaya?
        </span>
        <div class="res-bar-actions" style="display: flex; gap: 8px;">
          <button class="btn btn-success btn-sm" type="button" @click="handleResolution(true)" style="background:#16a34a; color:white; border:none; padding:6px 14px; border-radius:6px;">
            ✓ Selesai
          </button>
          <button class="btn btn-warning btn-sm" type="button" @click="handleResolution(false)" style="background:#d97706; color:white; border:none; padding:6px 14px; border-radius:6px;">
            Belum, Hubungi Tim HSSE
          </button>
        </div>
      </div>

      <!-- Chat Input Footer -->
      <div class="chat-input-bar">
        <textarea
          v-model="inputText"
          class="chat-input-field"
          rows="2"
          placeholder="Ceritakan kondisi bahaya, lokasi, dan aktivitas yang sedang berlangsung…"
          @keydown="handleKeyDown"
          :disabled="isTyping"
        ></textarea>
        <button
          class="btn btn-primary"
          id="btn-send-chat"
          type="button"
          @click="sendMessage"
          :disabled="isTyping || !inputText.trim()"
        >
          Kirim
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useModal } from '../composables/useModal';
import { useToast } from '../composables/useToast';
import { getChatStarters, sendChatMessage, resolveChatMessage, resetChatSession, createComplaint } from '../services/api';
import { HSSE_QUICK_REPORTS } from '../data/hsseQuickReports';
import { generateOfflineHsseAnalysis } from '../services/hsseOfflineEngine';
import { formatHtmlResponsTerstruktur } from '../services/structuredResponseFormatter';

const route = useRoute();
const { openConsultationModal, openWhatsAppModal } = useModal();
const { showToast } = useToast();

const STORAGE_KEY_MESSAGES = 'sigap_chat_messages_v1';
const STORAGE_KEY_GROUP = 'sigap_chat_selected_group_v1';
const STORAGE_KEY_RESOLUTION = 'sigap_chat_show_resolution_v1';

const DEFAULT_WELCOME = {
  sender: 'system',
  text: 'Selamat datang di Sistem Pendamping Keselamatan Kerja! Langsung tuliskan kondisi bahaya yang Anda temui di area kerja. Sistem akan menganalisis risiko dan merekomendasikan solusi K3 secara otomatis.'
};

function loadStoredMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal memuat pesan dari storage:', e);
  }
  return [DEFAULT_WELCOME];
}

const sessionId = ref(getOrCreateSessionId());
const messages = ref(loadStoredMessages());

const inputText = ref('');
const isTyping = ref(false);
const showResolutionBar = ref(false);
const selectedGroup = ref(null);
const chatStreamRef = ref(null);
const serverByGroup = ref({});

// Simpan setiap pesan baru ke localStorage secara otomatis
watch(
  messages,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(newVal));
    } catch (e) {
      console.warn('Gagal menyimpan riwayat chat ke localStorage:', e);
    }
  },
  { deep: true }
);

// Simpan kategori yang dipilih ke localStorage
watch(selectedGroup, (newVal) => {
  try {
    if (newVal) {
      localStorage.setItem(STORAGE_KEY_GROUP, newVal);
    } else {
      localStorage.removeItem(STORAGE_KEY_GROUP);
    }
  } catch (e) {}
});

// Simpan status bar konfirmasi resolusi
watch(showResolutionBar, (newVal) => {
  try {
    localStorage.setItem(STORAGE_KEY_RESOLUTION, newVal ? '1' : '0');
  } catch (e) {}
});

const groups = [
  { id: 'aktivitas-berisiko', nama: 'Pekerjaan Berisiko', deskripsi: 'Kegiatan kerja dengan bahaya tinggi' },
  { id: 'peralatan-kendaraan', nama: 'Peralatan & Kendaraan', deskripsi: 'Alat pelindung, alat kerja, dan kendaraan' },
  { id: 'kesehatan-lingkungan', nama: 'Kesehatan & Lingkungan', deskripsi: 'Kondisi pekerja dan area kerja' },
  { id: 'sistem-risiko', nama: 'Aturan & Pengawasan', deskripsi: 'Prosedur, izin kerja, dan pengawasan' },
  { id: 'budaya-kompetensi', nama: 'Perilaku & Pelatihan', deskripsi: 'Perilaku aman dan kemampuan pekerja' },
  { id: 'insiden-koordinasi', nama: 'Insiden & Darurat', deskripsi: 'Kecelakaan, hampir celaka, atau darurat' }
];

const selectedGroupName = computed(() => {
  const g = groups.find(x => x.id === selectedGroup.value);
  return g ? g.nama : '';
});

// Pilihan Cepat Bahaya: Selalu tepat 4 opsi kurasi terbaik per kategori terpilih
const activeStarters = computed(() => {
  const currentList = selectedGroup.value && HSSE_QUICK_REPORTS[selectedGroup.value]
    ? HSSE_QUICK_REPORTS[selectedGroup.value]
    : HSSE_QUICK_REPORTS['default'];
  return (currentList || []).slice(0, 4);
});

function getOrCreateSessionId() {
  const existing = localStorage.getItem('sigap_chat_session_id');
  if (existing) return existing;
  const newId = 'SESI-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  localStorage.setItem('sigap_chat_session_id', newId);
  return newId;
}

function selectGroup(groupId) {
  if (selectedGroup.value === groupId) {
    selectedGroup.value = null;
  } else {
    selectedGroup.value = groupId;
  }
}

function clearGroup() {
  selectedGroup.value = null;
}

function getIcon(id) {
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

function useStarter(chip) {
  if (chip.groupId && !selectedGroup.value) {
    selectedGroup.value = chip.groupId;
  }
  inputText.value = chip.text || chip.judul || chip.title || chip;
  sendMessage();
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (chatStreamRef.value) {
    chatStreamRef.value.scrollTop = chatStreamRef.value.scrollHeight;
  }
}

const lastReportText = ref('');

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isTyping.value) return;

  lastReportText.value = text;
  messages.value.push({ sender: 'user', text });
  inputText.value = '';
  isTyping.value = true;
  showResolutionBar.value = false;
  scrollToBottom();

  try {
    const payload = {
      session_id: sessionId.value,
      message: text,
      category_group: selectedGroup.value
    };

    const res = await sendChatMessage(payload);
    if (res && res.success && res.data) {
      const responseText = res.data.response || res.data.jawaban || 'Analisis selesai.';
      const escalation = res.data.show_escalation_prompt ? {
        message: text,
        suggestedRisk: res.data.suggested_risk_level || 'Sedang',
        category: res.data.category || res.data.kategori || 'Umum'
      } : null;

      messages.value.push({
        sender: 'system',
        text: responseText,
        escalation
      });

      showResolutionBar.value = true;
    } else {
      throw new Error(res?.message || 'Gagal memproses analisis di backend.');
    }
  } catch (err) {
    // Mode Cadangan HSSE yang Tangguh: Selalu memberikan jawaban berformat kartu terstruktur rapi
    console.warn('Backend server tidak dapat dihubungi atau mengembalikan status offline, menjalankan HSSE Intelligence Fallback:', err);
    
    const fallbackResult = generateOfflineHsseAnalysis(text, selectedGroup.value);

    messages.value.push({
      sender: 'system',
      text: fallbackResult.response,
      escalation: {
        message: text,
        suggestedRisk: fallbackResult.suggested_risk_level || 'Sedang',
        category: fallbackResult.category || 'Umum'
      }
    });

    showResolutionBar.value = true;
    showToast('Analisis bahaya K3 berhasil disajikan secara cerdas.', 'info');
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
}

async function handleResolution(isResolved) {
  showResolutionBar.value = false;
  if (isResolved) {
    try {
      await resolveChatMessage({ session_id: sessionId.value });
    } catch (e) {}
    showToast('Terima kasih atas konfirmasinya. Tetap utamakan keselamatan kerja!', 'success');
    messages.value.push({
      sender: 'system',
      text: '✅ Isu telah ditandai selesai. Terima kasih telah menerapkan prinsip K3 Pertamina Golden Rules (Patuh, Peduli, Tanggap)!'
    });
  } else {
    openWhatsAppModal({ description: lastReportText.value });
  }
  scrollToBottom();
}

async function handleCreateTicketFromChat(escData) {
  try {
    const res = await createComplaint({
      description: escData.message,
      urgency: escData.suggestedRisk || 'Sedang',
      category: escData.category || 'Pekerjaan Berisiko',
      location: 'Area Operasional Lirik Field',
      reporter_name: 'Pelapor (via Asisten HSSE)',
      division: 'Operasi Lapangan'
    });

    if (res && res.success) {
      const ticketNo = res.data?.complaint?.complaint_id || res.data?.ticket_number || 'HSE-TERBIT';
      showToast(`Tiket resmi ${ticketNo} berhasil dibuat!`, 'success');
      messages.value.push({
        sender: 'system',
        text: `🎫 **Tiket Resmi Berhasil Diterbitkan!**\nNomor Tiket: **${ticketNo}**\nStatus: **Open**\n\nTim HSSE Lapangan telah menerima notifikasi laporan ini.`
      });
    } else {
      throw new Error();
    }
  } catch (e) {
    openConsultationModal();
  }
  scrollToBottom();
}

async function resetConversation() {
  try {
    await resetChatSession({ session_id: sessionId.value });
  } catch (e) {}

  const newId = 'SESI-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  sessionId.value = newId;
  localStorage.setItem('sigap_chat_session_id', newId);

  messages.value = [
    {
      sender: 'system',
      text: 'Percakapan baru telah dimulai. Silakan tulis kondisi bahaya yang Anda temukan.'
    }
  ];
  showResolutionBar.value = false;
  selectedGroup.value = null;

  try {
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_GROUP);
    localStorage.removeItem(STORAGE_KEY_RESOLUTION);
  } catch (e) {}

  showToast('Sesi percakapan direset.', 'info');
  scrollToBottom();
}

function formatMessage(raw, sender) {
  if (!raw) return '';
  if (sender === 'user') {
    return String(raw)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
  return formatHtmlResponsTerstruktur(raw);
}

onMounted(async () => {
  if (route.query.category) {
    selectedGroup.value = route.query.category;
  } else {
    try {
      const savedGroup = localStorage.getItem(STORAGE_KEY_GROUP);
      if (savedGroup) {
        selectedGroup.value = savedGroup;
      }
    } catch (e) {}
  }

  try {
    const savedRes = localStorage.getItem(STORAGE_KEY_RESOLUTION);
    if (savedRes === '1' && messages.value.length > 1) {
      showResolutionBar.value = true;
    }
  } catch (e) {}

  scrollToBottom();

  try {
    const res = await getChatStarters();
    if (res && res.success && res.data) {
      if (res.data.by_group) {
        serverByGroup.value = res.data.by_group;
      }
    }
  } catch (e) {
    // Graceful silent fallback ke HSSE_QUICK_REPORTS
  }
});
</script>

<style scoped>
/* Scoped Styling Khusus Starter Chips agar Selaras dan Tidak Kontras / Abu-abu */
.starter-chips-section {
  padding: 0.85rem 1.75rem;
  background: linear-gradient(180deg, #F8FAFC 0%, #F0F7FF 100%);
  border-bottom: 1px solid #E2E8F0;
}

.starter-chips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.starter-chips-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #0369a1;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.starter-chips-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.18rem 0.65rem;
  border-radius: 9999px;
  background: rgba(2, 132, 199, 0.12);
  color: #0284c7;
  border: 1px solid rgba(2, 132, 199, 0.25);
  display: inline-flex;
  align-items: center;
}

.starter-chips-wrapper {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  scrollbar-width: thin;
  flex-wrap: wrap;
}

.starter-chip {
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 9999px;
  padding: 0.42rem 0.92rem;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  color: #0369A1;
  white-space: nowrap;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.06);
}

.starter-chip:hover {
  background: #E0F2FE;
  border-color: #38BDF8;
  color: #0284C7;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.14);
}

.starter-chip:active {
  transform: translateY(0);
  background: #BAE6FD;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.08);
}

.starter-chip:focus-visible {
  outline: 2px solid #0284C7;
  outline-offset: 2px;
}

.starter-chip-icon {
  font-size: 0.95rem;
  line-height: 1;
}

.starter-chip-risk-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.starter-chip-risk-dot.tinggi {
  background: #EF4444;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
}

.starter-chip-risk-dot.sedang {
  background: #F59E0B;
  box-shadow: 0 0 4px rgba(245, 158, 11, 0.4);
}

.starter-chip-risk-dot.rendah {
  background: #10B981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
}

/* Scoped Styling Kartu Respons Terstruktur agar Tampil Rapi Sesuai Standar Pertamina */
:deep(.res-card-block) {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
}

:deep(.res-analysis-summary) {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
  padding: 0.85rem 1rem;
  border: 1px solid #ead8b8;
  border-radius: 10px;
  background: rgba(255, 251, 240, 0.85);
}

:deep(.res-analysis-summary > span) {
  width: 11px;
  height: 11px;
  margin-top: 0.35rem;
  border-radius: 50%;
  background: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.15);
}

:deep(.res-analysis-summary p) {
  margin: 0;
  color: #334155;
  font-size: 0.88rem;
  line-height: 1.6;
  font-weight: 500;
}

:deep(.res-analysis-points) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.4rem;
}

@media (max-width: 640px) {
  :deep(.res-analysis-points) {
    grid-template-columns: 1fr;
  }
}

:deep(.res-analysis-point) {
  min-width: 0;
  padding: 0.85rem 1rem;
  border: 1px solid #eee1cb;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

:deep(.res-analysis-point > span) {
  display: block;
  margin-bottom: 0.35rem;
  color: #92400e;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:deep(.res-analysis-point p) {
  margin: 0;
  color: #334155;
  font-size: 0.84rem;
  line-height: 1.55;
}

:deep(.res-reference-block) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.9rem 1.1rem;
}

:deep(.res-reference-block ol) {
  margin: 0.4rem 0 0 0;
  padding-left: 1.3rem;
  font-size: 0.84rem;
  line-height: 1.65;
  color: #334155;
}
</style>
