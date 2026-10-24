<template>
  <div class="space-y-6">
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl">Quản Lý Khiếu Nại Đơn Hàng</h1>
        <p class="text-xs text-slate-500 mb-0">
          Xem, theo dõi và xử lý khiếu nại từ người mua
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold mb-1">Trạng thái</label>
            <select v-model="filterStatus" class="form-select" @change="() => { page = 0; load() }">
              <option value="OPEN">Mở</option>
              <option value="INVESTIGATING">Đang xử lý</option>
              <option value="RESOLVED_REFUND">Hoàn tiền toàn phần</option>
              <option value="RESOLVED_REJECT">Từ chối</option>
              <option value="RESOLVED_PARTIAL">Hoàn tiền một phần</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" @click="() => { page = 0; load() }">
              <i class="bi bi-filter me-1"></i> Lọc
            </button>
          </div>
          <div class="col-md-6 text-end">
            <span class="text-muted small">{{ totalElements }} khiếu nại</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Disputes Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Đơn hàng</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Người khiếu nại</th>
              <th>Ngày tạo</th>
              <th class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm me-2"></div>Đang tải...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center text-muted py-4">Không có khiếu nại nào.</td>
            </tr>
            <tr v-for="d in items" :key="d.id">
              <td class="font-monospace text-muted small">#{{ d.id }}</td>
              <td>
                <span class="font-monospace fw-semibold text-primary">{{ d.orderCode || '#' + d.orderId }}</span>
                <br /><small class="text-muted">#{{ d.orderId }}</small>
              </td>
              <td><BaseBadge :variant="typeVariant(d.disputeType)">{{ d.disputeType }}</BaseBadge></td>
              <td><BaseBadge :variant="statusVariant(d.status)">{{ statusLabel(d.status) }}</BaseBadge></td>
              <td class="small">
                {{ d.openedByEmail || 'User #' + d.openedBy }}
              </td>
              <td class="small text-muted">{{ formatDate(d.createdAt) }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary rounded-pill me-1" @click="viewDispute(d)">
                  Chi tiết
                </button>
                <button
                  v-if="d.status === 'OPEN' || d.status === 'INVESTIGATING'"
                  class="btn btn-sm btn-primary rounded-pill"
                  @click="openResolveModal(d)"
                >
                  Xử lý
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-body d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">Trang {{ page + 1 }} / {{ totalPages }} — {{ totalElements }} khiếu nại</small>
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

    <!-- View Detail Modal -->
    <BaseModal v-model="showViewModal" :title="`Khiếu nại #${viewing?.id}`" size="lg">
      <div v-if="viewing" class="space-y-3">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold">Đơn hàng</label>
            <div class="form-control-plaintext">{{ viewing.orderCode || '#' + viewing.orderId }} <span class="text-muted">#{{ viewing.orderId }}</span></div>
          </div>
          <div class="col-md-6">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold">Người khiếu nại</label>
            <div class="form-control-plaintext">{{ viewing.openedByEmail || 'User #' + viewing.openedBy }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold">Loại khiếu nại</label>
            <div class="form-control-plaintext"><BaseBadge :variant="typeVariant(viewing.disputeType)">{{ viewing.disputeType }}</BaseBadge></div>
          </div>
          <div class="col-md-6">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold">Trạng thái</label>
            <div class="form-control-plaintext"><BaseBadge :variant="statusVariant(viewing.status)">{{ statusLabel(viewing.status) }}</BaseBadge></div>
          </div>
          <div class="col-12">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold">Mô tả</label>
            <div class="form-control-plaintext p-2 bg-light rounded">{{ viewing.description }}</div>
          </div>
          <template v-if="viewing.status.startsWith('RESOLVED')">
            <div class="col-md-6">
              <label class="form-label text-xs text-muted text-uppercase fw-semibold">Người xử lý</label>
              <div class="form-control-plaintext">{{ viewing.resolvedByEmail || 'Admin #' + viewing.resolvedBy }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label text-xs text-muted text-uppercase fw-semibold">Thời gian xử lý</label>
              <div class="form-control-plaintext">{{ formatDate(viewing.resolvedAt) }}</div>
            </div>
            <div class="col-12">
              <label class="form-label text-xs text-muted text-uppercase fw-semibold">Ghi chú xử lý</label>
              <div class="form-control-plaintext p-2 bg-light rounded">{{ viewing.resolutionNote || '—' }}</div>
            </div>
            <div class="col-md-6" v-if="viewing.refundAmount">
              <label class="form-label text-xs text-muted text-uppercase fw-semibold">Số tiền hoàn (VND)</label>
              <div class="form-control-plaintext fw-bold text-danger">{{ formatCurrency(viewing.refundAmount) }}</div>
            </div>
          </template>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="showViewModal = false">Đóng</BaseButton>
        <BaseButton
          v-if="viewing && (viewing.status === 'OPEN' || viewing.status === 'INVESTIGATING')"
          variant="primary" size="sm"
          @click="() => { showViewModal = false; openResolveModal(viewing) }"
        >
          Xử lý khiếu nại
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Resolve Modal -->
    <BaseModal v-model="showResolveModal" title="Xử Lý Khiếu Nại" @close="closeResolve">
      <div class="space-y-3" v-if="resolving">
        <div class="alert alert-info small">
          Khiếu nại <strong>#{{ resolving.id }}</strong> — Đơn {{ resolving.orderCode || '#' + resolving.orderId }}
        </div>
        <div>
          <label class="form-label text-xs text-muted text-uppercase fw-semibold">Kết quả xử lý</label>
          <select v-model="resolveForm.status" class="form-select">
            <option value="RESOLVED_REFUND">Hoàn tiền toàn phần</option>
            <option value="RESOLVED_REJECT">Từ chối khiếu nại</option>
            <option value="RESOLVED_PARTIAL">Hoàn tiền một phần</option>
          </select>
        </div>
        <div v-if="resolveForm.status === 'RESOLVED_REFUND' || resolveForm.status === 'RESOLVED_PARTIAL'">
          <label class="form-label text-xs text-muted text-uppercase fw-semibold">Số tiền hoàn (VND)</label>
          <input v-model.number="resolveForm.refundAmount" type="number" class="form-control" placeholder="0" min="0" />
        </div>
        <div>
          <label class="form-label text-xs text-muted text-uppercase fw-semibold">Ghi chú xử lý</label>
          <textarea v-model="resolveForm.resolutionNote" class="form-control" rows="3" placeholder="Nhập ghi chú..."></textarea>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="closeResolve">Hủy</BaseButton>
        <BaseButton variant="primary" size="sm" :disabled="submitting" @click="confirmResolve">
          <span v-if="submitting"><span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...</span>
          <span v-else>Xác nhận xử lý</span>
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminDisputeService } from '@/services/adminDispute.service'
import { useNotifyStore } from '@/stores/notify'
import { useAdminNotificationsStore } from '@/stores/adminNotifications'
import { useRealtime } from '@/composables/useRealtime'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const notify = useNotifyStore()
const notifStore = useAdminNotificationsStore()
const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const filterStatus = ref('OPEN')
const loading = ref(false)

// View modal
const showViewModal = ref(false)
const viewing = ref(null)

// Resolve modal
const showResolveModal = ref(false)
const resolving = ref(null)
const submitting = ref(false)
const resolveForm = reactive({ status: 'RESOLVED_REFUND', resolutionNote: '', refundAmount: null })

function statusVariant(s) {
  switch (s) {
    case 'OPEN': return 'warning'
    case 'INVESTIGATING': return 'info'
    case 'RESOLVED_REFUND': return 'success'
    case 'RESOLVED_REJECT': return 'danger'
    case 'RESOLVED_PARTIAL': return 'primary'
    case 'CLOSED': return 'secondary'
    default: return 'neutral'
  }
}

function statusLabel(s) {
  return {
    OPEN: 'Mở',
    INVESTIGATING: 'Đang xử lý',
    RESOLVED_REFUND: 'Hoàn tiền toàn phần',
    RESOLVED_REJECT: 'Từ chối',
    RESOLVED_PARTIAL: 'Hoàn tiền một phần',
    CLOSED: 'Đã đóng',
  }[s] || s
}

function typeVariant(t) {
  return {
    NOT_RECEIVED: 'danger',
    WRONG_ITEM: 'warning',
    DAMAGED: 'secondary',
    OTHER: 'info',
  }[t] || 'neutral'
}

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr))
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (filterStatus.value) params.status = filterStatus.value
    const res = await adminDisputeService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length
  } catch (e) {
    notify.push('Không thể tải danh sách khiếu nại.', 'danger')
  } finally {
    loading.value = false
  }
}

