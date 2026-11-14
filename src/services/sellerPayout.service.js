import apiClient from '@/composables/useApi'

export const sellerPayoutService = {
  /**
   * Get wallet statement metrics:
   * totalPending (in Escrow), totalReady (available for payout), totalPaid (disbursed), lifetimeEarned
   */
  getWallet() {
    return apiClient.get('/seller/payouts/wallet')
  },

  /**
   * Get paginated ledger history with optional status filter:
   * PENDING, READY, PAID, CANCELLED
   */
  getHistory(params = {}) {
    return apiClient.get('/seller/payouts/history', { params })
  },

  /**
   * Request withdrawal / disbursement of all READY eligible escrow funds
   */
  requestPayout() {
    return apiClient.post('/seller/payouts/request-payout')
  },
}

