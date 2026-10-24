import apiClient from '@/composables/useApi'

export const adminPromotionService = {
  list(params = {}) {
    return apiClient.get('/admin/promotions', { params })
  },
  create(payload) {
    return apiClient.post('/admin/promotions', payload)
  },
  update(id, payload) {
    return apiClient.put(`/admin/promotions/${id}`, payload)
  },
  disable(id) {
    return apiClient.patch(`/admin/promotions/${id}/disable`)
  },
  delete(id) {
    return apiClient.delete(`/admin/promotions/${id}`)
  },
  restore(id) {
    return apiClient.post(`/admin/promotions/${id}/restore`)
  },
}
