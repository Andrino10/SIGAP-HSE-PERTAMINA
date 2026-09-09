<template>
  <section
    class="admin-login-wrapper"
    id="view-admin-login"
    style="background-color: #f1f5f9 !important; background: #f1f5f9 !important; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;"
  >
    <div
      class="admin-login-card"
      style="background-color: #ffffff !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 20px !important; box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12) !important; width: 100%; max-width: 450px; padding: 42px 36px;"
    >
      <div class="admin-login-header" style="text-align: center; margin-bottom: 24px;">
        <div
          class="admin-brand-logos"
          style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 20px; display: inline-flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 18px;"
        >
          <img
            src="/pertamina-ep-logo-transparent.png"
            alt="Pertamina EP"
            class="admin-logo-pep"
            style="height: 42px; width: auto; object-fit: contain;"
          />
          <div class="admin-logo-divider" style="width: 1px; height: 28px; background: #cbd5e1;"></div>
          <img
            src="/satu-it-sigap-logo-transparent.png"
            alt="SIGAP-AI HSSE"
            class="admin-logo-sigap"
            style="height: 42px; width: auto; object-fit: contain;"
          />
        </div>
        <div>
          <span
            class="admin-badge-portal"
            style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px;"
          >PORTAL PENGELOLAAN HSSE</span>
        </div>
        <h1
          class="admin-login-title"
          style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;"
        >SIGAP HSE ADMIN</h1>
        <p
          class="admin-login-subtitle"
          style="font-size: 13.5px; color: #64748b; line-height: 1.6; margin: 0; max-width: 360px; margin-left: auto; margin-right: auto;"
        >
          Monitoring, Verifikasi Temuan, Tindak Lanjut Mitigasi &amp; Rekapitulasi Laporan K3
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMsg"
        id="admin-login-error"
        style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; margin-bottom: 18px; display: flex; align-items: flex-start; gap: 8px;"
      >
        <span style="font-size: 16px; flex-shrink: 0;">⚠️</span>
        <span>{{ errorMsg }}</span>
      </div>

      <form id="admin-login-form" @submit.prevent="handleLogin">
        <!-- Username -->
        <div class="form-group" style="margin-bottom: 18px; text-align: left;">
          <label
            for="admin-user-input"
            style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;"
          >Username Admin <span class="field-required" style="color: #ef4444;">*</span></label>
          <input
            type="text"
            id="admin-user-input"
            v-model="username"
            class="form-input"
            placeholder="Masukkan username (contoh: admin)"
            autocomplete="username"
            style="width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 10px; padding: 12px 14px; font-size: 14px; box-sizing: border-box;"
            required
            autofocus
          />
        </div>

        <!-- Password + Toggle -->
        <div class="form-group" style="margin-bottom: 18px; text-align: left;">
          <label
            for="admin-pass-input"
            style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;"
          >Password <span class="field-required" style="color: #ef4444;">*</span></label>
          <div style="position: relative;">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="admin-pass-input"
              v-model="password"
              class="form-input"
              placeholder="Masukkan password"
              autocomplete="current-password"
              style="width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 10px; padding: 12px 42px 12px 14px; font-size: 14px; box-sizing: border-box;"
              required
            />
            <!-- Toggle show/hide password -->
            <button
              type="button"
              id="btn-toggle-password"
              @click="showPassword = !showPassword"
              style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 4px; color: #64748b; display: flex; align-items: center;"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              <!-- Eye icon (show) -->
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- Eye-off icon (hide) -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="admin-login-actions" style="margin-top: 24px;">
          <button
            type="submit"
            class="btn btn-primary btn-block"
            id="btn-admin-login"
            :disabled="isLoading"
            style="width: 100%; background: linear-gradient(135deg, #1e40af 0%, #0072ce 100%); color: #ffffff; border: none; border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 700; cursor: pointer; opacity: 1; transition: opacity 0.2s;"
            :style="isLoading ? 'opacity: 0.7; cursor: not-allowed;' : ''"
          >
            <span v-if="isLoading" style="display:inline-flex;align-items:center;gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Memverifikasi...
            </span>
            <span v-else>Masuk ke Portal Admin</span>
          </button>
        </div>

        <div class="admin-login-footer" style="text-align: center; margin-top: 20px; font-size: 13px;">
          <router-link to="/" class="admin-back-link" style="color: #64748b; text-decoration: none; font-weight: 500;">
            ← Kembali ke Portal Pengguna SIGAP HSE
          </router-link>
        </div>
      </form>

      <!-- Info hint -->
      <div style="margin-top: 20px; padding: 12px 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; font-size: 12px; color: #0369a1;">
        <strong>🔐 Akses terbatas.</strong> Hanya personil HSSE resmi PT Pertamina EP Lirik Field yang berwenang mengakses portal ini.
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminAuth } from '../../composables/useAdminAuth';
import { useToast } from '../../composables/useToast';

const router = useRouter();
const { login } = useAdminAuth();
const { showToast } = useToast();

const username = ref('admin');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
  if (isLoading.value) return;
  errorMsg.value = '';
  isLoading.value = true;

  try {
    await login(username.value.trim(), password.value);
    showToast('Login berhasil! Selamat datang di Portal Admin HSSE.', 'success');
    router.push('/admin/dashboard');
  } catch (err) {
    const msg = err.message || 'Login gagal. Periksa username dan password.';
    errorMsg.value = msg;
    showToast(msg, 'error');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
