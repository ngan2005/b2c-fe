import apiClient from '@/composables/useApi'

export const adminDisputeService = {
  list:   (params = {}) => apiClient.get('/admin/disputes', { params }),
  get:    (id) => apiClient.get(`/admin/disputes/${id}`),
  resolve:(id, body) => apiClient.post(`/admin/disputes/${id}/resolve`, body),
}
