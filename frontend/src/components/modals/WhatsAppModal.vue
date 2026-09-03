<template>
  <div v-if="isWhatsAppOpen" class="modal-overlay active" id="whatsapp-modal" @click.self="closeWhatsAppModal">
    <div class="modal-card">
      <button class="modal-close-btn" type="button" @click="closeWhatsAppModal" aria-label="Tutup modal"></button>
      <div class="modal-header-centered">
        <h3>Hubungi Tim HSSE via WhatsApp</h3>
        <p class="modal-sub">Semua kolom wajib dilengkapi. Pesan WhatsApp baru dapat dikirim setelah seluruh data valid.</p>
      </div>

      <!-- Recommended HSSE Officer Card -->
      <div class="tech-assigned-card" id="tech-assigned-card" style="margin-bottom: 16px;">
        <div class="tech-avatar">👷</div>
        <div class="tech-details">
          <h4 id="tech-assigned-name">{{ selectedOfficer.nama }}</h4>
          <span class="tech-role-badge" id="tech-assigned-role">{{ selectedOfficer.jabatan }}</span>
        </div>
      </div>

      <!-- HSSE Officer Selector Dropdown -->
      <div class="form-group">
        <label for="wa-tech-select">HSSE Officer tujuan <span class="field-required">*</span></label>
        <select id="wa-tech-select" v-model="selectedOfficerName" class="form-input" required>
          <option v-for="officer in officerList" :key="officer.nama" :value="officer.nama">
            {{ officer.nama }} ({{ officer.jabatan || officer.role || 'HSSE Officer' }})
          </option>
        </select>
      </div>

      <!-- Reporter Form inside WhatsApp Modal -->
      <div class="wa-report-form">
        <div class="wa-form-title">Detail laporan kondisi bahaya</div>

        <div class="wa-form-grid">
          <div class="form-group">
            <label for="wa-input-name">Nama pelapor <span class="field-required">*</span></label>
            <input
              type="text"
              id="wa-input-name"
              v-model="form.name"
              class="form-input"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div class="form-group">
            <label for="wa-input-division">Fungsi / Divisi <span class="field-required">*</span></label>
            <select id="wa-input-division" v-model="form.division" class="form-input" required>
              <option value="">— Pilih fungsi Anda —</option>
              <option value="FM (Field Manager)">FM (Field Manager)</option>
              <option value="HC">HC</option>
              <option value="Plan Eval">Plan Eval</option>
              <option value="PE">PE</option>
              <option value="WO/WS">WO/WS</option>
              <option value="Finance">Finance</option>
              <option value="RAM">RAM</option>
              <option value="Legal & Relation">Legal &amp; Relation</option>
              <option value="PO (Production Operation)">PO (Production Operation)</option>
              <option value="SCM">SCM</option>
              <option value="HSSE">HSSE</option>
              <option value="IT">IT</option>
              <option value="Security">Security</option>
              <option value="Transport">Transport</option>
              <option value="Fire">Fire</option>
              <option value="Bengkel / Mekanik">Bengkel / Mekanik</option>
              <option value="Kontraktor / Vendor">Kontraktor / Vendor</option>
            </select>
          </div>
        </div>

        <div class="wa-form-grid">
          <div class="form-group">
            <label for="wa-input-location">Lokasi temuan <span class="field-required">*</span></label>
            <select id="wa-input-location" v-model="form.location" class="form-input" required>
              <option value="">— Pilih lokasi Anda —</option>
              <optgroup label="Buatan">
                <option value="Kantor Besar Buatan">Kantor Besar Buatan</option>
                <option value="Operator Buatan">Operator Buatan</option>
              </optgroup>
              <optgroup label="Ukui">
                <option value="Pumper UKUI">Pumper UKUI</option>
                <option value="P3 Operator UKUI">P3 Operator UKUI</option>
                <option value="SP 5, 6, 7 UKUI">SP 5, 6, 7 UKUI</option>
                <option value="Klinik UKUI">Klinik UKUI</option>
              </optgroup>
              <optgroup label="Lirik">
                <option value="HSSE Demo Room Lirik">HSSE Demo Room Lirik</option>
                <option value="Produksi Lirik">Produksi Lirik</option>
                <option value="WS Lirik">WS Lirik</option>
                <option value="PE Lirik">PE Lirik</option>
                <option value="Finance Lirik">Finance Lirik</option>
                <option value="HC Lirik">HC Lirik</option>
                <option value="RAM Lirik">RAM Lirik</option>
                <option value="PO Lirik">PO Lirik</option>
                <option value="LR Lirik">LR Lirik</option>
                <option value="FM Lirik">FM Lirik</option>
                <option value="IT Lirik">IT Lirik</option>
                <option value="Fire Lirik">Fire Lirik</option>
                <option value="Transport Lirik">Transport Lirik</option>
                <option value="SCM Lirik">SCM Lirik</option>
                <option value="Bengkel TOPSIP Lirik">Bengkel TOPSIP Lirik</option>
                <option value="Bengkel Mekanik Lirik">Bengkel Mekanik Lirik</option>
                <option value="Bengkel Instrumen Umum dan Las Lirik">Bengkel Instrumen Umum dan Las Lirik</option>
                <option value="Bengkel Listrik Lirik">Bengkel Listrik Lirik</option>
                <option value="Security Kantor Besar Lirik">Security Kantor Besar Lirik</option>
                <option value="Pos Camp 1 Lirik">Pos Camp 1 Lirik</option>
                <option value="Security Industrial Lirik">Security Industrial Lirik</option>
                <option value="Security Japura Lirik">Security Japura Lirik</option>
                <option value="SP 2, 3, 4 Lirik">SP 2, 3, 4 Lirik</option>
                <option value="SP 1 Lirik">SP 1 Lirik</option>
                <option value="Klinik Lirik">Klinik Lirik</option>
                <option value="Mess Lirik">Mess Lirik</option>
              </optgroup>
            </select>
          </div>

          <div class="form-group">
            <label for="wa-input-occurrence-date">Tanggal kejadian <span class="field-required">*</span></label>
            <input type="date" id="wa-input-occurrence-date" v-model="form.occurrenceDate" class="form-input" required />
          </div>
        </div>

        <div class="wa-form-grid">
          <div class="form-group">
            <label for="wa-input-category">Kategori utama <span class="field-required">*</span></label>
            <select id="wa-input-category" v-model="form.category" class="form-input" required>
              <option value="">-- Pilih kategori utama --</option>
              <option value="Pekerjaan Berisiko">Pekerjaan Berisiko</option>
              <option value="Peralatan & Kendaraan">Peralatan &amp; Kendaraan</option>
              <option value="Kesehatan & Lingkungan">Kesehatan &amp; Lingkungan</option>
              <option value="Aturan & Pengawasan">Aturan &amp; Pengawasan</option>
              <option value="Perilaku & Pelatihan">Perilaku &amp; Pelatihan</option>
              <option value="Insiden & Darurat">Insiden &amp; Darurat</option>
            </select>
          </div>

          <div class="form-group">
            <label for="wa-input-urgency">Tingkat urgensi <span class="field-required">*</span></label>
            <select id="wa-input-urgency" v-model="form.urgency" class="form-input urgency-select" required>
              <option value="Ringan">Ringan (Potensi kecil)</option>
              <option value="Sedang">Sedang (Perlu tindakan)</option>
              <option value="Berat">Berat (Hentikan pekerjaan)</option>
            </select>
          </div>
        </div>

        <div class="form-group wa-description-field">
          <label for="wa-input-description">Deskripsi kondisi bahaya <span class="field-required">*</span></label>
          <textarea
            id="wa-input-description"
            v-model="form.description"
            class="form-input"
            rows="3"
            placeholder="Jelaskan kondisi bahaya yang ditemukan (minimal 10 karakter)"
            minlength="10"
            maxlength="3000"
            required
          ></textarea>
        </div>
      </div>

      <div class="wa-form-status" id="wa-form-status" role="status">
        <span v-if="!isValid" style="color: #f59e0b;">Lengkapi seluruh kolom wajib untuk mengaktifkan pengiriman WhatsApp.</span>
        <span v-else style="color: #10b981;">✓ Data lengkap! Siap dikirimkan via WhatsApp.</span>
      </div>

      <!-- Pre-filled Message Preview -->
      <div class="wa-preview-label" style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">
        Pratinjau pesan WhatsApp
      </div>
      <div class="wa-preview-box" style="white-space: pre-wrap; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); max-height: 140px; overflow-y: auto; margin-bottom: 16px;">{{ previewMessage }}</div>

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="closeWhatsAppModal">Batal</button>
        <button
          type="button"
          class="btn btn-success"
          id="wa-action-link"
          :disabled="!isValid"
          @click="sendWhatsApp"
          style="background: #16a34a; border-color: #16a34a; color: white;"
        >
          Kirim WhatsApp ke Tim HSSE
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useModal } from '../../composables/useModal';
import { useHealthCheck } from '../../composables/useHealthCheck';

