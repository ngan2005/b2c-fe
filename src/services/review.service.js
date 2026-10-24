import apiClient from '@/composables/useApi'

export const reviewService = {
  /** Write a review for a purchased order item */
  create(payload) {
    return apiClient.post('/buyer/reviews', payload)
  },

  /** List visible reviews for a product (public) */
  listByProduct(productId, params = {}) {
    return apiClient.get(`/products/${productId}/reviews`, { params })
  },

  // ===================== Seller-side =====================
  /**
   * List reviews of the current seller's products.
   * @param {object} params - { page, size, rating, productId, hasReply }
   */
  listForSeller(params = {}) {
    return apiClient.get('/seller/reviews', { params })
  },

  /** Reply to a review left on one of the seller's products */
  replyToReview(reviewId, payload) {
    return apiClient.post(`/seller/reviews/${reviewId}/reply`, payload)
  },
}
