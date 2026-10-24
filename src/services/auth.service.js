import apiClient from '@/composables/useApi'

export const authService = {
  async login(payload) {
    return apiClient.post('/auth/login', payload)
  },
  async register(payload) {
    return apiClient.post('/auth/register', payload)
  },
  async refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh-token', { refreshToken })
  },
  async me() {
    return apiClient.get('/users/me')
  },
  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email })
  },
  async resetPassword(payload) {
    return apiClient.post('/auth/reset-password', payload)
  },
}
