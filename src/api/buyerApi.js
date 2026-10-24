/**
 * Buyer API Service — wraps cart/order endpoints
 * Calls BE at http://localhost:8080/api/v1/...
 * If BE endpoint doesn't exist → falls back to mock via interceptor.
 */
import apiClient from '@/composables/useApi'

// ── Cart ────────────────────────────────────────────────────────
export const cartService = {
  getCart() {
    return apiClient.get('/cart')
  },
  addItem(payload) {
    // payload: { variantId, quantity }
    return apiClient.post('/cart/items', payload)
  },
  updateItem(id, payload) {
    // payload: { quantity, isSelected }
    return apiClient.patch(`/cart/items/${id}`, payload)
  },
  removeItem(id) {
    return apiClient.delete(`/cart/items/${id}`)
  },
}

// ── Orders ──────────────────────────────────────────────────────
export const orderService = {
  createOrder(payload, idempotencyKey) {
    return apiClient.post('/buyer/orders', payload, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    })
  },
  listOrders(params = {}) {
    return apiClient.get('/buyer/orders', { params })
  },
  getOrder(id) {
    return apiClient.get(`/buyer/orders/${id}`)
  },
  cancelOrder(id, reason) {
    return apiClient.patch(`/buyer/orders/${id}/cancel`, null, { params: { reason } })
  },
}

// ── Categories (re-export from catalog) ────────────────────────
export { catalogService } from '@/services/catalog.service'

// ── Wishlist ────────────────────────────────────────────────────
export { wishlistService } from '@/services/wishlist.service'

// ── Auth ────────────────────────────────────────────────────────
export { authService } from '@/services/auth.service'

// ── User Address ────────────────────────────────────────────────
export { userAddressService } from '@/services/userAddress.service'

// ── Promotions ─────────────────────────────────────────────────
export { promotionService } from '@/services/promotion.service'

// ── Reviews ─────────────────────────────────────────────────────
export { reviewService } from '@/services/review.service'
