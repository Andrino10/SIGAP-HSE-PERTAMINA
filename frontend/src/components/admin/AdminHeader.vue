<template>
  <header class="admin-navbar">
    <div class="admin-nav-left">
      <div class="admin-brand-compact">
        <img src="/pertamina-ep-logo-transparent.png" alt="Pertamina EP" class="admin-nav-logo" />
        <div class="admin-nav-divider"></div>
        <span class="admin-nav-title">SIGAP HSE <span>ADMIN</span></span>
      </div>

      <!-- Navigation Links -->
      <nav class="admin-nav-menu" aria-label="Menu Admin">
        <router-link to="/admin/dashboard" class="admin-nav-link" active-class="active">
          <span>📊</span> Dashboard
        </router-link>
        <router-link to="/admin/reports" class="admin-nav-link" active-class="active">
          <span>📋</span> Daftar Laporan
        </router-link>
        <router-link to="/admin/recap" class="admin-nav-link" active-class="active">
          <span>📈</span> Rekapitulasi
        </router-link>
      </nav>
    </div>

    <div class="admin-nav-right">
      <div class="admin-user-profile">
        <div class="admin-user-avatar">AD</div>
        <div class="admin-user-info">
          <strong>{{ adminUser?.name || 'Admin HSSE' }}</strong>
          <span>{{ adminUser?.role || 'Superintendent HSSE' }}</span>
        </div>
      </div>

      <router-link to="/" class="btn btn-sm btn-secondary admin-btn-public" title="Buka Portal Pengguna">
        Portal Pekerja ↗
      </router-link>

      <button class="btn btn-sm btn-outline-danger" @click="handleLogout" title="Keluar dari sesi Admin">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAdminAuth } from '../../composables/useAdminAuth';

const router = useRouter();
const { adminUser, logout } = useAdminAuth();

async function handleLogout() {
  await logout();
  router.push('/admin/login');
}
</script>
