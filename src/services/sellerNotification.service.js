/**
 * sellerNotification.service.js — API client for seller notification endpoints.
 */
import apiClient from '@/composables/useApi'

export const sellerNotificationService = {
  /**
   * Paginated notification list for the authenticated seller.
   * @param {{ page?: number, size?: number }} params
   */
  list({ page = 0, size = 20 } = {}) {
    return apiClient.get('/seller/notifications', { params: { page, size } })
  },

  /** Unread notification count. */
  getUnreadCount() {
    return apiClient.get('/seller/notifications/unread-count')
  },

  /** Mark one notification as read. */
  markRead(id) {
    return apiClient.patch(`/seller/notifications/${id}/read`)
  },

  /** Mark all notifications as read. */
  markAllRead() {
    return apiClient.patch('/seller/notifications/read-all')
  },
}
