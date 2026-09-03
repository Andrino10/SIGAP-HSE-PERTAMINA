<template>
  <div v-if="!isAdminRoute" class="app-container">
    <Navbar />
    <router-view />
    <Footer />

    <!-- Global Public Modals -->
    <ConsultationModal />
    <ConsultationChoiceModal />
    <WhatsAppModal />
    <TicketCheckModal />

    <!-- Global Toast Alerts -->
    <ToastRegion />
  </div>

  <div v-else class="admin-root">
    <router-view />
    <ToastRegion />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import ToastRegion from './components/ToastRegion.vue';
import ConsultationModal from './components/modals/ConsultationModal.vue';
import ConsultationChoiceModal from './components/modals/ConsultationChoiceModal.vue';
import WhatsAppModal from './components/modals/WhatsAppModal.vue';
import TicketCheckModal from './components/modals/TicketCheckModal.vue';
import { useHealthCheck } from './composables/useHealthCheck';

const route = useRoute();
const { startPolling } = useHealthCheck();

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin');
});

onMounted(() => {
  startPolling();
});
</script>
