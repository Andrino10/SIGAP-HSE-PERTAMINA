/**
 * SIGAP HSE — Admin Portal Script
 * Single Page Application Logic for HSSE Monitoring, Report Management, & Recap
 */

'use strict';

const API_BASE = window.location.origin ? `${window.location.origin}/api` : '/api';
const TOKEN_STORAGE_KEY = 'sigap_hse_admin_token';
const USER_STORAGE_KEY = 'sigap_hse_admin_user';

let currentAdminUser = null;
let currentReportsPage = 1;
let currentReportsLimit = 15;
let activeTicketInModal = null;
let searchDebounceTimer = null;
let cachedCategories = [];

// ==========================================================================
// 1. Toast Notifications & Helpers
// ==========================================================================
function showAdminToast(message, type = 'info') {
  const container = document.getElementById('admin-toast-region');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.animation = 'adminFadeIn 0.3s ease-out';
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatIndonesianDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dt);
  } catch (e) {
    return dateStr;
  }
}

function formatDateTimeIndonesian(isoStr) {
  if (!isoStr) return '-';
  try {
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return isoStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dt);
  } catch (e) {
    return isoStr;
  }
}

function getStatusBadgeHtml(status) {
  const s = String(status || 'Open').toLowerCase();
  if (s.includes('closed') || s.includes('resolved') || s.includes('selesai')) {
    return `<span class="status-badge status-closed">Closed / Resolved</span>`;
  } else if (s.includes('progress') || s.includes('diproses')) {
    return `<span class="status-badge status-in-progress">In Progress</span>`;
  } else {
    return `<span class="status-badge status-open">Open</span>`;
  }
}

function getUrgencyBadgeHtml(urgency, riskLevel) {
  const val = String(urgency || riskLevel || 'Sedang');
  const lower = val.toLowerCase();
  let cls = 'urgency-sedang';
  if (lower.includes('tinggi') || lower.includes('berat') || lower.includes('high')) {
    cls = 'urgency-tinggi';
  } else if (lower.includes('ringan') || lower.includes('low')) {
    cls = 'urgency-ringan';
  }
  return `<span class="urgency-badge ${cls}">${escapeHtml(val)}</span>`;
}

// ==========================================================================
// 2. Authentication & Session Handling
// ==========================================================================
function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function setStoredSession(token, user) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  currentAdminUser = user;
}

function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  currentAdminUser = null;
}

async function authenticatedFetch(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearStoredSession();
    showLoginView();
    showAdminToast('Sesi telah kedaluwarsa. Silakan login kembali.', 'warning');
    throw new Error('Unauthorized');
  }
  return response;
}

async function handleAdminLogin() {
  const usernameInput = document.getElementById('admin-user-input');
  const passwordInput = document.getElementById('admin-pass-input');
  const submitBtn = document.getElementById('btn-admin-login');

  const username = (usernameInput?.value || '').trim();
  const password = passwordInput?.value || '';

  if (!username || !password) {
    showAdminToast('Username dan password wajib diisi.', 'error');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memverifikasi...';
  }

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login gagal. Periksa username dan password.');
    }

    const session = data.data?.session;
    setStoredSession(session.token, session);
    showAdminToast('Login berhasil. Selamat datang di Portal Admin SIGAP HSE.', 'success');
    
    // Switch to Authenticated App
    showAppView('dashboard');
  } catch (err) {
    showAdminToast(err.message || 'Terjadi kesalahan saat login.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk ke Portal Admin';
    }
  }
}

async function handleAdminLogout() {
  const token = getStoredToken();
  try {
    if (token) {
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (e) {}
  
  clearStoredSession();
  showLoginView();
  showAdminToast('Anda telah keluar dari Portal Admin.', 'info');
}

async function checkCurrentSession() {
  const token = getStoredToken();
  if (!token) {
    showLoginView();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      currentAdminUser = data.data.user;
      const initialView = getInitialViewFromPath();
      showAppView(initialView);
      return true;
    } else {
      clearStoredSession();
      showLoginView();
      return false;
    }
  } catch (err) {
    clearStoredSession();
    showLoginView();
    return false;
  }
}

function getInitialViewFromPath() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('reports')) return 'reports';
  if (path.includes('recap')) return 'recap';
  return 'dashboard';
}

// ==========================================================================
// 3. Navigation & Views Management
// ==========================================================================
function showLoginView() {
  document.getElementById('view-admin-login').style.display = 'flex';
  document.getElementById('admin-app-container').style.display = 'none';
  if (window.location.pathname !== '/admin/login' && window.location.pathname.startsWith('/admin')) {
    window.history.replaceState({}, '', '/admin/login');
  }
}

