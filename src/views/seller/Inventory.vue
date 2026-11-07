<script setup>
import { ref, computed, onMounted } from 'vue'
import { sellerInventoryService } from '@/services/sellerInventory.service'
import { useNotifyStore } from '@/stores/notify'

const notify = useNotifyStore()

const loading = ref(false)
const items = ref([])
const totalElements = ref(0)
const totalPages = ref(0)
const page = ref(0)
const size = ref(20)

// Filters & search
const keyword = ref('')
const activeFilter = ref('ALL') // 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'

// Overall stats
const stats = ref({
  totalSkus: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
})

// Quick edit tracking: map of variantId -> { newStock, saving }
const editStates = ref({})

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      filter: activeFilter.value,
    }
    if (keyword.value.trim()) {
      params.q = keyword.value.trim()
    }
    const res = await sellerInventoryService.getInventory(params)
    const data = res.data || res

    stats.value = {
      totalSkus: data.totalSkus ?? 0,
      lowStockCount: data.lowStockCount ?? 0,
      outOfStockCount: data.outOfStockCount ?? 0,
    }

    const pageData = data.items || {}
    items.value = pageData.content || pageData.items || []
    totalPages.value = pageData.totalPages ?? 0
    totalElements.value = pageData.totalElements ?? items.value.length

    // Initialize edit states
    editStates.value = {}
    items.value.forEach(item => {
      editStates.value[item.variantId] = {
        stock: item.stockQuantity,
        initialStock: item.stockQuantity,
        saving: false,
      }
    })
  } catch (err) {
    console.error('Failed to load inventory:', err)
    notify.push('Không thể tải dữ liệu kho hàng. Vui lòng thử lại!', 'danger')
  } finally {
    loading.value = false
  }
}

function setFilter(f) {
  if (activeFilter.value === f) return
  activeFilter.value = f
  page.value = 0
  loadData()
}

function handleSearch() {
  page.value = 0
  loadData()
}

function resetSearch() {
  keyword.value = ''
  activeFilter.value = 'ALL'
  page.value = 0
  loadData()
}

async function quickSaveStock(item) {
  const state = editStates.value[item.variantId]
  if (!state) return

  const newStock = Number(state.stock)
  if (isNaN(newStock) || newStock < 0) {
    notify.push('Số lượng kho phải là số nguyên không âm!', 'warning')
    return
  }

  if (newStock < (item.reservedQuantity || 0)) {
    notify.push(`Số lượng kho (${newStock}) không được nhỏ hơn số lượng đang giữ chỗ cho khách (${item.reservedQuantity})!`, 'danger')
    state.stock = item.stockQuantity
    return
  }

  state.saving = true
  try {
    const res = await sellerInventoryService.updateStock(item.variantId, newStock)
    const updated = res.data || res
    item.stockQuantity = updated.stockQuantity
    item.availableStock = updated.availableStock
    state.initialStock = updated.stockQuantity
    state.stock = updated.stockQuantity
    notify.push(`Đã cập nhật tồn kho SKU "${item.sku}" thành ${newStock}!`, 'success')

    // Refresh KPI counters in background
    refreshCounters()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Cập nhật tồn kho thất bại'
    notify.push(msg, 'danger')
  } finally {
    state.saving = false
  }
}

async function refreshCounters() {
  try {
    const res = await sellerInventoryService.getInventory({ page: 0, size: 1, filter: 'ALL' })
    const data = res.data || res
    stats.value = {
      totalSkus: data.totalSkus ?? 0,
      lowStockCount: data.lowStockCount ?? 0,
      outOfStockCount: data.outOfStockCount ?? 0,
    }
  } catch (e) {
    // ignore background refresh failure
  }
}

const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Cpath d='M25 70 L45 45 L60 60 L70 50 L80 70 Z' fill='%23cbd5e1'/%3E%3Ccircle cx='38' cy='35' r='7' fill='%2394a3b8'/%3E%3C/svg%3E"

function onImgError(e) {
  e.target.src = placeholderSvg
}

function formatVnd(val) {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(val) + ' ₫'
}

