import apiClient from '@/composables/useApi'

export const adminCategoryService = {
  getTree() {
    return apiClient.get('/admin/categories/tree')
  },
  create(payload) {
    return apiClient.post('/admin/categories', payload)
  },
  update(id, payload) {
    return apiClient.patch(`/admin/categories/${id}`, payload)
  },
  toggle(id) {
    return apiClient.patch(`/admin/categories/${id}/toggle`)
  },
  remove(id) {
    return apiClient.delete(`/admin/categories/${id}`)
  },
}
