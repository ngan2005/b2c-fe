<script setup>
import { ref, onMounted } from 'vue'
import { adminSellerService } from '@/services/adminSeller.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const notify = useNotifyStore()
const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const filterStatus = ref('ACTIVE')
const loading = ref(false)

// Suspend modal
const showSuspendModal = ref(false)
const suspendingId = ref(null)
const suspendReason = ref('')
const submittingSuspend = ref(false)

const statusOptions = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'SUSPENDED', label: 'Bị tạm khóa' },
]

function statusBadge(s) {
  switch (s) {
    case 'ACTIVE': return 'bg-success'
    case 'SUSPENDED': return 'bg-warning text-dark'
    case 'BANNED': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(dateStr))
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await adminSellerService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length
  } catch (e) {
    notify.push('Không thể tải danh sách nhà bán.', 'danger')
  } finally {
    loading.value = false
  }
}

function openSuspend(id) {
  suspendingId.value = id
  suspendReason.value = ''
  showSuspendModal.value = true
}

async function confirmSuspend() {
  if (!suspendReason.value.trim()) {
    notify.push('Vui lòng nhập lý do tạm khóa.', 'warning')
    return
  }
  submittingSuspend.value = true
  try {
    await adminSellerService.suspend(suspendingId.value, suspendReason.value)
    notify.push('Đã tạm khóa nhà bán thành công.', 'success')
    showSuspendModal.value = false
    load()
  } catch (e) {
    notify.push('Không thể tạm khóa. Vui lòng thử lại.', 'danger')
  } finally {
    submittingSuspend.value = false
  }
}

async function reactivate(id) {
  const ok = await dialog.confirm('Kích hoạt lại nhà bán này?', {
    title: 'Kích hoạt lại',
    variant: 'success',
    confirmText: 'Kích hoạt',
  })
  if (!ok) return
  try {
    await adminSellerService.reactivate(id)
    notify.push('Đã kích hoạt lại nhà bán.', 'success')
    load()
  } catch (e) {
    notify.push('Không thể kích hoạt. Vui lòng thử lại.', 'danger')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2 class="fw-bold mb-3">Quản Lý Nhà Bán</h2>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold mb-1">Trạng thái</label>
            <select v-model="filterStatus" class="form-select" @change="() => { page = 0; load() }">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" @click="() => { page = 0; load() }">
              <i class="bi bi-filter me-1"></i> Lọc
            </button>
          </div>
          <div class="col-md-6 text-end">
            <span class="text-muted small">{{ totalElements }} nhà bán</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sellers Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Tên shop</th>
              <th>Chủ sở hữu</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Trạng thái</th>
              <th>Ngày đăng ký</th>
              <th class="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm me-2"></div>Đang tải...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="8" class="text-center text-muted py-4">Không có nhà bán nào.</td>
            </tr>
            <tr v-for="s in items" :key="s.id">
              <td class="small text-muted">#{{ s.id }}</td>
              <td class="fw-semibold">{{ s.shopName || '—' }}</td>
              <td class="small">{{ s.ownerName || s.userFullName || '—' }}</td>
              <td><code class="small">{{ s.email || s.userEmail || '—' }}</code></td>
              <td class="small">{{ s.phone || '—' }}</td>
              <td><span class="badge" :class="statusBadge(s.status)">{{ s.status }}</span></td>
              <td class="small text-muted">{{ formatDate(s.createdAt || s.registeredAt) }}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button
                    v-if="s.status === 'ACTIVE'"
                    class="btn btn-outline-warning"
                    title="Tạm khóa"
                    @click="openSuspend(s.id)"
                  ><i class="bi bi-lock me-1"></i>Khóa</button>
                  <button
                    v-if="s.status === 'SUSPENDED'"
                    class="btn btn-outline-success"
                    title="Kích hoạt lại"
                    @click="reactivate(s.id)"
                  ><i class="bi bi-unlock me-1"></i>Kích hoạt</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="card-body d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">{{ totalElements }} nhà bán — trang {{ page + 1 }} / {{ totalPages }}</small>
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

    <!-- Suspend Modal -->
    <Teleport to="body">
      <div v-if="showSuspendModal" class="modal fade show d-block bg-slate-900/50 backdrop-blur-sm z-50" tabindex="-1" @click.self="showSuspendModal = false">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-2xl rounded-2xl">
            <div class="modal-header border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h5 class="modal-title fw-semibold text-slate-800">Tạm Khóa Nhà Bán</h5>
              <button type="button" class="btn-close" @click="showSuspendModal = false"></button>
            </div>
            <div class="modal-body p-6">
              <p class="text-sm text-slate-600 mb-3">Vui lòng nhập lý do tạm khóa cho nhà bán #{{ suspendingId }}.</p>
              <label class="form-label text-xs text-muted text-uppercase fw-semibold">Lý do tạm khóa</label>
              <textarea v-model="suspendReason" class="form-control" rows="3" placeholder="Ví dụ: Vi phạm chính sách sàn..."></textarea>
            </div>
            <div class="modal-footer border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <button class="btn btn-light rounded-xl" :disabled="submittingSuspend" @click="showSuspendModal = false">Hủy</button>
              <button class="btn btn-warning rounded-xl" :disabled="submittingSuspend" @click="confirmSuspend">
                <span v-if="submittingSuspend"><span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...</span>
                <span v-else><i class="bi bi-lock me-1"></i>Tạm khóa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
