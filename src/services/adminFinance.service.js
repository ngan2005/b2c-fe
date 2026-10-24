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
}
