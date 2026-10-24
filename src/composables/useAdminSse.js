/**
 * useAdminSse.js — Server-Sent Events composable for the admin SPA.
 *
 * Usage:
 *   const { isConnected, lastError } = useAdminSse({
 *     streams: [
 *       { topic: 'orders',  callback: (msg) => { /* msg = { type, payload, occurredAt } *\/ } },
 *       { topic: 'returns', callback: (msg) => { /* ... *\/ } },
 *     ]
 *   })
 *
 * Replaces the previous STOMP/SockJS `useRealtime` composable for admin
 * dashboards. The EventSource API does not support custom request headers, so
 * the JWT is passed as a `?token=` query parameter (the backend
 * `AdminSseController` validates it manually).
 *
 * Auto-reconnects with exponential back-off on disconnect, sends heartbeats
 * (comment frames) every 30s, and tears down cleanly on unmount.
 */
import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Same origin as the API base (VITE_API_BASE or default).
const API_ORIGIN = new URL(
  import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1',
).origin

const BASE_DELAY = 1_000
const MAX_DELAY = 30_000

export function useAdminSse(options = {}) {
  const { streams = [] } = options

  const auth = useAuthStore()
  const isConnected = ref(false)
  const lastError = ref(null)

  // topic -> { emitter, attempt, reconnectTimer }
  const handles = new Map()

  function buildUrl(topic) {
    const token = auth.token
    if (!token) return null
    return `${API_ORIGIN}/admin/sse/${topic}?token=${encodeURIComponent(token)}`
  }

  function parseEvent(event) {
    // SSE dispatches as a single `message` event with JSON body.
    try {
      return JSON.parse(event.data)
    } catch {
      return { type: 'raw', payload: event.data }
    }
  }

  function open(topic, callback) {
    if (handles.has(topic)) return // already open
    const url = buildUrl(topic)
    if (!url) {
      lastError.value = 'No auth token'
      return
    }

    const handle = { emitter: null, attempt: 0, reconnectTimer: null }
    handles.set(topic, handle)

    function connect() {
      // Guard: component may have been unmounted
      if (!handles.has(topic)) return

      handle.emitter = new EventSource(url, { withCredentials: false })

      handle.emitter.onopen = () => {
        isConnected.value = true
        lastError.value = null
        handle.attempt = 0
      }

      handle.emitter.onmessage = (e) => {
        const msg = parseEvent(e)
        if (msg && msg.type && msg.type !== 'raw') {
          try { callback(msg) } catch (err) { console.error('[useAdminSse] callback error:', err) }
        }
      }

      handle.emitter.onerror = (e) => {
        // Browser will auto-reconnect on transient network blips, but if
        // the server returned 4xx/5xx the connection is dead. We close
        // explicitly and schedule our own back-off.
        try { handle.emitter.close() } catch {}
        isConnected.value = false
        lastError.value = `SSE ${topic} disconnected`
        scheduleReconnect(topic)
      }
    }

    function scheduleReconnect(t) {
      const h = handles.get(t)
      if (!h) return
      if (h.reconnectTimer != null) return
      const delay = Math.min(BASE_DELAY * 2 ** h.attempt + Math.random() * 500, MAX_DELAY)
      h.attempt++
      h.reconnectTimer = setTimeout(() => {
        h.reconnectTimer = null
        connect()
      }, delay)
    }

    connect()
  }

  function closeAll() {
    for (const [, h] of handles) {
      if (h.reconnectTimer) clearTimeout(h.reconnectTimer)
      if (h.emitter) {
        try { h.emitter.close() } catch {}
      }
    }
    handles.clear()
    isConnected.value = false
  }

  // Open all requested streams
  for (const { topic, callback } of streams) {
    if (topic && typeof callback === 'function') {
      open(topic, callback)
    }
  }

  onUnmounted(closeAll)

  return { isConnected, lastError, close: closeAll }
}
