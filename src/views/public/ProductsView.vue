<template>
  <!-- [PASTEL-REDESIGN] ProductsView -->
  <div class="bg-cream min-vh-100 py-4">
    <div class="container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb mb-3">
        <ol class="d-flex align-items-center gap-1" style="font-size: 0.8125rem; list-style: none; padding: 0; margin: 0;">
          <li><router-link :to="{ name: 'home' }" style="color: var(--pastel-muted); font-weight: 600; text-decoration: none;">Trang chủ</router-link></li>
          <li style="color: var(--pastel-muted);">/</li>
          <li class="fw-bold" style="color: var(--pastel-ink);" aria-current="page">Danh sách sản phẩm</li>
        </ol>
      </nav>

      <div class="row g-4">
        <!-- ── Filter Sidebar ─────────────────────────── -->
        <div class="col-lg-3">
          <div class="card-pastel sticky-top" style="top: 5rem; z-index: 10;">
            <div class="d-flex align-items-center justify-content-between pb-3 mb-3" style="border-bottom: 1.5px solid var(--pastel-border);">
              <h3 class="m-0 fw-bold" style="font-size: 1rem; color: var(--pastel-ink); display: flex; align-items: center; gap: 0.5rem;">
                <i class="bi bi-funnel" style="color: var(--pastel-coral-dark);"></i> Bộ Lọc
              </h3>
              <button v-if="hasActiveFilters" class="btn" @click="clearFilters"
                style="font-size: 0.75rem; font-weight: 700; color: var(--pastel-coral-dark); background: none; border: none; padding: 0; text-decoration: underline;">
                Xóa bộ lọc
              </button>
            </div>

            <!-- Search keyword -->
            <div class="mb-4">
              <label class="form-label">Từ khóa</label>
              <div class="input-group">
                <input v-model="filters.q" type="text" class="form-control" placeholder="Tên sản phẩm..."
                  @keyup.enter="applyFilters" />
                <button class="btn" @click="applyFilters" style="background: var(--pastel-coral); color: #fff; border-radius: 0 16px 16px 0; border-color: var(--pastel-coral);">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>

            <!-- Category -->
            <div class="mb-4">
              <label class="form-label">Danh mục</label>
              <select v-model="filters.categoryId" class="form-select" @change="applyFilters">
                <option value="">Tất cả danh mục</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <!-- Price range -->
            <div class="mb-4">
              <label class="form-label">Khoảng giá (VND)</label>
              <div class="row g-2">
                <div class="col-6">
                  <input v-model.number="filters.minPrice" type="number" class="form-control" placeholder="Từ" />
                </div>
                <div class="col-6">
                  <input v-model.number="filters.maxPrice" type="number" class="form-control" placeholder="Đến" />
                </div>
              </div>
            </div>

            <button class="btn-coral w-100" @click="applyFilters" style="font-size: 0.875rem; padding: 0.6rem;">
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        <!-- ── Product Grid ─────────────────────────────── -->
        <div class="col-lg-9">
          <!-- Top bar -->
          <div class="card-pastel d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 p-3">
            <div style="font-size: 0.875rem; color: var(--pastel-muted);">
              Hiển thị <span class="fw-bold" style="color: var(--pastel-ink);">{{ pageData.totalElements }}</span> sản phẩm phù hợp
            </div>
            <div class="d-flex align-items-center gap-2">
              <label style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Sắp xếp:</label>
              <select v-model="sortKey" class="form-select" style="font-size: 0.8125rem; width: auto;" @change="applyFilters">
                <option value="created-desc">Mới nhất</option>
                <option value="sold-desc">Bán chạy nhất</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="rating-desc">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>

          <LoadingSpinner v-if="loading" text="Đang tìm kiếm sản phẩm..." />
          <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchProducts" />
          <EmptyState
            v-else-if="pageData.content.length === 0"
            title="Không tìm thấy sản phẩm"
            description="Thử thay đổi từ khóa hoặc xóa bớt bộ lọc."
          >
            <template #action>
              <button class="btn-coral" @click="clearFilters" style="font-size: 0.8125rem; padding: 0.5rem 1.25rem;">Xóa bộ lọc</button>
            </template>
          </EmptyState>

          <div v-else class="row g-3 mb-4">
            <div v-for="product in pageData.content" :key="product.id" class="col-6 col-md-4 col-xl-3">
              <ProductCard :product="product" />
            </div>
          </div>

          <BasePagination
            v-if="pageData.totalPages > 1"
            :current-page="pageData.page"
            :total-pages="pageData.totalPages"
            :total-elements="pageData.totalElements"
            :is-first="pageData.first"
            :is-last="pageData.last"
            @change="onPageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'
import ProductCard from '@/components/common/ProductCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import BasePagination from '@/components/common/BasePagination.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const errorMsg = ref('')
const categories = ref([])
const sortKey = ref('created-desc')

const filters = reactive({
  q: route.query.q || '',
  categoryId: route.query.categoryId || '',
  minPrice: route.query.minPrice || '',
  maxPrice: route.query.maxPrice || '',
})

const pageData = ref({ content: [], page: 0, size: 12, totalElements: 0, totalPages: 1, first: true, last: true })

const hasActiveFilters = computed(() => filters.q || filters.categoryId || filters.minPrice || filters.maxPrice)

const fetchCategories = async () => {
  try {
    const data = await catalogService.listCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (_) {}
}

const fetchProducts = async (page = 0) => {
  loading.value = true
  errorMsg.value = ''
  const [sortBy, sortDir] = sortKey.value.split('-')
  const params = { page, size: 12, sortBy, sortDir }
  if (filters.q) params.q = filters.q
  if (filters.categoryId) params.categoryId = filters.categoryId
  if (filters.minPrice) params.minPrice = filters.minPrice
  if (filters.maxPrice) params.maxPrice = filters.maxPrice
  try {
    const res = await catalogService.listProducts(params)
    pageData.value = {
      content: res?.content || [],
      page: res?.page || 0, size: res?.size || 12,
      totalElements: res?.totalElements || 0, totalPages: res?.totalPages || 1,
      first: res?.first ?? true, last: res?.last ?? true,
    }
  } catch (err) { errorMsg.value = 'Không thể kết nối danh sách sản phẩm.' }
  finally { loading.value = false }
}

const applyFilters = () => {
  const query = {}
  if (filters.q) query.q = filters.q
  if (filters.categoryId) query.categoryId = filters.categoryId
  if (filters.minPrice) query.minPrice = filters.minPrice
  if (filters.maxPrice) query.maxPrice = filters.maxPrice
  router.push({ name: 'products', query })
  fetchProducts(0)
}

const clearFilters = () => {
  filters.q = ''; filters.categoryId = ''; filters.minPrice = ''; filters.maxPrice = ''
  router.push({ name: 'products' })
  fetchProducts(0)
}

const onPageChange = (newPage) => {
  fetchProducts(newPage)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(() => route.query, (newQuery) => {
  filters.q = newQuery.q || ''
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
