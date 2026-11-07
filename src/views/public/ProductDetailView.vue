<template>
  <!-- [PASTEL-REDESIGN] ProductDetailView -->
  <div class="bg-cream min-vh-100 py-4">
    <div class="container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav mb-4">
        <router-link :to="{ name: 'home' }" class="bc-link">Trang chủ</router-link>
        <i class="bi bi-chevron-right bc-sep"></i>
        <router-link :to="{ name: 'products' }" class="bc-link">Sản phẩm</router-link>
        <i class="bi bi-chevron-right bc-sep"></i>
        <span v-if="product" class="bc-current">{{ product.name }}</span>
      </nav>

      <LoadingSpinner v-if="loading" text="Đang tải thông tin chi tiết sản phẩm..." />
      <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchProduct" />
      <div v-else-if="product" class="space-y-4">

        <!-- ── Product Overview Card ───────────────────────── -->
        <div class="card-pastel">
          <div class="row g-5">
            <!-- Image gallery -->
            <div class="col-lg-6">
              <div class="card-pastel mb-3" style="padding: 0; overflow: hidden;">
                <div style="aspect-ratio: 1; background: var(--pastel-cream); display: flex; align-items: center; justify-content: center; border-radius: 20px;">
                  <img :src="selectedImage || product.thumbnailUrl || placeholderImg" :alt="product.name"
                    style="max-height: 100%; max-width: 100%; object-fit: contain; mix-blend-mode: multiply;" />
                </div>
              </div>
              <!-- Thumbnail dots -->
              <div v-if="imagesList.length > 1" class="d-flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="(img, idx) in imagesList"
                  :key="idx"
                  @click="selectedImage = img.imageUrl"
                  :style="selectedImage === img.imageUrl
                    ? 'width: 3.5rem; height: 3.5rem; border-radius: 12px; border: 2px solid var(--pastel-coral); padding: 3px; background: var(--pastel-pink); cursor: pointer; flex-shrink: 0; transition: all 0.2s;'
                    : 'width: 3.5rem; height: 3.5rem; border-radius: 12px; border: 1.5px solid var(--pastel-border); padding: 3px; cursor: pointer; flex-shrink: 0; transition: all 0.2s;'"
                >
                  <img :src="img.imageUrl" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />
                </button>
              </div>
            </div>

            <!-- Product info -->
            <div class="col-lg-6 d-flex flex-column justify-content-between">
              <div>
                <!-- Badges -->
                <div class="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <span class="pill-chip pill-chip-lavender">{{ product.categoryName || 'Danh mục' }}</span>
                  <span v-if="product.brand" class="pill-chip pill-chip-pink">Thương hiệu: {{ product.brand }}</span>
                </div>

                <!-- Name -->
                <h1 class="fw-extrabold mb-3" style="font-size: 1.75rem; color: var(--pastel-ink); line-height: 1.2;">{{ product.name }}</h1>

                <!-- Stats row -->
                <div class="d-flex align-items-center gap-3 py-2 mb-3 flex-wrap"
                  style="border-top: 1.5px solid var(--pastel-border); border-bottom: 1.5px solid var(--pastel-border);">
                  <div class="d-flex align-items-center gap-1" style="color: #f59e0b; font-weight: 700;">
                    <i class="bi bi-star-fill"></i>
                    <span style="color: var(--pastel-ink);">{{ Number(product.ratingAvg || 5).toFixed(1) }}</span>
                    <span style="color: var(--pastel-muted); font-weight: 400; font-size: 0.75rem;">({{ product.ratingCount || 0 }} đánh giá)</span>
                  </div>
                  <span style="color: var(--pastel-border);">|</span>
                  <span style="font-size: 0.8125rem; color: var(--pastel-muted);">Đã bán: <strong style="color: var(--pastel-ink);">{{ product.soldCount || 0 }}</strong></span>
                </div>

                <!-- [VARIANT-FIX] Price box — uses displayPrice (variant-aware) -->
                <div class="card-pastel p-3 mb-3" style="background: var(--pastel-cream); border-color: var(--pastel-pink) !important;">
                  <div class="d-flex align-items-baseline gap-3">
                    <span class="fw-extrabold" style="font-size: 2rem; color: var(--pastel-coral-dark);">{{ formatCurrency(displayPrice) }}</span>
                    <span v-if="selectedVariant?.salePrice" style="font-size: 1rem; color: var(--pastel-muted); text-decoration: line-through;">{{ formatCurrency(selectedVariant.price) }}</span>
                  </div>
                </div>

                <!-- Seller card — [SHOP-PAGE] full card is a link to shop detail -->
                <router-link
                  :to="{ name: 'shop-detail', params: { slug: product.sellerSlug || product.sellerId || '' } }"
                  class="card-pastel p-3 mb-3 d-flex align-items-center justify-content-between text-decoration-none"
                  style="border-color: var(--pastel-pink) !important;"
                >
                  <div class="d-flex align-items-center gap-3">
                    <div class="avatar-ring">
                      <div style="width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--pastel-coral); display: flex; align-items: center; justify-content: center;">
                        <i class="bi bi-shop text-white fs-5"></i>
                      </div>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-0" style="font-size: 0.875rem; color: var(--pastel-ink);">{{ product.shopName || 'B2C Shop' }}</h6>
                      <span style="font-size: 0.75rem; color: var(--pastel-muted);">Nhà bán uy tín</span>
                    </div>
                  </div>
                  <span class="btn-pastel" style="font-size: 0.75rem; padding: 0.35rem 0.875rem; pointer-events: none;">
                    <i class="bi bi-chevron-double-right me-1"></i>Xem shop
                  </span>
                </router-link>

              <!-- [VARIANT-FIX] Variant selector -->
              <div class="card-pastel p-3 mb-3" style="background: var(--pastel-cream); border-color: var(--pastel-pink) !important;">
                <VariantSelector
                  :variants="product.variants || []"
                  :options="product.options || []"
                  :model-value="selectedAttributeValues"
                  :base-price="product.minPrice || product.price || 0"
                  @update:model-value="onVariantSelected"
                />
              </div>

              <!-- Quantity -->
              <div class="d-flex align-items-center gap-3">
                <label class="form-label mb-0">Số lượng</label>
                <div class="qty-stepper">
                  <button @click="quantity = Math.max(1, quantity - 1)">−</button>
                  <input v-model.number="quantity" type="number" min="1" />
                  <button @click="quantity++">+</button>
                </div>
                <span style="font-size: 0.8125rem; color: var(--pastel-muted);">
                  <i class="bi bi-box-seam me-1"></i>Sẵn có:
                  <strong :style="displayStock > 0 ? 'color: var(--pastel-ink);' : 'color: var(--pastel-coral-dark);'">
                    {{ displayStock > 0 ? displayStock : 'Hết hàng' }}
                  </strong>
                </span>
              </div>
              </div>
            </div><!-- /product-info column -->

            <!-- Action buttons -->
              <div class="d-flex gap-3 mt-4 flex-wrap">
                <!-- [VARIANT-FIX] Thêm vào giỏ hàng: disabled when stock is 0 OR selection incomplete -->
                <button
                  class="btn-coral flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                  :disabled="!canAddToCart"
                  :loading="adding"
                  @click="handleAddToCart"
                  style="font-size: 0.875rem; padding: 0.75rem;"
                  :title="!canAddToCart && isMissingSelection ? 'Vui lòng chọn phân loại' : !canAddToCart ? 'Hết hàng' : ''"
                >
                  <i class="bi bi-cart-plus"></i>
                  {{ displayStock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng' }}
                </button>
                <!-- [VARIANT-FIX] Wishlist: unchanged (works without variant) -->
                <button class="btn-pastel d-flex align-items-center justify-content-center gap-2"
                  :style="isWishlisted ? 'background: var(--pastel-coral); color: #fff; border-color: var(--pastel-coral);' : ''"
                  style="font-size: 0.875rem; padding: 0.75rem 1.25rem; min-width: 5rem;"
                  :disabled="togglingWishlist"
                  :loading="togglingWishlist"
                  @click="handleToggleWishlist">
                  <i :class="isWishlisted ? 'bi bi-heart-fill' : 'bi bi-heart'" style="font-size: 1rem;"></i>
                </button>
                <!-- [VARIANT-FIX] Mua ngay: same guard -->
                <button
                  class="btn-coral flex-grow-1"
                  :disabled="!canAddToCart"
                  :loading="buying"
                  @click="handleBuyNow"
                  style="font-size: 0.875rem; padding: 0.75rem;"
                >
                  Mua ngay
                </button>
              </div><!-- /action buttons -->

          </div><!-- /row g-5 -->
        </div><!-- /card-pastel -->

        <!-- ── Description + Specs ─────────────────────────── -->
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="card-pastel">
              <h3 class="fw-bold mb-3" style="font-size: 1.1rem; color: var(--pastel-ink);">Mô Tả Sản Phẩm</h3>
              <p style="font-size: 0.875rem; color: var(--pastel-ink); line-height: 1.7; white-space: pre-line;">
                {{ product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.' }}
              </p>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card-pastel">
              <h3 class="fw-bold mb-3" style="font-size: 1.1rem; color: var(--pastel-ink);">Thông Số Kỹ Thuật</h3>
              <table class="table table-sm mb-0" style="font-size: 0.8125rem;">
                <tbody>
                  <tr><td style="color: var(--pastel-muted); font-weight: 600;">Thương hiệu</td><td class="fw-bold" style="color: var(--pastel-ink);">{{ product.brand || 'Khác' }}</td></tr>
                  <tr><td style="color: var(--pastel-muted); font-weight: 600;">Trọng lượng</td><td class="fw-bold" style="color: var(--pastel-ink);">{{ product.weightGram ? product.weightGram + 'g' : 'N/A' }}</td></tr>
                  <tr><td style="color: var(--pastel-muted); font-weight: 600;">Kích thước</td><td class="fw-bold" style="color: var(--pastel-ink);">{{ product.lengthCm || 0 }} × {{ product.widthCm || 0 }} × {{ product.heightCm || 0 }} cm</td></tr>
                  <tr><td style="color: var(--pastel-muted); font-weight: 600;">Trạng thái</td><td class="fw-bold" style="color: #5bb88a;">Đang bán</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ── Reviews ──────────────────────────────────── -->
        <div class="card-pastel">
          <div class="d-flex align-items-center justify-content-between mb-3 pb-3" style="border-bottom: 1.5px solid var(--pastel-border);">
            <h3 class="fw-bold m-0" style="font-size: 1.1rem; color: var(--pastel-ink);">Đánh Giá Từ Khách Hàng</h3>
            <div class="d-flex align-items-center gap-2">
              <div style="color: #f59e0b; font-weight: 800; font-size: 1rem;"><i class="bi bi-star-fill"></i> {{ Number(product.ratingAvg || 0).toFixed(1) }}</div>
              <span style="font-size: 0.8125rem; color: var(--pastel-muted);">({{ totalReviews }} đánh giá)</span>
            </div>
          </div>

          <LoadingSpinner v-if="loadingReviews" text="Đang tải đánh giá..." />
          <div v-else-if="reviews.length === 0" class="text-center py-5" style="color: var(--pastel-muted);">
            <i class="bi bi-chat-dots fs-1 d-block mb-2"></i>
            <p style="font-size: 0.875rem;">Chưa có đánh giá nào cho sản phẩm này.</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="review in reviews" :key="review.id" class="pb-3" style="border-bottom: 1px solid var(--pastel-border);">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="avatar-ring">
                  <div style="width: 2rem; height: 2rem; border-radius: 50%; background: var(--pastel-pink); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: var(--pastel-coral-dark);">
                    {{ review.reviewerName?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <strong style="font-size: 0.875rem; color: var(--pastel-ink);">{{ review.isAnonymous ? 'Ẩn danh' : review.reviewerName }}</strong>
                    <div style="color: #f59e0b; font-size: 0.75rem;">
                      <i v-for="n in 5" :key="n" :class="['bi', n <= review.rating ? 'bi-star-fill' : 'bi-star']"></i>
                    </div>
                  </div>
                  <small style="color: var(--pastel-muted); font-size: 0.75rem;">{{ formatDate(review.createdAt) }}</small>
                </div>
              </div>
              <p style="font-size: 0.875rem; color: var(--pastel-ink); margin-bottom: 0.5rem;">{{ review.comment || 'Không có nhận xét.' }}</p>
              <div v-if="review.sellerReply" class="card-pastel p-3 ms-4" style="background: var(--pastel-cream);">
                <div class="d-flex align-items-center gap-1 mb-1">
                  <i class="bi bi-shop" style="color: var(--pastel-coral-dark); font-size: 0.75rem;"></i>
                  <small style="font-weight: 700; color: var(--pastel-coral-dark);">Phản hồi từ người bán</small>
                </div>
                <p style="font-size: 0.8125rem; color: var(--pastel-ink); margin: 0;">{{ review.sellerReply }}</p>
              </div>
            </div>

            <div v-if="hasMoreReviews" class="text-center pt-2">
              <button class="btn-pastel" :disabled="loadingMoreReviews" @click="loadMoreReviews" style="font-size: 0.8125rem; padding: 0.5rem 1.25rem;">
                <span v-if="loadingMoreReviews" class="spinner-border spinner-border-sm me-1"></span>
                Xem thêm đánh giá
              </button>
            </div>
          </div>
        </div>

      </div><!-- /product detail -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'
import { wishlistService } from '@/services/wishlist.service'
import { reviewService } from '@/services/review.service'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import VariantSelector from '@/components/common/VariantSelector.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const notify = useNotifyStore()

const loading = ref(true)
const errorMsg = ref('')
const product = ref(null)
const selectedImage = ref('')
const selectedAttributeValues = ref(null)   // [VARIANT-FIX] holds current selection for VariantSelector
const quantity = ref(1)
const adding = ref(false)
const buying = ref(false)
const togglingWishlist = ref(false)
const isWishlisted = ref(false)
const reviews = ref([])
const totalReviews = ref(0)
const loadingReviews = ref(false)
const loadingMoreReviews = ref(false)
const reviewPage = ref(0)
const REVIEW_SIZE = 10
const hasMoreReviews = computed(() => reviews.value.length < totalReviews.value)
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'

const imagesList = computed(() => {
  if (product.value?.images?.length > 0) return product.value.images
  return [{ imageUrl: product.value?.thumbnailUrl || placeholderImg }]
})

// ── [VARIANT-FIX] Variant logic ───────────────────────────────────

/**
 * Whether the product has meaningful variant groups (attributeName + attributeValue).
 * Products with flat variants (no attribute grouping) still need a single "Default" chip.
 */
const productHasVariants = computed(() => {
  if (!product.value?.variants?.length) return false
  if (product.value?.options?.length > 0) return true
  return product.value.variants.some(v => (v.attributes && Object.keys(v.attributes).length > 0) || (v.attributeName && v.attributeValue))
})

/**
 * The currently selected variant object (full record) or null.
 * Updated by onVariantSelected() whenever the user picks a variant chip.
 */
const selectedVariant = ref(null)

/**
 * [VARIANT-FIX] Called by VariantSelector whenever the user picks a chip.
 * The VariantSelector emits the full matched variant once all groups are selected,
 * or a partial object ({ attributeName, attributeValueId, attributeValue, _partial: true })
 * during incremental picking.
 */
function onVariantSelected(payload) {
  if (!payload || payload._partial) {
    selectedVariant.value = null
    return
  }
  // Full variant emitted — all groups selected
  selectedVariant.value = payload
}

/**
 * Determines whether the user has completed all required variant groups.
 */
const isMissingSelection = computed(() => {
  if (!productHasVariants.value) return false
  return !selectedVariant.value
})

/**
 * Whether the add-to-cart and buy-now actions are allowed.
 */
const canAddToCart = computed(() => {
  if (product.value?.variants?.length && productHasVariants.value) {
    return !!selectedVariant.value && (selectedVariant.value.stockQuantity || 0) > 0
  }
  // Simple product (no variants): always allowed
  return (product.value?.stock || 0) > 0
})

/**
 * Price displayed to the user: selected variant's price, or product's base price.
 */
const displayPrice = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.salePrice || selectedVariant.value.price
  return product.value?.minPrice || product.value?.price || 0
})

/**
 * Stock displayed to the user: selected variant's stock, or product's own stock.
 */
const displayStock = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.stockQuantity || 0
  return product.value?.stock || 0
})

const fetchProduct = async () => {
  loading.value = true; errorMsg.value = ''
  try {
    const data = await catalogService.getProduct(route.params.slug)
    product.value = data
    selectedImage.value = data?.images?.[0]?.imageUrl || data?.thumbnailUrl || placeholderImg

    // [VARIANT-FIX] Reset variant selection state
    selectedVariant.value = null
    selectedAttributeValues.value = null

    // If the product has flat variants (no attribute grouping), pre-select the first one
    if (data?.variants?.length > 0 && !productHasVariants.value) {
      selectedVariant.value = data.variants[0]
    }

    checkWishlist()
    fetchReviews(true)
  } catch (_) { errorMsg.value = 'Không tìm thấy sản phẩm.' }
  finally { loading.value = false }
}

const checkWishlist = async () => {
  if (!product.value?.id || !authStore.isAuthenticated) { isWishlisted.value = false; return }
  try { const resp = await wishlistService.check(product.value.id); isWishlisted.value = resp.data?.wishlisted ?? false }
  catch (_) { isWishlisted.value = false }
}

const fetchReviews = async (reset = false) => {
  if (!product.value?.id) return
  if (reset) { reviewPage.value = 0; reviews.value = []; totalReviews.value = 0 }
  loadingReviews.value = reset; loadingMoreReviews.value = !reset
  try {
    const resp = await reviewService.listByProduct(product.value.id, { page: reviewPage.value, size: REVIEW_SIZE })
    const page = resp
    if (reset) reviews.value = page.content || []
    else reviews.value.push(...(page.content || []))
    totalReviews.value = page.totalElements || 0
  } catch (_) {} finally { loadingReviews.value = false; loadingMoreReviews.value = false }
}

const loadMoreReviews = () => { reviewPage.value++; fetchReviews(false) }

const formatDate = (str) => {
  if (!str) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(str))
}

const handleToggleWishlist = async () => {
  if (!authStore.isAuthenticated) { notify.push('Vui lòng đăng nhập!', 'warning'); router.push({ name: 'login', query: { redirect: route.fullPath } }); return }
  togglingWishlist.value = true
  try {
    const resp = await wishlistService.toggle(product.value.id)
    isWishlisted.value = resp.data?.wishlisted ?? !isWishlisted.value
    notify.push(isWishlisted.value ? 'Đã thêm vào yêu thích!' : 'Đã xóa khỏi yêu thích!', 'success')
  } catch (_) { notify.push('Không thể cập nhật yêu thích.', 'danger') }
  finally { togglingWishlist.value = false }
}

const handleAddToCart = async () => {
  if (!authStore.isAuthenticated) { notify.push('Vui lòng đăng nhập!', 'warning'); router.push({ name: 'login', query: { redirect: route.fullPath } }); return }
  // [VARIANT-FIX] Block if variant groups exist but none is fully selected
  if (productHasVariants.value && !selectedVariant.value) {
    notify.push('Vui lòng chọn phân loại!', 'warning')
    return
  }
  const variantId = selectedVariant.value?.id || null
  // For flat-variants products (no attribute groups), use first variant ID
  const fallbackId = !productHasVariants.value ? product.value?.variants?.[0]?.id : null
  const resolvedId = variantId || fallbackId
  if (!resolvedId) { notify.push('Sản phẩm chưa có biến thể!', 'danger'); return }
  adding.value = true
  const ok = await cartStore.addItem(resolvedId, quantity.value)
  adding.value = false
  if (ok) notify.push(`Đã thêm ${quantity.value} sản phẩm vào giỏ hàng!`, 'success')
}

const handleBuyNow = async () => {
  // [VARIANT-FIX] Same guard as add-to-cart
  if (productHasVariants.value && !selectedVariant.value) {
    notify.push('Vui lòng chọn phân loại!', 'warning')
    return
  }
  if (!authStore.isAuthenticated) { notify.push('Vui lòng đăng nhập!', 'warning'); router.push({ name: 'login', query: { redirect: route.fullPath } }); return }
  const variantId = selectedVariant.value?.id || product.value?.variants?.[0]?.id
  if (!variantId) { notify.push('Sản phẩm chưa có biến thể!', 'danger'); return }
  buying.value = true
  const ok = await cartStore.addItem(variantId, quantity.value)
  buying.value = false
  if (ok) {
    notify.push(`Đã thêm ${quantity.value} sản phẩm vào giỏ hàng!`, 'success')
    router.push({ name: 'cart' })
  }
}

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

watch(() => route.params.slug, (slug) => { if (slug) { fetchProduct(); fetchReviews(true) } })
onMounted(fetchProduct)
</script>

<style scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.bc-link {
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  font-weight: 400;
  transition: color 0.15s;
}
.bc-link:hover { color: #1a56db; }
.bc-sep {
  font-size: 10px;
  color: #d1d5db;
}
.bc-current {
  font-size: 13px;
  color: #212121;
  font-weight: 500;
}
</style>

