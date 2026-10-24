import apiClient from '@/composables/useApi'

export const wishlistService = {
  list(params = {}) {
    return apiClient.get('/wishlist', { params })
  },
  toggle(productId) {
    return apiClient.post(`/wishlist/products/${productId}`)
  },
  remove(productId) {
    return apiClient.delete(`/wishlist/products/${productId}`)
  },
  check(productId) {
    return apiClient.get(`/wishlist/products/${productId}/check`)
  }
}
