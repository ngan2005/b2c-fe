import apiClient from '@/composables/useApi'

export const aiService = {
  chat(message, conversationId = null) {
    return apiClient.post('/ai/chat', { message, conversationId })
  },
  generateDescription(payload) {
    return apiClient.post('/ai/generate-description', payload)
  },
}
