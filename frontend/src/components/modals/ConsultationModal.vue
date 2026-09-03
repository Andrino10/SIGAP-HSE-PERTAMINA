<template>
  <div v-if="isConsultationOpen" class="modal-overlay active" id="consultation-modal" @click.self="closeConsultationModal">
    <div class="modal-card">
      <button class="modal-close-btn" type="button" @click="closeConsultationModal" aria-label="Tutup modal"></button>
      <h3>Formulir Laporan Kondisi Bahaya</h3>
      <p class="modal-sub">
        Lengkapi detail kondisi bahaya untuk membantu sistem dan Tim HSSE mengidentifikasi risiko dan menentukan tindakan.
      </p>

      <form id="consultation-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="cons-name">Nama Pelapor <span class="field-required">*</span></label>
          <input
            type="text"
            id="cons-name"
            v-model="form.name"
            class="form-input"
            placeholder="Masukkan nama lengkap pelapor"
            autocomplete="name"
            minlength="2"
            maxlength="150"
            required
          />
        </div>

        <div class="form-group">
          <label for="cons-division">Fungsi / Divisi <span class="field-required">*</span></label>
          <select id="cons-division" v-model="form.division" class="form-input" required>
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

        <div class="form-group">
          <label for="cons-location">Lokasi Temuan Bahaya <span class="field-required">*</span></label>
          <select id="cons-location" v-model="form.location" class="form-input" required>
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
          <label for="cons-occurrence-date">Tanggal Kejadian <span class="field-required">*</span></label>
          <input type="date" id="cons-occurrence-date" v-model="form.occurrenceDate" class="form-input" required />
        </div>

        <div class="form-group">
          <label for="cons-category">Kategori Utama <span class="field-required">*</span></label>
          <select id="cons-category" v-model="form.category" class="form-input" required>
            <option value="">-- Pilih kategori utama --</option>
            <option v-for="cat in categoryOptions" :key="cat.id || cat.nama" :value="cat.nama || cat.name || cat.id">
              {{ cat.nama || cat.name || cat.label || cat }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="cons-urgency">Tingkat Urgensi <span class="field-required">*</span></label>
          <select id="cons-urgency" v-model="form.urgency" class="form-input" required>
            <option value="Ringan">Ringan (Potensi bahaya kecil)</option>
            <option value="Sedang">Sedang (Perlu tindakan korektif)</option>
            <option value="Berat">Berat (Bahaya serius / hentikan pekerjaan)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="cons-description">Deskripsi Kondisi Bahaya <span class="field-required">*</span></label>
          <textarea
            id="cons-description"
            v-model="form.description"
            class="form-input"
            rows="3"
            placeholder="Jelaskan kondisi bahaya yang ditemukan di area kerja..."
            required
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeConsultationModal">Batal</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-consultation" :disabled="isSubmitting">
            {{ isSubmitting ? 'Memproses Laporan...' : 'Lanjutkan analisis' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useModal } from '../../composables/useModal';
import { useToast } from '../../composables/useToast';
import { useHealthCheck } from '../../composables/useHealthCheck';
import { createConsultation } from '../../services/api';

const { isConsultationOpen, closeConsultationModal, openChoiceModal } = useModal();
const { showToast } = useToast();
const { categories } = useHealthCheck();

const isSubmitting = ref(false);

const today = new Date().toISOString().split('T')[0];

const form = ref({
  name: '',
  division: '',
  location: '',
  occurrenceDate: today,
  category: '',
  urgency: 'Sedang',
  description: ''
});

const defaultCategories = [
  { nama: 'Pekerjaan Berisiko' },
  { nama: 'Peralatan & Kendaraan' },
  { nama: 'Kesehatan & Lingkungan' },
  { nama: 'Aturan & Pengawasan' },
  { nama: 'Perilaku & Pelatihan' },
  { nama: 'Insiden & Darurat' }
];

const categoryOptions = computed(() => {
  return (categories.value && categories.value.length > 0) ? categories.value : defaultCategories;
});

watch(isConsultationOpen, (isOpen) => {
  if (isOpen) {
    form.value.occurrenceDate = new Date().toISOString().split('T')[0];
  }
});

async function handleSubmit() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const payload = {
      nama: form.value.name,
      divisi: form.value.division,
      lokasi: form.value.location,
      tanggal_kejadian: form.value.occurrenceDate,
      kategori: form.value.category,
      urgensi: form.value.urgency,
      deskripsi: form.value.description
    };

    const res = await createConsultation(payload);

    if (res && res.success) {
      showToast('Laporan berhasil dikirim ke sistem SIGAP!', 'success');
      closeConsultationModal();

      // Open choice modal
      openChoiceModal({
        ticketNumber: res.data?.complaint?.complaint_id || res.data?.ticket_number || res.data?.complaint_id || 'HSE-TERBIT',
        status: res.data?.complaint?.status || 'Open',
        consultationData: res.data
      });

      // Reset form
      form.value = {
        name: '',
        division: '',
        location: '',
        occurrenceDate: new Date().toISOString().split('T')[0],
        category: '',
        urgency: 'Sedang',
        description: ''
      };
    } else {
      throw new Error(res?.message || 'Gagal menyimpan laporan.');
    }
  } catch (err) {
    showToast(err.message || 'Terjadi kesalahan saat mengirim formulir.', 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>
