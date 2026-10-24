import apiClient from '@/composables/useApi'

/**
 * Public shop-facing service — reads shop profile, products, and reviews.
 * All endpoints live under /api/v1/public/shops (server must implement).
 * Auth-gated actions (follow/unfollow) use the standard auth header from useApi.
 */
export const publicShopService = {
  /**
   * GET /api/v1/public/shops/:slug
   * Returns shop profile: { id, slug, name, logoUrl, description, address,
   *   verified, rating, productCount, responseRate, responseTime,
   *   createdAt, tier, followerCount, ... }
   */
  getBySlug(slug) {
    return apiClient.get(`/public/shops/${encodeURIComponent(slug)}`)
  },

  /**
   * GET /api/v1/public/shops/:slug/products
   * Query params: { page, size, sort, categoryId }
   * Returns Spring Page envelope: { content, page, size, totalElements, totalPages, first, last }
   */
  getProducts(slug, { page = 0, size = 12, sort, categoryId } = {}) {
    const params = { page, size }
    if (sort) params.sort = sort
    if (categoryId) params.categoryId = categoryId
    return apiClient.get(`/public/shops/${encodeURIComponent(slug)}/products`, { params })
  },

  /**
   * GET /api/v1/public/shops/:slug/reviews
   * Query params: { page, size }
   * Returns Spring Page envelope: { content: [{ id, rating, comment, reviewerName, createdAt, ... }] }
   */
  getReviews(slug, { page = 0, size = 10 } = {}) {
    return apiClient.get(`/public/shops/${encodeURIComponent(slug)}/reviews`, { params: { page, size } })
  },

  /**
   * POST /api/v1/auth/me/follows/:sellerId  (requires auth header)
   * Returns { following: true }
   */
  follow(sellerId) {
    return apiClient.post(`/auth/me/follows/${sellerId}`)
  },

  /**
   * DELETE /api/v1/auth/me/follows/:sellerId  (requires auth header)
   * Returns { following: false }
   */
  unfollow(sellerId) {
    return apiClient.delete(`/auth/me/follows/${sellerId}`)
  },
}
