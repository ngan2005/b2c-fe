import apiClient from '@/composables/useApi'

export const sellerCommissionService = {
  list(params = {}) {
    return apiClient.get('/seller/commission-rules', { params })
  },
  simulate(categoryId, amount) {
    return apiClient.get('/seller/commission-rules/simulate', {
      params: { categoryId, amount }
    })
  }
}
