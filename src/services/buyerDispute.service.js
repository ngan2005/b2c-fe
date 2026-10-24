import apiClient from '@/composables/useApi'
export const buyerDisputeService = {
  open: (orderId, body) => apiClient.post(`/buyer/orders/${orderId}/dispute`, body),
}
