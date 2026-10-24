import apiClient from '@/composables/useApi'

export const sellerOrderService = {
  list(params = {}) {
    return apiClient.get('/seller/orders', { params })
  },
  get(id) {
    return apiClient.get(`/seller/orders/${id}`)
  },
  updateStatus(id, status, note = '') {
    return apiClient.patch(`/seller/orders/${id}/status`, { status, note })
  },
}
