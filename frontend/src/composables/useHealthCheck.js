import { ref } from 'vue';
import { getKnowledgeCategories, getKnowledgeTechnicians } from '../services/api';

const status = ref('checking'); // 'checking' | 'online' | 'offline'
const statusLabel = ref('MEMERIKSA');
const categories = ref([]);
const technicians = ref([]);
let isPolling = false;

export function useHealthCheck() {
  async function checkHealth() {
    try {
      const res = await getKnowledgeCategories();
      if (res && res.success) {
        status.value = 'online';
        statusLabel.value = 'SISTEM SIAP';
        categories.value = res.data?.details || res.data?.categories || [];
      } else {
        throw new Error();
      }
    } catch (e) {
      status.value = 'offline';
      statusLabel.value = 'MODE OFFLINE';
    }

    try {
      const techRes = await getKnowledgeTechnicians();
      if (techRes && techRes.success) {
        technicians.value = techRes.data?.petugas || techRes.data?.technicians || [];
      }
    } catch (e) {
      // Keep default if fail
    }
  }

  function startPolling(intervalMs = 15000) {
    if (isPolling) return;
    isPolling = true;
    checkHealth();
    setInterval(checkHealth, intervalMs);
  }

  return {
    status,
    statusLabel,
    categories,
    technicians,
    checkHealth,
    startPolling
  };
}
