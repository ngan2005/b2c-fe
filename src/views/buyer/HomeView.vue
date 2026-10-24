<template>
  <!-- NO MALL Home View — 3-column layout -->
  <div class="pb-5" style="background: var(--nomall-bg);">

    <!-- Breadcrumb strip -->
    <div style="background: #fff; border-bottom: 1px solid var(--nomall-border); padding: 0.5rem 0;">
      <div class="nomall-container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
          <span style="color: var(--nomall-red); font-weight: 700;">NO MALL</span>
        </nav>
      </div>
    </div>

    <div class="nomall-container mt-3">
      <div class="nomall-home-layout">

        <!-- Floating Restore Tab for Left Sidebar when collapsed -->
        <button
          v-if="isLeftCollapsed"
          class="nomall-sidebar-tab-trigger left d-none d-lg-flex"
          type="button"
          @click="isLeftCollapsed = false"
          title="Mở rộng danh mục"
        >
          <i class="bi bi-list"></i>
          <span>Danh mục</span>
        </button>

        <!-- Floating Restore Tab for Right Sidebar when collapsed -->
        <button
          v-if="isRightCollapsed"
          class="nomall-sidebar-tab-trigger right d-none d-xl-flex"
          type="button"
          @click="isRightCollapsed = false"
          title="Mở rộng ưu đãi & top bán chạy"
        >
          <span>Ưu đãi & Top</span>
          <i class="bi bi-ticket-perforated"></i>
        </button>

        <!-- ── LEFT: Category Sidebar (Pushed to left edge, compact & collapsible) ─ -->
        <aside
          class="nomall-sidebar-col d-none d-lg-block"
          :class="{ 'collapsed': isLeftCollapsed }"
        >
          <div class="position-sticky" style="top: 85px;">
            <BuyerCategorySidebar
              collapsible
              @collapse="isLeftCollapsed = true"
              @select="onCategorySelect"
              @select-all="goToAllProducts"
              @search="onSearchTrend"
            />
          </div>
        </aside>

        <!-- ── CENTER: Main spacious content ────────────── -->
        <main class="nomall-main-col">
          <!-- Hero Carousel -->
          <BuyerHeroCarousel class="mb-3" />

          <!-- Brand Trust Badges Strip (Option 2) -->
          <BuyerShortcutIcons class="mb-3" />

          <!-- Flash Sale Section -->
          <BuyerFlashSaleCountdown
            class="mb-4"
            :products="dealProducts"
            :loading="loadingDeals"
            @add-to-cart="handleAddToCart"
            @view-detail="goToDetail"
          />

          <!-- All Products Section -->
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h2 class="nomall-section-title">Gợi ý hôm nay</h2>
              <router-link
                :to="{ name: 'products' }"
                class="text-decoration-none"
                style="font-size: 0.8125rem; font-weight: 700; color: var(--nomall-red);"
              >
                Xem tất cả <i class="bi bi-chevron-right"></i>
              </router-link>
            </div>

            <LoadingSpinner v-if="loadingLatest" text="Đang tải sản phẩm..." />

            <div v-else class="nomall-grid">
              <NomallProductCard
                v-for="product in latestProducts"
                :key="product.id"
                :product="product"
                @add-to-cart="handleAddToCart"
                @click="goToDetail(product)"
              />
            </div>

            <!-- Pagination -->
            <div v-if="latestTotalPages > 1" class="d-flex justify-content-center mt-3">
              <nav>
                <ul class="pagination mb-0" style="gap: 0.25rem;">
                  <li class="page-item" :class="{ disabled: latestPage <= 0 }">
                    <button class="page-link nomall-page-link" @click="changePage(latestPage - 1)">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li
                    v-for="p in visiblePages"
                    :key="p"
                    class="page-item"
                    :class="{ active: p === latestPage }"
                  >
                    <button class="page-link nomall-page-link" @click="changePage(p)">{{ p + 1 }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: latestPage >= latestTotalPages - 1 }">
                    <button class="page-link nomall-page-link" @click="changePage(latestPage + 1)">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </main>

        <!-- ── RIGHT: Promo Banners (Pushed to right edge, compact & collapsible) ── -->
        <aside
          class="nomall-promo-col d-none d-xl-block"
          :class="{ 'collapsed': isRightCollapsed }"
        >
          <div class="position-sticky" style="top: 85px;">
            <BuyerPromoSidebar
              collapsible
              @collapse="isRightCollapsed = true"
            />
          </div>
        </aside>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'
import { useNotifyStore } from '@/stores/notify'
import BuyerCategorySidebar from '@/components/buyer/CategorySidebar.vue'
import BuyerHeroCarousel from '@/components/buyer/HeroCarousel.vue'
import BuyerShortcutIcons from '@/components/buyer/ShortcutIcons.vue'
import BuyerFlashSaleCountdown from '@/components/buyer/FlashSaleCountdown.vue'
import BuyerPromoSidebar from '@/components/buyer/PromoSidebar.vue'
import NomallProductCard from '@/components/buyer/ProductCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const notify = useNotifyStore()

// ── Sidebar collapse toggles ─────────────────────────────────
const isLeftCollapsed = ref(false)
const isRightCollapsed = ref(false)

const dealProducts = ref([])
const loadingDeals = ref(true)
const latestProducts = ref([])
const loadingLatest = ref(true)
const latestPage = ref(0)
const latestPageSize = 20
const latestTotalPages = ref(1)

const visiblePages = computed(() => {
  const total = latestTotalPages.value
  const cur = latestPage.value
  const pages = []
  const start = Math.max(0, cur - 2)
  const end = Math.min(total - 1, cur + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const loadDeals = async () => {
  loadingDeals.value = true
  try {
    const data = await catalogService.listProducts({ page: 0, size: 6, sortBy: 'sold', sortDir: 'desc' })
    dealProducts.value = data?.content || []
  } catch (_) {} finally { loadingDeals.value = false }
}

const loadLatest = async (page = 0) => {
  loadingLatest.value = true
  latestPage.value = page
  try {
    const data = await catalogService.listProducts({ page, size: latestPageSize, sortBy: 'created', sortDir: 'desc' })
    latestProducts.value = data?.content || []
    latestTotalPages.value = data?.totalPages ?? 1
  } catch (_) {} finally { loadingLatest.value = false }
}

const changePage = (p) => {
  if (p < 0 || p >= latestTotalPages.value) return
  loadLatest(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (product) => {
  router.push({ name: 'product-detail', params: { slug: product.slug } })
}

const goToAllProducts = () => {
  router.push({ name: 'products' })
}

const onCategorySelect = (cat) => {
  router.push({ name: 'products', query: { category: cat.slug || cat.id } })
}

const onSearchTrend = (tag) => {
  router.push({ name: 'products', query: { q: tag } })
}

const handleAddToCart = (product) => {
  notify.push(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success')
}

onMounted(() => {
  loadDeals()
  loadLatest(0)
})
</script>

<style scoped>
.nomall-page-link {
  border: 1.5px solid var(--nomall-border);
  border-radius: 8px;
  color: var(--nomall-ink);
  font-size: 0.8125rem;
  font-weight: 700;
  min-width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.nomall-page-link:hover {
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  border-color: var(--nomall-red);
}

.pagination .active .nomall-page-link {
  background: var(--nomall-red);
  border-color: var(--nomall-red);
  color: #fff;
}
</style>
