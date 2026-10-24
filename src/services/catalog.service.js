import apiClient from '@/composables/useApi'

export const catalogService = {
  listProducts(params = {}) {
    return apiClient.get('/products', { params })
  },
  getProduct(slug) {
    return apiClient.get(`/products/${encodeURIComponent(slug)}`)
  },
  listCategories() {
    return apiClient.get('/categories')
  },
  getCategoryTree() {
    return apiClient.get('/categories/tree')
  },
  getRootCategories() {
    return apiClient.get('/categories/roots')
  },
}
