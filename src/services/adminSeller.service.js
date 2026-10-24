import apiClient from '@/composables/useApi'

export const adminSellerService = {
  list(params = {}) {
    return apiClient.get('/admin/sellers', { params })
  },
  suspend(id, reason) {
    return apiClient.patch(`/admin/sellers/${id}/suspend`, { reason })
  },
  reactivate(id) {
    return apiClient.patch(`/admin/sellers/${id}/reactivate`)
  },
}
