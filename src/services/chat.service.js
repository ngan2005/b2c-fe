import apiClient from '@/composables/useApi'

// Backend routes (confirmed against ChatController.java):
// - GET    /api/v1/seller/conversations             -> list seller's conversations
// - GET    /api/v1/conversations/{id}               -> get one conversation
// - POST   /api/v1/conversations                    -> create conversation
// - GET    /api/v1/conversations/{id}/messages      -> list messages (shared, no role prefix)
// - POST   /api/v1/conversations/{id}/messages      -> send message
export const chatService = {
  /** List the seller's chat conversations (paginated) */
  listConversations(params = {}) {
    return apiClient.get('/seller/conversations', { params })
  },
  /** Get the message history for a specific conversation */
  getMessages(conversationId, params = {}) {
    return apiClient.get(`/conversations/${conversationId}/messages`, { params })
  },
  /** Send a message in a conversation */
  sendMessage(conversationId, payload) {
    return apiClient.post(`/conversations/${conversationId}/messages`, payload)
  },
}
