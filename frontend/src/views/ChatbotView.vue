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
      <p class="guided-cat-help">Pilih yang paling sesuai. Jika ragu, langsung tulis laporan.</p>

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

      <!-- Starter Chips -->
      <div class="starter-chips-section" id="starter-bar" v-if="starterChips.length > 0">
        <div class="starter-chips-label">Contoh laporan bahaya cepat</div>
        <div class="starter-chips-wrapper">
          <button
            v-for="(chip, i) in starterChips"
            :key="i"
            class="starter-chip"
            type="button"
            @click="useStarter(chip)"
          >
            {{ chip.title || chip.judul || chip.text || chip }}
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
          <div class="bubble-text" style="white-space: pre-wrap;" v-html="formatMessage(msg.text)"></div>

          <!-- Structured Escalation Card if available -->
          <div v-if="msg.escalation" class="escalation-prompt-block" style="margin-top: 14px; background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.3); border-radius: 10px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 4px;">
              ⚠️ Rekomendasi Tindak Lanjut Resmi
            </div>
            <div style="font-size: 13px; margin-bottom: 12px; color: #1e293b; font-weight: 500;">
              Kondisi ini memerlukan verifikasi lapangan atau penerbitan izin kerja. Lanjutkan laporan sebagai tiket resmi atau kontak tim langsung:
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-sm btn-primary" type="button" @click="handleCreateTicketFromChat(msg.escalation)">
                🎫 Buat Tiket Laporan
              </button>
              <button class="btn btn-sm btn-success" type="button" @click="openWhatsAppModal({ description: msg.escalation.message })" style="background:#16a34a; border-color:#16a34a; color:white;">
                💬 Hubungi via WhatsApp
              </button>
            </div>
          </div>
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useModal } from '../composables/useModal';
import { useToast } from '../composables/useToast';
import { getChatStarters, sendChatMessage, resolveChatMessage, resetChatSession, createComplaint } from '../services/api';

const route = useRoute();
const { openConsultationModal, openWhatsAppModal } = useModal();
const { showToast } = useToast();

const sessionId = ref(getOrCreateSessionId());
const messages = ref([
  {
    sender: 'system',
    text: 'Selamat datang di Sistem Pendamping Keselamatan Kerja! Langsung tuliskan kondisi bahaya yang Anda temui di area kerja. Sistem akan menganalisis risiko dan merekomendasikan solusi K3 secara otomatis.'
  }
]);

const inputText = ref('');
const isTyping = ref(false);
const showResolutionBar = ref(false);
const starterChips = ref([]);
const selectedGroup = ref(null);
const chatStreamRef = ref(null);

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

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isTyping.value) return;

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
      throw new Error(res?.message || 'Gagal menerima respons AI.');
    }
  } catch (err) {
    messages.value.push({
      sender: 'system',
      text: 'Maaf, terjadi kendala saat menghubungkan ke Asisten HSSE: ' + (err.message || 'Silakan coba lagi.')
    });
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
      showToast('Terima kasih atas konfirmasinya. Tetap utamakan keselamatan kerja!', 'success');
      messages.value.push({
        sender: 'system',
        text: '✅ Isu telah ditandai selesai. Terima kasih telah menerapkan prinsip K3 Pertamina Golden Rules!'
      });
    } catch (e) {}
  } else {
    openWhatsAppModal();
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
  showToast('Sesi percakapan direset.', 'info');
  scrollToBottom();
}

function formatMessage(raw) {
  if (!raw) return '';
  // Simple markdown highlight formatting without external dependency
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 5px; border-radius:4px; font-family:monospace;">$1</code>');
}

onMounted(async () => {
  if (route.query.category) {
    selectedGroup.value = route.query.category;
  }

  try {
    const res = await getChatStarters();
    if (res && res.success && res.data) {
      const items = res.data.starters || res.data.pertanyaan || res.data;
      starterChips.value = Array.isArray(items) ? items : [
        { title: 'Bekerja di Ketinggian', text: 'Pekerja di scaffolding tanpa safety harness' },
        { title: 'Tumpahan Kimia B3', text: 'Terdapat tumpahan oli dan bahan kimia di dekat tangki' },
        { title: 'Kabel Listrik Terkelupas', text: 'Kabel daya pada panel pompa terkelupas dan basah' },
        { title: 'APAR Kedaluwarsa', text: 'Tabung APAR di pos security jarum tekanannya di zona merah' }
      ];
    }
  } catch (e) {
    starterChips.value = [
      { title: 'Bekerja di Ketinggian', text: 'Pekerja di scaffolding tanpa safety harness' },
      { title: 'Tumpahan Kimia B3', text: 'Terdapat tumpahan oli dan bahan kimia di dekat tangki' },
      { title: 'Kabel Listrik Terkelupas', text: 'Kabel daya pada panel pompa terkelupas dan basah' },
      { title: 'APAR Kedaluwarsa', text: 'Tabung APAR di pos security jarum tekanannya di zona merah' }
    ];
  }
});
</script>
