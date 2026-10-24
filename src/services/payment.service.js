import apiClient from '@/composables/useApi'

export const paymentService = {
  getPaymentsForOrder(orderId) {
    return apiClient.get(`/payments/orders/${orderId}`)
  },
}
