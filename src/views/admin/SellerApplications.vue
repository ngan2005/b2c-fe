<script setup>
import { ref, onMounted } from 'vue'
import { sellerApplicationService } from '@/services/sellerApplication.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import BaseModal from '@/components/common/BaseModal.vue'

const notify = useNotifyStore()
const dialog = useDialogs()
const items = ref([])
const totalPages = ref(0)
const page = ref(0)
const size = ref(20)
const status = ref('')
const loading = ref(false)

// Reject modal
const showRejectModal = ref(false)
const rejectingApp = ref(null)
const rejectReason = ref('')
const submittingReject = ref(false)

function statusVariant(s) {
  switch (s) {
    case 'PENDING':  return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'danger'
    default: return 'secondary'
  }
}

function statusLabel(s) {
  switch (s) {
    case 'PENDING': return 'Chờ duyệt'
    case 'APPROVED': return 'Đã duyệt'
    case 'REJECTED': return 'Đã từ chối'
    default: return s
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr))
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (status.value) params.status = status.value
    const res = await sellerApplicationService.adminList(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
  } finally {
    loading.value = false
  }
}

async function approve(app) {
  const ok = await dialog.confirm(`Duyệt đơn đăng ký từ ${app.shopName || app.userEmail}?`, {
    title: 'Duyệt đơn đăng ký',
    variant: 'success',
    confirmText: 'Duyệt',
  })
  if (!ok) return
  try {
    await sellerApplicationService.adminApprove(app.id)
    notify.push('Đã duyệt đơn đăng ký.', 'success')
    load()
  } catch (e) {
    notify.push('Không thể duyệt. Vui lòng thử lại.', 'danger')
  }
}

function openReject(app) {
  rejectingApp.value = app
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    notify.push('Vui lòng nhập lý do từ chối.', 'warning')
    return
  }
  submittingReject.value = true
  try {
    await sellerApplicationService.adminReject(rejectingApp.value.id, rejectReason.value)
    notify.push('Đã từ chối đơn đăng ký.', 'info')
    showRejectModal.value = false
    load()
  } catch (e) {
    notify.push('Không thể từ chối. Vui lòng thử lại.', 'danger')
  } finally {
    submittingReject.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2 class="fw-bold mb-3">Duyệt Đơn Đăng Ký Nhà Bán</h2>
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-4">
            <select v-model="status" class="form-select" @change="() => { page = 0; load() }">
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Tên shop</th>
              <th>Người đăng ký</th>
              <th>Điện thoại</th>
              <th>Trạng thái</th>
              <th>Ngày nộp</th>
              <th class="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" class="text-center text-muted py-4">
              <div class="spinner-border spinner-border-sm me-2"></div>Đang tải...
            </td></tr>
            <tr v-else-if="!items.length"><td colspan="7" class="text-center text-muted py-4">Không có đơn đăng ký nào.</td></tr>
            <tr v-for="a in items" :key="a.id">
              <td>{{ a.id }}</td>
              <td class="fw-semibold">{{ a.shopName }}</td>
              <td>{{ a.userEmail || a.userId }}</td>
              <td>{{ a.phone }}</td>
              <td><span class="badge" :class="`bg-${statusVariant(a.status)}`">{{ statusLabel(a.status) }}</span></td>
              <td class="small text-muted">{{ formatDate(a.createdAt) }}</td>
              <td class="text-end">
                <div v-if="a.status === 'PENDING'" class="btn-group btn-group-sm">
                  <button class="btn btn-outline-success" title="Duyệt" @click="approve(a)"><i class="bi bi-check2"></i></button>
                  <button class="btn btn-outline-danger" title="Từ chối" @click="openReject(a)"><i class="bi bi-x"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-body d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">Trang {{ page + 1 }} / {{ totalPages }}</small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; load() }">Trước</button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; load() }">Sau</button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Từ Chối Đơn Đăng Ký" size="sm" @close="showRejectModal = false">
      <div>
        <p class="text-sm text-muted mb-3">
          Từ chối đơn đăng ký từ <strong>{{ rejectingApp?.shopName }}</strong>.
        </p>
        <label class="form-label text-xs text-muted text-uppercase fw-semibold">Lý do từ chối</label>
        <textarea v-model="rejectReason" class="form-control" rows="3" placeholder="Ví dụ: Thông tin shop không hợp lệ..."></textarea>
      </div>
      <template #footer>
        <button class="btn btn-light rounded-xl" :disabled="submittingReject" @click="showRejectModal = false">Hủy</button>
        <button class="btn btn-danger rounded-xl" :disabled="submittingReject" @click="confirmReject">
          <span v-if="submittingReject"><span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...</span>
          <span v-else><i class="bi bi-x-circle me-1"></i>Từ chối</span>
        </button>
      </template>
    </BaseModal>
  </div>
</template>
