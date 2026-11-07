import apiClient from '@/composables/useApi'

export const adminOrderService = {
  list(params = {}) {
    return apiClient.get('/admin/orders', { params })
  },
  get(id) {
    return apiClient.get(`/admin/orders/${id}`)
  },
  approveReturn(id) {
    return apiClient.post(`/admin/orders/${id}/approve-return`)
  },
  rejectReturn(id, adminNote) {
    return apiClient.post(`/admin/orders/${id}/reject-return`, { adminNote })
  },
  cleanupExpired() {
    return apiClient.post('/admin/orders/cleanup-expired')
  },
}