function viewDispute(d) {
  viewing.value = d
  showViewModal.value = true
}

function openResolveModal(d) {
  resolving.value = d
  resolveForm.status = 'RESOLVED_REFUND'
  resolveForm.resolutionNote = ''
  resolveForm.refundAmount = null
  showResolveModal.value = true
}

function closeResolve() {
  showResolveModal.value = false
  resolving.value = null
}

async function confirmResolve() {
  if (!resolving.value) return
  submitting.value = true
  try {
    const body = {
      status: resolveForm.status,
      resolutionNote: resolveForm.resolutionNote || null,
      refundAmount: (resolveForm.status === 'RESOLVED_REFUND' || resolveForm.status === 'RESOLVED_PARTIAL')
        ? resolveForm.refundAmount : null,
    }
    await adminDisputeService.resolve(resolving.value.id, body)
    notify.push('Khiếu nại đã được xử lý thành công!', 'success')
    closeResolve()
    load()
  } catch (e) {
    notify.push('Không thể xử lý khiếu nại. Vui lòng thử lại.', 'danger')
  } finally {
    submitting.value = false
  }
}

onMounted(load)

// Realtime: new dispute opened
useRealtime({
  topics: [
    {
      destination: '/topic/admin/disputes',
      callback: (msg) => {
        const payload = msg?.payload ?? msg
        notifStore.push(msg)
        notify.push(
          `Khiếu nại mới: Đơn #${payload?.orderCode || payload?.orderId || '—'} — ${payload?.disputeType || ''}`,
          'warning',
          8000,
        )
        if (page.value === 0 && !filterStatus.value) {
          load()
        }
      },
    },
  ],
})
</script>
