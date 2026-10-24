import apiClient from '@/composables/useApi'

export const statsService = {
  sellerOverview() {
    return apiClient.get('/seller/stats/overview')
  },
  sellerRevenue(days = 30) {
    return apiClient.get('/seller/stats/revenue', { params: { days } })
  },
  adminOverview() {
    return apiClient.get('/admin/stats/overview')
  },
  adminRevenue(params = {}) {
    return apiClient.get('/admin/stats/revenue', { params })
  },
  adminOrderFunnel() {
    return apiClient.get('/admin/stats/order-funnel')
  },
  adminTopSellers(params = {}) {
    return apiClient.get('/admin/stats/top-sellers', { params })
  },
  adminLowStock(params = {}) {
    return apiClient.get('/admin/stats/low-stock', { params })
  },
}
