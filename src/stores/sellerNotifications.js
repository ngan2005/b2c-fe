/**
 * sellerNotifications.js — Pinia store for seller real-time notification events.
 *
 * Notifications arrive via STOMP from /topic/sellers/commission-rules.
 * Shape: { type: string, payload: object, occurredAt: ISO string }
 *
 * The store holds a capped rolling list (newest first) and exposes
 * unreadCount for badge display.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { sellerNotificationService } from '@/services/sellerNotification.service'

export const useSellerNotificationsStore = defineStore('sellerNotifications', () => {
  const notifications = ref([]) // newest-first array
  const MAX_NOTIFS = 50

  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.isRead).length
  )

  /**
   * Push an incoming STOMP event (or a payload from a DB fetch) into the store.
   * @param {object} payload — { notificationId, ruleId, ruleName, rulePercent,
   *                              action, occurredAt, isRead }
   */
  function push(payload) {
    // Deduplicate by notificationId if present
    if (payload.notificationId) {
      const exists = notifications.value.some(
        (n) => n.notificationId === payload.notificationId
      )
      if (exists) return
    }

    notifications.value.unshift({
      notificationId: payload.notificationId ?? null,
      ruleId:         payload.ruleId         ?? null,
      ruleName:       payload.ruleName       ?? null,
      rulePercent:    payload.rulePercent    ?? null,
      action:         payload.action         ?? null,
      isRead:         payload.isRead         ?? false,
      occurredAt:     payload.occurredAt     ?? new Date().toISOString(),
    })

    if (notifications.value.length > MAX_NOTIFS) {
      notifications.value.length = MAX_NOTIFS
    }
  }

  function markAllRead() {
    notifications.value.forEach((n) => { n.isRead = true })
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await sellerNotificationService.getUnreadCount()
      return data.data?.count ?? 0
    } catch {
      return 0
    }
  }

  /**
   * Fetch the notification list from the API and reconcile with the store.
   * @param {number} page  0-indexed page number
   * @param {number} size  page size
   */
  async function fetchList(page = 0, size = 20) {
    try {
      const { data } = await sellerNotificationService.list({ page, size })
      const items = data.data?.content ?? []

      // Replace the entire list with the fresh page (newest-first from API)
      notifications.value = items.slice(0, MAX_NOTIFS)
    } catch (err) {
      console.error('[sellerNotifications] fetchList failed', err)
    }
  }

  return {
    notifications,
    unreadCount,
    push,
    markAllRead,
    fetchUnreadCount,
    fetchList,
  }
})
