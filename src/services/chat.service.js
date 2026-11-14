import apiClient from '@/composables/useApi'

// Backend endpoints (ChatController.java):
// - GET    /api/v1/conversations                    -> list conversations for current user (auto-detects role)
// - GET    /api/v1/buyer/conversations              -> list buyer conversations
// - GET    /api/v1/seller/conversations             -> list seller conversations
// - POST   /api/v1/conversations?sellerId=...       -> start/get buyer-seller conversation
// - GET    /api/v1/conversations/{id}               -> get one conversation
// - GET    /api/v1/conversations/{id}/messages      -> list messages
// - POST   /api/v1/conversations/{id}/messages      -> send message
// - POST   /api/v1/conversations/{id}/read          -> mark conversation read
export const chatService = {
  /**
   * Start or retrieve existing conversation with a seller (as Buyer)
   */
  startConversation(sellerId) {
    return apiClient.post('/conversations', null, { params: { sellerId } })
  },

  /**
   * List conversations for current user (auto-detects buyer or seller)
   */
  getConversations(params = {}) {
    return apiClient.get('/conversations', { params })
  },

  /**
   * List conversations specifically for seller
   */
  listSellerConversations(params = {}) {
    return apiClient.get('/seller/conversations', { params })
  },

  /**
   * List conversations specifically for buyer
   */
  listBuyerConversations(params = {}) {
    return apiClient.get('/buyer/conversations', { params })
  },

  /**
   * Get single conversation details
   */
  getConversation(conversationId) {
    return apiClient.get(`/conversations/${conversationId}`)
  },

  /**
   * Get message history for a conversation
   */
  getMessages(conversationId, params = {}) {
    return apiClient.get(`/conversations/${conversationId}/messages`, { params })
  },

  /**
   * Send a message
   */
  sendMessage(conversationId, payload) {
    return apiClient.post(`/conversations/${conversationId}/messages`, payload)
  },

  /**
   * Mark all messages in a conversation as read
   */
  markAsRead(conversationId) {
    return apiClient.post(`/conversations/${conversationId}/read`)
  },
}
