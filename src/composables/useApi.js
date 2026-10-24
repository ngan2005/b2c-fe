import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'

/**
 * Axios instance wrapping all backend calls. Unwraps the standard ApiResponse
 * envelope so callers receive `data` directly. Surfaces errors via the notify
 * store and clears auth on 401.
 *
 * On 401 from a *protected* endpoint the response interceptor will:
 *   1. Skip refresh for `/auth/login`, `/auth/register`, `/auth/refresh-token`
 *      (so failed logins do not loop).
 *   2. Coalesce parallel 401s into a single refresh call (queue pattern).
 *   3. POST `/auth/refresh-token` with the stored refresh token, persist the
 *      new pair, then retry the original request exactly once.
 *   4. If the refresh call also fails, clear auth, push a toast, and reject
 *      every queued promise.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

const REFRESH_URL = '/auth/refresh-token'
const SKIP_REFRESH_PATHS = new Set([REFRESH_URL, '/auth/login', '/auth/register'])

// Mutex + queue so parallel 401s trigger only one refresh call.
let refreshing = null
let pendingQueue = []

function isSkipRefreshPath(url = '') {
  return SKIP_REFRESH_PATHS.has(url)
}

function enqueueRequest(config) {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ config, resolve, reject })
  })
}

function flushQueue(error, newAccessToken) {
  const queue = pendingQueue
  pendingQueue = []
  queue.forEach(({ config, resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${newAccessToken}`
    // Mark as retried so a second 401 does not loop.
    config.__isRetry = true
    resolve(apiClient.request(config))
  })
}

async function performRefresh() {
  const auth = useAuthStore()
  const refreshToken = auth.refreshToken
  if (!refreshToken) {
    const err = new Error('No refresh token')
    err.isAuthSkip = true
    throw err
  }
  // Use the same client but ensure no Authorization header is sent on the
  // refresh call (refresh token is in the body).
  const response = await apiClient.post(REFRESH_URL, { refreshToken })
  const data = response.data
  return {
    accessToken: data?.accessToken,
    refreshToken: data?.refreshToken,
    user: data
      ? {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        }
      : null,
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data
    // Spring returns { code, message, data, timestamp }; unwrap to data.
    if (payload && typeof payload === 'object' && 'data' in payload && 'code' in payload) {
      return payload.data
    }
    return payload
  },
  (error) => {
    const status = error.response?.status
    const notify = useNotifyStore()
    const auth = useAuthStore()
    const config = error.config || {}

    if (status === 401) {
      // Login / register / refresh-token themselves: surface as normal 401,
      // do NOT attempt to refresh again.
      if (isSkipRefreshPath(config.url) || config.__isRetry) {
        // Keep the legacy behaviour: clear auth if we had one, but suppress
        // the "Session expired" toast for plain login failures.
        if (auth.isAuthenticated) {
          auth.clear()
          notify.push('Session expired. Please login again.', 'danger')
        }
        return Promise.reject(error)
      }

      // No refresh token available: nothing to do but clear + reject.
      if (!auth.refreshToken) {
        auth.clear()
        notify.push('Session expired. Please login again.', 'danger')
        return Promise.reject(error)
      }

      // Coalesce parallel 401s into the same refresh call.
      if (!refreshing) {
        refreshing = performRefresh()
          .then((tokens) => {
            auth.updateTokens(tokens.accessToken, tokens.refreshToken)
            // Keep the user object in sync if the refresh response carried it.
            if (tokens.user && (!auth.user || auth.user.id !== tokens.user.id)) {
              auth.setSession(
                tokens.accessToken,
                tokens.user,
                tokens.refreshToken,
              )
            }
            flushQueue(null, tokens.accessToken)
            return tokens.accessToken
          })
          .catch((refreshErr) => {
            flushQueue(refreshErr, null)
            auth.clear()
            notify.push('Session expired. Please login again.', 'danger')
            throw refreshErr
          })
          .finally(() => {
            refreshing = null
          })
      }

      // Either we just kicked off the refresh (return queued promise) or
      // another 401 beat us to it (queue ourselves and wait).
      return enqueueRequest(config)
    }

    // Skip auto-toast for login/register/refresh — those flows render their own error UI
    if (isSkipRefreshPath(config.url)) {
      return Promise.reject(error)
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed'
    notify.push(message, 'danger')
    return Promise.reject(error)
  },
)

export default apiClient
