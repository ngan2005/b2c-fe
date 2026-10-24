import apiClient from '@/composables/useApi'

export const adminUserService = {
  list(params = {}) {
    return apiClient.get('/admin/users', { params })
  },
  get(id) {
    return apiClient.get(`/admin/users/${id}`)
  },
  updateStatus(id, status) {
    return apiClient.patch(`/admin/users/${id}/status`, { status })
  },
  updateRole(id, role) {
    return apiClient.patch(`/admin/users/${id}/role`, { role })
  },
  getOnlineUsers() {
    return apiClient.get('/admin/users/online')
  },
}
