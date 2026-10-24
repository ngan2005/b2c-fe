import apiClient from '@/composables/useApi'

export const adminCommissionService = {
  list:   (params = {}) => apiClient.get('/admin/commission-rules', { params }),
  get:    (id) => apiClient.get(`/admin/commission-rules/${id}`),
  create: (body) => apiClient.post('/admin/commission-rules', body),
  update: (id, body) => apiClient.put(`/admin/commission-rules/${id}`, body),
  disable:(id) => apiClient.patch(`/admin/commission-rules/${id}/disable`),
  delete: (id) => apiClient.delete(`/admin/commission-rules/${id}`),
  backfill: () => apiClient.post('/admin/commission-rules/backfill'),
}
