import apiClient from '@/composables/useApi'

export const sellerApplicationService = {
  submit(payload) {
    return apiClient.post('/seller-applications', payload)
  },
  // [SELLER-BUYER-UPGRADE]
  /**
   * Quick-upgrade a BUYER to SELLER instantly.
   * Returns the unwrapped QuickUpgradeResponse (tokens + seller info).
   */
  quickUpgrade(payload) {
    return apiClient.post('/seller-applications/quick-upgrade', payload)
  },
  adminList(params = {}) {
    return apiClient.get('/admin/seller-applications', { params })
  },
  adminGet(id) {
    return apiClient.get(`/admin/seller-applications/${id}`)
  },
  adminApprove(id) {
    return apiClient.post(`/admin/seller-applications/${id}/approve`)
  },
  adminReject(id, reason) {
    return apiClient.post(`/admin/seller-applications/${id}/reject`, { reason })
  },
}
