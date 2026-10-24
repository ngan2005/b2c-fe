<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h1 class="font-extrabold text-slate-900 text-2xl md:text-3xl">Sản Phẩm Yêu Thích</h1>
          <p v-if="!loading && totalElements > 0" class="text-sm text-slate-500 mt-1">
            {{ totalElements }} sản phẩm đã lưu
          </p>
        </div>
        <router-link :to="{ name: 'products' }" class="btn btn-sm btn-outline-primary rounded-xl d-flex align-items-center gap-1">
          <i class="bi bi-bag"></i> Tiếp tục mua sắm
        </router-link>
      </div>

      <!-- Loading State -->
      <LoadingSpinner v-if="loading" text="Đang tải danh sách yêu thích..." />

      <!-- Error State -->
      <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchWishlist" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="items.length === 0"
        title="Chưa có sản phẩm yêu thích"
        description="Hãy thêm những sản phẩm bạn thích vào danh sách yêu thích để mua sắm dễ dàng hơn."
      >
        <template #action>
          <router-link :to="{ name: 'products' }">
            <BaseButton variant="primary" size="sm">Khám phá sản phẩm</BaseButton>
          </router-link>
        </template>
      </EmptyState>

      <!-- Wishlist Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm d-flex flex-column"
        >
          <!-- Product Image -->
          <div class="position-relative bg-slate-100 overflow-hidden aspect-square">
            <router-link :to="{ name: 'product-detail', params: { slug: item.productSlug } }">
              <img
                :src="item.productThumbnail || placeholderImg"
                :alt="item.productName"
                class="w-100 h-100 object-cover hover:scale-105 transition-transform duration-500"
                @error="(e) => e.target.src = placeholderImg"
              />
            </router-link>
            <!-- Remove Button -->
            <button
              class="position-absolute top-2 end-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-rose-500 d-flex align-items-center justify-content-center border-0 shadow-sm transition-colors"
              title="Xóa khỏi yêu thích"
              @click="handleRemove(item)"
            >
              <i class="bi bi-x-lg"></i>
            </button>
            <!-- Out of Stock Badge -->
            <span
              v-if="item.status !== 'ACTIVE'"
              class="position-absolute bottom-2 start-2 badge bg-slate-700 text-white text-xs font-semibold px-2 py-1 rounded-lg"
            >
              Không còn bán
            </span>
          </div>

          <!-- Product Info -->
          <div class="p-3 d-flex flex-column justify-content-between flex-grow-1">
            <div class="space-y-1">
              <!-- Seller -->
              <p v-if="item.sellerName" class="text-xs text-slate-400 truncate">
                <i class="bi bi-shop me-1"></i>{{ item.sellerName }}
              </p>
              <!-- Product Name -->
              <router-link
                :to="{ name: 'product-detail', params: { slug: item.productSlug } }"
                class="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-blue-600 transition-colors text-decoration-none d-block"
              >
                {{ item.productName }}
              </router-link>
            </div>

            <!-- Price -->
            <div class="mt-3">
              <div class="font-bold text-slate-900 text-base">
                {{ formatCurrency(item.minPrice) }}
              </div>
              <div
                v-if="item.maxPrice && item.maxPrice > item.minPrice"
                class="text-xs text-slate-400"
              >
                - {{ formatCurrency(item.maxPrice) }}
              </div>
            </div>

            <!-- Add to Cart -->
            <div class="mt-3">
              <button
                class="btn btn-sm btn-primary w-100 rounded-xl d-flex align-items-center justify-content-center gap-1 font-semibold"
                :disabled="item.status !== 'ACTIVE' || addingId === item.id"
                @click="handleAddToCart(item)"
              >
                <i :class="addingId === item.id ? 'bi bi-arrow-repeat spin' : 'bi bi-cart-plus'"></i>
                <span v-if="addingId === item.id">Đang thêm...</span>
                <span v-else>Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <BasePagination
        v-if="!loading && items.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-elements="totalElements"
        :is-first="isFirst"
        :is-last="isLast"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wishlistService } from '@/services/wishlist.service'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const notify = useNotifyStore()

const loading = ref(true)
const errorMsg = ref('')
const items = ref([])
const currentPage = ref(0)
const totalPages = ref(1)
const totalElements = ref(0)
const isFirst = ref(true)
const isLast = ref(true)
const addingId = ref(null)
const pageSize = 20

const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'

const fetchWishlist = async (page = 0) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const resp = await wishlistService.list({ page, size: pageSize })
    const data = (resp && resp.content) ? resp : (resp?.data?.data || resp?.data || resp || {})
    items.value = data.content || []
    currentPage.value = data.number ?? 0
    totalPages.value = data.totalPages ?? 1
    totalElements.value = data.totalElements ?? 0
    isFirst.value = data.first ?? true
    isLast.value = data.last ?? true
  } catch (err) {
    errorMsg.value = 'Không thể tải danh sách yêu thích. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  fetchWishlist(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleRemove = async (item) => {
  try {
    await wishlistService.remove(item.productId)
    notify.push('Đã xóa sản phẩm khỏi danh sách yêu thích!', 'success')
    await fetchWishlist(currentPage.value)
  } catch (err) {
    notify.push('Không thể xóa sản phẩm. Vui lòng thử lại.', 'danger')
  }
}

const handleAddToCart = async (item) => {
  if (!authStore.isAuthenticated) {
    notify.push('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'warning')
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }

  addingId.value = item.id
  try {
    // For now, redirect to product detail where the full add-to-cart flow exists
    notify.push('Đang chuyển đến trang sản phẩm để thêm vào giỏ hàng...', 'info')
    router.push({ name: 'product-detail', params: { slug: item.productSlug } })
  } catch (_) {
    notify.push('Không thể thêm sản phẩm vào giỏ hàng.', 'danger')
  } finally {
    addingId.value = null
  }
}

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

onMounted(() => fetchWishlist(0))
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
