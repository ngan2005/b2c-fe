<script setup>
import { ref, onMounted } from 'vue'
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

const statusOptions = [
  { value: 'ACTIVE', label: 'Đang bán (ACTIVE)' },
  { value: 'HIDDEN', label: 'Đã ẩn (HIDDEN)' },
  { value: 'BANNED', label: 'Bị khóa (BANNED)' },
]

function statusBadge(s) {
  switch (s) {
    case 'ACTIVE': return 'bg-success'
    case 'HIDDEN': return 'bg-secondary'
    case 'BANNED': return 'bg-danger'
    default: return 'bg-light text-dark'
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
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

async function setStatus(id, status) {
  const label = status === 'HIDDEN' ? 'Ẩn' : 'Khóa'
  const ok = await dialog.confirm(`Đặt sản phẩm #${id} sang trạng thái ${status}?`, {
    title: 'Thay đổi trạng thái',
    variant: 'warning',
    confirmText: label,
  })
  if (!ok) return
  try {
    await adminProductService.updateStatus(id, status)
    notify.push(`Đã đặt trạng thái thành ${label}.`, 'success')
    load()
  } catch (e) {
    notify.push('Không thể cập nhật trạng thái.', 'danger')
  }
}

onMounted(() => {
  // Pick up ?q= from the navbar admin search.
  if (typeof route.query.q === 'string' && route.query.q.trim()) {
    keyword.value = route.query.q.trim()
  }
  load()
})
</script>

<template>
  <div>
    <h2 class="fw-bold mb-3">Kiểm Duyệt Sản Phẩm</h2>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold mb-1">Tìm kiếm</label>
            <input v-model="keyword" @keyup.enter="() => { page = 0; load() }" class="form-control" placeholder="Tên sản phẩm..." />
          </div>
          <div class="col-md-3">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold mb-1">Trạng thái</label>
            <select v-model="filterStatus" class="form-select" @change="() => { page = 0; load() }">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold mb-1">Seller ID</label>
            <input v-model="filterSellerId" @keyup.enter="() => { page = 0; load() }" class="form-control" placeholder="ID nhà bán..." type="number" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" @click="() => { page = 0; load() }">
              <i class="bi bi-filter me-1"></i> Lọc
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Tên sản phẩm</th>
              <th>Nhà bán</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th class="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm me-2"></div>Đang tải...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center text-muted py-4">Không có sản phẩm nào.</td>
            </tr>
            <tr v-for="p in items" :key="p.id">
              <td class="small text-muted">#{{ p.id }}</td>
              <td class="fw-semibold">{{ p.name || p.productName }}</td>
              <td class="small text-muted">{{ p.sellerEmail || p.sellerId || '—' }}</td>
              <td class="fw-bold text-danger">{{ formatCurrency(p.price || p.basePrice) }}</td>
              <td class="small">{{ p.stockQuantity ?? p.stock ?? '—' }}</td>
              <td><span class="badge" :class="statusBadge(p.status)">{{ p.status }}</span></td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button
                    v-if="p.status === 'ACTIVE'"
                    class="btn btn-outline-secondary"
                    title="Ẩn sản phẩm"
                    @click="setStatus(p.id, 'HIDDEN')"
                  ><i class="bi bi-eye-slash"></i></button>
                  <button
                    v-if="p.status !== 'BANNED'"
                    class="btn btn-outline-danger"
                    title="Khóa sản phẩm"
                    @click="setStatus(p.id, 'BANNED')"
                  ><i class="bi bi-ban"></i></button>
                  <button
                    v-if="p.status === 'BANNED' || p.status === 'HIDDEN'"
                    class="btn btn-outline-success"
                    title="Kích hoạt lại"
                    @click="setStatus(p.id, 'ACTIVE')"
                  ><i class="bi bi-check-lg"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="card-body d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">{{ totalElements }} sản phẩm — trang {{ page + 1 }} / {{ totalPages }}</small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; load() }">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; load() }">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