function getStockBadge(item) {
  if (item.availableStock <= 0) {
    return { text: 'Hết hàng', class: 'bg-rose-50 text-rose-700 border-rose-200' }
  }
  if (item.availableStock <= 5) {
    return { text: 'Sắp hết hàng', class: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  return { text: 'Còn hàng', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="seller-inventory-container space-y-6">
    <!-- ── Hero Banner: Inventory Hub ────────────────── -->
    <div class="seller-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="seller-hero-pill">WAREHOUSE & STOCK HUB</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span>
              {{ stats.totalSkus }} mã SKU trong kho
            </span>
          </div>
          <h1 class="seller-hero-title">Quản Lý Tồn Kho & Biến Thể</h1>
          <p class="seller-hero-desc">
            Theo dõi tồn kho thực tế, số lượng đang giữ chỗ cho khách và cập nhật nhanh số lượng cho từng SKU
          </p>
        </div>

        <!-- Action buttons -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap">
          <button class="seller-hero-btn" @click="loadData" :disabled="loading">
            <i class="bi bi-arrow-clockwise me-1.5" :class="{ 'spin-anim': loading }"></i>
            Làm mới
          </button>
          <router-link :to="{ name: 'seller-products' }" class="seller-hero-btn-primary text-decoration-none">
            <i class="bi bi-box-seam me-1.5"></i>
            Xem danh mục SP
          </router-link>
        </div>
      </div>
    </div>

    <!-- ── 3 KPI Cards ─────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total SKUs -->
      <div
        class="seller-kpi-card cursor-pointer transition-all"
        :class="{ 'ring-2 ring-indigo-500': activeFilter === 'ALL' }"
        @click="setFilter('ALL')"
      >
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng SKU Đang Quản Lý</span>
            <div class="text-3xl font-black text-slate-900 font-mono mt-1">
              {{ stats.totalSkus }} <span class="text-sm font-normal text-slate-400">mã</span>
            </div>
          </div>
          <div class="seller-kpi-icon-wrap bg-indigo-50 text-indigo-600 border border-indigo-100">
            <i class="bi bi-boxes text-xl"></i>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Bấm để xem tất cả SKU</span>
          <i class="bi bi-arrow-right"></i>
        </div>
      </div>

      <!-- Low Stock Warning (<= 5) -->
      <div
        class="seller-kpi-card cursor-pointer transition-all"
        :class="{ 'ring-2 ring-amber-500': activeFilter === 'LOW_STOCK' }"
        @click="setFilter('LOW_STOCK')"
      >
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">Cảnh Báo Sắp Hết Hàng (≤ 5)</span>
            <div class="text-3xl font-black text-amber-600 font-mono mt-1">
              {{ stats.lowStockCount }} <span class="text-sm font-normal text-slate-400">mã</span>
            </div>
          </div>
          <div class="seller-kpi-icon-wrap bg-amber-50 text-amber-600 border border-amber-100">
            <i class="bi bi-exclamation-triangle-fill text-xl"></i>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between text-xs text-amber-700 font-semibold">
          <span>Cần nhập thêm hàng sớm</span>
          <i class="bi bi-funnel-fill"></i>
        </div>
      </div>

      <!-- Out of Stock (== 0) -->
      <div
        class="seller-kpi-card cursor-pointer transition-all"
        :class="{ 'ring-2 ring-rose-500': activeFilter === 'OUT_OF_STOCK' }"
        @click="setFilter('OUT_OF_STOCK')"
      >
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-rose-600 uppercase tracking-wider">Đã Hết Hàng (0 SP)</span>
            <div class="text-3xl font-black text-rose-600 font-mono mt-1">
              {{ stats.outOfStockCount }} <span class="text-sm font-normal text-slate-400">mã</span>
            </div>
          </div>
          <div class="seller-kpi-icon-wrap bg-rose-50 text-rose-600 border border-rose-100">
            <i class="bi bi-x-octagon-fill text-xl"></i>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between text-xs text-rose-700 font-semibold">
          <span>Đang tạm ngừng nhận đơn</span>
          <i class="bi bi-funnel-fill"></i>
        </div>
      </div>
    </div>

    <!-- ── Filter & Search Bar ────────────────────────── -->
    <div class="seller-filter-card">
      <div class="row g-3 align-items-center">
        <!-- Search Input -->
        <div class="col-md-6 col-lg-5">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-slate-400">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="keyword"
              @keyup.enter="handleSearch"
              class="form-control border-start-0 ps-0 text-sm"
              placeholder="Tìm theo mã SKU, tên sản phẩm hoặc tên biến thể..."
            />
            <button class="btn btn-outline-secondary btn-sm" type="button" @click="handleSearch">
              Tìm kiếm
            </button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="col-md-6 col-lg-7 d-flex justify-content-md-end gap-2 flex-wrap">
          <button
            class="seller-tab-pill"
            :class="{ active: activeFilter === 'ALL' }"
            @click="setFilter('ALL')"
          >
            Tất cả ({{ stats.totalSkus }})
          </button>
          <button
            class="seller-tab-pill warning-pill"
            :class="{ active: activeFilter === 'LOW_STOCK' }"
            @click="setFilter('LOW_STOCK')"
          >
            <i class="bi bi-exclamation-circle me-1"></i>
            Sắp hết hàng ({{ stats.lowStockCount }})
          </button>
          <button
            class="seller-tab-pill danger-pill"
            :class="{ active: activeFilter === 'OUT_OF_STOCK' }"
            @click="setFilter('OUT_OF_STOCK')"
          >
            <i class="bi bi-x-circle me-1"></i>
            Đã hết hàng ({{ stats.outOfStockCount }})
          </button>
          <button
            v-if="keyword || activeFilter !== 'ALL'"
            class="btn btn-link text-xs text-slate-500 p-1 text-decoration-none"
            @click="resetSearch"
          >
            <i class="bi bi-arrow-counterclockwise"></i> Xóa lọc
          </button>
        </div>
      </div>
    </div>

    <!-- ── Inventory Table ───────────────────────────── -->
    <div class="seller-surface-card p-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50 text-slate-500 font-semibold text-xs border-bottom border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0" style="width: 60px;">ẢNH</th>
              <th class="py-3 px-3.5 border-0" style="min-width: 220px;">SẢN PHẨM & BIẾN THỂ</th>
              <th class="py-3 px-3.5 border-0">MÃ SKU</th>
              <th class="py-3 px-3.5 text-end border-0">GIÁ BÁN</th>
              <th class="py-3 px-3.5 text-center border-0" style="min-width: 170px;">
                TỒN THỰC TẾ (ON-HAND)
              </th>
              <th class="py-3 px-3.5 text-center border-0">
                ĐANG TẠM GIỮ
              </th>
              <th class="py-3 px-3.5 text-center border-0">
                KHẢ DỤNG BÁN
              </th>
              <th class="py-3 px-3.5 text-end border-0">ĐÃ BÁN</th>
              <th class="py-3 px-3.5 text-center border-0" style="width: 130px;">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="9" class="text-center text-slate-400 py-10">
                <div class="spinner-border spinner-border-sm text-indigo-600 me-2"></div>
                Đang tải dữ liệu kho hàng...
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="!items.length">
              <td colspan="9" class="text-center text-slate-400 py-12">
                <i class="bi bi-inbox text-4xl d-block mb-2 text-slate-300"></i>
                <div class="font-medium">Không tìm thấy mã SKU nào phù hợp</div>
                <div class="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc điều kiện lọc</div>
              </td>
            </tr>

            <!-- Row item -->
            <tr v-for="item in items" :key="item.variantId" class="hover:bg-slate-50/70 transition-colors">
              <!-- Thumbnail -->
              <td class="px-3.5 py-3">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  alt=""
                  style="width: 44px; height: 44px; object-fit: cover;"
                  class="rounded-xl border border-slate-200"
                  @error="onImgError"
                />
                <div
                  v-else
                  class="bg-slate-100 rounded-xl d-flex align-items-center justify-content-center text-slate-400"
                  style="width: 44px; height: 44px;"
                >
                  <i class="bi bi-image"></i>
                </div>
              </td>

              <!-- Product Name & Variant Name -->
              <td class="px-3.5 py-3">
                <router-link
                  :to="{ name: 'seller-product-edit', params: { id: item.productId } }"
                  class="fw-bold text-slate-800 text-decoration-none hover:text-indigo-600 d-block line-clamp-1"
                  :title="item.productName"
                >
                  {{ item.productName }}
                </router-link>
                <div class="d-flex align-items-center gap-1.5 mt-1">
                  <span class="badge bg-slate-100 text-slate-700 font-normal border border-slate-200/80">
                    <i class="bi bi-tag-fill text-indigo-500 me-1"></i>
                    {{ item.variantName || 'Mặc định' }}
                  </span>
                  <span
                    v-if="item.productStatus !== 'ACTIVE'"
                    class="badge bg-amber-50 text-amber-700 border border-amber-200 text-2xs"
                  >
                    {{ item.productStatus }}
                  </span>
                </div>
              </td>

              <!-- SKU Code -->
              <td class="px-3.5 py-3">
                <code class="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                  {{ item.sku }}
                </code>
              </td>

              <!-- Price -->
              <td class="px-3.5 py-3 text-end font-mono font-bold text-slate-800">
                {{ formatVnd(item.salePrice || item.price) }}
              </td>

              <!-- On-hand Stock (Inline Edit) -->
              <td class="px-3.5 py-3 text-center">
                <div class="d-inline-flex align-items-center gap-1.5" style="max-width: 150px;">
                  <input
                    v-if="editStates[item.variantId]"
                    v-model.number="editStates[item.variantId].stock"
                    type="number"
                    min="0"
                    class="form-control form-control-sm text-center font-mono font-bold"
                    :class="{
                      'border-indigo-500 bg-indigo-50/30': editStates[item.variantId].stock !== editStates[item.variantId].initialStock
                    }"
                    @keyup.enter="quickSaveStock(item)"
                    :disabled="editStates[item.variantId].saving"
                  />
                  <!-- Quick Save Button (Shows when value changed) -->
                  <button
                    v-if="editStates[item.variantId] && editStates[item.variantId].stock !== editStates[item.variantId].initialStock"
                    class="btn btn-sm btn-indigo px-2 py-1 d-flex align-items-center"
                    @click="quickSaveStock(item)"
                    :disabled="editStates[item.variantId].saving"
                    title="Lưu số lượng mới"
                  >
                    <span v-if="editStates[item.variantId].saving" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-check-lg"></i>
                  </button>
                </div>
              </td>

              <!-- Reserved Stock -->
              <td class="px-3.5 py-3 text-center font-mono">
                <span
                  class="badge rounded-pill"
                  :class="item.reservedQuantity > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'"
                >
                  <i class="bi bi-lock-fill me-0.5 text-xs"></i>
                  {{ item.reservedQuantity || 0 }}
                </span>
              </td>

              <!-- Available Stock (ATP) -->
              <td class="px-3.5 py-3 text-center font-mono font-bold">
                <span
                  class="text-base"
                  :class="{
                    'text-rose-600': item.availableStock <= 0,
                    'text-amber-600': item.availableStock > 0 && item.availableStock <= 5,
                    'text-emerald-600': item.availableStock > 5
                  }"
                >
                  {{ item.availableStock }}
                </span>
              </td>

              <!-- Sold count -->
              <td class="px-3.5 py-3 text-end font-mono text-slate-600">
                {{ item.soldCount || 0 }}
              </td>

              <!-- Status Badge -->
              <td class="px-3.5 py-3 text-center">
                <span
                  class="badge border text-xs px-2.5 py-1 rounded-full font-semibold"
                  :class="getStockBadge(item).class"
                >
                  {{ getStockBadge(item).text }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="totalPages > 1"
        class="d-flex align-items-center justify-content-between px-4 py-3 bg-slate-50/70 border-top border-slate-100 text-xs text-slate-500"
      >
        <div>
          Hiển thị trang <strong>{{ page + 1 }}</strong> / <strong>{{ totalPages }}</strong> (Tổng {{ totalElements }} biến thể)
        </div>
        <div class="d-flex align-items-center gap-1.5">
          <button
            class="btn btn-sm btn-outline-secondary"
            :disabled="page === 0 || loading"
            @click="() => { page--; loadData() }"
          >
            <i class="bi bi-chevron-left me-1"></i> Trang trước
          </button>
          <button
            class="btn btn-sm btn-outline-secondary"
            :disabled="page >= totalPages - 1 || loading"
            @click="() => { page++; loadData() }"
          >
            Trang sau <i class="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-inventory-container {
  max-width: 1400px;
  margin: 0 auto;
}

.seller-hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.25);
}

