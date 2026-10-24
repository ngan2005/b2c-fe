import apiClient from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

export const buyerOrderService = {
  createOrder(payload, idempotencyKey = null) {
    const headers = {}
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }
    return apiClient.post('/buyer/orders', payload, { headers })
  },
  listOrders(params = {}) {
    // SELLER users must use /history (POST/PATCH are blocked for them on /buyer/orders).
    // BUYER users use the normal /buyer/orders GET.
    const auth = useAuthStore()
    const path = auth.role === 'SELLER' ? '/buyer/orders/history' : '/buyer/orders'
    return apiClient.get(path, { params })
  },
  getOrder(id) {
    return apiClient.get(`/buyer/orders/${id}`)
  },
  cancelOrder(id, reason = '') {
    return apiClient.patch(`/buyer/orders/${id}/cancel`, null, {
      params: { reason },
    })
  },
  requestReturn(id, payload) {
    return apiClient.post(`/buyer/orders/${id}/return-request`, payload)
  },
}
