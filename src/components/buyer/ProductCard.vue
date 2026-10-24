<template>
  <!-- NO MALL Product Card -->
  <div class="nomall-product-card" @click="$emit('click', product)">
    <!-- Image -->
    <div class="card-img-wrap">
      <router-link
        :to="{ name: 'product-detail', params: { slug: product.slug } }"
        class="w-100 h-100 d-flex align-items-center justify-content-center"
        @click.stop
      >
        <img
          :src="product.thumbnailUrl || placeholderImg"
          :alt="product.name"
          loading="lazy"
          @error="onImgError"
        />
      </router-link>

      <!-- Discount badge -->
      <span v-if="discountPct > 0" class="nomall-discount-badge">
        -{{ discountPct }}%
      </span>

      <!-- Wishlist button -->
      <button
        v-if="!compact"
        class="nomall-wishlist-btn"
        :class="{ active: isWishlisted }"
        :disabled="togglingWishlist"
        @click.stop="toggleWishlist"
        :title="isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'"
      >
        <i :class="isWishlisted ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
      </button>
    </div>

    <!-- Body -->
    <div class="nomall-card-body">
      <!-- Brand chip -->
      <div v-if="product.brand && !compact" class="d-flex align-items-center gap-1">
        <span class="nomall-brand-chip">{{ product.brand }}</span>
      </div>

      <!-- Product name -->
      <router-link
        :to="{ name: 'product-detail', params: { slug: product.slug } }"
        class="nomall-product-name"
        @click.stop
      >
        {{ product.name }}
      </router-link>

      <!-- Rating -->
      <div v-if="!compact && product.ratingAvg" class="nomall-rating">
        <span class="nomall-rating-stars">
          <i v-for="n in 5" :key="n" :class="['bi', n <= Math.round(product.ratingAvg) ? 'bi-star-fill' : 'bi-star']"></i>
        </span>
        <span class="nomall-rating-count">({{ product.ratingCount || 0 }})</span>
      </div>

      <!-- Price -->
      <div class="nomall-price-row">
        <span class="nomall-price-sale">{{ formatCurrency(displayPrice) }}</span>
        <span v-if="displayOriginal > displayPrice" class="nomall-price-original">
          {{ formatCurrency(displayOriginal) }}
        </span>
      </div>

      <!-- Sold + progress bar (flash sale / non-compact) -->
      <div v-if="!compact || soldPercent > 0" class="nomall-sold-row">
        <span class="nomall-sold-text">Đã bán {{ product.soldCount || soldFake }}</span>
        <div class="nomall-sold-bar">
          <div class="nomall-sold-bar-fill" :style="'width:' + (soldPercent || 0) + '%'"></div>
        </div>
      </div>
    </div>

    <!-- Add to cart (non-compact only) -->
    <div v-if="!compact" class="px-2 pb-2">
      <button
        class="nomall-add-cart-btn"
        @click.stop="$emit('add-to-cart', product)"
        title="Thêm vào giỏ hàng"
      >
        <i class="bi bi-cart-plus"></i>
        <span>Thêm vào giỏ</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import { wishlistService } from '@/services/wishlist.service'

const props = defineProps({
  product: { type: Object, required: true },
  compact: { type: Boolean, default: false },
  soldPercent: { type: Number, default: 0 },
})

defineEmits(['click', 'add-to-cart'])

const auth = useAuthStore()
const notify = useNotifyStore()
const placeholderImg = 'https://picsum.photos/seed/' + (Math.floor(Math.random() * 1000)) + '/400/400'
const isWishlisted = ref(false)
const togglingWishlist = ref(false)
const soldFake = computed(() => {
  // Fake sold count based on discount to look realistic
  const base = Math.floor(Math.random() * 200) + 50
  return base
})

const discountPct = computed(() => {
  if (props.product.maxPrice && props.product.minPrice && props.product.maxPrice > props.product.minPrice) {
    return Math.round(((props.product.maxPrice - props.product.minPrice) / props.product.maxPrice) * 100)
  }
  return 0
})

const displayPrice = computed(() => {
  return props.product.minPrice || props.product.price || 0
})

const displayOriginal = computed(() => {
  if (props.product.maxPrice && props.product.maxPrice > props.product.minPrice) {
    return props.product.maxPrice
  }
  return props.product.price || displayPrice.value
})

const formatCurrency = (val) => {
  if (!val) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val)
}

const onImgError = (e) => {
  e.target.src = 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/400/400'
}

const toggleWishlist = async () => {
  if (!auth.isAuthenticated) {
    notify.push('Vui lòng đăng nhập để lưu sản phẩm!', 'warning')
    return
  }
  togglingWishlist.value = true
  try {
    const resp = await wishlistService.toggle(props.product.id)
    isWishlisted.value = resp.data?.wishlisted ?? !isWishlisted.value
    notify.push(isWishlisted.value ? 'Đã thêm vào yêu thích!' : 'Đã xóa khỏi yêu thích!', 'success')
  } catch (_) {
    notify.push('Không thể cập nhật yêu thích.', 'danger')
  } finally {
    togglingWishlist.value = false
  }
}
</script>
