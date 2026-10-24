<template>
  <!-- NO MALL Products List View -->
  <div style="background: var(--nomall-bg); min-height: 100vh;" class="pb-5">

    <!-- Breadcrumb -->
    <div style="background: #fff; border-bottom: 1px solid var(--nomall-border); padding: 0.5rem 0;">
      <div class="container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
          <span style="color: var(--nomall-red); font-weight: 700;">Sản phẩm</span>
          <template v-if="activeCategory">
            <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
            <span>{{ activeCategory.name }}</span>
          </template>
        </nav>
      </div>
    </div>

    <div class="container mt-3">
      <div class="row g-4">

        <!-- ── LEFT: Filter Sidebar ──────────────────── -->
        <div class="col-lg-3">
          <!-- Mobile: Offcanvas trigger button -->
          <button
            class="d-lg-none w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
            style="background:#fff; border: 1.5px solid var(--nomall-border); border-radius: 10px; padding: 0.625rem; font-size:0.875rem; font-weight:700; color: var(--nomall-ink);"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#filterOffcanvas"
          >
            <i class="bi bi-funnel" style="color: var(--nomall-red);"></i>
            Bộ lọc
            <span v-if="hasActiveFilters" class="badge" style="background: var(--nomall-red); color: #fff; border-radius: 50%; width: 1.25rem; height: 1.25rem; display: flex; align-items: center; justify-content: center; font-size: 0.6875rem;">
              {{ activeFilterCount }}
            </span>
          </button>

          <!-- Desktop sidebar -->
          <div class="nomall-card p-3 d-none d-lg-block position-sticky" style="top: 100px;">
            <FilterSidebar
              :categories="categories"
              :filters="filters"
              @apply="applyFilters"
              @clear="clearFilters"
            />
          </div>
        </div>

        <!-- ── RIGHT: Product Grid ──────────────────────── -->
        <div class="col-lg-9">
          <!-- Top bar: count + sort -->
          <div class="nomall-card p-3 mb-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <div style="font-size: 0.8125rem; color: var(--nomall-muted);">
              <strong style="color: var(--nomall-ink);">{{ totalElements }}</strong> sản phẩm
            </div>
            <div class="d-flex align-items-center gap-2">
              <label style="font-size: 0.8125rem; font-weight: 700; color: var(--nomall-muted); white-space: nowrap;">Sắp xếp:</label>
              <select v-model="sortKey" class="nomall-form-control" style="width: auto; font-size: 0.8125rem; padding: 0.375rem 0.75rem;" @change="applyFilters">
                <option value="created-desc">Mới nhất</option>
                <option value="sold-desc">Bán chạy nhất</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="rating-desc">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>

          <!-- Search results info -->
          <div v-if="filters.q" class="nomall-card p-3 mb-3 d-flex align-items-center gap-2" style="border-left: 4px solid var(--nomall-red);">
            <i class="bi bi-search" style="color: var(--nomall-red); font-size: 1.25rem;"></i>
            <div>
              <div style="font-size: 0.875rem; font-weight: 700; color: var(--nomall-ink);">
                Kết quả tìm kiếm cho "{{ filters.q }}"
              </div>
              <div style="font-size: 0.75rem; color: var(--nomall-muted);">
                {{ totalElements }} sản phẩm được tìm thấy
              </div>
            </div>
            <button class="btn ms-auto" style="font-size: 0.75rem; color: var(--nomall-red); border: none; padding: 0.25rem 0.5rem;" @click="clearSearch">×</button>
          </div>

          <!-- Loading -->
          <LoadingSpinner v-if="loading" text="Đang tải sản phẩm..." />

          <!-- Empty -->
          <div v-else-if="products.length === 0" class="nomall-empty nomall-card p-5 text-center">
            <i class="bi bi-bag-x" style="font-size: 3.5rem;"></i>
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            <button class="nomall-btn-primary" @click="clearFilters">Xóa bộ lọc</button>
          </div>

          <!-- Product grid -->
          <div v-else class="nomall-grid mb-4">
            <NomallProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @add-to-cart="handleAddToCart"
              @click="goToDetail(product)"
            />
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="d-flex justify-content-center">
            <nav>
              <ul class="pagination mb-0" style="gap: 0.25rem;">
                <li class="page-item" :class="{ disabled: currentPage <= 0 }">
                  <button class="page-link nomall-page-link" @click="changePage(currentPage - 1)">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                </li>
                <li v-for="p in visiblePages" :key="p" class="page-item" :class="{ active: p === currentPage }">
                  <button class="page-link nomall-page-link" @click="changePage(p)">{{ p + 1 }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage >= totalPages - 1 }">
                  <button class="page-link nomall-page-link" @click="changePage(currentPage + 1)">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile filter offcanvas -->
    <div class="offcanvas offcanvas-start" tabindex="-1" id="filterOffcanvas">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title" style="font-weight: 800; color: var(--nomall-red);">
          <i class="bi bi-funnel me-1"></i>Bộ Lọc
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <FilterSidebar
          :categories="categories"
          :filters="filters"
          @apply="applyFilters"
          @clear="clearFilters"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'