const { isWhatsAppOpen, closeWhatsAppModal, whatsappPrefill } = useModal();
const { technicians } = useHealthCheck();

const defaultOfficers = [
  { nama: 'M. Solihin', jabatan: 'Superintendent HSSE Lirik Field', nomor: '6281234567890' },
  { nama: 'Bambang Irawan', jabatan: 'Sr. HSSE Officer Operasional', nomor: '6281234567891' },
  { nama: 'Dedi Kurniawan', jabatan: 'HSSE Officer Rig & Wellsite', nomor: '6281234567892' },
  { nama: 'Hendra Saputra', jabatan: 'HSSE Inspector Fasilitas Produksi', nomor: '6281234567893' },
  { nama: 'Rian Pratama', jabatan: 'HSSE Field Emergency Responder', nomor: '6281234567894' },
  { nama: 'Agus Setiawan', jabatan: 'Environmental & Waste Compliance', nomor: '6281234567895' }
];

const officerList = computed(() => {
  return (technicians.value && technicians.value.length > 0) ? technicians.value : defaultOfficers;
});

const selectedOfficerName = ref(defaultOfficers[0].nama);

const selectedOfficer = computed(() => {
  return officerList.value.find(o => o.nama === selectedOfficerName.value) || officerList.value[0];
});

