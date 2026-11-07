<template>
  <!-- NO MALL Product Detail — Layout giống ảnh, tông xanh dương + trắng -->
  <div class="pd-page">
    <!-- Breadcrumb -->
    <div class="pd-breadcrumb-bar">
      <div class="container">
        <nav class="pd-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right"></i>
          <router-link :to="{ name: 'products' }">Sản phẩm</router-link>
          <template v-if="product">
            <i class="bi bi-chevron-right"></i>
            <span class="pd-breadcrumb-current">{{ product.name }}</span>
          </template>
        </nav>
      </div>
    </div>

    <LoadingSpinner v-if="loading" text="Đang tải chi tiết sản phẩm..." class="my-5" />

    <div v-else-if="product" class="container pd-container">

      <!-- ── Main info card ──────────────────────────────── -->
      <div class="pd-card pd-main-card">

        <div class="row g-4">
          <!-- LEFT: Gallery (thumbnails dọc + ảnh chính) -->
          <div class="col-lg-5">
            <div class="pd-gallery">
              <!-- Vertical thumbnails -->
              <div v-if="imagesList.length > 1" class="pd-thumbs">
                <button
                  v-for="(img, idx) in imagesList"
                  :key="idx"
                  class="pd-thumb"
                  :class="{ active: selectedImage === (img.imageUrl || img) }"
                  @click="selectedImage = img.imageUrl || img"
                  type="button"
                >
                  <img :src="img.imageUrl || img" :alt="`thumb-${idx}`" />
                </button>
              </div>

              <!-- Main image -->
              <div class="pd-main-img-wrap">
                <img
                  :src="selectedImage || product.thumbnailUrl || placeholderImg"
                  :alt="product.name"
                  class="pd-main-img"
                />
                <button class="pd-img-heart" :class="{ active: isWishlisted }" :disabled="togglingWishlist" @click="handleToggleWishlist" type="button" title="Yêu thích">
                  <i :class="isWishlisted ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                </button>
                <span v-if="discountPct > 0" class="pd-img-badge">-{{ discountPct }}%</span>
              </div>
            </div>
          </div>

          <!-- RIGHT: Product info -->
          <div class="col-lg-7">
            <div class="pd-info">

              <!-- Badges (category / brand) -->
              <div v-if="product.categoryName || product.brand" class="pd-badges">
                <span v-if="product.categoryName" class="pd-chip">{{ product.categoryName }}</span>
                <span v-if="product.brand" class="pd-chip pd-chip-yellow">{{ product.brand }}</span>
              </div>

              <!-- Name + share -->
              <div class="pd-name-row">
                <h1 class="pd-name">{{ product.name }}</h1>
                <div class="pd-name-actions">
                  <button class="pd-icon-btn" type="button" title="Sao chép liên kết">
                    <i class="bi bi-link-45deg"></i>
                  </button>
                </div>
              </div>

              <!-- Rating + sold + sku -->
              <div class="pd-stats-row">
                <div class="pd-rating">
                  <span class="pd-stars">
                    <i v-for="n in 5" :key="n" :class="['bi', n <= Math.round(product.ratingAvg || 5) ? 'bi-star-fill' : 'bi-star']"></i>
                  </span>
                  <span class="pd-rating-num">{{ Number(product.ratingAvg || 5).toFixed(1) }}</span>
                  <span class="pd-rating-count">({{ product.ratingCount || 0 }} đánh giá)</span>
                </div>
                <span class="pd-divider"></span>
                <div class="pd-stat">
                  <span class="pd-stat-label">Đã bán</span>
                  <span class="pd-stat-value">{{ product.soldCount || 0 }}</span>
                </div>
                <span v-if="product.sku" class="pd-divider"></span>
                <div v-if="product.sku" class="pd-stat">
                  <span class="pd-stat-label">Mã SP</span>
                  <span class="pd-stat-value pd-stat-mono">{{ product.sku }}</span>
                </div>
              </div>

              <!-- Price row (no box, inline) -->
              <div class="pd-price-row">
                <template v-if="!selectedVariant && product.maxPrice && product.maxPrice > product.minPrice">
                  <span class="pd-price-sale">
                    {{ formatCurrency(product.minPrice) }} - {{ formatCurrency(product.maxPrice) }}
                  </span>
                </template>
                <template v-else>
                  <span class="pd-price-sale">{{ formatCurrency(displayPrice) }}</span>
                  <span v-if="displayOriginal > displayPrice" class="pd-price-original">
                    {{ formatCurrency(displayOriginal) }}
                  </span>
                  <span v-if="discountPct > 0" class="pd-price-pct">-{{ discountPct }}%</span>
                </template>
              </div>

              <!-- Variant -->
              <div v-if="product.variants?.length > 0" class="pd-block">
                <VariantSelector
                  :variants="product.variants || []"
                  :options="product.options || []"
                  :model-value="selectedAttributeValues"
                  :base-price="product.minPrice || product.price || 0"
                  @update:model-value="onVariantSelected"
                  @image-selected="img => { if (img) selectedImage = img }"
                />
              </div>

              <!-- Quantity + stock -->
              <div class="pd-block pd-qty-row">
                <label class="pd-label">Số lượng:</label>
                <div class="pd-qty">
                  <button @click="quantity = Math.max(1, quantity - 1)" type="button" aria-label="Giảm">−</button>
                  <input v-model.number="quantity" type="number" min="1" />
                  <button @click="quantity++" type="button" aria-label="Tăng">+</button>
                </div>
                <span class="pd-stock">
                  <i class="bi bi-box-seam"></i>
                  <strong :class="displayStock > 0 ? 'pd-stock-ok' : 'pd-stock-out'">
                    {{ displayStock > 0 ? 'Còn ' + displayStock + ' sản phẩm' : 'Hết hàng' }}
                  </strong>
                </span>
              </div>

              <!-- CTA buttons -->
              <div class="pd-cta">
                <button
                  class="pd-btn pd-btn-outline"
                  :disabled="!canAddToCart || adding"
                  @click="handleAddToCart"
                  type="button"
                >
                  <i class="bi bi-cart-plus"></i>
                  {{ adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng' }}
                </button>
                <button
                  class="pd-btn pd-btn-primary"
                  :disabled="!canAddToCart || buying"
                  @click="handleBuyNow"
                  type="button"
                >
                  <i class="bi bi-lightning-fill"></i>
                  {{ buying ? 'Đang xử lý...' : 'Mua ngay' }}
                </button>
              </div>

              <!-- Commitments (4 ô) -->
              <div class="pd-promises">
                <div class="pd-promise">
                  <i class="bi bi-truck"></i>
                  <div>
                    <div class="pd-promise-title">Giao hàng nhanh</div>
                    <div class="pd-promise-sub">2-3 ngày toàn quốc</div>
                  </div>
                </div>
                <div class="pd-promise">
                  <i class="bi bi-patch-check"></i>
                  <div>
                    <div class="pd-promise-title">Chính hãng 100%</div>
                    <div class="pd-promise-sub">Hoàn tiền nếu giả</div>
                  </div>
                </div>
                <div class="pd-promise">
                  <i class="bi bi-arrow-counterclockwise"></i>
                  <div>
                    <div class="pd-promise-title">Đổi trả 7 ngày</div>
                    <div class="pd-promise-sub">Miễn phí đổi trả</div>
                  </div>
                </div>
                <div class="pd-promise">
                  <i class="bi bi-shield-lock"></i>
                  <div>
                    <div class="pd-promise-title">Thanh toán an toàn</div>
                    <div class="pd-promise-sub">COD / VNPay / MoMo</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- ── Shop / Seller Profile Card ────────────────────── -->
      <div v-if="product.sellerId || product.shopName" class="pd-card pd-shop-card">
        <div class="row align-items-center g-4">
          <!-- Left: Shop Avatar + Name + Actions -->
          <div class="col-lg-5">
            <div class="pd-shop-main">
              <!-- Avatar with online indicator -->
              <div class="pd-shop-avatar-wrap">
                <img
                  v-if="product.shopLogoUrl"
                  :src="product.shopLogoUrl"
                  :alt="product.shopName"
                  class="pd-shop-avatar-img"
                />
                <div v-else class="pd-shop-avatar-fallback">
                  {{ (product.shopName || 'S').charAt(0).toUpperCase() }}
                </div>
                <span
                  class="pd-shop-presence-dot"
                  :class="shopIsOnline ? 'online' : 'offline'"
                  :title="shopIsOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'"
                ></span>
              </div>

              <!-- Shop Identity -->
              <div class="pd-shop-identity">
                <div class="pd-shop-name-row">
                  <h3 class="pd-shop-name">{{ product.shopName || 'Cửa hàng NoMall' }}</h3>
                  <span class="pd-shop-official-badge">
                    <i class="bi bi-patch-check-fill me-1"></i>Official Store
                  </span>
                </div>
                <div class="pd-shop-status-text">
                  <span v-if="shopIsOnline" class="pd-shop-online-badge">
                    <span class="pd-shop-pulse-dot"></span> Đang trực tuyến
                  </span>
                  <span v-else class="pd-shop-offline-badge">
                    <span class="pd-shop-gray-dot"></span> Hoạt động gần đây
                  </span>
                </div>

                <!-- Action Buttons: Chat & Visit Shop -->
                <div class="pd-shop-actions">
                  <button
                    class="pd-shop-btn pd-shop-btn-chat"
                    type="button"
                    @click="handleChatWithShop"
                  >
                    <i class="bi bi-chat-dots-fill me-1.5"></i> Chat Ngay
                  </button>
                  <router-link
                    v-if="product.shopSlug"
                    :to="{ name: 'shop-detail', params: { slug: product.shopSlug } }"
                    class="pd-shop-btn pd-shop-btn-visit"
                  >
                    <i class="bi bi-shop me-1.5"></i> Xem Shop
                  </router-link>
                  <button
                    v-else
                    class="pd-shop-btn pd-shop-btn-visit"
                    type="button"
                    @click="router.push({ name: 'products', query: { seller: product.sellerId } })"
                  >
                    <i class="bi bi-shop me-1.5"></i> Xem Shop
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Vertical Divider (Desktop) -->
          <div class="col-lg-1 d-none d-lg-flex justify-content-center">
            <div class="pd-shop-divider-v"></div>
          </div>

          <!-- Right: Shop Stats Grid -->
          <div class="col-lg-6">
            <div class="pd-shop-stats-grid">
              <!-- Rating -->
              <div class="pd-shop-stat-item">
                <span class="pd-shop-stat-label">Đánh giá Shop</span>
                <span class="pd-shop-stat-value pd-stat-rating">
                  <i class="bi bi-star-fill me-1"></i>
                  {{ Number(product.sellerRatingAvg || 4.8).toFixed(1) }}
                  <small class="pd-stat-sub">({{ product.shopRatingCount || 100 }}+)</small>
                </span>
              </div>

              <!-- Product count -->
              <div class="pd-shop-stat-item">
                <span class="pd-shop-stat-label">Sản phẩm</span>
                <span class="pd-shop-stat-value pd-stat-count">
                  <i class="bi bi-box-seam me-1"></i>
                  {{ product.shopProductCount || '50+' }}
                </span>
              </div>

              <!-- Response rate -->
              <div class="pd-shop-stat-item">
                <span class="pd-shop-stat-label">Tỉ lệ phản hồi</span>
                <span class="pd-shop-stat-value pd-stat-response">
                  <i class="bi bi-lightning-charge-fill me-1"></i>
                  99%
                  <small class="pd-stat-sub">(vài phút)</small>
                </span>
              </div>

              <!-- Joined date -->
              <div class="pd-shop-stat-item">
                <span class="pd-shop-stat-label">Tham gia</span>
                <span class="pd-shop-stat-value pd-stat-joined">
                  <i class="bi bi-calendar3 me-1"></i>
                  {{ formatShopJoin(product.shopCreatedAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tabs: Mô tả / Đánh giá / Chính sách ────────────────────── -->
      <div class="pd-card pd-tabs-card">
        <ul class="pd-tabs" role="tablist">
          <li v-for="t in tabs" :key="t.id">
            <button
              class="pd-tab"
              :class="{ active: activeTab === t.id }"
              @click="activeTab = t.id"
              type="button"
              role="tab"
            >
              {{ t.label }}
              <span v-if="t.id === 'reviews' && (product.ratingCount || 0) > 0" class="pd-tab-count">
                ({{ product.ratingCount }})
              </span>
            </button>
          </li>
        </ul>
        <div class="pd-tab-content">
          <div v-show="activeTab === 'desc'" class="pd-tab-pane">
            <p v-if="product.description" class="pd-desc">{{ product.description }}</p>
            <p v-else class="pd-desc-empty">Chưa có mô tả chi tiết cho sản phẩm này.</p>

            <!-- Specs grid (nếu có) -->
            <div v-if="specsList.length > 0" class="pd-specs">
              <div v-for="(s, idx) in specsList" :key="idx" class="pd-spec-row">
                <span class="pd-spec-key">{{ s.key }}</span>
                <span class="pd-spec-val">{{ s.value }}</span>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'reviews'" class="pd-tab-pane">
            <div class="pd-reviews">
              <!-- Reviews Summary Card -->
              <div class="pd-reviews-summary-card mb-4 p-4 rounded-3xl bg-amber-50/50 border border-amber-200/60 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
                <div class="d-flex align-items-center gap-3">
                  <div class="text-center px-2">
                    <div class="fs-1 fw-extrabold text-amber-500 font-mono lh-1">
                      {{ Number(product.ratingAvg || 5).toFixed(1) }}
                    </div>
                    <div class="text-amber-400 fs-5 mt-1.5">
                      <i v-for="n in 5" :key="n" :class="['bi', n <= Math.round(product.ratingAvg || 5) ? 'bi-star-fill' : 'bi-star']"></i>
                    </div>
                    <div class="text-xs text-slate-500 mt-1">{{ product.ratingCount || 0 }} lượt đánh giá</div>
                  </div>
                </div>

                <!-- Star Rating Filter Chips -->
                <div class="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold transition-all"
                    :class="selectedRatingFilter === 0 ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'"
                    style="background-color: selectedRatingFilter === 0 ? '#f59e0b' : '#fff';"
                    @click="selectRatingFilter(0)"
                  >
                    Tất cả ({{ product.ratingCount || 0 }})
                  </button>
                  <button
                    v-for="star in [5, 4, 3, 2, 1]"
                    :key="star"
                    type="button"
                    class="btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-semibold transition-all d-flex align-items-center gap-1"
                    :class="selectedRatingFilter === star ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'"
                    @click="selectRatingFilter(star)"
                  >
                    <span>{{ star }} Sao</span>
                    <i class="bi bi-star-fill" :class="selectedRatingFilter === star ? 'text-white' : 'text-amber-400'" style="font-size: 0.65rem;"></i>
                  </button>
                </div>
              </div>

              <!-- Loading State -->
              <div v-if="reviewsLoading" class="text-center py-5 text-muted">
                <span class="spinner-border spinner-border-sm me-2 text-warning"></span> Đang tải đánh giá sản phẩm...
              </div>

              <!-- Empty State -->
              <div v-else-if="reviews.length === 0" class="text-center py-5 bg-slate-50 rounded-3xl border border-slate-100">
                <i class="bi bi-chat-square-heart text-3xl text-slate-300 d-block mb-2"></i>
                <h6 class="text-slate-700 font-bold mb-1">Chưa có đánh giá nào cho mục này</h6>
                <p class="text-xs text-slate-400 mb-0">Đơn hàng hoàn tất sẽ có thể gửi đánh giá và nhận xét tại đây.</p>
              </div>

              <!-- Reviews List -->
              <div v-else class="space-y-3">
                <div
                  v-for="rev in reviews"
                  :key="rev.id"
                  class="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs"
                >
                  <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div class="d-flex align-items-center gap-2.5">
                      <!-- Avatar -->
                      <img
                        v-if="rev.reviewerAvatar"
                        :src="rev.reviewerAvatar"
                        class="w-9 h-9 rounded-full object-cover border border-slate-200"
                        alt="reviewer"
                      />
                      <div v-else class="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold d-flex align-items-center justify-content-center text-xs">
                        {{ (rev.reviewerName || 'A').charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-bold text-xs text-slate-800">{{ rev.reviewerName || 'Người mua ẩn danh' }}</div>
                        <div class="text-amber-400 text-xs">
                          <i v-for="s in 5" :key="s" :class="['bi', s <= rev.rating ? 'bi-star-fill' : 'bi-star']"></i>
                        </div>
                      </div>
                    </div>
                    <span class="text-slate-400 text-xxs font-mono">{{ formatDateVi(rev.createdAt) }}</span>
                  </div>

                  <!-- Comment text -->
                  <p class="text-xs text-slate-700 mb-0 leading-relaxed ps-1">
                    {{ rev.comment || 'Khách hàng không để lại nhận xét bằng lời.' }}
                  </p>

                  <!-- Seller reply box if exists -->
                  <div v-if="rev.sellerReply" class="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 ms-3">
                    <div class="d-flex align-items-center gap-1.5 mb-1 text-xs font-bold text-blue-900">
                      <i class="bi bi-reply-fill text-blue-600"></i>
                      <span>Phản hồi từ Người Bán ({{ product.shopName || 'Shop' }})</span>
                    </div>
                    <p class="text-xs text-blue-800 mb-0 ps-3 leading-relaxed">
                      {{ rev.sellerReply }}
                    </p>
                  </div>
                </div>

                <!-- Pagination controls -->
                <div v-if="reviewsTotalPages > 1" class="d-flex align-items-center justify-content-between pt-3 border-top border-slate-100 text-xs">
                  <span class="text-slate-400">Trang {{ reviewsPage + 1 }} / {{ reviewsTotalPages }} (Tổng {{ reviewsTotalElements }} đánh giá)</span>
                  <div class="d-flex gap-2">
                    <button
                      class="btn btn-xs btn-outline-secondary rounded-pill px-3"
                      :disabled="reviewsPage === 0"
                      @click="fetchReviews(reviewsPage - 1)"
                    >
                      <i class="bi bi-chevron-left me-1"></i> Trang trước
                    </button>
                    <button
                      class="btn btn-xs btn-outline-secondary rounded-pill px-3"
                      :disabled="reviewsPage + 1 >= reviewsTotalPages"
                      @click="fetchReviews(reviewsPage + 1)"
                    >
                      Trang sau <i class="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'policy'" class="pd-tab-pane">
            <ul class="pd-policy-list">
              <li><strong>Chính sách đổi trả:</strong> Hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm còn nguyên tem, chưa qua sử dụng.</li>
              <li><strong>Chính sách vận chuyển:</strong> Giao hàng toàn quốc 2–3 ngày làm việc. Miễn phí vận chuyển cho đơn từ 200.000₫.</li>
              <li><strong>Chính sách bảo hành:</strong> Bảo hành chính hãng theo từng danh mục sản phẩm. Liên hệ CSKH để được hỗ trợ.</li>
              <li><strong>Phương thức thanh toán:</strong> COD, VNPay, MoMo, chuyển khoản ngân hàng.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ── More from this Shop ───────────────────────── -->
      <div v-if="shopProducts.length > 0" class="pd-card pd-related-card mb-4">
        <div class="pd-section-head">
          <div class="d-flex align-items-center gap-2">
            <h3 class="pd-section-title">Sản phẩm khác từ {{ product.shopName || 'Shop' }}</h3>
            <span class="badge bg-danger-subtle text-danger rounded-pill px-2.5 py-1 text-xs">Cùng Shop</span>
          </div>
          <router-link
            v-if="product.shopSlug"
            :to="{ name: 'shop-detail', params: { slug: product.shopSlug } }"
            class="pd-section-more"
          >
            Xem tất cả {{ product.shopProductCount ? product.shopProductCount + ' sản phẩm' : '' }} <i class="bi bi-chevron-right"></i>
          </router-link>
        </div>
        <LoadingSpinner v-if="loadingShopProducts" />
        <div v-else class="row g-3">
          <div v-for="p in shopProducts" :key="p.id" class="col-6 col-md-3">
            <NomallProductCard :product="p" @click="goToDetail(p)" />
          </div>
        </div>
      </div>

      <!-- ── Related Products ───────────────────────────── -->
      <div class="pd-card pd-related-card">
        <div class="pd-section-head">
          <h3 class="pd-section-title">Sản phẩm liên quan</h3>
          <router-link
            :to="{ name: 'products', query: { category: product.categoryName } }"
            class="pd-section-more"
          >
            Xem thêm <i class="bi bi-chevron-right"></i>
          </router-link>
        </div>
        <LoadingSpinner v-if="loadingRelated" />
        <div v-else class="row g-3">
          <div v-for="p in relatedProducts" :key="p.id" class="col-6 col-md-3">
            <NomallProductCard :product="p" @click="goToDetail(p)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'
import { wishlistService } from '@/services/wishlist.service'
import { reviewService } from '@/services/review.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import { useCartStore } from '@/stores/cart'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import VariantSelector from '@/components/common/VariantSelector.vue'
import NomallProductCard from '@/components/buyer/ProductCard.vue'
import { useRealtime } from '@/composables/useRealtime'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notify = useNotifyStore()
const cartStore = useCartStore()

const loading = ref(true)
const loadingRelated = ref(true)
const loadingShopProducts = ref(false)
const product = ref(null)
const relatedProducts = ref([])
const shopProducts = ref([])
const shopIsOnline = ref(false)
const selectedImage = ref('')
const selectedAttributeValues = ref(null)
const selectedVariant = ref(null)
const quantity = ref(1)
const isWishlisted = ref(false)
const togglingWishlist = ref(false)
const adding = ref(false)
const buying = ref(false)
const activeTab = ref('desc')

// Reviews state
const reviews = ref([])
const reviewsLoading = ref(false)
const selectedRatingFilter = ref(0)
const reviewsPage = ref(0)
const reviewsTotalPages = ref(1)
const reviewsTotalElements = ref(0)

const tabs = [
  { id: 'desc', label: 'Mô tả sản phẩm' },
  { id: 'reviews', label: 'Đánh giá' },
  { id: 'policy', label: 'Chính sách' },
]

const placeholderImg = 'https://picsum.photos/seed/detail/400/400'

const imagesList = computed(() => {
  if (product.value?.images?.length > 0) return product.value.images.map(i => i.imageUrl || i)
  return [product.value?.thumbnailUrl || placeholderImg]
})

const productHasVariants = computed(() => {
  if (!product.value?.variants?.length) return false
  if (product.value?.options?.length > 0) return true
  if (product.value.variants.length > 1) return true
  return product.value.variants.some(v =>
    (v.attributes && Object.keys(v.attributes).length > 0) ||
    (v.attributeName && v.attributeValue)
  )
})

const discountPct = computed(() => {
  if (displayOriginal.value > displayPrice.value) {
    return Math.round(((displayOriginal.value - displayPrice.value) / displayOriginal.value) * 100)
  }
  return 0
})

const displayPrice = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.salePrice || selectedVariant.value.price
  return product.value?.minPrice || product.value?.price || 0
})

const displayOriginal = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.price || displayPrice.value
  if (product.value?.maxPrice && product.value.maxPrice > displayPrice.value) {
    return product.value.maxPrice
  }
  return displayPrice.value
})

const displayStock = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.stockQuantity || 0
  return product.value?.stock || 0
})

const canAddToCart = computed(() => {
  if (product.value?.variants?.length && productHasVariants.value) {
    return !!selectedVariant.value && displayStock.value > 0
  }
  return displayStock.value > 0 || !product.value?.variants?.length
})

// Specs list (nếu backend trả về product.attributes / product.specs)
const specsList = computed(() => {
  const p = product.value
  if (!p) return []
  if (Array.isArray(p.specs) && p.specs.length) {
    return p.specs.map(s => ({ key: s.key || s.name, value: s.value }))
  }
  if (Array.isArray(p.attributes) && p.attributes.length) {
    return p.attributes.map(a => ({ key: a.name, value: a.value }))
  }
  return []
})

const onVariantSelected = (payload) => {
  if (!payload || payload._partial) {
    selectedVariant.value = null
    if (payload?.imageUrl) {
      selectedImage.value = payload.imageUrl
    }
    return
  }
  selectedVariant.value = payload
  if (payload.imageUrl) {
    selectedImage.value = payload.imageUrl
  }
}

const fetchProduct = async () => {
  loading.value = true
  try {
    const data = await catalogService.getProduct(route.params.slug)
    product.value = data
    selectedImage.value = data?.thumbnailUrl || placeholderImg
    selectedVariant.value = null
    selectedAttributeValues.value = null
    if (data?.variants?.length > 0 && !productHasVariants.value) {
      selectedVariant.value = data.variants[0]
    }
    shopIsOnline.value = Boolean(data?.shopIsOnline)
    checkWishlist()
    fetchRelated()
    fetchShopProducts()
    fetchReviews(0)
  } catch (_) {
    notify.push('Không tìm thấy sản phẩm.', 'danger')
  } finally { loading.value = false }
}

const fetchReviews = async (page = 0) => {
  if (!product.value?.id) return
  reviewsLoading.value = true
  reviewsPage.value = page
  try {
    const params = { page, size: 5 }
    if (selectedRatingFilter.value > 0) {
      params.rating = selectedRatingFilter.value
    }
    const res = await reviewService.listByProduct(product.value.id, params)
    const data = res?.data || res
    reviews.value = data?.content || []
    reviewsTotalElements.value = data?.totalElements || 0
    reviewsTotalPages.value = data?.totalPages || 1
  } catch (err) {
    console.error('Failed to load reviews:', err)
  } finally {
    reviewsLoading.value = false
  }
}

const selectRatingFilter = (rating) => {
  selectedRatingFilter.value = rating
  fetchReviews(0)
}

function formatDateVi(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const fetchShopProducts = async () => {
  if (!product.value?.sellerId) return
  loadingShopProducts.value = true
  try {
    const data = await catalogService.listProducts({
      sellerId: product.value.sellerId,
      page: 0,
      size: 5,
    })
    shopProducts.value = (data?.content || []).filter(p => p.id !== product.value?.id).slice(0, 4)
  } catch (_) {}
  finally { loadingShopProducts.value = false }
}

function formatShopJoin(d) {
  if (!d) return 'Chính hãng'
  try {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 30) return `${days} ngày trước`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} tháng trước`
    const years = Math.floor(months / 12)
    return `${years} năm trước`
  } catch {
    return 'Chính hãng'
  }
}

function handleChatWithShop() {
  if (!auth.isAuthenticated) {
    notify.push('Vui lòng đăng nhập để bắt đầu chat với người bán!', 'warning')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  notify.push(`Đang kết nối hội thoại với ${product.value?.shopName || 'Shop'}...`, 'info')
}

// Lắng nghe cập nhật WebSocket Realtime Presence từ /topic/admin/presence
useRealtime({
  topics: [
    {
      destination: '/topic/admin/presence',
      callback: (msg) => {
        if (!msg || !product.value) return
        if (product.value.sellerId && Number(msg.userId) === Number(product.value.sellerId)) {
          shopIsOnline.value = Boolean(msg.isOnline)
        }
      },
    },
  ],
})

const fetchRelated = async () => {
  loadingRelated.value = true
  try {
    const data = await catalogService.listProducts({
      categoryId: product.value?.categoryId,
      page: 0,
      size: 4,
      sortBy: 'sold',
      sortDir: 'desc',
    })
    relatedProducts.value = (data?.content || []).filter(p => p.id !== product.value?.id).slice(0, 4)
  } catch (_) {} finally { loadingRelated.value = false }
}

const checkWishlist = async () => {
  if (!product.value?.id || !auth.isAuthenticated) { isWishlisted.value = false; return }
  try {
    const resp = await wishlistService.check(product.value.id)
    isWishlisted.value = resp?.wishlisted ?? resp?.data?.wishlisted ?? false
  } catch (_) { isWishlisted.value = false }
}

const handleToggleWishlist = async () => {
  if (!auth.isAuthenticated) { notify.push('Vui lòng đăng nhập!', 'warning'); return }
  togglingWishlist.value = true
  try {
    const resp = await wishlistService.toggle(product.value.id)
    isWishlisted.value = resp?.wishlisted ?? resp?.data?.wishlisted ?? !isWishlisted.value
    notify.push(isWishlisted.value ? 'Đã thêm vào yêu thích!' : 'Đã xóa khỏi yêu thích!', 'success')
  } catch (_) { notify.push('Không thể cập nhật yêu thích.', 'danger') }
  finally { togglingWishlist.value = false }
}

const handleAddToCart = async () => {
  if (!auth.isAuthenticated) { notify.push('Vui lòng đăng nhập!', 'warning'); router.push({ name: 'login' }); return }
  if (productHasVariants.value && !selectedVariant.value) { notify.push('Vui lòng chọn phân loại!', 'warning'); return }
  const variantId = selectedVariant.value?.id || product.value?.variants?.[0]?.id
  if (!variantId) { notify.push('Sản phẩm chưa có biến thể!', 'danger'); return }
  adding.value = true
  const ok = await cartStore.addItem(variantId, quantity.value)
  adding.value = false
  if (ok) notify.push(`Đã thêm ${quantity.value} sản phẩm vào giỏ hàng!`, 'success')
}

const handleBuyNow = async () => {
  if (!auth.isAuthenticated) { notify.push('Vui lòng đăng nhập!', 'warning'); router.push({ name: 'login' }); return }
  if (productHasVariants.value && !selectedVariant.value) { notify.push('Vui lòng chọn phân loại!', 'warning'); return }
  const variantId = selectedVariant.value?.id || product.value?.variants?.[0]?.id
  if (!variantId) { notify.push('Sản phẩm chưa có biến thể!', 'danger'); return }
  buying.value = true
  const ok = await cartStore.addItem(variantId, quantity.value)
  buying.value = false
  if (ok) { notify.push('Đã thêm vào giỏ hàng!', 'success'); router.push({ name: 'cart' }) }
}

const goToDetail = (p) => { router.push({ name: 'product-detail', params: { slug: p.slug } }) }

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

watch(() => route.params.slug, (slug) => { if (slug) fetchProduct() })
onMounted(fetchProduct)
</script>

<style scoped>
/* ── Page wrapper ───────────────────────────────────── */
.pd-page {
  background: #F9FAFB;
  min-height: 100vh;
  padding-bottom: 3rem;
}

/* ── Breadcrumb bar ─────────────────────────────────── */
.pd-breadcrumb-bar {
  background: #fff;
  border-bottom: 1px solid #E5E7EB;
  padding: 0.625rem 0;
}
.pd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6B7280;
  margin: 0;
}
.pd-breadcrumb a {
  color: #6B7280;
  text-decoration: none;
  transition: color 0.15s;
}
.pd-breadcrumb a:hover { color: #F97316; }
.pd-breadcrumb i { font-size: 0.625rem; color: #9CA3AF; }
.pd-breadcrumb-current {
  color: #F97316;
  font-weight: 600;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Cards & container ──────────────────────────────── */
.pd-container { margin-top: 1.25rem; }
.pd-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.pd-main-card { padding: 1.5rem; margin-bottom: 1.25rem; }
.pd-tabs-card { padding: 0; margin-bottom: 1.25rem; overflow: hidden; }
.pd-related-card { padding: 1.5rem; }

/* ── Gallery ────────────────────────────────────────── */
.pd-gallery {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.pd-thumbs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
  max-height: 28rem;
  overflow-y: auto;
  scrollbar-width: thin;
}
.pd-thumbs::-webkit-scrollbar { width: 4px; }
.pd-thumbs::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 9999px; }

.pd-thumb {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 10px;
  border: 1.5px solid #E5E7EB;
  background: #fff;
  padding: 4px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.pd-thumb:hover { border-color: #FDBA74; }
.pd-thumb.active {
  border-color: #F97316;
  background: #FFF7ED;
  box-shadow: 0 0 0 1px #F97316;
}
.pd-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.pd-main-img-wrap {
  flex-grow: 1;
  position: relative;
  aspect-ratio: 1;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E5E7EB;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pd-main-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.pd-img-heart {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #E5E7EB;
  color: #6B7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.pd-img-heart:hover { color: #F97316; transform: scale(1.05); }
.pd-img-heart.active { color: #E84A4A; border-color: #FECACA; background: #FEF2F2; }

.pd-img-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: #E84A4A;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba(232, 74, 74, 0.3);
}

/* ── Info column ────────────────────────────────────── */
.pd-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pd-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.pd-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: #FFF7ED;
  color: #F97316;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 9999px;
  border: 1px solid #FED7AA;
}
.pd-chip-yellow {
  background: #FEF3C7;
  color: #B45309;
  border-color: #FDE68A;
}

.pd-name-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.pd-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1F2937;
  line-height: 1.4;
  margin: 0;
  flex-grow: 1;
}
.pd-name-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.pd-icon-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid #E5E7EB;
  background: #fff;
  color: #6B7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
}
.pd-icon-btn:hover { color: #F97316; border-color: #FDBA74; }

.pd-stats-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-wrap: wrap;
  padding: 0.625rem 0;
  border-top: 1px solid #F3F4F6;
  border-bottom: 1px solid #F3F4F6;
}
.pd-rating {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.pd-stars { color: #FBBF24; font-size: 0.875rem; display: inline-flex; gap: 1px; }
.pd-rating-num { color: #1F2937; font-weight: 700; font-size: 0.875rem; }
.pd-rating-count { color: #6B7280; font-size: 0.8125rem; }
.pd-divider { width: 1px; height: 1rem; background: #E5E7EB; }
.pd-stat { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; }
.pd-stat-label { color: #6B7280; }
.pd-stat-value { color: #1F2937; font-weight: 600; }
.pd-stat-mono { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 0.75rem; }

.pd-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.25rem 0;
}
.pd-price-sale {
  font-size: 1.875rem;
  font-weight: 800;
  color: #F97316;
  letter-spacing: -0.01em;
}
.pd-price-original {
  font-size: 1rem;
  color: #9CA3AF;
  text-decoration: line-through;
}
.pd-price-pct {
  background: #FEE2E2;
  color: #B91C1C;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.1875rem 0.625rem;
  border-radius: 9999px;
}

.pd-block { display: flex; flex-direction: column; gap: 0.5rem; }
.pd-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #6B7280;
  white-space: nowrap;
  margin: 0;
}

.pd-qty-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.pd-qty {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid #E5E7EB;
  border-radius: 9999px;
  overflow: hidden;
  background: #fff;
}
.pd-qty button {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: transparent;
  color: #1F2937;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.pd-qty button:hover { background: #FFF7ED; color: #F97316; }
.pd-qty input {
  width: 3rem;
  height: 2.25rem;
  border: none;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1F2937;
  background: transparent;
  outline: none;
  -moz-appearance: textfield;
}
.pd-qty input::-webkit-outer-spin-button,
.pd-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.pd-stock {
  font-size: 0.8125rem;
  color: #6B7280;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.pd-stock-ok { color: #059669; }
.pd-stock-out { color: #DC2626; }

/* CTA */
.pd-cta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.pd-btn {
  flex: 1 1 0;
  min-width: 12rem;
  height: 3rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid transparent;
}
.pd-btn-outline {
  background: #fff;
  color: #F97316;
  border-color: #F97316;
}
.pd-btn-outline:hover:not(:disabled) {
  background: #FFF7ED;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}
.pd-btn-primary {
  background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
  color: #fff;
  border-color: #EA580C;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}
.pd-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(249, 115, 22, 0.35);
}
.pd-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Promises */
.pd-promises {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.625rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #E5E7EB;
}
.pd-promise {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  background: #F9FAFB;
  border-radius: 10px;
  border: 1px solid #F3F4F6;
}
.pd-promise i {
  font-size: 1.25rem;
  color: #F97316;
  flex-shrink: 0;
}
.pd-promise-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.2;
}
.pd-promise-sub {
  font-size: 0.6875rem;
  color: #6B7280;
  margin-top: 2px;
}

/* ── Tabs ───────────────────────────────────────────── */
.pd-tabs {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0 1.5rem;
  border-bottom: 1px solid #E5E7EB;
  gap: 0.25rem;
  overflow-x: auto;
}
.pd-tabs li { flex-shrink: 0; }
.pd-tab {
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 2.5px solid transparent;
  color: #6B7280;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}
.pd-tab:hover { color: #F97316; }
.pd-tab.active {
  color: #F97316;
  border-bottom-color: #F97316;
  font-weight: 700;
}
.pd-tab-count {
  font-size: 0.75rem;
  color: #6B7280;
  font-weight: 600;
}
.pd-tab.active .pd-tab-count { color: #F97316; }

.pd-tab-content { padding: 1.5rem; }
.pd-tab-pane { color: #1F2937; }
.pd-desc {
  font-size: 0.9375rem;
  line-height: 1.75;
  color: #374151;
  white-space: pre-line;
  margin: 0 0 1.25rem;
}
.pd-desc-empty {
  font-size: 0.875rem;
  color: #6B7280;
  font-style: italic;
  margin: 0;
}

.pd-specs {
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  overflow: hidden;
}
.pd-spec-row {
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #F3F4F6;
}
.pd-spec-row:last-child { border-bottom: none; }
.pd-spec-row:nth-child(even) { background: #F9FAFB; }
.pd-spec-key { color: #6B7280; font-weight: 600; }
.pd-spec-val { color: #1F2937; }

.pd-reviews-summary { margin-bottom: 1rem; }
.pd-reviews-avg {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.pd-reviews-avg-num {
  font-size: 2rem;
  font-weight: 800;
  color: #1F2937;
  line-height: 1;
}
.pd-reviews-avg-stars { color: #FBBF24; font-size: 1.125rem; display: inline-flex; gap: 2px; }
.pd-reviews-avg-text { color: #6B7280; font-size: 0.875rem; }

.pd-policy-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;
}
.pd-policy-list strong { color: #1F2937; }

/* Section head */
.pd-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.pd-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}
.pd-section-more {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #F97316;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: gap 0.15s;
}
.pd-section-more:hover { gap: 0.5rem; text-decoration: none; }

/* ── Shop Card Styling ───────────────────────────── */
.pd-shop-card {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.pd-shop-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.pd-shop-avatar-wrap {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  flex-shrink: 0;
}

.pd-shop-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #F3F4F6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.pd-shop-avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #EF4444 0%, #F97316 100%);
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
}

.pd-shop-presence-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2.5px solid #ffffff;
}

.pd-shop-presence-dot.online {
  background: #10B981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.35);
}

.pd-shop-presence-dot.offline {
  background: #9CA3AF;
}

.pd-shop-identity {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.pd-shop-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pd-shop-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pd-shop-official-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #DC2626;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

.pd-shop-status-text {
  font-size: 0.75rem;
  margin-bottom: 0.4rem;
}

.pd-shop-online-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #059669;
  font-weight: 600;
}

.pd-shop-offline-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #6B7280;
  font-weight: 500;
}

.pd-shop-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10B981;
  display: inline-block;
  box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
  animation: presencePulse 1.8s infinite;
}

.pd-shop-gray-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9CA3AF;
  display: inline-block;
}

@keyframes presencePulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.pd-shop-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.pd-shop-btn {
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.4rem 0.875rem;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.pd-shop-btn-chat {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.pd-shop-btn-chat:hover {
  background: #FEE2E2;
  color: #B91C1C;
  border-color: #FCA5A5;
}

.pd-shop-btn-visit {
  background: #F8FAFC;
  color: #334155;
  border: 1px solid #CBD5E1;
}

.pd-shop-btn-visit:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: #94A3B8;
  text-decoration: none;
}

.pd-shop-divider-v {
  width: 1px;
  height: 72px;
  background: #E5E7EB;
}

.pd-shop-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 2rem;
}

.pd-shop-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pd-shop-stat-label {
  font-size: 0.8125rem;
  color: #6B7280;
  font-weight: 500;
}

.pd-shop-stat-value {
  font-size: 0.875rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.pd-stat-rating { color: #D97706; }
.pd-stat-count { color: #4F46E5; }
.pd-stat-response { color: #059669; }
.pd-stat-joined { color: #374151; }
.pd-stat-sub { font-size: 0.6875rem; color: #9CA3AF; font-weight: 500; margin-left: 0.25rem; }

/* Responsive */
@media (max-width: 991px) {
  .pd-shop-divider-v { display: none; }
  .pd-shop-stats-grid { border-top: 1px solid #F3F4F6; padding-top: 1rem; }
  .pd-promises { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 575px) {
  .pd-main-card { padding: 1rem; }
  .pd-related-card { padding: 1rem; }
  .pd-thumbs { flex-direction: row; max-height: none; }
  .pd-thumb { width: 3.5rem; height: 3.5rem; }
  .pd-price-sale { font-size: 1.5rem; }
  .pd-btn { min-width: 100%; }
  .pd-promises { grid-template-columns: 1fr 1fr; }
  .pd-name { font-size: 1.0625rem; }
  .pd-spec-row { grid-template-columns: 8rem 1fr; }
}
</style>
