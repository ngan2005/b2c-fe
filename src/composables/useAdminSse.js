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
 * Connects to /api/v1/admin/sse/{topic}?token=... using EventSource.
 * Auto-reconnects with exponential back-off on disconnect, handles heartbeats,
 * and tears down cleanly on unmount or logout.
 */
import { ref, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Base API URL with /api/v1 (e.g. http://localhost:8080/api/v1)
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1').replace(/\/+$/, '')

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
    return `${API_BASE}/admin/sse/${topic}?token=${encodeURIComponent(token)}`
  }

  function parseEvent(event) {
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
      if (!handles.has(topic)) return
      if (!auth.token) return

      const currentUrl = buildUrl(topic)
      if (!currentUrl) return

      try {
        handle.emitter = new EventSource(currentUrl, { withCredentials: false })
      } catch (err) {
        lastError.value = `Failed to create EventSource: ${err.message}`
        scheduleReconnect(topic)
        return
      }

      handle.emitter.onopen = () => {
        isConnected.value = true
        lastError.value = null
        handle.attempt = 0
      }

      function handleIncoming(e) {
        const msg = parseEvent(e)
        if (msg) {
          try {
            callback(msg)
          } catch (err) {
            console.error('[useAdminSse] callback error:', err)
          }
        }
      }

      handle.emitter.onmessage = handleIncoming
      handle.emitter.addEventListener('message', handleIncoming)
      handle.emitter.addEventListener('hello', () => {
        isConnected.value = true
        lastError.value = null
      })

      handle.emitter.onerror = () => {
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
      if (h.reconnectTimer != null) {
        clearTimeout(h.reconnectTimer)
        h.reconnectTimer = null
      }
      if (h.emitter) {
        try { h.emitter.close() } catch {}
        h.emitter = null
      }
    }
    handles.clear()
    isConnected.value = false
  }

  function init() {
    closeAll()
    streams.forEach(({ topic, callback }) => open(topic, callback))
  }

  init()

  watch(() => auth.token, (newToken) => {
    if (newToken) {
      init()
    } else {
      closeAll()
    }
  })

  onUnmounted(() => {
    closeAll()
  })

  return { isConnected, lastError }
}
