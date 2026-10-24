<script setup>
import { ref, onMounted } from 'vue'
import { sellerProductService } from '@/services/sellerProduct.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const notify = useNotifyStore()
const dialog = useDialogs()

const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const status = ref('')
const keyword = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (status.value) params.status = status.value
    if (keyword.value) params.q = keyword.value
    const res = await sellerProductService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length
  } finally {
    loading.value = false
  }
}

function statusVariant(s) {
  switch (s) {
    case 'ACTIVE': return 'success'
    case 'DRAFT': return 'secondary'
    case 'PENDING': return 'warning'
    case 'HIDDEN': return 'dark'
    case 'BANNED': return 'danger'
    default: return 'secondary'
  }
}

async function confirmDelete(product) {
  const ok = await dialog.confirm(`Xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`, {
    title: 'Xóa sản phẩm',
    variant: 'danger',
    confirmText: 'Xóa',
  })
  if (!ok) return
  try {
    await sellerProductService.remove(product.id)
    notify.pushUndo({
      message: `Đã xóa "${product.name}".`,
      variant: 'success',
      actionLabel: 'Hoàn tác',
      onAction: async () => {
        try {
          await sellerProductService.restore(product.id)
          notify.push(`Đã khôi phục "${product.name}".`, 'success')
        } catch (e) {
          notify.push('Không thể khôi phục sản phẩm. Vui lòng thử lại.', 'danger')
        } finally {
          load()
        }
      },
    })
  } catch (e) {
    notify.push('Không thể xóa sản phẩm. Vui lòng thử lại.', 'danger')
  } finally {
    load()
  }
}

onMounted(load)
</script>

