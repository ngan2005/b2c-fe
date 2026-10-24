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

export const userAddressService = {
  getProfile() {
    return apiClient.get('/users/me')
  },
  updateProfile(payload) {
    return apiClient.put('/users/me', payload)
  },
  /**
   * POST /api/v1/users/me/avatar (multipart/form-data)
   * Uploads a new personal avatar and returns
   * { avatarUrl, avatarPublicId, format, bytes }.
   *
   * @param {File} file
   * @returns {Promise<{ avatarUrl: string, avatarPublicId: string, format: string, bytes: number }>}
   */
  uploadAvatar(file) {
    const form = new FormData()
    form.append('file', file)
    return multipartClient().post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  changePassword(payload) {
    return apiClient.post('/users/change-password', payload)
  },
  getAddresses() {
    return apiClient.get('/users/addresses')
  },
  createAddress(payload) {
    return apiClient.post('/users/addresses', payload)
  },
  getAddress(id) {
    return apiClient.get(`/users/addresses/${id}`)
  },
  updateAddress(id, payload) {
    return apiClient.put(`/users/addresses/${id}`, payload)
  },
  deleteAddress(id) {
    return apiClient.delete(`/users/addresses/${id}`)
  },
  setDefaultAddress(id) {
    return apiClient.put(`/users/addresses/${id}/default`)
  },
}
