<template>
  <!-- [SHOP-PAGE] ShopDetailView -->
  <div class="bg-cream min-vh-100 pb-5 pt-3">

    <!-- ── LOADING STATE ──────────────────────────────────── -->
    <LoadingSpinner v-if="loading" text="Đang tải thông tin cửa hàng..." />

    <!-- ── ERROR STATE ────────────────────────────────────── -->
    <ErrorState
      v-else-if="errorMsg"
      :title="'Không tìm thấy cửa hàng'"
      :message="errorMsg"
      @retry="fetchShop"
    />

    <!-- ── SHOP CONTENT ──────────────────────────────────── -->
    <div v-else-if="seller" class="container">

      <!-- ── SECTION A — HERO BANNER ──────────────────────── -->
      <!-- [SHOP-PAGE] -->
      <section class="hero-blob card-pastel mb-4" style="border-color: var(--pastel-pink) !important; overflow: hidden;">
        <!-- Decorative SVG blob -->
        <svg class="position-absolute" style="top: -25%; right: -12%; width: 50%; height: 160%; opacity: 0.12; pointer-events: none; z-index: 0;" viewBox="0 0 500 500">
          <path fill="var(--pastel-coral)" d="M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,354Q39,301,29.5,227Q20,153,70,99Q120,45,193.5,25Q267,5,323.5,60Q380,115,425.5,192.5Q471,270,440.5,320.5Z"/>
        </svg>

        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-4 p-4 position-relative" style="z-index: 1;">

          <!-- Avatar -->
          <div class="avatar-ring flex-shrink-0" style="width: 6rem; height: 6rem;">
            <div class="d-flex align-items-center justify-content-center rounded-circle overflow-hidden"
              style="width: 100%; height: 100%; background: var(--pastel-coral);">
              <img v-if="seller.logoUrl" :src="seller.logoUrl" :alt="seller.name" style="width: 100%; height: 100%; object-fit: cover;" />
              <span v-else style="font-size: 2rem; font-weight: 900; color: #fff;">
                {{ seller.name?.charAt(0)?.toUpperCase() || 'S' }}
              </span>
            </div>
          </div>

          <!-- Shop info -->
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h1 class="fw-extrabold mb-0" style="font-size: 1.5rem; color: var(--pastel-ink);">{{ seller.name }}</h1>
              <!-- Verification chip -->
              <span v-if="seller.verified" class="pill-chip pill-chip-mint">
                <i class="bi bi-patch-check-fill"></i> Đã xác minh
              </span>
              <span v-else class="pill-chip pill-chip-butter">
                <i class="bi bi-exclamation-circle"></i> Chưa xác minh
              </span>
            </div>

            <!-- Stats row -->
            <div class="d-flex flex-wrap gap-2 mt-2">
              <span class="card-pastel px-3 py-1.5" style="border-color: var(--pastel-butter) !important; border-radius: 9999px; padding-top: 0.35rem; padding-bottom: 0.35rem;">
                <i class="bi bi-star-fill" style="color: #f59e0b;"></i>
                <strong style="color: var(--pastel-ink); font-size: 0.8125rem;"> {{ seller.rating || '—' }}</strong>
                <span style="color: var(--pastel-muted); font-size: 0.75rem;"> Đánh giá</span>
              </span>
              <span class="card-pastel px-3 py-1.5" style="border-color: var(--pastel-mint) !important; border-radius: 9999px; padding-top: 0.35rem; padding-bottom: 0.35rem;">
                <i class="bi bi-box-seam" style="color: #5bb88a;"></i>
                <strong style="color: var(--pastel-ink); font-size: 0.8125rem;"> {{ seller.productCount || 0 }}</strong>
                <span style="color: var(--pastel-muted); font-size: 0.75rem;"> Sản phẩm</span>
              </span>
              <span class="card-pastel px-3 py-1.5" style="border-color: var(--pastel-lavender) !important; border-radius: 9999px; padding-top: 0.35rem; padding-bottom: 0.35rem;">
                <i class="bi bi-chat-dots" style="color: #9b74d1;"></i>
                <strong style="color: var(--pastel-ink); font-size: 0.8125rem;"> {{ seller.responseRate || '—' }}</strong>
                <span style="color: var(--pastel-muted); font-size: 0.75rem;"> Tỉ lệ phản hồi</span>
              </span>
              <span class="card-pastel px-3 py-1.5" style="border-color: var(--pastel-peach) !important; border-radius: 9999px; padding-top: 0.35rem; padding-bottom: 0.35rem;">
                <i class="bi bi-clock" style="color: #8a5a20;"></i>
                <span style="color: var(--pastel-ink); font-size: 0.8125rem;"> {{ seller.responseTime || '—' }}</span>
                <span style="color: var(--pastel-muted); font-size: 0.75rem;"> Phản hồi</span>
              </span>
            </div>
          </div>

          <!-- Follow button -->
          <div class="flex-shrink-0">
            <button
              v-if="isFollowing"
              class="btn-mint d-flex align-items-center gap-2"
              :disabled="togglingFollow"
              @click="handleUnfollow"
              style="min-width: 160px;"
            >
              <i v-if="togglingFollow" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-check2"></i>
              Đang theo dõi
            </button>
            <button
              v-else
              class="btn-coral d-flex align-items-center gap-2"
              :disabled="togglingFollow"
              @click="handleFollow"
              style="min-width: 160px;"
            >
              <i v-if="togglingFollow" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-plus-lg"></i>
              Theo dõi
            </button>
          </div>
        </div>
      </section>

      <!-- ── SECTION B — TABS ────────────────────────────── -->
      <!-- [SHOP-PAGE] -->
      <section>
        <!-- Tab navigation -->
        <div class="d-flex gap-2 mb-4 overflow-x-auto pb-2" role="tablist" style="scrollbar-width: none;">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :id="'tab-' + tab.id"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="'panel-' + tab.id"
            class="nav-pill flex-shrink-0"
            :style="activeTab === tab.id
              ? 'background: var(--pastel-coral); border-color: var(--pastel-coral); color: #fff; box-shadow: 0 4px 12px rgba(255,138,138,0.3);'
              : ''"
            @click="activeTab = tab.id"
          >
            <i :class="['bi me-1', tab.icon]"></i>
            {{ tab.label }}
          </button>
        </div>

        <!-- ── TAB 1: SẢN PHẨM ────────────────────────────── -->
        <div
          id="panel-products"
          role="tabpanel"
          aria-labelledby="tab-products"
          v-show="activeTab === 'products'"
        >
          <!-- Sub-toolbar -->
          <div class="card-pastel d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3 p-3 mb-4">
            <div class="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">
              <label class="fw-bold" style="font-size: 0.8125rem; color: var(--pastel-muted);">Sắp xếp:</label>
              <select v-model="sortKey" class="form-select" style="font-size: 0.8125rem; max-width: 220px;" @change="fetchProducts(0)">
                <option value="created-desc">Mới nhất</option>
                <option value="sold-desc">Bán chạy nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
            </div>
            <!-- Category chips -->
            <div v-if="shopCategories.length > 0" class="d-flex gap-2 flex-wrap">
              <button
                :class="['pill-chip', activeCategoryId === '' ? 'pill-chip-coral' : 'pill-chip-pink']"
                style="cursor: pointer; border: none; font-size: 0.75rem;"
                @click="activeCategoryId = ''; fetchProducts(0)"
              >Tất cả</button>
              <button
                v-for="cat in shopCategories"
                :key="cat.id"
                :class="['pill-chip', activeCategoryId === cat.id ? 'pill-chip-coral' : 'pill-chip-pink']"
                style="cursor: pointer; border: none; font-size: 0.75rem;"
                @click="activeCategoryId = cat.id; fetchProducts(0)"
              >{{ cat.name }}</button>
            </div>
          </div>

          <!-- Loading -->
          <LoadingSpinner v-if="loadingProducts" text="Đang tải sản phẩm..." />

          <!-- Empty state -->
          <EmptyState
            v-else-if="products.length === 0"
            icon="bi bi-box-seam"
            title="Cửa hàng chưa có sản phẩm nào"
            description="Hãy quay lại sau để xem các sản phẩm mới."
          />

          <!-- Product grid -->
          <div v-else class="row g-3 mb-4">
            <div
              v-for="product in products"
              :key="product.id"
              class="col-6 col-md-4 col-lg-3"
            >
              <ProductCard :product="product" @add-to-cart="handleAddToCart" />
            </div>
          </div>

          <!-- Pagination -->
          <BasePagination
            v-if="!loadingProducts && productsTotalPages > 1"
            :current-page="productsPage"
            :total-pages="productsTotalPages"
            :total-elements="productsTotalElements"
            :is-first="productsFirst"
            :is-last="productsLast"
            @change="fetchProducts"
          />
        </div>

        <!-- ── TAB 2: VỀ SHOP ─────────────────────────────── -->
        <div
          id="panel-about"
          role="tabpanel"
          aria-labelledby="tab-about"
          v-show="activeTab === 'about'"
        >
          <div class="row g-4">
            <!-- Description -->
            <div class="col-md-6">
              <div class="card-pastel h-100">
                <h3 class="fw-bold mb-3" style="font-size: 1rem; color: var(--pastel-ink); display: flex; align-items: center; gap: 0.5rem;">
                  <i class="bi bi-card-text" style="color: var(--pastel-coral-dark);"></i>
                  Mô tả cửa hàng
                </h3>
                <p style="font-size: 0.875rem; color: var(--pastel-ink); line-height: 1.7; white-space: pre-line; margin: 0;">
                  {{ seller.description || 'Cửa hàng chưa cập nhật mô tả.' }}
                </p>
              </div>
            </div>

            <!-- Info -->
            <div class="col-md-6">
              <div class="card-pastel h-100">
                <h3 class="fw-bold mb-3" style="font-size: 1rem; color: var(--pastel-ink); display: flex; align-items: center; gap: 0.5rem;">
                  <i class="bi bi-info-circle" style="color: var(--pastel-coral-dark);"></i>
                  Thông tin cửa hàng
                </h3>
                <ul class="list-unstyled mb-0" style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <li class="d-flex align-items-start gap-2">
                    <i class="bi bi-geo-alt flex-shrink-0 mt-1" style="color: var(--pastel-coral-dark);"></i>
                    <div>
                      <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Địa chỉ</span>
                      <p class="mb-0" style="font-size: 0.875rem; color: var(--pastel-ink); font-weight: 500;">
                        {{ seller.address || 'Chưa cập nhật địa chỉ.' }}
                      </p>
                    </div>
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <i class="bi bi-calendar-event flex-shrink-0 mt-1" style="color: var(--pastel-mint);"></i>
                    <div>
                      <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Tham gia</span>
                      <p class="mb-0" style="font-size: 0.875rem; color: var(--pastel-ink); font-weight: 500;">
                        {{ formatDate(seller.createdAt) }}
                      </p>
                    </div>
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <i class="bi bi-award flex-shrink-0 mt-1" style="color: var(--pastel-lavender);"></i>
                    <div>
                      <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Cấp bậc</span>
                      <p class="mb-0" style="font-size: 0.875rem; font-weight: 500;">
                        <span :class="tierChipClass(seller.tier)" style="font-size: 0.75rem;">
                          <i :class="tierIcon(seller.tier)"></i>
                          {{ tierLabel(seller.tier) }}
                        </span>
                      </p>
                    </div>
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <i class="bi bi-shield-check flex-shrink-0 mt-1" style="color: var(--pastel-peach);"></i>
                    <div>
                      <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Chính sách</span>
                      <p class="mb-0" style="font-size: 0.875rem; color: var(--pastel-ink); font-weight: 500;">
                        Đổi trả trong 7 ngày, giao hàng toàn quốc
                      </p>
                    </div>
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <i class="bi bi-people flex-shrink-0 mt-1" style="color: var(--pastel-coral-dark);"></i>
                    <div>
                      <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Người theo dõi</span>
                      <p class="mb-0" style="font-size: 0.875rem; color: var(--pastel-ink); font-weight: 500;">
                        {{ seller.followerCount || 0 }} người
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- ── TAB 3: ĐÁNH GIÁ ─────────────────────────────── -->
        <div
          id="panel-reviews"
          role="tabpanel"
          aria-labelledby="tab-reviews"
          v-show="activeTab === 'reviews'"
        >
          <!-- Rating summary -->
          <div class="card-pastel mb-4 p-4">
            <div class="d-flex flex-column flex-sm-row align-items-center gap-4">
              <!-- Overall score -->
              <div class="text-center flex-shrink-0">
                <div style="font-size: 3.5rem; font-weight: 900; color: var(--pastel-coral-dark); line-height: 1;">
                  {{ shopRating.avg }}
                </div>
                <div class="my-1">
                  <i v-for="n in 5" :key="n"
                    :class="['bi', n <= Math.round(parseFloat(shopRating.avg)) ? 'bi-star-fill' : 'bi-star']"
                    style="font-size: 1rem; color: #f59e0b;"></i>
                </div>
                <p style="font-size: 0.75rem; color: var(--pastel-muted); margin: 0;">{{ shopRating.total }} đánh giá</p>
              </div>

              <!-- Breakdown bars -->
              <div class="flex-grow-1 w-100" style="max-width: 400px;">
                <div v-for="(count, star) in shopRating.breakdown" :key="star" class="d-flex align-items-center gap-2 mb-2">
                  <span style="font-size: 0.8125rem; font-weight: 700; color: var(--pastel-ink); width: 2rem; text-align: right;">{{ star }}★</span>
                  <div class="progress flex-grow-1" style="height: 8px;">
                    <div class="progress-bar" role="progressbar"
                      :style="'width: ' + (shopRating.total > 0 ? (count / shopRating.total * 100) : 0) + '%; background: var(--pastel-coral);'">
                    </div>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--pastel-muted); width: 2rem;">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading reviews -->
          <LoadingSpinner v-if="loadingReviews" text="Đang tải đánh giá..." />

          <!-- Empty reviews -->
          <EmptyState
            v-else-if="reviews.length === 0"
            icon="bi bi-chat-dots"
            title="Chưa có đánh giá nào"
            description="Hãy là người đầu tiên đánh giá cửa hàng này."
          />

          <!-- Review list -->
          <div v-else class="d-flex flex-column gap-3 mb-4">
            <div
              v-for="review in reviews"
              :key="review.id"
              class="card-pastel p-3"
            >
              <div class="d-flex align-items-start gap-3">
                <!-- Avatar -->
                <div class="avatar-ring flex-shrink-0" style="width: 2.5rem; height: 2.5rem;">
                  <div class="d-flex align-items-center justify-content-center rounded-circle"
                    style="width: 100%; height: 100%; background: var(--pastel-pink); font-weight: 800; font-size: 0.875rem; color: var(--pastel-coral-dark);">
                    {{ review.reviewerName?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-1">
                    <strong style="font-size: 0.875rem; color: var(--pastel-ink);">
                      {{ review.isAnonymous ? 'Ẩn danh' : (review.reviewerName || 'Khách hàng') }}
                    </strong>
                    <div style="color: #f59e0b; font-size: 0.75rem;">
                      <i v-for="n in 5" :key="n" :class="['bi', n <= review.rating ? 'bi-star-fill' : 'bi-star']"></i>
                      <span style="color: var(--pastel-muted); font-weight: 400; margin-left: 0.25rem;">{{ formatDate(review.createdAt) }}</span>
                    </div>
                  </div>
                  <p v-if="review.productName" style="font-size: 0.75rem; color: var(--pastel-muted); margin-bottom: 0.5rem;">
                    <i class="bi bi-box-seam me-1"></i> Đã mua: {{ review.productName }}
                  </p>
                  <p style="font-size: 0.875rem; color: var(--pastel-ink); margin: 0; line-height: 1.6;">
                    {{ review.comment || 'Không có nhận xét.' }}
                  </p>
                  <!-- Seller reply -->
                  <div v-if="review.sellerReply" class="card-pastel p-2 mt-2" style="background: var(--pastel-cream);">
                    <div class="d-flex align-items-center gap-1 mb-1">
                      <i class="bi bi-shop" style="color: var(--pastel-coral-dark); font-size: 0.75rem;"></i>
                      <small style="font-weight: 700; color: var(--pastel-coral-dark);">Phản hồi từ cửa hàng</small>
                    </div>
                    <p style="font-size: 0.8125rem; color: var(--pastel-ink); margin: 0;">{{ review.sellerReply }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Load more -->
          <div v-if="hasMoreReviews && !loadingMoreReviews" class="text-center">
            <button class="btn-pastel" @click="loadMoreReviews" style="font-size: 0.875rem; padding: 0.5rem 1.5rem;">
              <i class="bi bi-chevron-double-down me-1"></i> Xem thêm đánh giá
            </button>
          </div>
          <LoadingSpinner v-else-if="loadingMoreReviews" text="Đang tải thêm..." />
        </div>

      </section><!-- /tabs -->

    </div><!-- /container -->

    <!-- ── SECTION C — BACK TO TOP ────────────────────────── -->
    <!-- [SHOP-PAGE] -->
    <button
      v-show="showBackTop"
      class="fab-coral position-fixed"
      style="bottom: 2rem; right: 2rem; z-index: 30;"
      @click="scrollTop"
      aria-label="Quay về đầu trang"
    >
      <!-- Inline SVG arrow -->
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicShopService } from '@/services/publicShop.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import ProductCard from '@/components/common/ProductCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import BasePagination from '@/components/common/BasePagination.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notify = useNotifyStore()

// ── Tabs ──────────────────────────────────────────────────────
const tabs = [
  { id: 'products', label: 'Sản phẩm', icon: 'bi-box-seam' },
  { id: 'about',    label: 'Về shop',  icon: 'bi-shop' },
  { id: 'reviews',  label: 'Đánh giá', icon: 'bi-star' },
]
const activeTab = ref('products')

// ── Shop data ─────────────────────────────────────────────────
const seller = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const isFollowing = ref(false)
const togglingFollow = ref(false)

// ── Products ──────────────────────────────────────────────────
const products = ref([])
const loadingProducts = ref(true)
const productsPage = ref(0)
const productsTotalPages = ref(1)
const productsTotalElements = ref(0)
const productsFirst = ref(true)
const productsLast = ref(true)
const sortKey = ref('created-desc')
const activeCategoryId = ref('')
const shopCategories = ref([])
const productsPageSize = 12

// ── Reviews ───────────────────────────────────────────────────
const reviews = ref([])
const loadingReviews = ref(true)
const loadingMoreReviews = ref(false)
const reviewPage = ref(0)
const reviewTotal = ref(0)
const hasMoreReviews = computed(() => reviews.value.length < reviewTotal.value)
const REVIEW_SIZE = 10

// ── Rating summary ────────────────────────────────────────────
const shopRating = reactive({
  avg: '—',
  total: 0,
  breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
})

// ── Back to top ────────────────────────────────────────────────
const showBackTop = ref(false)

const handleScroll = () => { showBackTop.value = window.scrollY > 400 }
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

// ── Helpers ───────────────────────────────────────────────────
const formatDate = (str) => {
  if (!str) return '—'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(str))
}

const tierLabel = (tier) => {
  const map = { GOLD: 'Vàng', SILVER: 'Bạc', BRONZE: 'Đồng', NEW: 'Mới' }
  return map[tier?.toUpperCase()] || tier || '—'
}

const tierChipClass = (tier) => {
  const map = { GOLD: 'pill-chip-lavender', SILVER: 'pill-chip-mint', BRONZE: 'pill-chip-peach', NEW: 'pill-chip-butter' }
  return 'pill-chip ' + (map[tier?.toUpperCase()] || 'pill-chip-pink')
}

const tierIcon = (tier) => {
  const map = { GOLD: 'bi bi-award-fill', SILVER: 'bi bi-award', BRONZE: 'bi bi-award', NEW: 'bi bi-star' }
  return map[tier?.toUpperCase()] || 'bi bi-star'
}

// ── API calls ─────────────────────────────────────────────────
const fetchShop = async () => {
  loading.value = true
  errorMsg.value = ''
  const slug = route.params.slug
  try {
    const data = await publicShopService.getBySlug(slug)
    seller.value = data
    // Seed rating summary from seller object if available
    if (data.ratingAvg != null) shopRating.avg = Number(data.ratingAvg).toFixed(1)
    if (data.ratingCount != null) shopRating.total = data.ratingCount
    // Follow state — backend may include `isFollowing` boolean
    isFollowing.value = data?.isFollowing ?? false
  } catch (err) {
    errorMsg.value = 'Không thể tải thông tin cửa hàng. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}

const fetchProducts = async (page = 0) => {
  loadingProducts.value = true
  productsPage.value = page
  const slug = route.params.slug
  const [sortBy, sortDir] = sortKey.value.split('-')
  try {
    const data = await publicShopService.getProducts(slug, {
      page,
      size: productsPageSize,
      sort: sortBy,
      categoryId: activeCategoryId.value || undefined,
    })
    products.value = data?.content || []
    productsTotalPages.value = data?.totalPages ?? 1
    productsTotalElements.value = data?.totalElements ?? 0
    productsFirst.value = data?.first ?? true
    productsLast.value = data?.last ?? true
    // Seed categories from first response if available
    if (page === 0 && data?.content?.length > 0) {
      const catMap = {}
      data.content.forEach(p => {
        if (p.categoryId && p.categoryName && !catMap[p.categoryId]) {
          catMap[p.categoryId] = { id: p.categoryId, name: p.categoryName }
        }
      })
      shopCategories.value = Object.values(catMap)
    }
  } catch (_) {
    products.value = []
  } finally {
    loadingProducts.value = false
  }
}

const fetchReviews = async (reset = false) => {
  if (reset) { reviewPage.value = 0; reviews.value = []; reviewTotal.value = 0 }
  loadingReviews.value = reset; loadingMoreReviews.value = !reset
  const slug = route.params.slug
  try {
    const data = await publicShopService.getReviews(slug, { page: reviewPage.value, size: REVIEW_SIZE })
    const page = data
    if (reset) {
      reviews.value = page?.content || []
    } else {
      reviews.value.push(...(page?.content || []))
    }
    reviewTotal.value = page?.totalElements || 0
    // Build rating breakdown from page metadata (backend may provide it)
    if (page?.ratingStats) {
      shopRating.avg = page.ratingStats.avg?.toFixed(1) ?? shopRating.avg
      shopRating.total = page.ratingStats.total ?? reviewTotal.value
      shopRating.breakdown = page.ratingStats.breakdown || shopRating.breakdown
    }
  } catch (_) {} finally {
    loadingReviews.value = false; loadingMoreReviews.value = false
  }
}

const loadMoreReviews = () => {
  reviewPage.value++
  fetchReviews(false)
}

const handleAddToCart = (product) => {
  notify.push(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success')
}

// ── Follow / Unfollow ────────────────────────────────────────
const handleFollow = async () => {
  if (!auth.isAuthenticated) {
    notify.push('Vui lòng đăng nhập để theo dõi cửa hàng!', 'warning')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  togglingFollow.value = true
  try {
    await publicShopService.follow(seller.value.id)
    isFollowing.value = true
    notify.push(`Bạn đã theo dõi "${seller.value.name}"!`, 'success')
  } catch (_) {
    notify.push('Không thể theo dõi cửa hàng. Vui lòng thử lại.', 'danger')
  } finally {
    togglingFollow.value = false
  }
}

const handleUnfollow = async () => {
  togglingFollow.value = true
  try {
    await publicShopService.unfollow(seller.value.id)
    isFollowing.value = false
    notify.push(`Đã bỏ theo dõi "${seller.value.name}".`, 'success')
  } catch (_) {
    notify.push('Không thể bỏ theo dõi. Vui lòng thử lại.', 'danger')
  } finally {
    togglingFollow.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────
watch(() => route.params.slug, (slug) => {
  if (slug) {
    fetchShop()
    fetchProducts(0)
    fetchReviews(true)
    activeTab.value = 'products'
  }
})

onMounted(() => {
  fetchShop()
  fetchProducts(0)
  fetchReviews(true)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* [SHOP-PAGE] */
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
