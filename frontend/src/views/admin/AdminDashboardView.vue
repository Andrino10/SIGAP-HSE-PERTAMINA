<template>
  <div class="admin-app-container">
    <AdminHeader />

    <main class="admin-view active" id="view-admin-dashboard" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
      <div class="admin-view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <span class="section-kicker">MONITORING OPERASIONAL HSSE</span>
          <h2>Dashboard Monitoring Laporan</h2>
          <p>Pemantauan real-time kondisi bahaya (Unsafe Act &amp; Unsafe Condition), tingkat keparahan, dan progres mitigasi.</p>
        </div>
        <div class="admin-header-actions">
          <button class="btn btn-sm btn-secondary" @click="fetchDashboardData" :disabled="isLoading">
            {{ isLoading ? 'Memuat...' : 'Perbarui Data' }}
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <section class="admin-kpi-grid" aria-label="Statistik Laporan">
        <div class="admin-kpi-card card-total">
          <div class="kpi-icon-wrap kpi-icon-total">📋</div>
          <div class="kpi-content">
            <span class="kpi-label">TOTAL LAPORAN</span>
            <strong class="kpi-value">{{ stats.total }}</strong>
            <span class="kpi-sub">Seluruh laporan tercatat</span>
          </div>
        </div>

        <div class="admin-kpi-card card-open">
          <div class="kpi-icon-wrap kpi-icon-open">⚡</div>
          <div class="kpi-content">
            <span class="kpi-label">LAPORAN BARU</span>
            <strong class="kpi-value">{{ stats.open }}</strong>
            <span class="kpi-sub">Status: Open (Menunggu review)</span>
          </div>
        </div>

        <div class="admin-kpi-card card-progress">
          <div class="kpi-icon-wrap kpi-icon-progress">🔄</div>
          <div class="kpi-content">
            <span class="kpi-label">SEDANG DIPROSES</span>
            <strong class="kpi-value">{{ stats.in_progress }}</strong>
            <span class="kpi-sub">Status: In Progress (Investigasi)</span>
          </div>
        </div>

        <div class="admin-kpi-card card-closed">
          <div class="kpi-icon-wrap kpi-icon-closed">✅</div>
          <div class="kpi-content">
            <span class="kpi-label">SELESAI (RESOLVED)</span>
            <strong class="kpi-value">{{ stats.closed }}</strong>
            <span class="kpi-sub">Status: Closed / Resolved</span>
          </div>
        </div>

        <div class="admin-kpi-card card-critical">
          <div class="kpi-icon-wrap kpi-icon-critical">🚨</div>
          <div class="kpi-content">
            <span class="kpi-label">LAPORAN KRITIS</span>
            <strong class="kpi-value">{{ stats.critical }}</strong>
            <span class="kpi-sub">Risiko Tinggi / Urgent</span>
          </div>
        </div>
      </section>

      <!-- DASHBOARD CHARTS & BREAKDOWNS -->
      <section class="admin-dashboard-grids">
        <!-- Distribution by Category -->
        <div class="admin-panel-card">
          <div class="panel-card-header">
            <h3>Distribusi Kategori Bahaya K3</h3>
            <span class="panel-tag">Knowledge &amp; Laporan</span>
          </div>
          <div class="category-dist-list">
            <div v-if="categoryDistribution.length === 0" class="empty-placeholder">Tidak ada data kategori.</div>
            <div
              v-for="cat in categoryDistribution"
              :key="cat.name"
              class="cat-dist-row"
              style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);"
            >
              <span style="font-weight: 600; font-size: 13.5px;">{{ cat.name }}</span>
              <span class="badge badge-secondary" style="font-size: 12px; font-weight: 700; background: #e2e8f0; padding: 3px 10px; border-radius: 12px;">
                {{ cat.count }} laporan
              </span>
            </div>
          </div>
        </div>

        <!-- Distribution by Finding Type & Risk -->
        <div class="admin-panel-card">
          <div class="panel-card-header">
            <h3>Klasifikasi Temuan &amp; Tingkat Risiko</h3>
            <span class="panel-tag">Analisis Matriks</span>
          </div>
          <div class="matrix-dist-box">
            <div class="matrix-group" style="margin-bottom: 20px;">
              <div class="matrix-group-title" style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">Jenis Temuan Keselamatan</div>
              <div class="matrix-pills" style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="badge" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                  ⚠️ Unsafe Condition: <strong>{{ findingTypes.unsafe_condition || 0 }}</strong>
                </span>
                <span class="badge" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                  🛑 Unsafe Act: <strong>{{ findingTypes.unsafe_act || 0 }}</strong>
                </span>
                <span class="badge" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                  ⚡ Near Miss: <strong>{{ findingTypes.near_miss || 0 }}</strong>
                </span>
              </div>
            </div>

            <div class="matrix-group">
              <div class="matrix-group-title" style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">Tingkat Keparahan / Risiko</div>
              <div class="matrix-pills" style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="urgency-badge urgency-tinggi" style="padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                  Tinggi: {{ riskLevels.tinggi || 0 }}
                </span>
                <span class="urgency-badge urgency-sedang" style="padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                  Sedang: {{ riskLevels.sedang || 0 }}
                </span>
                <span class="urgency-badge urgency-ringan" style="padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                  Rendah: {{ riskLevels.rendah || 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RECENT REPORTS SECTION -->
      <section class="admin-panel-card mt-4" style="margin-top: 24px;">
        <div class="panel-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3>Laporan Terbaru &amp; Perlu Tindak Lanjut</h3>
            <span class="panel-sub" style="font-size: 13px; color: #64748b;">Laporan yang masuk terkini dan membutuhkan atensi tim keselamatan</span>
          </div>
          <router-link to="/admin/reports" class="btn btn-sm btn-primary" style="text-decoration: none;">
            Lihat Semua Laporan →
          </router-link>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>No Tiket</th>
                <th>Tanggal</th>
                <th>Lokasi</th>
                <th>Kategori Bahaya</th>
                <th>Keparahan</th>
                <th>Status</th>
                <th>Petugas</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="8" class="text-center py-4" style="text-align: center; padding: 24px; color: #64748b;">Memuat laporan terbaru...</td>
              </tr>
              <tr v-else-if="recentReports.length === 0">
                <td colspan="8" class="text-center py-4" style="text-align: center; padding: 24px; color: #64748b;">Belum ada laporan tercatat.</td>
              </tr>
              <tr v-for="item in recentReports" :key="item.ticket_number || item.complaint_id">
                <td>
                  <strong style="font-family: monospace; color: #0284c7;">{{ item.ticket_number || item.complaint_id }}</strong>
                </td>
                <td>{{ formatDateShort(item.occurrence_date || item.created_at) }}</td>
                <td>{{ item.location || '-' }}</td>
                <td>{{ item.category || '-' }}</td>
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
                <td>
                  <button class="btn btn-sm btn-secondary" @click="openDetail(item)">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Report Detail & Action Modal -->
    <ReportDetailModal
      :isOpen="isDetailModalOpen"
      :report="activeReport"
      @close="isDetailModalOpen = false"
      @updated="fetchDashboardData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import ReportDetailModal from '../../components/modals/ReportDetailModal.vue';