<template>
  <div class="seller-products-container space-y-6">
    <!-- ── Hero Banner: Product Inventory (Unified Dark Slate Theme) ── -->
    <div class="seller-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="seller-hero-pill">CATALOG & INVENTORY</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span>
              {{ totalElements }} sản phẩm gian hàng
            </span>
          </div>
          <h1 class="seller-hero-title">Quản Lý Danh Mục Sản Phẩm</h1>
          <p class="seller-hero-desc">
            Theo dõi tồn kho, biên độ giá và trạng thái kiểm duyệt hàng hóa trên sàn NoMall
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap">
          <button class="seller-hero-btn" @click="load" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới
          </button>
          <router-link :to="{ name: 'seller-product-new' }" class="seller-btn-primary text-decoration-none">
            <i class="bi bi-plus-lg me-1.5"></i>
            Thêm sản phẩm mới
          </router-link>
        </div>
      </div>
    </div>

    <!-- ── Filter & Search Toolbar ────────────────────────── -->
    <div class="seller-surface-card p-3 mb-3">
      <div class="row g-2 align-items-center">
        <div class="col-md-5">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0 text-slate-400">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="keyword"
              @keyup.enter="() => { page = 0; load() }"
              class="form-control border-start-0 ps-0"
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
            />
          </div>
        </div>
        <div class="col-md-4">
          <select v-model="status" class="form-select" @change="() => { page = 0; load() }">
            <option value="">Tất cả trạng thái kiểm duyệt</option>
            <option value="DRAFT">Bản nháp (Draft)</option>
            <option value="PENDING">Chờ kiểm duyệt sàn (Pending)</option>
            <option value="ACTIVE">Đang mở bán công khai (Active)</option>
            <option value="HIDDEN">Đã tạm ẩn (Hidden)</option>
          </select>
        </div>
        <div class="col-md-3">
          <button class="seller-btn-primary w-100 justify-content-center" @click="() => { page = 0; load() }">
            <i class="bi bi-funnel me-1.5"></i> Lọc danh sách
          </button>
        </div>
      </div>
    </div>

    <!-- ── Products Table ─────────────────────────────────── -->
    <div class="seller-surface-card p-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50 text-slate-500 font-semibold text-xs border-bottom border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0" style="width: 70px;">ẢNH</th>
              <th class="py-3 px-3.5 border-0">TÊN SẢN PHẨM</th>
              <th class="py-3 px-3.5 border-0">DANH MỤC</th>
              <th class="py-3 px-3.5 text-end border-0">KHOẢNG GIÁ</th>
              <th class="py-3 px-3.5 text-end border-0">ĐÃ BÁN</th>
              <th class="py-3 px-3.5 text-center border-0">TRẠNG THÁI</th>
              <th class="py-3 px-3.5 text-end border-0" style="width: 140px;">THAO TÁC</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center text-slate-400 py-8">
                <div class="spinner-border spinner-border-sm text-indigo-600 me-2"></div>Đang tải dữ liệu sản phẩm...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center text-slate-400 py-8">Chưa có sản phẩm nào trong gian hàng.</td>
            </tr>
            <tr v-for="p in items" :key="p.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-3.5 py-3">
                <img
                  v-if="p.thumbnailUrl"
                  :src="p.thumbnailUrl"
                  alt=""
                  style="width: 48px; height: 48px; object-fit: cover;"
                  class="rounded-xl border border-slate-200"
                />
                <div v-else class="bg-slate-100 rounded-xl d-flex align-items-center justify-content-center text-slate-400" style="width: 48px; height: 48px;">
                  <i class="bi bi-image"></i>
                </div>
              </td>
              <td class="px-3.5 py-3">
                <div class="fw-bold text-slate-800">{{ p.name }}</div>
                <div class="text-slate-400 text-xs font-mono"><code>{{ p.slug }}</code></div>
              </td>
              <td class="px-3.5 py-3 text-slate-600 font-medium">{{ p.categoryName || '—' }}</td>
              <td class="px-3.5 py-3 text-end font-mono font-bold text-slate-800">
                {{ p.minPrice ? new Intl.NumberFormat('vi-VN').format(p.minPrice) + ' ₫' : '—' }}
                <span v-if="p.maxPrice && p.maxPrice !== p.minPrice" class="text-slate-400 font-normal"> – {{ new Intl.NumberFormat('vi-VN').format(p.maxPrice) + ' ₫' }}</span>
              </td>
              <td class="px-3.5 py-3 text-end font-mono font-bold text-slate-700">{{ p.soldCount || 0 }}</td>
              <td class="px-3.5 py-3 text-center">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold border"
                  :class="[
                    (p.status === 'ACTIVE' || !p.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    p.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    p.status === 'DRAFT' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  ]"
                >
                  {{ p.status || 'ACTIVE' }}
                </span>
              </td>
              <td class="px-3.5 py-3 text-end">
                <div class="d-flex align-items-center justify-content-end gap-1.5">
                  <router-link
                    :to="{ name: 'seller-product-edit', params: { id: p.id } }"
                    class="btn btn-sm btn-outline-secondary rounded-lg"
                    title="Chỉnh sửa sản phẩm"
                  >
                    <i class="bi bi-pencil"></i>
                  </router-link>
                  <button
                    class="btn btn-sm btn-outline-danger rounded-lg"
                    @click="confirmDelete(p)"
                    title="Xóa sản phẩm"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 border-top border-slate-100 d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-slate-500 font-medium">Trang <strong class="text-slate-800">{{ page + 1 }}</strong> / <strong>{{ totalPages }}</strong></small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; load() }">
            <i class="bi bi-chevron-left me-1"></i>Trước
          </button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; load() }">
            Sau<i class="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-products-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Hero Operational Dark Slate Banner ──────────────────── */
.seller-hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.seller-hero-pill {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.35);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.seller-live-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: #34d399;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.seller-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.seller-hero-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.seller-hero-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 0;
  max-width: 620px;
  line-height: 1.45;
}

.seller-hero-btn {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  transition: all 0.15s;
  cursor: pointer;
}

.seller-hero-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.seller-btn-primary {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  transition: all 0.15s;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.seller-btn-primary:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
  color: #ffffff;
  transform: translateY(-1px);
}

.seller-surface-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
