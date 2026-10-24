import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartService } from '@/services/cart.service'
import { useAuthStore } from '@/stores/auth'

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
    } catch (_) {
      return false
    }
  }

  async function updateQuantity(cartItemId, quantity, isSelected = true) {
    try {
      await cartService.updateItem(cartItemId, { quantity, isSelected })
      await fetchCart()
    } catch (_) {}
  }

  async function removeItem(cartItemId) {
    try {
      await cartService.removeItem(cartItemId)
      await fetchCart()
    } catch (_) {}
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
