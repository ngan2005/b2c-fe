import apiClient from '@/composables/useApi'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

/**
 * Multipart helper: raw axios instance (bypasses apiClient's JSON
 * Content-Type) so we can send multipart/form-data for image uploads.
 * Replicates the auth token injection of useApi.js.
 */
function multipartClient() {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1',
    timeout: 30000,
  })
  client.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
    return config
  })
  // Unwrap the standard ApiResponse envelope so callers receive `data` directly,
  // mirroring useApi.js behaviour.
  client.interceptors.response.use((response) => {
    const payload = response.data
    if (payload && typeof payload === 'object' && 'code' in payload && 'data' in payload) {
      return payload.data
    }
    return payload
  }, Promise.reject)
  return client
}

export const sellerProfileService = {
  /**
   * GET /api/v1/seller/profile
   * Returns the authenticated seller's own profile.
   */
  getProfile() {
    return apiClient.get('/seller/profile')
  },

  /**
   * POST /api/v1/seller/profile/logo (multipart/form-data)
   * Uploads a new shop avatar and returns { logoUrl, logoPublicId, format, bytes }.
   *
   * @param {File} file
   * @returns {Promise<{ logoUrl: string, logoPublicId: string, format: string, bytes: number }>}
   */
  uploadLogo(file) {
    const form = new FormData()
    form.append('file', file)
    return multipartClient().post('/seller/profile/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
