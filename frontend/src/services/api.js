/**
 * Centralized API Service for SIGAP-HSE-PERTAMINA
 * Compatible with Flask backend & Vercel deployment
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

/**
 * Fetch wrapper with timeout and JSON handling
 */
async function request(endpoint, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const adminToken = localStorage.getItem('sigap_hse_admin_token');
  if (adminToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = data?.message || (typeof data === 'string' ? data : 'Terjadi kesalahan sistem.');
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================================================
// 1. Public & Knowledge Base API
// ==========================================================================
export async function getHealth() {
  return request('/health', { method: 'GET' }, 5000);
}

export async function getKnowledgeCategories() {
  return request('/knowledge/categories', { method: 'GET' }, 8000);
}

export async function getKnowledgeTechnicians() {
  return request('/knowledge/technicians', { method: 'GET' }, 8000);
}

export async function getKnowledgeList() {
  return request('/knowledge', { method: 'GET' }, 45000);
}

export async function getKnowledgeById(kbId) {
  return request(`/knowledge/${encodeURIComponent(kbId)}`, { method: 'GET' }, 10000);
}

// ==========================================================================
// 2. Chatbot & AI Assistant API
// ==========================================================================
export async function getChatStarters() {
  return request('/chatbot/starters', { method: 'GET' }, 8000);
}

export async function sendChatMessage(payload) {
  return request('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 35000);
}

export async function resolveChatMessage(payload) {
  return request('/chatbot/resolve', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 10000);
}

export async function resetChatSession(payload) {
  return request('/chatbot/reset', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 8000);
}

export async function analyzeLegacy(laporan) {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({ laporan })
  }, 30000);
}

// ==========================================================================
// 3. Consultation & Ticket Tracking API
// ==========================================================================
export async function createConsultation(payload) {
  return request('/consultations', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 20000);
}

export async function createComplaint(payload) {
  return request('/complaints', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 20000);
}

export async function getComplaints() {
  return request('/complaints', { method: 'GET' }, 10000);
}

export async function getComplaintByTicket(ticketNo) {
  return request(`/complaints/${encodeURIComponent(ticketNo)}`, { method: 'GET' }, 10000);
}

// ==========================================================================
// 4. Admin Portal API
// ==========================================================================
export async function adminLogin(username, password) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }, 10000);
}

export async function adminLogout() {
  return request('/admin/logout', { method: 'POST' }, 8000);
}

export async function getAdminMe() {
  return request('/admin/me', { method: 'GET' }, 8000);
}

export async function getAdminDashboard() {
  return request('/admin/dashboard', { method: 'GET' }, 12000);
}

export async function getAdminReports() {
  return request('/admin/reports', { method: 'GET' }, 15000);
}

export async function getAdminReportDetail(ticketNo) {
  return request(`/admin/reports/${encodeURIComponent(ticketNo)}`, { method: 'GET' }, 10000);
}

export async function updateAdminReport(ticketNo, payload) {
  return request(`/admin/reports/${encodeURIComponent(ticketNo)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }, 15000);
}

export async function getAdminRecap() {
  return request('/admin/recap', { method: 'GET' }, 15000);
}

export async function getAdminOfficers() {
  return request('/admin/officers', { method: 'GET' }, 8000);
}