function showAppView(targetView = 'dashboard') {
  document.getElementById('view-admin-login').style.display = 'none';
  document.getElementById('admin-app-container').style.display = 'flex';

  // Update profile banner
  if (currentAdminUser) {
    const nameEl = document.getElementById('admin-profile-name');
    const roleEl = document.getElementById('admin-profile-role');
    if (nameEl) nameEl.textContent = currentAdminUser.name || currentAdminUser.username;
    if (roleEl) roleEl.textContent = currentAdminUser.role || 'HSSE Officer';
  }

  navigateAdmin(targetView);
}

function navigateAdmin(viewName) {
  // Update nav buttons
  document.querySelectorAll('.admin-nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === viewName);
  });

  // Update view containers
  document.querySelectorAll('.admin-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-admin-${viewName}`);
  });

  // Update URL path seamlessly
  const newPath = `/admin/${viewName}`;
  if (window.location.pathname !== newPath) {
    window.history.pushState({ view: viewName }, '', newPath);
  }

  // Load view data
  if (viewName === 'dashboard') {
    refreshAdminDashboard();
  } else if (viewName === 'reports') {
    loadAdminReports(1);
  } else if (viewName === 'recap') {
    loadRecapData();
  }
}

window.addEventListener('popstate', (event) => {
  if (getStoredToken()) {
    const view = getInitialViewFromPath();
    navigateAdmin(view);
  }
});

// ==========================================================================
// 4. Dashboard View Logic
// ==========================================================================
async function refreshAdminDashboard() {
  try {
    const res = await authenticatedFetch(`${API_BASE}/admin/dashboard`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    const stats = data.data;
    renderDashboardStats(stats);
  } catch (err) {
    showAdminToast('Gagal memuat data dashboard.', 'error');
  }
}

function renderDashboardStats(stats) {
  const summary = stats.summary || {};
  document.getElementById('stat-total').textContent = summary.total || 0;
  document.getElementById('stat-open').textContent = summary.open || 0;
  document.getElementById('stat-progress').textContent = summary.in_progress || 0;
  document.getElementById('stat-closed').textContent = summary.closed || 0;
  document.getElementById('stat-critical').textContent = summary.critical || 0;

  // Render category distribution bars
  const catList = document.getElementById('category-dist-list');
  if (catList && stats.category_distribution) {
    const total = summary.total || 1;
    catList.innerHTML = stats.category_distribution.slice(0, 7).map(item => {
      const pct = Math.round((item.count / total) * 100);
      return `
        <div class="dist-bar-item">
          <div class="dist-bar-info">
            <span>${escapeHtml(item.category)}</span>
            <strong>${item.count} laporan (${pct}%)</strong>
          </div>
          <div class="dist-bar-track">
            <div class="dist-bar-fill" style="width: ${Math.max(4, pct)}%;"></div>
          </div>
        </div>
      `;
    }).join('') || '<div class="empty-placeholder">Belum ada data kategori.</div>';
  }

  // Render Finding Types Matrix
  const findingBox = document.getElementById('matrix-finding-types');
  if (findingBox && stats.finding_type_distribution) {
    findingBox.innerHTML = Object.entries(stats.finding_type_distribution).map(([ft, count]) => `
      <div class="matrix-pill">
        <span>${escapeHtml(ft)}</span>
        <strong>${count}</strong>
      </div>
    `).join('');
  }

  // Render Risk Levels Matrix
  const riskBox = document.getElementById('matrix-risk-levels');
  if (riskBox && stats.risk_distribution) {
    riskBox.innerHTML = Object.entries(stats.risk_distribution).map(([rl, count]) => `
      <div class="matrix-pill">
        <span>${escapeHtml(rl)}</span>
        <strong>${count}</strong>
      </div>
    `).join('');
  }

  // Render Recent Reports
  const recentTbody = document.getElementById('recent-reports-tbody');
  if (recentTbody && stats.recent_reports) {
    if (stats.recent_reports.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Belum ada laporan keselamatan yang masuk.</td></tr>`;
      return;
    }

    recentTbody.innerHTML = stats.recent_reports.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.ticket_number || r.complaint_id)}</strong></td>
        <td>${formatIndonesianDate(r.occurrence_date || r.created_at)}</td>
        <td>${escapeHtml(r.location)}</td>
        <td>${escapeHtml(r.category)}</td>
        <td><span class="finding-type-badge">${escapeHtml(r.finding_type || 'Unsafe Condition')}</span></td>
        <td>${getUrgencyBadgeHtml(r.urgency, r.risk_level)}</td>
        <td>${getStatusBadgeHtml(r.status)}</td>
        <td>
          <button class="btn btn-xs btn-primary" onclick="openReportDetailModal('${escapeHtml(r.ticket_number || r.complaint_id)}')">
            Detail
          </button>
        </td>
      </tr>
    `).join('');
  }
}

// ==========================================================================
// 5. Reports Management View Logic
// ==========================================================================
function debouncedSearchReports() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadAdminReports(1);
  }, 350);
}

function resetReportFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-status').value = 'Semua';
  document.getElementById('filter-category').value = 'Semua';
  document.getElementById('filter-urgency').value = 'Semua';
  loadAdminReports(1);
}

async function loadAdminReports(page = 1) {
  currentReportsPage = page;
  const search = document.getElementById('filter-search')?.value || '';
  const status = document.getElementById('filter-status')?.value || 'Semua';
  const category = document.getElementById('filter-category')?.value || 'Semua';
  const urgency = document.getElementById('filter-urgency')?.value || 'Semua';

  const params = new URLSearchParams({
    page: currentReportsPage,
    limit: currentReportsLimit,
    search: search.trim(),
    status,
    category,
    urgency
  });

  try {
    const res = await authenticatedFetch(`${API_BASE}/admin/reports?${params.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    renderReportsTable(data.data);
  } catch (err) {
    showAdminToast('Gagal memuat daftar laporan.', 'error');
  }
}

function renderReportsTable(data) {
  const tbody = document.getElementById('reports-table-tbody');
  const countBadge = document.getElementById('reports-counter-badge');
  const pagInfo = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('btn-prev-page');
  const nextBtn = document.getElementById('btn-next-page');

  const reports = data.reports || [];
  const total = data.total || 0;
  const page = data.page || 1;
  const totalPages = data.total_pages || 1;

  if (countBadge) {
    countBadge.textContent = `Menampilkan ${reports.length} dari total ${total} laporan`;
  }

  if (pagInfo) {
    pagInfo.textContent = `Halaman ${page} dari ${totalPages}`;
  }

  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;

  if (!tbody) return;

  if (reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4">Tidak ada laporan yang sesuai dengan filter.</td></tr>`;
    return;
  }

  const startIdx = (page - 1) * currentReportsLimit;
  tbody.innerHTML = reports.map((r, i) => `
    <tr>
      <td>${startIdx + i + 1}</td>
      <td><strong>${escapeHtml(r.ticket_number || r.complaint_id)}</strong></td>
      <td>${formatIndonesianDate(r.occurrence_date || r.created_at)}</td>
      <td>${escapeHtml(r.category)}</td>
      <td><span class="finding-type-badge">${escapeHtml(r.finding_type || 'Unsafe Condition')}</span></td>
      <td>${escapeHtml(r.location)}</td>
      <td>${escapeHtml(r.reporter_name || (r.reporter || {}).name || '-')}</td>
      <td>${getUrgencyBadgeHtml(r.urgency, r.risk_level)}</td>
      <td>${getStatusBadgeHtml(r.status)}</td>
      <td style="text-align: center;">
        <button class="btn btn-xs btn-primary" onclick="openReportDetailModal('${escapeHtml(r.ticket_number || r.complaint_id)}')">
          Detail &amp; Tindak Lanjut
        </button>
      </td>
    </tr>
  `).join('');
}

function changeReportsPage(delta) {
  loadAdminReports(currentReportsPage + delta);
}

// ==========================================================================
// 6. Report Detail Modal & Audit Trail
// ==========================================================================
async function openReportDetailModal(ticketNo) {
  activeTicketInModal = ticketNo;
  const modal = document.getElementById('report-detail-modal');

  try {
    const res = await authenticatedFetch(`${API_BASE}/admin/reports/${encodeURIComponent(ticketNo)}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    const report = data.data.report;
    renderReportDetail(report);
    if (modal) modal.classList.add('active');
  } catch (err) {
    showAdminToast('Gagal memuat detail laporan: ' + err.message, 'error');
  }
}

function renderReportDetail(report) {
  document.getElementById('modal-ticket-no').textContent = report.ticket_number || report.complaint_id;
  document.getElementById('modal-occurrence-date').textContent = formatIndonesianDate(report.occurrence_date || report.created_at);
  document.getElementById('modal-location').textContent = report.location || '-';
  
  const reporterName = report.reporter_name || (report.reporter || {}).name || 'Pekerja Lapangan';
  const division = report.division || (report.reporter || {}).department || 'Operasi';
  document.getElementById('modal-reporter').textContent = `${reporterName} (${division})`;
  
  document.getElementById('modal-category').textContent = report.category || 'Umum';
  document.getElementById('modal-finding-type').textContent = report.finding_type || 'Unsafe Condition';
  document.getElementById('modal-assigned-engineer').textContent = report.assigned_engineer || 'Tim HSSE Lapangan';
  document.getElementById('modal-description').textContent = report.description || report.complaint_description || '-';

  // Badges
  const statusBadge = document.getElementById('modal-status-badge');
  if (statusBadge) {
    statusBadge.outerHTML = getStatusBadgeHtml(report.status);
  }
  const urgencyBadge = document.getElementById('modal-urgency-badge');
  if (urgencyBadge) {
    urgencyBadge.outerHTML = getUrgencyBadgeHtml(report.urgency, report.risk_level);
  }

  // Pre-fill form
  const statusSelect = document.getElementById('update-status-select');
  if (statusSelect) {
    const curStatus = report.status || 'Open';
    statusSelect.value = curStatus;
  }
  const officerInput = document.getElementById('update-assigned-officer');
  if (officerInput) {
    officerInput.value = report.assigned_engineer || '';
  }
  const notesInput = document.getElementById('update-follow-up-notes');
  if (notesInput) {
    notesInput.value = report.follow_up_notes || '';
  }

  // Render Audit Trail Timeline
  renderAuditTimeline(report.history || []);
}

function renderAuditTimeline(history) {
  const container = document.getElementById('modal-audit-timeline');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `<div class="empty-placeholder" style="padding: 10px 0;">Belum ada catatan riwayat perubahan.</div>`;
    return;
  }

  container.innerHTML = history.slice().reverse().map(item => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <span class="timeline-meta">${formatDateTimeIndonesian(item.timestamp)} · ${escapeHtml(item.actor || 'Sistem')}</span>
        <span class="timeline-action">${escapeHtml(item.action)}</span>
        ${item.notes ? `<div class="timeline-notes">${escapeHtml(item.notes)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function closeReportDetailModal() {
  const modal = document.getElementById('report-detail-modal');
  if (modal) modal.classList.remove('active');
  activeTicketInModal = null;
}

async function submitReportUpdate() {
  if (!activeTicketInModal) return;

  const status = document.getElementById('update-status-select')?.value;
  const assigned_engineer = document.getElementById('update-assigned-officer')?.value?.trim();
  const follow_up_notes = document.getElementById('update-follow-up-notes')?.value?.trim();
  const submitBtn = document.getElementById('btn-save-report-update');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
  }

  try {
    const res = await authenticatedFetch(`${API_BASE}/admin/reports/${encodeURIComponent(activeTicketInModal)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        assigned_engineer,
        follow_up_notes
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    showAdminToast('Laporan berhasil diperbarui.', 'success');
    renderReportDetail(data.data.report);

    // Refresh underlying tables
    loadAdminReports(currentReportsPage);
  } catch (err) {
    showAdminToast('Gagal memperbarui laporan: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Pembaruan Laporan';
    }
  }
}

// ==========================================================================
// 7. Recap View Logic
// ==========================================================================
async function loadRecapData() {
  const startDate = document.getElementById('recap-start-date')?.value || '';
  const endDate = document.getElementById('recap-end-date')?.value || '';
  const category = document.getElementById('recap-category-filter')?.value || 'Semua';
  const status = document.getElementById('recap-status-filter')?.value || 'Semua';

  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (category && category !== 'Semua') params.append('category', category);
  if (status && status !== 'Semua') params.append('status', status);

  try {
    const res = await authenticatedFetch(`${API_BASE}/admin/recap?${params.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    renderRecapDocument(data.data);
  } catch (err) {
    showAdminToast('Gagal memuat data rekapitulasi.', 'error');
  }
}

function renderRecapDocument(recap) {
  const summary = recap.summary || {};
  document.getElementById('recap-sum-total').textContent = summary.total_reports || 0;
  document.getElementById('recap-sum-open').textContent = summary.open || 0;
  document.getElementById('recap-sum-progress').textContent = summary.in_progress || 0;
  document.getElementById('recap-sum-closed').textContent = summary.closed || 0;
  document.getElementById('recap-sum-critical').textContent = summary.critical || 0;

  // Period label
  const periodText = document.getElementById('recap-doc-period-text');
  if (periodText) {
    const s = recap.period?.start_date !== 'Semua' ? formatIndonesianDate(recap.period.start_date) : 'Awal Data';
    const e = recap.period?.end_date !== 'Semua' ? formatIndonesianDate(recap.period.end_date) : 'Hari Ini';
    periodText.textContent = `Periode: ${s} s.d. ${e}`;
  }

  const generatedAt = document.getElementById('recap-generated-at');
  if (generatedAt) {
    generatedAt.textContent = `Dicetak pada: ${formatDateTimeIndonesian(new Date().toISOString())}`;
  }

  const total = summary.total_reports || 1;

  // 1. Status Breakdown
  const statusTbody = document.getElementById('recap-status-breakdown-tbody');
  if (statusTbody) {
    const statuses = [
      { name: 'Open (Baru)', count: summary.open },
      { name: 'In Progress (Ditindaklanjuti)', count: summary.in_progress },
      { name: 'Closed / Resolved (Selesai)', count: summary.closed }
    ];
    statusTbody.innerHTML = statuses.map(st => `
      <tr>
        <td>${escapeHtml(st.name)}</td>
        <td class="text-right"><strong>${st.count}</strong></td>
        <td class="text-right">${Math.round((st.count / total) * 100)}%</td>
      </tr>
    `).join('');
  }

  // 2. Risk Breakdown
  const riskTbody = document.getElementById('recap-risk-breakdown-tbody');
  if (riskTbody && recap.risk_breakdown) {
    riskTbody.innerHTML = Object.entries(recap.risk_breakdown).map(([k, v]) => `
      <tr>
        <td>${escapeHtml(k)}</td>
        <td class="text-right"><strong>${v}</strong></td>
        <td class="text-right">${Math.round((v / total) * 100)}%</td>
      </tr>
    `).join('');
  }

  // 3. Finding Type Breakdown
  const findingTbody = document.getElementById('recap-finding-breakdown-tbody');
  if (findingTbody && recap.finding_type_breakdown) {
    findingTbody.innerHTML = Object.entries(recap.finding_type_breakdown).map(([k, v]) => `
      <tr>
        <td>${escapeHtml(k)}</td>
        <td class="text-right"><strong>${v}</strong></td>
        <td class="text-right">${Math.round((v / total) * 100)}%</td>
      </tr>
    `).join('');
  }

  // 4. Category Breakdown
  const catTbody = document.getElementById('recap-category-breakdown-tbody');
  if (catTbody && recap.category_breakdown) {
    const entries = Object.entries(recap.category_breakdown);
    catTbody.innerHTML = entries.map(([k, v]) => `
      <tr>
        <td>${escapeHtml(k)}</td>
        <td class="text-right"><strong>${v}</strong></td>
        <td class="text-right">${Math.round((v / total) * 100)}%</td>
      </tr>
    `).join('') || `<tr><td colspan="3" class="text-center">Tidak ada data kategori.</td></tr>`;
  }

  // 5. Detailed List Table
  const detailsTbody = document.getElementById('recap-details-tbody');
  if (detailsTbody && recap.reports) {
    if (recap.reports.length === 0) {
      detailsTbody.innerHTML = `<tr><td colspan="9" class="text-center py-3">Tidak ada laporan pada periode ini.</td></tr>`;
      return;
    }

    detailsTbody.innerHTML = recap.reports.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${escapeHtml(r.ticket_number || r.complaint_id)}</strong></td>
        <td>${formatIndonesianDate(r.occurrence_date || r.created_at)}</td>
        <td>${escapeHtml(r.reporter_name || '-')} / ${escapeHtml(r.division || '-')}</td>
        <td>${escapeHtml(r.location)}</td>
        <td>${escapeHtml(r.category)}</td>
        <td>${getUrgencyBadgeHtml(r.urgency, r.risk_level)}</td>
        <td>${getStatusBadgeHtml(r.status)}</td>
        <td>${escapeHtml(r.follow_up_notes || '-')}</td>
      </tr>
    `).join('');
  }
}

// ==========================================================================
// 8. Categories Loader for Filter Dropdowns
// ==========================================================================
async function loadCategoriesIntoFilters() {
  try {
    const res = await fetch(`${API_BASE}/knowledge/categories`);
    const data = await res.json();
    if (res.ok && data.success && data.data?.categories) {
      cachedCategories = data.data.categories;
      populateCategoryDropdowns(cachedCategories);
    }
  } catch (e) {}
}

function populateCategoryDropdowns(categories) {
  const filterCat = document.getElementById('filter-category');
  const recapCat = document.getElementById('recap-category-filter');

  const optionsHtml = ['<option value="Semua">Semua Kategori</option>'].concat(
    categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
  ).join('');

  if (filterCat) filterCat.innerHTML = optionsHtml;
  if (recapCat) recapCat.innerHTML = optionsHtml;
}

// ==========================================================================
// 9. App Bootstrap
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesIntoFilters();
  checkCurrentSession();
});
