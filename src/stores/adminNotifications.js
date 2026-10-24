/**
 * adminNotifications.js — Pinia store for admin real-time notification events.
 *
 * Events arrive via STOMP from the backend's /topic/admin/** endpoints.
 * Shape: { type: string, payload: object, occurredAt: ISO string }
 *
 * The store holds a capped rolling list (newest first) and exposes
 * unreadCount for badge display.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAdminNotificationsStore = defineStore('adminNotifications', () => {
  const notifications = ref([]) // newest-first array
  const MAX_NOTIFS = 50

  const unreadCount = computed(() => notifications.value.length)

  /**
   * Push an incoming STOMP event into the store.
   * @param {object} notif — { type, payload, occurredAt }
   */
  function push(notif) {
    notifications.value.unshift({
      id: `${notif.occurredAt}-${Math.random().toString(36).slice(2, 8)}`,
      type: notif.type,
      title: titleFor(notif.type),
      body: bodyFor(notif.type, notif.payload),
      link: linkFor(notif.type, notif.payload),
      occurredAt: notif.occurredAt,
    })
    if (notifications.value.length > MAX_NOTIFS) {
      notifications.value.length = MAX_NOTIFS
    }
  }

  function markAllRead() {
    notifications.value = []
  }

  return { notifications, unreadCount, push, markAllRead }
})

// ---------------------------------------------------------------------------
// Helpers — keep in sync with backend event type names
// ---------------------------------------------------------------------------

function titleFor(type) {
  return (
    {
      SELLER_APPLICATION_CREATED: 'Đơn đăng ký nhà bán mới',
      ORDER_CREATED: 'Đơn hàng mới',
      RETURN_REQUESTED: 'Yêu cầu hoàn trả mới',
      DISPUTE_OPENED: 'Khiếu nại đơn hàng mới',
      DASHBOARD_SNAPSHOT: 'Cập nhật thống kê',
    }[type] || type
  )
}

function bodyFor(type, p = {}) {
  if (type === 'SELLER_APPLICATION_CREATED')
    return `${p.shopName || '(không tên)'} (${p.applicantEmail || p.applicantId || '—'})`
  if (type === 'ORDER_CREATED')
    return `#${p.orderCode || p.orderId || '—'} — ${p.totalAmount != null ? `${Number(p.totalAmount).toLocaleString('vi-VN')}₫` : '—'}`
  if (type === 'RETURN_REQUESTED')
    return `Đơn #${p.orderCode || p.orderId || '—'}: ${p.reason || '—'}`
  if (type === 'DISPUTE_OPENED')
    return `Đơn #${p.orderCode || p.orderId || '—'} — ${p.disputeType || ''}`
  if (type === 'DASHBOARD_SNAPSHOT')
    return 'Thống kê tổng quan đã được cập nhật.'
  return ''
}

function linkFor(type, p = {}) {
  if (type === 'SELLER_APPLICATION_CREATED')
    return { name: 'admin-seller-applications' }
  if (type === 'ORDER_CREATED' || type === 'RETURN_REQUESTED')
    return { name: 'admin-orders' }
  if (type === 'DISPUTE_OPENED')
    return { name: 'admin-disputes' }
  return null
}
