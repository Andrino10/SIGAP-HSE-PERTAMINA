<template>
  <header class="navbar">
    <router-link to="/" class="nav-brand" title="Kembali ke beranda SIGAP-AI">
      <img src="/pertamina-ep-logo-transparent.png" alt="Logo Pertamina EP" class="nav-logo-pertamina-ep" />
      <div class="nav-logo-divider"></div>
      <img src="/pertamina-one-logo-transparent.png" alt="Logo PERTAMINA ONE" class="nav-logo-pertamina-one" />
      <div class="nav-logo-divider"></div>
      <img src="/satu-it-sigap-logo-transparent.png" alt="Logo SIGAP-AI HSSE" class="nav-logo-sigap" />
    </router-link>

    <!-- Main Navigation Menu -->
    <nav class="nav-menu" :class="{ active: isMobileMenuOpen }" id="nav-menu" aria-label="Navigasi utama">
      <router-link to="/" class="nav-link" active-class="active" @click="closeMobileMenu">
        <span class="nav-icon" aria-hidden="true"></span> Beranda
      </router-link>
      <router-link to="/chatbot" class="nav-link" active-class="active" @click="closeMobileMenu">
        <span class="nav-icon" aria-hidden="true"></span> Asisten HSSE
      </router-link>
      <router-link to="/ticket" class="nav-link nav-link-contact" active-class="active" @click="closeMobileMenu">
        <span class="nav-icon" aria-hidden="true"></span> Cek Status Tiket
      </router-link>
    </nav>

    <!-- System Status Indicator & Mobile Actions -->
    <div class="nav-actions">
      <div
        :class="['status-indicator', status]"
        id="status-indicator"
        :title="status === 'online' ? 'Layanan HSSE terhubung' : 'Layanan HSSE memeriksa/offline'"
      >
        <span class="status-dot"></span>
        <span class="status-label">{{ statusLabel }}</span>
      </div>

      <router-link
        to="/admin/login"
        class="btn btn-sm btn-secondary"
        style="font-size: 12px; padding: 6px 12px; text-decoration: none; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; display: inline-flex; align-items: center; gap: 4px;"
        title="Masuk ke Portal Admin"
      >
        🔒 Portal Admin
      </router-link>

      <button
        class="mobile-toggle"
        type="button"
        @click="toggleMobileMenu"
        aria-label="Buka menu navigasi"
        aria-controls="nav-menu"
        :aria-expanded="isMobileMenuOpen"
      >
        <span class="mobile-toggle-bars" aria-hidden="true"></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useHealthCheck } from '../composables/useHealthCheck';

const { status, statusLabel } = useHealthCheck();
const isMobileMenuOpen = ref(false);

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}
</script>
