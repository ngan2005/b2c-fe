import apiClient from '@/composables/useApi'

export const adminFinanceService = {
  /**
   * Fetch aggregated finance KPIs: GMV, platform revenue, payout totals, top categories.
   */
  overview() {
    return apiClient.get('/admin/stats/finance')
  },

  /**
   * Fetch daily revenue series for the last N days (default 30).
   * @param {number} days - number of days to look back
   */
  daily(days = 30) {
    return apiClient.get('/admin/stats/finance/daily', { params: { days } })
  },

  /**
   * List payouts for admin review
   */
  listPayouts(params = {}) {
    return apiClient.get('/admin/payouts', { params })
  },

  /**
   * Mark a payout as paid (disbursed) with bank reference
   */
  markPaid(id, bankReference) {
    return apiClient.post(`/admin/payouts/${id}/mark-paid`, { bankReference })
  },

  /**
   * Cancel a pending payout
   */
  cancelPayout(id) {
    return apiClient.post(`/admin/payouts/${id}/cancel`)
  },
}
