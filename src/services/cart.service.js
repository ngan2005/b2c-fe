import apiClient from '@/composables/useApi'

export const cartService = {
  getCart() {
    return apiClient.get('/cart')
  },
  addItem(payload) {
    return apiClient.post('/cart/items', payload)
  },
  updateItem(id, payload) {
    return apiClient.patch(`/cart/items/${id}`, payload)
  },
  removeItem(id) {
    return apiClient.delete(`/cart/items/${id}`)
  },
}
