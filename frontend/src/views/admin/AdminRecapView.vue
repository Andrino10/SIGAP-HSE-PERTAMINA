<template>
  <div class="admin-app-container">
    <AdminHeader />

    <main class="admin-view active" id="view-admin-recap" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
      <div class="admin-view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <div>
          <span class="section-kicker">LAPORAN &amp; AUDIT K3</span>
          <h2>Rekapitulasi Laporan HSE</h2>
          <p>Rekap data laporan berdasarkan status, kategori, tingkat keparahan, dan periode tanggal tertentu.</p>
        </div>
        <div class="admin-header-actions no-print">
          <button class="btn btn-primary" @click="printRecap">
            🖨️ Cetak / Ekspor Rekap
          </button>
        </div>
      </div>

      <!-- RECAP PERIOD FILTER BAR -->
      <div class="admin-filter-bar no-print" style="margin-bottom: 24px;">
        <div class="filter-row">
          <div class="filter-col">
            <label for="recap-start-date">Periode Dari</label>
            <input type="date" id="recap-start-date" v-model="filterStartDate" class="form-input" />
          </div>
          <div class="filter-col">
            <label for="recap-end-date">Sampai Tanggal</label>
            <input type="date" id="recap-end-date" v-model="filterEndDate" class="form-input" />
          </div>
          <div class="filter-col">
            <label for="recap-category-filter">Kategori</label>
            <select id="recap-category-filter" v-model="filterCategory" class="form-input">
              <option value="Semua">Semua Kategori</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="filter-col">
            <label for="recap-status-filter">Status</label>
            <select id="recap-status-filter" v-model="filterStatus" class="form-input">
              <option value="Semua">Semua Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed / Resolved">Closed / Resolved</option>
            </select>
          </div>
          <div class="filter-col filter-actions-col" style="display:flex; align-items:flex-end;">
            <button class="btn btn-primary btn-block" @click="loadData">Tampilkan Rekap</button>
          </div>
        </div>
      </div>

      <!-- RECAP PRINTABLE REPORT DOCUMENT -->
      <div class="recap-document" id="recap-document" style="background: white; color: #0f172a; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="recap-doc-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
          <div class="recap-doc-brand" style="display: flex; align-items: center; gap: 16px;">
            <img src="/pertamina-ep-logo-transparent.png" alt="Pertamina EP" class="recap-doc-logo" style="height: 48px;" />
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">PT PERTAMINA EP — ASSET 2 LIRIK FIELD</h3>
              <h4 style="margin: 2px 0 0 0; font-size: 14px; font-weight: 700; color: #1e40af;">LAPORAN REKAPITULASI TEMUAN KESELAMATAN KERJA (HSSE)</h4>
              <span class="recap-doc-period" style="font-size: 12px; color: #64748b;">Periode: {{ periodLabel }}</span>
            </div>
          </div>
          <div class="recap-doc-stamp" style="text-align: right; font-size: 12px; color: #64748b;">
            <strong style="color: #0f172a; display: block;">SISTEM SIGAP HSE</strong>
            <small>Dicetak: {{ printTime }}</small>
          </div>
        </div>

        <!-- RECAP SUMMARY METRICS -->
        <div class="recap-summary-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 28px;">
          <div class="recap-metric-box" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b;">TOTAL LAPORAN</span>
            <strong style="display: block; font-size: 22px; color: #0f172a;">{{ summary.total }}</strong>
          </div>
          <div class="recap-metric-box metric-open" style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 14px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; color: #92400e;">OPEN (BARU)</span>
            <strong style="display: block; font-size: 22px; color: #b45309;">{{ summary.open }}</strong>
          </div>
          <div class="recap-metric-box metric-progress" style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 10px; padding: 14px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; color: #1e40af;">IN PROGRESS</span>
            <strong style="display: block; font-size: 22px; color: #1d4ed8;">{{ summary.in_progress }}</strong>
          </div>
          <div class="recap-metric-box metric-closed" style="background: #dcfce7; border: 1px solid #86efac; border-radius: 10px; padding: 14px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; color: #166534;">CLOSED / RESOLVED</span>
            <strong style="display: block; font-size: 22px; color: #15803d;">{{ summary.closed }}</strong>
          </div>
          <div class="recap-metric-box metric-critical" style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 10px; padding: 14px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; color: #991b1b;">KRITIS / TINGGI</span>
            <strong style="display: block; font-size: 22px; color: #b91c1c;">{{ summary.critical }}</strong>
          </div>
        </div>

        <!-- RECAP BREAKDOWNS -->
        <div class="recap-breakdown-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <div class="recap-breakdown-card" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 13.5px; font-weight: 700;">1. Rekapitulasi Berdasarkan Status Penanganan</h4>
            <table class="recap-mini-table" style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #cbd5e1; text-align: left;">
                  <th style="padding: 6px 0;">Status</th>
                  <th style="text-align: right; padding: 6px 0;">Jumlah</th>
                  <th style="text-align: right; padding: 6px 0;">Persentase</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in statusBreakdown" :key="s.name" style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 0;">{{ s.name }}</td>
                  <td style="text-align: right; padding: 6px 0; font-weight: 600;">{{ s.count }}</td>
                  <td style="text-align: right; padding: 6px 0; color: #64748b;">{{ s.pct }}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="recap-breakdown-card" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 13.5px; font-weight: 700;">2. Rekapitulasi Berdasarkan Tingkat Keparahan</h4>
            <table class="recap-mini-table" style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #cbd5e1; text-align: left;">
                  <th style="padding: 6px 0;">Tingkat Keparahan</th>
                  <th style="text-align: right; padding: 6px 0;">Jumlah</th>
                  <th style="text-align: right; padding: 6px 0;">Persentase</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in riskBreakdown" :key="r.name" style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 0;">{{ r.name }}</td>
                  <td style="text-align: right; padding: 6px 0; font-weight: 600;">{{ r.count }}</td>
                  <td style="text-align: right; padding: 6px 0; color: #64748b;">{{ r.pct }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- RECAP DETAILED LIST TABLE -->
        <div class="recap-details-section" style="margin-top: 24px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700;">3. Rincian Laporan dalam Periode Ini</h4>
          <table class="admin-table recap-table" style="width: 100%; font-size: 12.5px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="width: 40px;">No</th>
                <th>Nomor Tiket</th>
                <th>Tanggal</th>
                <th>Pelapor / Divisi</th>
                <th>Lokasi</th>
                <th>Kategori Bahaya</th>
                <th>Keparahan</th>
                <th>Status</th>
                <th>Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredReports.length === 0">
                <td colspan="9" style="text-align: center; padding: 18px; color: #64748b;">Tidak ada laporan pada periode ini.</td>
              </tr>
              <tr v-for="(item, idx) in filteredReports" :key="item.ticket_number || item.complaint_id">
                <td>{{ idx + 1 }}</td>
                <td><strong style="font-family: monospace;">{{ item.ticket_number || item.complaint_id }}</strong></td>
                <td>{{ formatDate(item.occurrence_date || item.created_at) }}</td>
                <td>{{ item.reporter_name || '-' }} <small style="color:#64748b;">({{ item.division || '-' }})</small></td>
                <td>{{ item.location || '-' }}</td>
                <td>{{ item.category || '-' }}</td>
                <td>{{ item.urgency || '-' }}</td>
                <td>{{ item.status || 'Open' }}</td>
                <td style="font-size: 11.5px; color: #475569;">{{ item.follow_up_notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminHeader from '../../components/admin/AdminHeader.vue';
import { getAdminReports } from '../../services/api';

const filterStartDate = ref('');
const filterEndDate = ref('');
const filterCategory = ref('Semua');
const filterStatus = ref('Semua');

const allReports = ref([]);
const printTime = ref(new Date().toLocaleString('id-ID'));

const categories = computed(() => {
  const set = new Set();
  allReports.value.forEach(r => {
    if (r.category) set.add(r.category);
  });
  return Array.from(set).sort();
});

const periodLabel = computed(() => {
  if (filterStartDate.value && filterEndDate.value) {
    return `${filterStartDate.value} s/d ${filterEndDate.value}`;
  } else if (filterStartDate.value) {
    return `Mulai ${filterStartDate.value}`;
  } else if (filterEndDate.value) {
    return `Sampai ${filterEndDate.value}`;
  }
  return 'Semua Data Terdata';
});

const filteredReports = computed(() => {
  return allReports.value.filter(item => {
    const d = item.occurrence_date || item.created_at || '';
    if (filterStartDate.value && d < filterStartDate.value) return false;
    if (filterEndDate.value && d > filterEndDate.value) return false;
    if (filterCategory.value !== 'Semua' && item.category !== filterCategory.value) return false;
    if (filterStatus.value !== 'Semua' && String(item.status || '').toLowerCase() !== filterStatus.value.toLowerCase()) return false;
    return true;
  });
});

const summary = computed(() => {
  const list = filteredReports.value;
  const total = list.length;
  let open = 0, in_progress = 0, closed = 0, critical = 0;

  list.forEach(r => {
    const s = String(r.status || '').toLowerCase();
    const u = String(r.urgency || '').toLowerCase();
    if (s.includes('closed') || s.includes('resolved') || s.includes('selesai')) closed++;
    else if (s.includes('progress') || s.includes('diproses')) in_progress++;
    else open++;

    if (u.includes('tinggi') || u.includes('berat')) critical++;
  });

  return { total, open, in_progress, closed, critical };
});

const statusBreakdown = computed(() => {
  const total = summary.value.total || 1;
  return [
    { name: 'Open', count: summary.value.open, pct: Math.round((summary.value.open / total) * 100) },
    { name: 'In Progress', count: summary.value.in_progress, pct: Math.round((summary.value.in_progress / total) * 100) },
    { name: 'Closed / Resolved', count: summary.value.closed, pct: Math.round((summary.value.closed / total) * 100) }
  ];
});

const riskBreakdown = computed(() => {
  const total = summary.value.total || 1;
  const counts = { Tinggi: 0, Sedang: 0, Ringan: 0 };
  filteredReports.value.forEach(r => {
    const u = String(r.urgency || 'Sedang').toLowerCase();
    if (u.includes('tinggi') || u.includes('berat')) counts.Tinggi++;
    else if (u.includes('sedang')) counts.Sedang++;
    else counts.Ringan++;
  });

  return [
    { name: 'Tinggi (High Risk)', count: counts.Tinggi, pct: Math.round((counts.Tinggi / total) * 100) },
    { name: 'Sedang (Medium Risk)', count: counts.Sedang, pct: Math.round((counts.Sedang / total) * 100) },
    { name: 'Rendah (Low Risk)', count: counts.Ringan, pct: Math.round((counts.Ringan / total) * 100) }
  ];
});

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function printRecap() {
  printTime.value = new Date().toLocaleString('id-ID');
  window.print();
}

async function loadData() {
  try {
    const res = await getAdminReports();
    if (res && res.success && res.data) {
      allReports.value = res.data.reports || res.data.complaints || res.data || [];
    }
  } catch (e) {}
}

onMounted(() => {
  loadData();
});
</script>
