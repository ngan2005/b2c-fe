import apiClient from '@/composables/useApi'

export const promotionService = {
  /**
   * List active public promotions (for all visitors/buyers).
   * @returns {Promise<Array<PromotionDto>>}
   */
  listPublic() {
    return apiClient.get('/promotions')
  },

  /**
   * List active promotions available to the authenticated buyer.
   * @returns {Promise<Array<PromotionDto>>}
   */
  listActive() {
    return apiClient.get('/buyer/promotions')
  },

  /**
   * Validate a promotion code against the current order subtotal.
   * Does NOT consume the promotion — only checks eligibility.
   *
   * @param {string} code - The promotion/coupon code
   * @param {number} subtotal - Current order subtotal (order total before discount)
   * @returns {Promise<ApplyPromotionResponse>}
   */
  validate(code, subtotal) {
    return apiClient.post('/buyer/promotions/validate', { code, subtotal })
  },

  // ===================== Seller-side =====================
  /** List the current seller's promotions (paginated) */
  listForSeller(params = {}) {
    return apiClient.get('/seller/promotions', { params })
  },

  /** Get one promotion owned by the current seller */
  getForSeller(id) {
    return apiClient.get(`/seller/promotions/${id}`)
  },

  /** Create a new promotion for the current seller's shop */
  createForSeller(payload) {
    return apiClient.post('/seller/promotions', payload)
  },

  /** Update a promotion owned by the current seller (full update) */
  updateForSeller(id, payload) {
    return apiClient.put(`/seller/promotions/${id}`, payload)
  },

  /** Disable (soft-delete) a promotion owned by the current seller */
  disableForSeller(id) {
    return apiClient.patch(`/seller/promotions/${id}/disable`)
  },
}
