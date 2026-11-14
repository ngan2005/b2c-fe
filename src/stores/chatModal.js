import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatService } from '@/services/chat.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'

export const useChatModalStore = defineStore('chatModal', () => {
  const auth = useAuthStore()
  const notify = useNotifyStore()

  const isOpen = ref(false)
  const isMinimized = ref(false)
  const loading = ref(false)
  const activeConversation = ref(null)
  const targetProduct = ref(null)

  /**
   * Open chat with a specific seller (e.g. from Product Detail page)
   */
  async function openChatWithSeller(sellerId, shopInfo = {}, productInfo = null) {
    if (!auth.isAuthenticated) {
      notify.push('Vui lòng đăng nhập để bắt đầu nhắn tin với Shop!', 'warning')
      return false
    }

    if (!sellerId) {
      notify.push('Không tìm thấy thông tin người bán!', 'warning')
      return false
    }

    isOpen.value = true
    isMinimized.value = false
    targetProduct.value = productInfo
    loading.value = true

    try {
      const res = await chatService.startConversation(sellerId)
      const convData = res.data || res
      activeConversation.value = {
        ...convData,
        shopName: convData.shopName || shopInfo.shopName || 'Shop',
        shopAvatar: convData.shopAvatar || shopInfo.shopAvatar || null,
        sellerId: convData.sellerId || sellerId,
      }
      return true
    } catch (err) {
      console.error('Failed to start conversation:', err)
      const msg = err.response?.data?.message || 'Không thể tạo cuộc hội thoại với shop lúc này.'
      notify.push(msg, 'danger')
      isOpen.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  function openConversation(conv) {
    activeConversation.value = conv
    targetProduct.value = null
    isOpen.value = true
    isMinimized.value = false
  }

  function closeChat() {
    isOpen.value = false
  }

  function toggleMinimize() {
    isMinimized.value = !isMinimized.value
  }

  function clearTargetProduct() {
    targetProduct.value = null
  }

  return {
    isOpen,
    isMinimized,
    loading,
    activeConversation,
    targetProduct,
    openChatWithSeller,
    openConversation,
    closeChat,
    toggleMinimize,
    clearTargetProduct,
  }
})

