<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sellerApplicationService } from '@/services/sellerApplication.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import BaseModal from '@/components/common/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const notify = useNotifyStore()
const dialog = useDialogs()

const app = ref(null)
const loading = ref(true)

// Reject modal
const showRejectModal = ref(false)
const rejectReason = ref('')
const submittingReject = ref(false)

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(dateStr))
}

function statusVariant(s) {
  switch (s) {
    case 'PENDING': return 'warning'
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

onMounted(async () => {
  try {
    app.value = await sellerApplicationService.adminGet(route.params.id)
  } catch (e) {
    notify.push('Không thể tải chi tiết đơn đăng ký.', 'danger')
    router.push({ name: 'admin-seller-applications' })
  } finally {
    loading.value = false
  }
})

async function approve() {
  const ok = await dialog.confirm('Duyệt đơn đăng ký này?', {
    title: 'Duyệt đơn đăng ký',
    variant: 'success',
    confirmText: 'Duyệt',
  })
  if (!ok) return
  try {
    await sellerApplicationService.adminApprove(route.params.id)
    notify.push('Đã duyệt đơn đăng ký.', 'success')
    app.value = await sellerApplicationService.adminGet(route.params.id)
  } catch (e) {
    notify.push('Không thể duyệt. Vui lòng thử lại.', 'danger')
  }
}

function openReject() {
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
    await sellerApplicationService.adminReject(route.params.id, rejectReason.value)
    notify.push('Đã từ chối đơn đăng ký.', 'info')
    showRejectModal.value = false
    app.value = await sellerApplicationService.adminGet(route.params.id)
  } catch (e) {
    notify.push('Không thể từ chối. Vui lòng thử lại.', 'danger')
  } finally {
    submittingReject.value = false
  }
}
</script>

<template>
  <div>
    <button class="btn btn-link p-0 mb-3 text-decoration-none" @click="router.back()">
      <i class="bi bi-arrow-left me-1"></i> Quay lại danh sách
    </button>

    <div v-if="loading" class="text-center text-muted py-5">
      <div class="spinner-border spinner-border-sm me-2"></div> Đang tải...
    </div>

    <div v-else-if="app" class="card border-0 shadow-sm">
      <div class="card-body">
        <dl class="row mb-0">
          <dt class="col-sm-3 text-muted small">Tên shop</dt><dd class="col-sm-9 fw-semibold">{{ app.shopName }}</dd>
          <dt class="col-sm-3 text-muted small">Người đăng ký</dt><dd class="col-sm-9">{{ app.userEmail }} (id {{ app.userId }})</dd>
          <dt class="col-sm-3 text-muted small">Điện thoại</dt><dd class="col-sm-9">{{ app.phone || '—' }}</dd>
          <dt class="col-sm-3 text-muted small">Địa chỉ</dt><dd class="col-sm-9">{{ app.address || '—' }}</dd>
          <dt class="col-sm-3 text-muted small">Mô tả shop</dt><dd class="col-sm-9">{{ app.shopDescription || '—' }}</dd>
          <dt class="col-sm-3 text-muted small">Trạng thái</dt>
          <dd class="col-sm-9"><span class="badge" :class="`bg-${statusVariant(app.status)}`">{{ statusLabel(app.status) }}</span></dd>
          <dt class="col-sm-3 text-muted small">Ngày nộp</dt><dd class="col-sm-9">{{ formatDate(app.createdAt) }}</dd>
          <template v-if="app.rejectionReason">
            <dt class="col-sm-3 text-danger small">Lý do từ chối</dt>
            <dd class="col-sm-9 text-danger">{{ app.rejectionReason }}</dd>
          </template>
        </dl>

        <div v-if="app.status === 'PENDING'" class="d-flex gap-2 mt-4 justify-content-end">
          <button class="btn btn-outline-danger" @click="openReject">
            <i class="bi bi-x-lg me-1"></i>Từ chối
          </button>
          <button class="btn btn-success" @click="approve">
            <i class="bi bi-check-lg me-1"></i>Duyệt
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Từ Chối Đơn Đăng Ký" size="sm" @close="showRejectModal = false">
      <div>
        <p class="text-sm text-muted mb-3">Vui lòng nhập lý do từ chối đơn đăng ký của <strong>{{ app?.shopName }}</strong>.</p>
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