import { getAdminDashboard } from '../../services/api';

const isLoading = ref(true);
const stats = ref({ total: 0, open: 0, in_progress: 0, closed: 0, critical: 0 });
const categoryDistribution = ref([]);
const findingTypes = ref({});
const riskLevels = ref({});
const recentReports = ref([]);

const isDetailModalOpen = ref(false);
const activeReport = ref(null);

function openDetail(report) {
  activeReport.value = report;
  isDetailModalOpen.value = true;
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

function formatDateShort(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function fetchDashboardData() {
  isLoading.value = true;
  try {
    const res = await getAdminDashboard();
    if (res && res.success && res.data) {
      const d = res.data;
      stats.value = {
        total: d.kpi?.total ?? d.total_laporan ?? 0,
        open: d.kpi?.open ?? d.laporan_open ?? 0,
        in_progress: d.kpi?.in_progress ?? d.laporan_in_progress ?? 0,
        closed: d.kpi?.closed ?? d.laporan_closed ?? 0,
        critical: d.kpi?.critical ?? d.laporan_kritis ?? 0
      };

      if (d.category_distribution) {
        categoryDistribution.value = Object.entries(d.category_distribution).map(([name, count]) => ({
          name,
          count
        }));
      }

      findingTypes.value = d.finding_types || {};
      riskLevels.value = d.risk_levels || {};
      recentReports.value = d.recent_reports || d.laporan_terbaru || [];
    }
  } catch (e) {
    // Keep defaults
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchDashboardData();
});
</script>