.seller-hero-pill {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #818cf8;
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.3);
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.seller-live-badge {
  font-size: 0.75rem;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.seller-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
}

.seller-hero-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 0.35rem;
  color: #f8fafc;
}

.seller-hero-desc {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0;
  max-width: 700px;
}

.seller-hero-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.55rem 1.1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
}

.seller-hero-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.seller-hero-btn-primary {
  background: #4f46e5;
  color: #ffffff;
  border: none;
  padding: 0.55rem 1.15rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.seller-hero-btn-primary:hover {
  background: #4338ca;
  color: #ffffff;
  transform: translateY(-1px);
}

.seller-kpi-card {
  background: #ffffff;
  padding: 1.25rem 1.35rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.seller-kpi-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px -3px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.seller-kpi-icon-wrap {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seller-filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.seller-tab-pill {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.15s;
}

.seller-tab-pill:hover {
  background: #f1f5f9;
  color: #334155;
}

.seller-tab-pill.active {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
}

.seller-tab-pill.warning-pill.active {
  background: #d97706;
  border-color: #d97706;
  color: #ffffff;
}

.seller-tab-pill.danger-pill.active {
  background: #e11d48;
  border-color: #e11d48;
  color: #ffffff;
}

.seller-surface-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.btn-indigo {
  background: #4f46e5;
  color: #ffffff;
  border: none;
}

.btn-indigo:hover {
  background: #4338ca;
  color: #ffffff;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

