<template>
  <section class="admin-login-wrapper" id="view-admin-login" style="background-color: #f1f5f9 !important; background: #f1f5f9 !important; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
    <div class="admin-login-card" style="background-color: #ffffff !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 20px !important; box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12) !important; width: 100%; max-width: 450px; padding: 42px 36px;">
      <div class="admin-login-header" style="text-align: center; margin-bottom: 24px;">
        <div class="admin-brand-logos" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 20px; display: inline-flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 18px;">
          <img src="/pertamina-ep-logo-transparent.png" alt="Pertamina EP" class="admin-logo-pep" style="height: 42px; width: auto; object-fit: contain;" />
          <div class="admin-logo-divider" style="width: 1px; height: 28px; background: #cbd5e1;"></div>
          <img src="/satu-it-sigap-logo-transparent.png" alt="SIGAP-AI HSSE" class="admin-logo-sigap" style="height: 42px; width: auto; object-fit: contain;" />
        </div>
        <div>
          <span class="admin-badge-portal" style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px;">PORTAL PENGELOLAAN HSSE</span>
        </div>
        <h1 class="admin-login-title" style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">SIGAP HSE ADMIN</h1>
        <p class="admin-login-subtitle" style="font-size: 13.5px; color: #64748b; line-height: 1.6; margin: 0; max-width: 360px; margin-left: auto; margin-right: auto;">
          Monitoring, Verifikasi Temuan, Tindak Lanjut Mitigasi &amp; Rekapitulasi Laporan K3
        </p>
      </div>

      <form id="admin-login-form" @submit.prevent="handleLogin">
        <div class="form-group" style="margin-bottom: 18px; text-align: left;">
          <label for="admin-user-input" style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Username Admin <span class="field-required" style="color: #ef4444;">*</span></label>
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

        <div class="form-group" style="margin-bottom: 18px; text-align: left;">
          <label for="admin-pass-input" style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Password <span class="field-required" style="color: #ef4444;">*</span></label>
          <input
            type="password"
            id="admin-pass-input"
            v-model="password"
            class="form-input"
            placeholder="Masukkan password"
            autocomplete="current-password"
            style="width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; border-radius: 10px; padding: 12px 14px; font-size: 14px; box-sizing: border-box;"
            required
          />
        </div>

        <div class="admin-login-actions" style="margin-top: 24px;">
          <button
            type="submit"
            class="btn btn-primary btn-block"
            id="btn-admin-login"
            :disabled="isLoading"
            style="width: 100%; background: linear-gradient(135deg, #1e40af 0%, #0072ce 100%); color: #ffffff; border: none; border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 700; cursor: pointer;"
          >
            {{ isLoading ? 'Memverifikasi...' : 'Masuk ke Portal Admin' }}
          </button>
        </div>

        <div class="admin-login-footer" style="text-align: center; margin-top: 20px; font-size: 13px;">
          <router-link to="/" class="admin-back-link" style="color: #64748b; text-decoration: none; font-weight: 500;">
            ← Kembali ke Portal Pengguna SIGAP HSE
          </router-link>
        </div>
      </form>
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
const isLoading = ref(false);

async function handleLogin() {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    await login(username.value.trim(), password.value);
    showToast('Login berhasil! Selamat datang di Portal Admin HSSE.', 'success');
    router.push('/admin/dashboard');
  } catch (err) {
    showToast(err.message || 'Login gagal. Periksa username dan password.', 'error');
  } finally {
    isLoading.value = false;
  }
}
</script>
