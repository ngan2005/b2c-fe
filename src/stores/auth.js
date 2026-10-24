import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'b2c.auth'
const TOKEN_KEY = STORAGE_KEY + '.token'
const REFRESH_KEY = STORAGE_KEY + '.refreshToken'
const USER_KEY = STORAGE_KEY + '.user'

function readStored(key) {
  try {
    return localStorage.getItem(key) || ''
  } catch (_) {
    return ''
  }
}

function readStoredJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readStored(TOKEN_KEY))
  const refreshToken = ref(readStored(REFRESH_KEY))
  const user = ref(readStoredJSON(USER_KEY))

  const isAuthenticated = computed(() => !!token.value)

  /**
   * All roles the user holds (array of uppercase strings).
   * Backward-compat: if user.roles is missing but user.role exists, wrap it.
   */
  const roles = computed(() => {
    if (!user.value) return []
    if (Array.isArray(user.value.roles) && user.value.roles.length > 0) {
      return user.value.roles.map(r => String(r).toUpperCase())
    }
    // Fallback for legacy stored users or API responses that only have `role`
    const single = user.value?.role
    return single ? [String(single).toUpperCase()] : []
  })

  /**
   * Primary (highest-priority) role — first element of the sorted roles array.
   * ADMIN > SELLER > BUYER (ADMIN wins if user has multiple).
   * Kept for backward compatibility.
   */
  const role = computed(() => roles.value[0] || '')

  const isBuyer  = computed(() => roles.value.includes('BUYER'))
  const isSeller = computed(() => roles.value.includes('SELLER'))
  const isAdmin  = computed(() => roles.value.includes('ADMIN'))

  function setSession(nextToken, nextUser, nextRefreshToken) {
    token.value = nextToken || ''
    user.value = nextUser || null
    refreshToken.value = nextRefreshToken || ''
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
    if (nextRefreshToken) localStorage.setItem(REFRESH_KEY, nextRefreshToken)
    else localStorage.removeItem(REFRESH_KEY)
  }

  function updateTokens(nextAccessToken, nextRefreshToken) {
    token.value = nextAccessToken || ''
    refreshToken.value = nextRefreshToken || refreshToken.value
    if (nextAccessToken) localStorage.setItem(TOKEN_KEY, nextAccessToken)
    if (nextRefreshToken) localStorage.setItem(REFRESH_KEY, nextRefreshToken)
  }

  function clear() {
    setSession(null, null, null)
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    role,
    roles,
    isBuyer,
    isSeller,
    isAdmin,
    setSession,
    updateTokens,
    clear,
  }
})