const form = ref({
  name: '',
  division: '',
  location: '',
  occurrenceDate: new Date().toISOString().split('T')[0],
  category: 'Pekerjaan Berisiko',
  urgency: 'Sedang',
  description: ''
});

watch(isWhatsAppOpen, (isOpen) => {
  if (isOpen) {
    if (whatsappPrefill.value) {
      const p = whatsappPrefill.value;
      if (p.name) form.value.name = p.name;
      if (p.division) form.value.division = p.division;
      if (p.location) form.value.location = p.location;
      if (p.description) form.value.description = p.description;
    }
  }
});

const isValid = computed(() => {
  return form.value.name.trim().length >= 2 &&
    form.value.division &&
    form.value.location &&
    form.value.occurrenceDate &&
    form.value.category &&
    form.value.urgency &&
    form.value.description.trim().length >= 10;
});

const previewMessage = computed(() => {
  return `*LAPORAN TEMUAN BAHAYA KESELAMATAN KERJA (HSSE)*
Sistem: SIGAP-HSE Pertamina EP Lirik Field

*1. Data Pelapor*
- Nama: ${form.value.name || '-'}
- Fungsi/Divisi: ${form.value.division || '-'}

*2. Detail Temuan*
- Tanggal: ${form.value.occurrenceDate || '-'}
- Lokasi: ${form.value.location || '-'}
- Kategori: ${form.value.category || '-'}
- Tingkat Urgensi: ${form.value.urgency || '-'}

*3. Uraian Bahaya*
${form.value.description || '-'}

Mohon arahan dan tindak lanjut dari Tim HSSE Lapangan. Terima kasih.`;
});

function sendWhatsApp() {
  if (!isValid.value) return;
  const phone = selectedOfficer.value.nomor || '6281234567890';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(previewMessage.value)}`;
  window.open(url, '_blank');
  closeWhatsAppModal();
}
</script>
