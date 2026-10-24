import apiClient from '@/composables/useApi'

export const adminProductService = {
  list(params = {}) {
    return apiClient.get('/admin/products', { params })
  },
  get(id) {
    return apiClient.get(`/admin/products/${id}`)
  },
  updateStatus(id, status) {
    return apiClient.patch(`/admin/products/${id}/status`, { status })
  },
}
