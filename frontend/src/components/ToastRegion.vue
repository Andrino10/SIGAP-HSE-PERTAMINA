<template>
  <div class="toast-region" id="toast-region" aria-live="polite" aria-atomic="true">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`]"
      :role="toast.type === 'error' ? 'alert' : 'status'"
    >
      <span class="toast-indicator" aria-hidden="true"></span>
      <span>{{ toast.message }}</span>
      <button type="button" aria-label="Tutup notifikasi" @click="removeToast(toast.id)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();
</script>
