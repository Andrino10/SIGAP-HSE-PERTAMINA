<template>
  <div class="admin-app-container">
    <AdminHeader />

    <main class="admin-view active" id="view-admin-reports" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
      <div class="admin-view-header" style="margin-bottom: 24px;">
        <div>
          <span class="section-kicker">DATABASE &amp; WORKFLOW</span>
          <h2>Daftar Seluruh Laporan HSE</h2>
          <p>Cari, filter, buka detail, perbarui status penanganan, dan catat riwayat mitigasi lapangan.</p>
        </div>
      </div>

      <!-- FILTER CONTROLS BAR -->
      <div class="admin-filter-bar">
        <div class="filter-row">
          <div class="filter-col flex-2">
            <label for="filter-search">Pencarian Cepat</label>
            <input
              type="text"
              id="filter-search"
              v-model="filters.search"
              class="form-input"
              placeholder="Cari nomor tiket, pelapor, lokasi, atau kata kunci..."
            />
          </div>

          <div class="filter-col">
            <label for="filter-status">Status Laporan</label>
            <select id="filter-status" v-model="filters.status" class="form-input">
              <option value="Semua">Semua Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed / Resolved">Closed / Resolved</option>
            </select>
          </div>

          <div class="filter-col">
            <label for="filter-category">Kategori Bahaya</label>
            <select id="filter-category" v-model="filters.category" class="form-input">
              <option value="Semua">Semua Kategori</option>
              <option v-for="cat in uniqueCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="filter-col">
            <label for="filter-urgency">Tingkat Keparahan</label>
            <select id="filter-urgency" v-model="filters.urgency" class="form-input">
              <option value="Semua">Semua Tingkat</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Ringan">Ringan</option>
            </select>
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-col">
            <label for="filter-assigned-to">PIC / Assignee</label>
            <select id="filter-assigned-to" v-model="filters.assigned_to" class="form-input">
              <option value="Semua">Semua Officer</option>
              <option value="M. Solihin">M. Solihin (Superintendent)</option>
              <option value="Juni Trihardiyanto">Juni Trihardiyanto (Safety Lead)</option>
              <option value="Dr. Irsyad Yoga">Dr. Irsyad Yoga (Medical)</option>
              <option value="Jayadi">Jayadi (Security)</option>
              <option value="Ronny Pribadi">Ronny Pribadi (Environmental)</option>
              <option value="Andre & Della">Andre &amp; Della (Finance/Admin)</option>
            </select>
          </div>

          <div class="filter-col filter-actions-col" style="display:flex; align-items:flex-end;">
            <button class="btn btn-secondary btn-block" @click="resetFilters">Reset Filter</button>
          </div>
        </div>
      </div>

      <!-- DATA TABLE -->
      <div class="admin-panel-card" style="margin-top: 20px;">
        <div class="table-meta-bar" style="margin-bottom: 12px; font-size: 13px; color: #64748b;">
          <span>Menampilkan {{ paginatedReports.length }} dari {{ filteredReports.length }} laporan yang cocok</span>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>Nomor Tiket</th>
                <th>Tanggal</th>
                <th>Kategori Bahaya</th>
                <th>Lokasi</th>
                <th>Pelapor</th>
                <th>Keparahan</th>
                <th>Status</th>
                <th>Petugas</th>
                <th style="text-align: center;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="10" class="text-center py-4" style="text-align: center; padding: 24px; color: #64748b;">Memuat data laporan...</td>
              </tr>
              <tr v-else-if="paginatedReports.length === 0">
                <td colspan="10" class="text-center py-4" style="text-align: center; padding: 24px; color: #64748b;">Tidak ada laporan yang sesuai dengan filter.</td>
              </tr>
              <tr v-for="(item, idx) in paginatedReports" :key="item.ticket_number || item.complaint_id">
                <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td>
                  <strong style="font-family: monospace; color: #0284c7;">
                    {{ item.ticket_number || item.complaint_id }}
                  </strong>
                </td>
                <td>{{ formatDate(item.occurrence_date || item.created_at) }}</td>
                <td>{{ item.category || '-' }}</td>
                <td>{{ item.location || '-' }}</td>
                <td>
                  {{ item.reporter_name || '-' }}
                  <small v-if="item.division" style="color:#64748b; display:block;">({{ item.division }})</small>
                </td>
                <td>
                  <span :class="['urgency-badge', getUrgencyClass(item.urgency)]">
                    {{ item.urgency || 'Sedang' }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', getStatusClass(item.status)]">
                    {{ item.status || 'Open' }}
                  </span>
                </td>
                <td>{{ item.assigned_to || item.assigned_engineer || 'Belum Ditugaskan' }}</td>
                <td style="text-align: center;">
                  <button class="btn btn-sm btn-primary" @click="openDetail(item)">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION BAR -->
        <div class="pagination-bar" style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
          <button
            class="btn btn-sm btn-secondary"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            ← Sebelumnya
          </button>
          <span class="pagination-info" style="font-size:13px; color:#64748b;">
            Halaman {{ currentPage }} dari {{ totalPages || 1 }}
          </span>
          <button
            class="btn btn-sm btn-secondary"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Berikutnya →
          </button>
        </div>
      </div>
    </main>

    <!-- Detail / Update Modal -->
    <ReportDetailModal
      :isOpen="isDetailModalOpen"
      :report="activeReport"
      @close="isDetailModalOpen = false"
      @updated="fetchReports"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import ReportDetailModal from '../../components/modals/ReportDetailModal.vue';
import { getAdminReports } from '../../services/api';

const isLoading = ref(true);
const allReports = ref([]);
const currentPage = ref(1);
const pageSize = 15;

const isDetailModalOpen = ref(false);
const activeReport = ref(null);

const filters = ref({
  search: '',
  status: 'Semua',
  category: 'Semua',
  urgency: 'Semua',
  assigned_to: 'Semua'
});

const uniqueCategories = computed(() => {
  const set = new Set();
  allReports.value.forEach(r => {
    if (r.category) set.add(r.category);
  });
  return Array.from(set).sort();
});

const filteredReports = computed(() => {
  const q = filters.value.search.toLowerCase().trim();
  const st = filters.value.status;
  const cat = filters.value.category;
  const urg = filters.value.urgency;
  const pic = filters.value.assigned_to;

  return allReports.value.filter(item => {
    if (st !== 'Semua' && String(item.status || '').toLowerCase() !== st.toLowerCase()) return false;
    if (cat !== 'Semua' && item.category !== cat) return false;
    if (urg !== 'Semua' && String(item.urgency || '').toLowerCase() !== urg.toLowerCase()) return false;
    if (pic !== 'Semua' && !String(item.assigned_to || item.assigned_engineer || '').includes(pic)) return false;

    if (!q) return true;

    const ticketNo = (item.ticket_number || item.complaint_id || '').toLowerCase();
    const desc = (item.description || item.complaint_description || '').toLowerCase();
    const reporter = (item.reporter_name || '').toLowerCase();
    const location = (item.location || '').toLowerCase();

    return ticketNo.includes(q) || desc.includes(q) || reporter.includes(q) || location.includes(q);
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredReports.value.length / pageSize) || 1;
});

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredReports.value.slice(start, start + pageSize);
});

function openDetail(report) {
  activeReport.value = report;
  isDetailModalOpen.value = true;
}

function resetFilters() {
  filters.value = {
    search: '',
    status: 'Semua',
    category: 'Semua',
    urgency: 'Semua',
    assigned_to: 'Semua'
  };
  currentPage.value = 1;
}

function getStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('closed') || s.includes('resolved') || s.includes('selesai')) return 'status-closed';
  if (s.includes('progress') || s.includes('diproses')) return 'status-in-progress';
  return 'status-open';
}

function getUrgencyClass(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u.includes('tinggi') || u.includes('berat')) return 'urgency-tinggi';
  if (u.includes('sedang')) return 'urgency-sedang';
  return 'urgency-ringan';
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function fetchReports() {
  isLoading.value = true;
  try {
    const res = await getAdminReports();
    if (res && res.success && res.data) {
      allReports.value = res.data.reports || res.data.complaints || res.data || [];
    }
  } catch (e) {
    // Keep empty
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchReports();
});
</script>
