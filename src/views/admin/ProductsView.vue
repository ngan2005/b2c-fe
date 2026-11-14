<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { adminProductService } from '@/services/adminProduct.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const route = useRoute()
const notify = useNotifyStore()
const dialog = useDialogs()
const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const filterStatus = ref('ACTIVE')
const filterSellerId = ref('')
const keyword = ref('')
const loading = ref(false)

// Product Detail Modal state
const showDetailModal = ref(false)
const selectedProduct = ref(null)
const loadingDetail = ref(false)

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang bán (ACTIVE)' },
  { value: 'HIDDEN', label: 'Đã ẩn (HIDDEN)' },
  { value: 'BANNED', label: 'Bị khóa (BANNED)' },
]

function statusBadge(s) {
  switch (s) {
    case 'ACTIVE': return 'bg-success text-white'
    case 'HIDDEN': return 'bg-secondary text-white'
    case 'BANNED': return 'bg-danger text-white'
    default: return 'bg-light text-dark'
  }
}

function statusText(s) {
  switch (s) {
    case 'ACTIVE': return 'Đang bán'
    case 'HIDDEN': return 'Đã ẩn'
    case 'BANNED': return 'Bị khóa'
    default: return s || '—'
  }
}

function formatCurrency(val) {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

function displayPrice(p) {
  const min = p.minPrice ?? p.price ?? p.basePrice
  const max = p.maxPrice ?? p.price ?? p.basePrice
  if (min == null && max == null) return '0 ₫'
  if (min != null && max != null && Number(min) !== Number(max)) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  }
  return formatCurrency(min || max)
}

function displayStock(p) {
  if (p.totalStock != null) return p.totalStock
  if (p.stockQuantity != null) return p.stockQuantity
  if (p.stock != null) return p.stock
  return 0
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterSellerId.value) params.sellerId = filterSellerId.value
    if (keyword.value) params.q = keyword.value
    const res = await adminProductService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length
  } catch (e) {
    notify.push('Không thể tải danh sách sản phẩm.', 'danger')
  } finally {
    loading.value = false
  }
}

async function openDetail(product) {
  showDetailModal.value = true
  loadingDetail.value = true
  selectedProduct.value = null
  try {
    const res = await adminProductService.get(product.id)
    selectedProduct.value = res?.data ?? res
  } catch (e) {
    notify.push('Không thể tải thông tin chi tiết sản phẩm.', 'danger')
    showDetailModal.value = false
  } finally {
    loadingDetail.value = false
  }
}

async function setStatus(id, status) {
  const label = status === 'HIDDEN' ? 'Ẩn' : (status === 'BANNED' ? 'Khóa' : 'Kích hoạt lại')
  const ok = await dialog.confirm(`Bạn có chắc chắn muốn đặt sản phẩm #${id} sang trạng thái "${label}"?`, {
    title: 'Xác nhận thay đổi trạng thái',
    variant: status === 'BANNED' ? 'danger' : 'warning',
    confirmText: label,
  })
  if (!ok) return
  try {
    await adminProductService.updateStatus(id, status)
    notify.push(`Đã cập nhật trạng thái thành "${label}".`, 'success')
    if (selectedProduct.value && selectedProduct.value.id === id) {
      selectedProduct.value.status = status
    }
    load()
  } catch (e) {
    notify.push('Không thể cập nhật trạng thái.', 'danger')
  }
}

const modalTotalStock = computed(() => {
  if (!selectedProduct.value?.variants) return 0
  return selectedProduct.value.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
})