import { useNotifyStore } from '@/stores/notify'
import NomallProductCard from '@/components/buyer/ProductCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import FilterSidebar from '@/components/buyer/FilterSidebar.vue'

const route = useRoute()
const router = useRouter()
const notify = useNotifyStore()

const loading = ref(true)
const products = ref([])
const categories = ref([])
const sortKey = ref('created-desc')
const totalElements = ref(0)
const totalPages = ref(1)
const currentPage = ref(0)

const activeCategory = computed(() => {
  const id = route.query.category
  return categories.value.find(c => (c.slug || String(c.id)) === id) || null
})

const filters = reactive({
  q: route.query.q || '',
  categoryId: route.query.categoryId || '',
  category: route.query.category || '',
  minPrice: route.query.minPrice || '',
  maxPrice: route.query.maxPrice || '',
})

const hasActiveFilters = computed(() =>
  filters.q || filters.categoryId || filters.category || filters.minPrice || filters.maxPrice
)

const activeFilterCount = computed(() => {
  let n = 0
  if (filters.q) n++
  if (filters.categoryId || filters.category) n++
  if (filters.minPrice || filters.maxPrice) n++
  return n
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages = []
  const start = Math.max(0, cur - 2)
  const end = Math.min(total - 1, cur + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const fetchCategories = async () => {
  try {
    const data = await catalogService.getRootCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (_) {}
}

const fetchProducts = async (page = 0) => {
  loading.value = true
  currentPage.value = page
  const [sortBy, sortDir] = sortKey.value.split('-')
  const params = { page, size: 20, sortBy, sortDir }
  if (filters.q) params.q = filters.q
  if (filters.category) params.categoryId = filters.category
  else if (filters.categoryId) params.categoryId = filters.categoryId
  if (filters.minPrice) params.minPrice = filters.minPrice
  if (filters.maxPrice) params.maxPrice = filters.maxPrice

  try {
    const data = await catalogService.listProducts(params)
    products.value = data?.content || []
    totalElements.value = data?.totalElements || 0
    totalPages.value = data?.totalPages || 1
  } catch (_) {
    products.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  const query = {}
  if (filters.q) query.q = filters.q
  if (filters.category) query.category = filters.category
  if (filters.categoryId) query.categoryId = filters.categoryId
  if (filters.minPrice) query.minPrice = filters.minPrice
  if (filters.maxPrice) query.maxPrice = filters.maxPrice
  router.push({ name: 'products', query })
  fetchProducts(0)

  // Close mobile offcanvas if open
  const offcanvas = document.getElementById('filterOffcanvas')
  if (offcanvas) {
    const bs = window.bootstrap?.Offcanvas.getInstance(offcanvas)
    bs?.hide()
  }
}

const clearFilters = () => {
  filters.q = ''
  filters.categoryId = ''
  filters.category = ''
  filters.minPrice = ''
  filters.maxPrice = ''
  router.push({ name: 'products' })
  fetchProducts(0)
}

const clearSearch = () => {
  filters.q = ''
  applyFilters()
}

const changePage = (p) => {
  if (p < 0 || p >= totalPages.value) return
  fetchProducts(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (product) => {
  router.push({ name: 'product-detail', params: { slug: product.slug } })
}

const handleAddToCart = (product) => {
  notify.push(`Đã thêm "${product.name}" vào giỏ!`, 'success')
}

watch(() => route.query, (newQuery) => {
  filters.q = newQuery.q || ''
  filters.category = newQuery.category || ''
  filters.categoryId = newQuery.categoryId || ''
  filters.minPrice = newQuery.minPrice || ''
  filters.maxPrice = newQuery.maxPrice || ''
  fetchProducts(0)
})

onMounted(() => {
  fetchCategories()
  fetchProducts(0)
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
