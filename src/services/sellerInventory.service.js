import apiClient from '@/composables/useApi'

export const sellerInventoryService = {
  getInventory(params = {}) {
    return apiClient.get('/seller/inventory', { params })
  },
  updateStock(variantId, stockQuantity) {
    return apiClient.put(`/seller/inventory/${variantId}/stock`, { stockQuantity })
  },
}
