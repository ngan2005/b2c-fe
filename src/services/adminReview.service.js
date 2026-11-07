import apiClient from '@/composables/useApi'

export const adminReviewService = {
  list(params = {}) {
    return apiClient.get('/admin/reviews', { params })
  },

  getStats() {
    return apiClient.get('/admin/reviews/stats')
  },

  updateStatus(id, status) {
    return apiClient.patch(`/admin/reviews/${id}/status`, { status })
  },

  deleteReview(id) {
    return apiClient.delete(`/admin/reviews/${id}`)
  }
}
