import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartService } from '@/services/cart.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const authStore = useAuthStore()

  const totalItemsCount = computed(() => {
    return items.value.reduce((acc, item) => acc + (item.quantity || 0), 0)
  })

  const subtotalPrice = computed(() => {
    return items.value
      .filter((i) => i.isSelected !== false)
      .reduce((acc, item) => acc + (item.priceSnapshot || 0) * (item.quantity || 0), 0)
  })

  async function fetchCart() {
    if (!authStore.isAuthenticated) {
      items.value = []
      return
    }
    loading.value = true
    try {
      const data = await cartService.getCart()
      items.value = Array.isArray(data) ? data : []
    } catch (_) {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function addItem(variantId, quantity = 1) {
    if (!authStore.isAuthenticated) return false
    try {
      await cartService.addItem({ variantId, quantity })
      await fetchCart()
      return true
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể thêm vào giỏ hàng'
      const notify = useNotifyStore()
      notify.push(msg === 'Requested quantity not available' ? 'Số lượng yêu cầu vượt quá tồn kho khả dụng!' : msg, 'danger')
      return false
    }
  }

  async function updateQuantity(cartItemId, quantity, isSelected = true) {
    try {
      await cartService.updateItem(cartItemId, { quantity, isSelected })
      await fetchCart()
      return true
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật giỏ hàng'
      const notify = useNotifyStore()
      notify.push(msg === 'Requested quantity not available' ? 'Số lượng yêu cầu vượt quá tồn kho khả dụng!' : msg, 'warning')
      await fetchCart()
      return false
    }
  }

  async function removeItem(cartItemId) {
    try {
      await cartService.removeItem(cartItemId)
      await fetchCart()
      const notify = useNotifyStore()
      notify.push('Đã xóa sản phẩm khỏi giỏ hàng', 'info')
      return true
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa sản phẩm'
      const notify = useNotifyStore()
      notify.push(msg, 'danger')
      return false
    }
  }

  function clearCart() {
    items.value = []
  }

  return {
    items,
    loading,
    totalItemsCount,
    subtotalPrice,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }
})
