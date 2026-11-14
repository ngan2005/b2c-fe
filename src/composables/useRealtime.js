/**
 * useRealtime.js — STOMP/SockJS composable for real-time events.
 *
 * Usage:
 *   const { isConnected, lastError, subscribe } = useRealtime({
 *     topics: [
 *       { destination: '/topic/admin/dashboard', callback: (msg) => {} },
 *       { destination: '/topic/admin/presence',  callback: (msg) => {} },
 *     ]
 *   })
 *
 * Connects to /ws via STOMP/SockJS with JWT auth (when logged in) or anonymously.
 * Auto-reconnects with exponential backoff on disconnect, and reacts to token changes.
 * Supports static topic configuration as well as dynamic `subscribe(destination, callback)`.
 */
import { ref, onUnmounted, watch } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/stores/auth'

// Resolve API origin (e.g. http://localhost:8080)
const API_ORIGIN = new URL(
  import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1',
).origin

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
  let isExplicitlyClosed = false

  // Store dynamic subscriptions: Map<Symbol, { destination, callback, stompSub }>
  const activeSubscriptions = new Map()

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
    if (isExplicitlyClosed) return
    if (reconnectTimer != null) return // Avoid duplicate scheduling

    const delay = Math.min(BASE_DELAY * 2 ** attempt + Math.random() * 500, MAX_DELAY)
    attempt++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  function connect() {
    if (isExplicitlyClosed) return
    if (stompClient && stompClient.connected) return

    const token = auth.token
    const wsUrl = token
      ? `${API_ORIGIN}/ws?token=${encodeURIComponent(token)}`
      : `${API_ORIGIN}/ws`

    stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      reconnectDelay: 0, // We control reconnection with exponential backoff
      onConnect: () => {
        isConnected.value = true
        lastError.value = null
        attempt = 0

        // 1. Subscribe static topics configured in options
        topics.forEach(({ destination, callback }) => {
          try {
            stompClient.subscribe(destination, (frame) => {
              callback(parseMessage(frame.body))
            })
          } catch (err) {
            console.warn('[useRealtime] Failed to subscribe to', destination, err)
          }
        })

        // 2. Re-subscribe any dynamic active subscriptions
        activeSubscriptions.forEach((subEntry) => {
          try {
            subEntry.stompSub = stompClient.subscribe(subEntry.destination, (frame) => {
              subEntry.callback(parseMessage(frame.body))
            })
          } catch (err) {
            console.warn('[useRealtime] Failed to re-subscribe to', subEntry.destination, err)
          }
        })
      },
      onDisconnect: () => {
        isConnected.value = false
        // Clear stompSub references on disconnect
        activeSubscriptions.forEach((entry) => {
          entry.stompSub = null
        })
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

  function subscribe(destination, callback) {
    if (!destination || !callback) return () => {}

    const subKey = Symbol()
    const subEntry = {
      destination,
      callback,
      stompSub: null,
    }

    if (stompClient && stompClient.connected) {
      try {
        subEntry.stompSub = stompClient.subscribe(destination, (frame) => {
          callback(parseMessage(frame.body))
        })
      } catch (e) {
        console.warn('[useRealtime] error in direct subscribe', e)
      }
    }

    activeSubscriptions.set(subKey, subEntry)

    // Return unsubscribe function
    return () => {
      if (subEntry.stompSub) {
        try {
          subEntry.stompSub.unsubscribe()
        } catch {}
      }
      activeSubscriptions.delete(subKey)
    }
  }

  function disconnect() {
    clearReconnectTimer()
    if (stompClient) {
      try {
        stompClient.deactivate()
      } catch {}
      stompClient = null
    }
    isConnected.value = false
  }

  connect()

  // React to login/logout or token refresh
  watch(() => auth.token, (newToken, oldToken) => {
    if (newToken !== oldToken) {
      disconnect()
      connect()
    }
  })

  onUnmounted(() => {
    isExplicitlyClosed = true
    disconnect()
  })

  return { isConnected, lastError, subscribe }
}
