import { ref } from 'vue';

const toasts = ref([]);
let toastIdCounter = 0;

export function useToast() {
  function showToast(message, type = 'info', duration = 4500) {
    const id = ++toastIdCounter;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return {
    toasts,
    showToast,
    removeToast
  };
}
