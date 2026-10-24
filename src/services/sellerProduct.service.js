import apiClient from '@/composables/useApi'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Multipart helper: raw axios instance (bypasses apiClient's JSON Content-Type)
// so we can send multipart/form-data for image uploads.
// Replicates the auth token injection and error-unwrapping of useApi.js.
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
  // Only surface the raw data on success; leave errors for the caller to handle.
  client.interceptors.response.use((response) => response.data, Promise.reject)
  return client
}

export const sellerProductService = {
  list(params = {}) {
    return apiClient.get('/seller/products', { params })
  },
  get(id) {
    return apiClient.get(`/seller/products/${id}`)
  },
  create(payload) {
    return apiClient.post('/seller/products', payload)
  },
  update(id, payload) {
    return apiClient.put(`/seller/products/${id}`, payload)
  },
  remove(id) {
    return apiClient.delete(`/seller/products/${id}`)
  },
  restore(id) {
    return apiClient.post(`/seller/products/${id}/restore`)
  },
  updateStatus(id, status) {
    return apiClient.patch(`/seller/products/${id}/status`, { status })
  },

  /**
   * Upload a single product image.
   * @param {number|string} productId
   * @param {File} file
   * @param {{ altText?: string, isThumbnail?: boolean }} options
   * @returns {Promise<ProductImageDto>} the created image record
   */
  uploadImage(productId, file, { altText = '', isThumbnail = false } = {}) {
    const form = new FormData()
    form.append('file', file)
    form.append('altText', altText)
    form.append('isThumbnail', String(isThumbnail))
    return multipartClient().post(`/seller/products/${productId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Promote an existing image as the thumbnail via a metadata-only PATCH.
   * @param {number|string} productId
   * @param {number|string} imageId
   * @returns {Promise<ProductImageDto>} the updated image record
   */
  promoteThumbnail(productId, imageId) {
    return apiClient.patch(`/seller/products/${productId}/images/${imageId}`, {
      isThumbnail: true,
    })
  },

  /**
   * Delete a product image (soft-delete; can be undone within the window).
   * @param {number|string} productId
   * @param {number|string} imageId
   */
  deleteImage(productId, imageId) {
    return apiClient.delete(`/seller/products/${productId}/images/${imageId}`)
  },
  /**
   * Restore a previously soft-deleted product image (undo).
   * @param {number|string} productId
   * @param {number|string} imageId
   * @returns {Promise<ProductImageDto>} the restored image record
   */
  restoreImage(productId, imageId) {
    return apiClient.post(`/seller/products/${productId}/images/${imageId}/restore`)
  },
}
