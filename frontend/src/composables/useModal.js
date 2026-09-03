import { ref } from 'vue';

const isConsultationOpen = ref(false);
const isChoiceOpen = ref(false);
const isWhatsAppOpen = ref(false);
const isTicketCheckOpen = ref(false);

const choiceModalData = ref(null);
const whatsappPrefill = ref(null);

export function useModal() {
  function openConsultationModal() {
    isConsultationOpen.value = true;
  }
  function closeConsultationModal() {
    isConsultationOpen.value = false;
  }

  function openChoiceModal(data) {
    choiceModalData.value = data;
    isChoiceOpen.value = true;
  }
  function closeChoiceModal() {
    isChoiceOpen.value = false;
    choiceModalData.value = null;
  }

  function openWhatsAppModal(prefill = null) {
    whatsappPrefill.value = prefill;
    isWhatsAppOpen.value = true;
  }
  function closeWhatsAppModal() {
    isWhatsAppOpen.value = false;
    whatsappPrefill.value = null;
  }

  function openTicketCheckModal() {
    isTicketCheckOpen.value = true;
  }
  function closeTicketCheckModal() {
    isTicketCheckOpen.value = false;
  }

  return {
    isConsultationOpen,
    isChoiceOpen,
    isWhatsAppOpen,
    isTicketCheckOpen,
    choiceModalData,
    whatsappPrefill,
    openConsultationModal,
    closeConsultationModal,
    openChoiceModal,
    closeChoiceModal,
    openWhatsAppModal,
    closeWhatsAppModal,
    openTicketCheckModal,
    closeTicketCheckModal
  };
}
