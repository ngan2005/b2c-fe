/**
 * useRealtime.js — STOMP/SockJS composable for admin real-time events.
 *
 * Usage:
 *   const { isConnected, lastError } = useRealtime({
 *     topics: [
 *       { destination: '/topic/admin/dashboard',     callback: (msg) => {} },
 *       { destination: '/topic/admin/seller-applications', callback: (msg) => {} },
 *       { destination: '/topic/admin/orders',        callback: (msg) => {} },
 *       { destination: '/topic/admin/returns',       callback: (msg) => {} },
 *     ]
 *   })
 *
 * The composable reads the JWT from the auth store, connects on mount,
 * auto-reconnects with exponential backoff on disconnect, and tears down
 * cleanly on unmount.
 */
import { ref, onUnmounted } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/stores/auth'

// Resolve VITE_API_BASE from the same base used by axios in useApi.js
const API_ORIGIN = new URL(
  import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1',
).origin

// Exponential back-off delays (ms) — cycles up to MAX_DELAY
const BASE_DELAY = 1000
const MAX_DELAY = 30_000

export function useRealtime(options = {}) {
  const { topics = [] } = options

  const auth = useAuthStore()
  const isConnected = ref(false)
  const lastError = ref(null)

  let stompClient = null
  let reconnectTimer = null
  let attempt = 0

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  function parseMessage(raw) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  function clearReconnectTimer() {
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function scheduleReconnect() {
    clearReconnectTimer()
    // Exponential back-off with jitter
    const delay = Math.min(BASE_DELAY * 2 ** attempt + Math.random() * 500, MAX_DELAY)
    attempt++
    reconnectTimer = setTimeout(() => {
      connect()
    }, delay)
  }

  // ------------------------------------------------------------------
  // Connect / disconnect
  // ------------------------------------------------------------------

  function connect() {
    if (stompClient && stompClient.connected) return

    const token = auth.token
    if (!token) {
      // Not logged in — silently skip
      return
    }

    // Build the SockJS URL with JWT query param
    const wsUrl = `${API_ORIGIN}/ws?token=${encodeURIComponent(token)}`

    stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl, null, {
        transports: ['websocket', 'xhr-polling'],
      }),
      // Minimal STOMP frame settings
      connectHeaders: {},
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      reconnectDelay: 0, // We handle reconnection manually for back-off control
      onConnect: () => {
        isConnected.value = true
        lastError.value = null
        attempt = 0

        // Subscribe to all topics
        topics.forEach(({ destination, callback }) => {
          stompClient.subscribe(destination, (frame) => {
            callback(parseMessage(frame.body))
          })
        })
      },
      onDisconnect: () => {
        isConnected.value = false
        scheduleReconnect()
      },
      onStompError: (frame) => {
        lastError.value = `STOMP error: ${frame.headers?.message || 'unknown'}`
        console.error('[useRealtime] STOMP error', frame)
      },
      onWebSocketError: (event) => {
        lastError.value = 'WebSocket error'
        console.error('[useRealtime] WebSocket error', event)
      },
      onWebSocketClose: () => {
        isConnected.value = false
        scheduleReconnect()
      },
    })

    stompClient.activate()
  }

  function disconnect() {
    clearReconnectTimer()
    if (stompClient) {
      stompClient.deactivate()
      stompClient = null
    }
    isConnected.value = false
  }

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  connect()

  onUnmounted(() => {
    disconnect()
  })

  return { isConnected, lastError }
}
