<template>
  <div class="card h-100 border-slate-200/80 rounded-2xl overflow-hidden card-hover bg-white d-flex flex-column shadow-xs">
    <!-- Thumbnail Image Container -->
    <div class="position-relative overflow-hidden bg-slate-50 aspect-square p-2 d-flex align-items-center justify-content-center">
      <router-link :to="{ name: 'product-detail', params: { slug: product.slug } }" class="w-100 h-100 d-flex align-items-center justify-content-center">
        <img
          :src="product.thumbnailUrl || placeholderImg"
          :alt="product.name"
          class="max-w-full max-h-full object-contain transition-transform duration-500 hover:scale-105"
          @error="handleImgError"
        />
      </router-link>

      <!-- Discount Tag -->
      <span v-if="discountPercentage > 0" class="position-absolute top-2 start-2 badge bg-rose-600 text-white font-semibold px-1.5 py-0.5 text-[11px] rounded-md shadow-sm">
        -{{ discountPercentage }}%
      </span>

      <!-- Wishlist / Favorite Button -->
      <button
        :class="[
          'position-absolute top-2 end-2 w-7 h-7 rounded-full d-flex align-items-center justify-content-center border-0 shadow-xs transition-all text-xs',
          isFavorite ? 'bg-rose-100 text-rose-500 hover:bg-rose-200' : 'bg-white/90 hover:bg-white text-slate-500 hover:text-rose-500'
        ]"
        :disabled="toggling"
        title="Lưu vào yêu thích"
        @click.prevent="toggleFavorite"
      >
        <i v-if="toggling" class="bi bi-arrow-repeat spin"></i>
        <i v-else :class="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
      </button>
    </div>

    <!-- Product Info -->
    <div class="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
      <div>
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[100px]">
            {{ product.categoryName || 'Khác' }}
          </span>
          <div v-if="product.ratingAvg" class="d-flex align-items-center text-amber-500 text-[11px] font-medium">
            <i class="bi bi-star-fill me-1"></i>
            <span>{{ Number(product.ratingAvg).toFixed(1) }}</span>
          </div>
        </div>

        <h3 class="font-semibold text-slate-800 text-xs mb-1.5 line-clamp-2 hover:text-blue-600 transition-colors leading-snug">
          <router-link :to="{ name: 'product-detail', params: { slug: product.slug } }" class="text-reset text-decoration-none">
            {{ product.name }}
          </router-link>
        </h3>
      </div>

      <div class="pt-2 border-t border-slate-100 mt-1 d-flex align-items-center justify-content-between">
        <div>
          <div class="font-bold text-slate-900 text-sm">
            {{ formatCurrency(product.minPrice) }}
          </div>
          <div v-if="product.maxPrice && product.maxPrice > product.minPrice" class="text-[10px] text-slate-400">
            đến {{ formatCurrency(product.maxPrice) }}
          </div>
        </div>

        <button
          class="btn btn-sm btn-outline-primary rounded-lg d-flex align-items-center gap-1 font-medium px-2 py-1 text-xs"
          title="Thêm vào giỏ hàng"
          @click.prevent="$emit('add-to-cart', product)"
        >
          <i class="bi bi-bag-plus"></i>
          <span class="d-none d-sm-inline">Thêm</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { wishlistService } from '@/services/wishlist.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'

const props = defineProps({
  product: { type: Object, required: true },
})

const emit = defineEmits(['add-to-cart'])
const auth = useAuthStore()
const notify = useNotifyStore()
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'
const isFavorite = ref(false)
const toggling = ref(false)

const toggleFavorite = async () => {
  if (!auth.isAuthenticated) {
    notify.push('Vui lòng đăng nhập để lưu sản phẩm!', 'warning')
    return
  }
  toggling.value = true
  try {
    const resp = await wishlistService.toggle(props.product.id)
    isFavorite.value = resp.data?.wishlisted ?? !isFavorite.value
  } catch (_) {
    notify.push('Không thể cập nhật yêu thích. Vui lòng thử lại.', 'danger')
  } finally {
    toggling.value = false
  }
}

const handleImgError = (e) => {
  e.target.src = placeholderImg
}

const discountPercentage = computed(() => {
  if (props.product.maxPrice && props.product.minPrice && props.product.maxPrice > props.product.minPrice) {
    const diff = props.product.maxPrice - props.product.minPrice
    return Math.round((diff / props.product.maxPrice) * 100)
  }
  return 0
})

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}
</script>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