onMounted(() => {
  if (typeof route.query.q === 'string' && route.query.q.trim()) {
    keyword.value = route.query.q.trim()
  }
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-1">Kiểm Duyệt Sản Phẩm</h2>
        <p class="text-muted small mb-0">Quản lý toàn bộ danh mục hàng hóa, kiểm tra giá, tồn kho và chi tiết từng biến thể.</p>
      </div>
      <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" @click="load">
        <i class="bi bi-arrow-clockwise"></i> Làm mới danh sách
      </button>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label text-2xs text-muted text-uppercase fw-bold mb-1">Tìm kiếm sản phẩm</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input
                v-model="keyword"
                @keyup.enter="() => { page = 0; load() }"
                class="form-control form-control-sm border-start-0"
                placeholder="Nhập tên sản phẩm hoặc từ khóa..."
              />
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label text-2xs text-muted text-uppercase fw-bold mb-1">Trạng thái</label>
            <select v-model="filterStatus" class="form-select form-select-sm" @change="() => { page = 0; load() }">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label text-2xs text-muted text-uppercase fw-bold mb-1">Mã Nhà Bán (Seller ID)</label>
            <input
              v-model="filterSellerId"
              @keyup.enter="() => { page = 0; load() }"
              class="form-control form-control-sm"
              placeholder="VD: 1, 2, 3..."
              type="number"
            />
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary btn-sm w-100 fw-bold" @click="() => { page = 0; load() }">
              <i class="bi bi-filter me-1"></i> Lọc dữ liệu
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle table-hover mb-0">
          <thead class="table-light text-muted text-2xs text-uppercase">
            <tr>
              <th style="width: 70px;">ID</th>
              <th>Sản Phẩm</th>
              <th>Gian Hàng (Shop)</th>
              <th>Khoảng Giá</th>
              <th>Tổng Tồn Kho</th>
              <th>Trạng Thái</th>
              <th class="text-end" style="width: 140px;">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center text-muted py-5">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Đang tải dữ liệu sản phẩm...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-inbox text-3xl d-block mb-2 text-slate-300"></i>
                Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
              </td>
            </tr>
            <tr v-for="p in items" :key="p.id">
              <td class="font-mono text-muted small">#{{ p.id }}</td>
              <td>
                <div class="d-flex align-items-center gap-2.5">
                  <img
                    v-if="p.thumbnailUrl"
                    :src="p.thumbnailUrl"
                    alt=""
                    class="rounded-lg object-cover border border-slate-200 shrink-0"
                    style="width: 44px; height: 44px;"
                    onerror="this.style.display='none'"
                  />
                  <div
                    v-else
                    class="rounded-lg bg-slate-100 text-slate-400 d-flex align-items-center justify-content-center shrink-0"
                    style="width: 44px; height: 44px;"
                  >
                    <i class="bi bi-image text-lg"></i>
                  </div>
                  <div class="overflow-hidden">
                    <div
                      class="fw-bold text-slate-800 text-sm text-truncate cursor-pointer hover:text-indigo-600 transition-colors"
                      :title="p.name"
                      @click="openDetail(p)"
                    >
                      {{ p.name }}
                    </div>
                    <div class="text-xs text-muted d-flex align-items-center gap-2 mt-0.5">
                      <span v-if="p.brand" class="badge bg-slate-100 text-slate-600 font-normal">{{ p.brand }}</span>
                      <span v-if="p.categoryName" class="text-slate-400">{{ p.categoryName }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="fw-semibold text-slate-800 text-sm">
                  {{ p.shopName || 'Gian hàng đối tác' }}
                </div>
                <div class="text-2xs text-muted font-mono">
                  Seller #{{ p.sellerId }}
                </div>
              </td>
              <td>
                <div class="fw-bold text-danger text-sm">
                  {{ displayPrice(p) }}
                </div>
              </td>
              <td>
                <div>
                  <span
                    class="badge rounded-pill px-2 py-1"
                    :class="displayStock(p) > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                  >
                    {{ displayStock(p) > 0 ? displayStock(p) + ' sp' : 'Hết hàng' }}
                  </span>
                  <div class="text-2xs text-muted mt-0.5">
                    Đã bán: {{ p.soldCount || 0 }}
                  </div>
                </div>
              </td>
              <td>
                <span class="badge rounded-pill px-2.5 py-1" :class="statusBadge(p.status)">
                  {{ statusText(p.status) }}
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-light border text-indigo-600 hover:bg-indigo-50"
                    title="Xem chi tiết các loại & tồn kho"
                    @click="openDetail(p)"
                  >
                    <i class="bi bi-eye"></i>
                  </button>
                  <button
                    v-if="p.status === 'ACTIVE'"
                    class="btn btn-light border text-amber-600 hover:bg-amber-50"
                    title="Ẩn sản phẩm"
                    @click="setStatus(p.id, 'HIDDEN')"
                  >
                    <i class="bi bi-eye-slash"></i>
                  </button>
                  <button
                    v-if="p.status !== 'BANNED'"
                    class="btn btn-light border text-danger hover:bg-rose-50"
                    title="Khóa vi phạm"
                    @click="setStatus(p.id, 'BANNED')"
                  >
                    <i class="bi bi-ban"></i>
                  </button>
                  <button
                    v-if="p.status === 'BANNED' || p.status === 'HIDDEN'"
                    class="btn btn-light border text-success hover:bg-emerald-50"
                    title="Kích hoạt lại"
                    @click="setStatus(p.id, 'ACTIVE')"
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-footer bg-white border-top py-2.5 d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">Tổng {{ totalElements }} sản phẩm — Trang {{ page + 1 }} / {{ totalPages }}</small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; load() }">
            <i class="bi bi-chevron-left"></i> Trang trước
          </button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; load() }">
            Trang sau <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- ── MODAL: CHI TIẾT SẢN PHẨM & TỒN KHO TỪNG LOẠI (VARIANTS) ────────── -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div v-if="showDetailModal" class="modal-backdrop-custom" @click.self="showDetailModal = false">
      <div class="modal-dialog-custom max-w-4xl">
        <div class="modal-content-custom bg-white rounded-2xl shadow-2xl overflow-hidden border-0">
          
          <!-- Modal Header -->
          <div class="d-flex align-items-center justify-content-between p-3.5 px-4 bg-slate-900 text-white border-bottom border-slate-800">
            <div class="d-flex align-items-center gap-2.5">
              <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <i class="bi bi-box-seam-fill text-lg"></i>
              </div>
              <div>
                <div class="text-2xs text-indigo-300 text-uppercase tracking-wider font-bold">
                  CHI TIẾT SẢN PHẨM & TỒN KHO THEO LOẠI
                </div>
                <h5 class="mb-0 fw-bold text-white text-base line-clamp-1">
                  {{ selectedProduct?.name || 'Đang tải thông tin...' }}
                </h5>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-link text-slate-400 hover:text-white p-1" @click="showDetailModal = false">
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loadingDetail" class="text-center py-5 text-muted">
            <div class="spinner-border text-primary me-2"></div> Đang tải chi tiết biến thể và gian hàng...
          </div>

          <!-- Modal Body -->
          <div v-else-if="selectedProduct" class="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

            <!-- 1. Shop & Overview Cards -->
            <div class="row g-3">
              <!-- Shop Card -->
              <div class="col-md-6">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 h-100">
                  <div class="text-2xs font-bold text-slate-400 text-uppercase mb-2">Gian Hàng Bán</div>
                  <div class="d-flex align-items-center gap-3">
                    <img
                      v-if="selectedProduct.shopLogoUrl"
                      :src="selectedProduct.shopLogoUrl"
                      alt=""
                      class="rounded-circle border border-white shadow-sm object-cover"
                      style="width: 48px; height: 48px;"
                      onerror="this.style.display='none'"
                    />
                    <div
                      v-else
                      class="rounded-circle bg-indigo-600 text-white font-bold d-flex align-items-center justify-content-center shadow-sm"
                      style="width: 48px; height: 48px;"
                    >
                      {{ (selectedProduct.shopName || 'S').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <h6 class="fw-bold text-slate-900 mb-0.5">{{ selectedProduct.shopName || 'Gian Hàng Đối Tác' }}</h6>
                      <div class="text-xs text-muted d-flex align-items-center gap-2">
                        <span>Mã Shop: <strong>#{{ selectedProduct.sellerId }}</strong></span>
                        <span v-if="selectedProduct.shopIsOnline" class="badge bg-emerald-100 text-emerald-800 text-2xs">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Product Summary Card -->
              <div class="col-md-6">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 h-100">
                  <div class="text-2xs font-bold text-slate-400 text-uppercase mb-2">Tổng Quan Kinh Doanh</div>
                  <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="p-2 bg-white rounded-lg border border-slate-100">
                      <span class="text-2xs text-muted d-block">Tổng Tồn Kho</span>
                      <strong class="text-indigo-600 font-mono text-sm">{{ modalTotalStock }} sp</strong>
                    </div>
                    <div class="p-2 bg-white rounded-lg border border-slate-100">
                      <span class="text-2xs text-muted d-block">Đã Bán</span>
                      <strong class="text-emerald-600 font-mono text-sm">{{ selectedProduct.soldCount || 0 }}</strong>
                    </div>
                    <div class="p-2 bg-white rounded-lg border border-slate-100">
                      <span class="text-2xs text-muted d-block">Lượt Xem</span>
                      <strong class="text-slate-800 font-mono text-sm">{{ selectedProduct.viewCount || 0 }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Breakdown Table: Phân Loại / Biến Thể Cụ Thể Từng Loại -->
            <div class="border rounded-xl overflow-hidden">
              <div class="p-3 bg-indigo-50/60 border-bottom border-indigo-100 d-flex align-items-center justify-content-between">
                <div>
                  <h6 class="fw-bold text-indigo-950 mb-0 d-flex align-items-center gap-2">
                    <i class="bi bi-diagram-3-fill text-indigo-600"></i>
                    Bảng Phân Loại Biến Thể & Số Lượng Từng Loại ({{ selectedProduct.variants?.length || 0 }} loại)
                  </h6>
                  <small class="text-indigo-700 text-2xs">
                    Chi tiết giá bán, mã SKU và tồn kho của từng phân loại sản phẩm.
                  </small>
                </div>
                <span class="badge bg-indigo-600 text-white font-mono px-2 py-1">
                  Tổng kho: {{ modalTotalStock }} sản phẩm
                </span>
              </div>

              <div class="table-responsive">
                <table class="table align-middle table-sm mb-0">
                  <thead class="table-light text-2xs text-muted text-uppercase">
                    <tr>
                      <th style="width: 40px;">#</th>
                      <th>Phân Loại / Biến Thể</th>
                      <th>Mã SKU</th>
                      <th>Giá Niêm Yết</th>
                      <th>Giá Bán</th>
                      <th>Tồn Kho Cụ Thể</th>
                      <th>Đã Bán</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(v, idx) in selectedProduct.variants" :key="v.id || idx">
                      <td class="text-muted text-2xs font-mono">{{ idx + 1 }}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <img
                            v-if="v.imageUrl"
                            :src="v.imageUrl"
                            alt=""
                            class="rounded border border-slate-200 object-cover shrink-0"
                            style="width: 32px; height: 32px;"
                            onerror="this.style.display='none'"
                          />
                          <div>
                            <div class="fw-bold text-slate-900 text-xs">
                              {{ v.variantName || 'Mặc định' }}
                            </div>
                            <div v-if="v.attributes && Object.keys(v.attributes).length" class="text-2xs text-muted">
                              <span v-for="(val, key) in v.attributes" :key="key" class="me-2">
                                {{ key }}: <strong>{{ val }}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="font-mono text-2xs text-muted">{{ v.sku || '—' }}</td>
                      <td class="text-2xs text-muted text-decoration-line-through">
                        {{ v.salePrice && v.price > v.salePrice ? formatCurrency(v.price) : '—' }}
                      </td>
                      <td class="fw-bold text-danger text-xs font-mono">
                        {{ formatCurrency(v.salePrice || v.price) }}
                      </td>
                      <td>
                        <span
                          class="badge rounded-pill font-mono px-2 py-0.5"
                          :class="v.stockQuantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                        >
                          {{ v.stockQuantity > 0 ? v.stockQuantity + ' sp' : 'Hết hàng' }}
                        </span>
                      </td>
                      <td class="text-2xs font-mono text-muted">{{ v.soldCount || 0 }}</td>
                      <td>
                        <span v-if="v.isActive !== false" class="badge bg-success-subtle text-success text-2xs">Bật</span>
                        <span v-else class="badge bg-secondary-subtle text-secondary text-2xs">Tắt</span>
                      </td>
                    </tr>
                    <tr v-if="!selectedProduct.variants || !selectedProduct.variants.length">
                      <td colspan="8" class="text-center text-muted py-3 small">
                        Sản phẩm này chưa cấu hình phân loại biến thể.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. Image Gallery Preview (if any) -->
            <div v-if="selectedProduct.images && selectedProduct.images.length" class="space-y-1.5">
              <label class="text-2xs font-bold text-slate-400 text-uppercase d-block">Thư Viện Ảnh Sản Phẩm</label>
              <div class="d-flex align-items-center gap-2 overflow-x-auto pb-1">
                <img
                  v-for="(img, idx) in selectedProduct.images"
                  :key="idx"
                  :src="img.imageUrl"
                  alt=""
                  class="rounded-xl border border-slate-200 object-cover shrink-0"
                  style="width: 64px; height: 64px;"
                />
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="p-3 px-4 bg-slate-50 border-top d-flex align-items-center justify-content-between">
            <div>
              <span class="text-xs text-muted me-2">Trạng thái hiện tại:</span>
              <span class="badge" :class="statusBadge(selectedProduct?.status)">
                {{ statusText(selectedProduct?.status) }}
              </span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button
                v-if="selectedProduct?.status === 'ACTIVE'"
                class="btn btn-sm btn-outline-secondary"
                @click="setStatus(selectedProduct.id, 'HIDDEN')"
              >
                <i class="bi bi-eye-slash me-1"></i> Ẩn sản phẩm
              </button>
              <button
                v-if="selectedProduct?.status !== 'BANNED'"
                class="btn btn-sm btn-outline-danger"
                @click="setStatus(selectedProduct.id, 'BANNED')"
              >
                <i class="bi bi-ban me-1"></i> Khóa vi phạm
              </button>
              <button
                v-if="selectedProduct?.status === 'BANNED' || selectedProduct?.status === 'HIDDEN'"
                class="btn btn-sm btn-success"
                @click="setStatus(selectedProduct.id, 'ACTIVE')"
              >
                <i class="bi bi-check-lg me-1"></i> Kích hoạt lại
              </button>
              <button class="btn btn-sm btn-secondary" @click="showDetailModal = false">
                Đóng
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-dialog-custom {
  width: 100%;
  position: relative;
  z-index: 1051;
}

.modal-content-custom {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.text-2xs {
  font-size: 11px;
}
</style>
