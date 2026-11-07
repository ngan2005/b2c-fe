<template>
  <div>
    <h2 class="fw-bold mb-3">Quản lý đơn hàng</h2>

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label text-xs text-muted text-uppercase fw-semibold mb-1">Trạng thái</label>
            <select v-model="filterStatus" class="form-select" @change="() => { page = 0; load() }">
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PACKED">Đã đóng gói</option>
              <option value="SHIPPING">Đang giao</option>
              <option value="DELIVERED">Đã giao</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="RETURN_REQUESTED">Yêu cầu hoàn trả</option>
              <option value="RETURNED">Đã hoàn trả</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" @click="() => { page = 0; load() }">
              <i class="bi bi-filter me-1"></i> Lọc
            </button>
          </div>
          <div class="col-md-6 text-end d-flex align-items-center justify-content-end gap-3">
            <button
              class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5"
              :disabled="cleaningExpired"
              @click="cleanupExpiredOrders"
              title="Tự động hủy các đơn hàng chưa thanh toán quá 15 phút và hoàn trả tồn kho"
            >
              <span v-if="cleaningExpired" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-clock-history"></i>
              Quét & Hủy Đơn Quá Hạn (15m)
            </button>
            <span class="text-muted small">{{ totalElements }} đơn hàng</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Mã đơn</th>
              <th>Người mua</th>
              <th>Người bán</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
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
              <td colspan="8" class="text-center text-muted py-4">Không có đơn hàng nào.</td>
            </tr>
            <tr v-for="o in items" :key="o.id">
              <td>
                <span class="font-monospace fw-semibold text-primary">{{ o.orderCode }}</span>
                <br /><small class="text-muted">#{{ o.id }}</small>
              </td>
              <td>{{ o.buyerEmail || o.buyerId }}</td>
              <td>{{ o.sellerEmail || o.sellerId }}</td>
              <td class="fw-bold text-danger">{{ formatCurrency(o.totalAmount) }}</td>
              <td>
                <span class="badge" :class="o.paymentStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'">
                  {{ o.paymentStatus }}
                </span>
              </td>
              <td>
                <span class="badge" :class="statusBadgeClass(o.status)">{{ o.status }}</span>
                <div v-if="o.status === 'RETURN_REQUESTED'" class="mt-1">
                  <button class="btn btn-sm btn-success rounded-pill px-2 py-0" @click="handleApprove(o.id)">
                    <i class="bi bi-check-circle me-1"></i>Duyệt
                  </button>
                  <button class="btn btn-sm btn-outline-danger rounded-pill px-2 py-0 ms-1" @click="handleReject(o.id)">
                    <i class="bi bi-x-circle me-1"></i>Từ chối
                  </button>
                </div>
              </td>
              <td class="small text-muted">{{ formatDate(o.createdAt) }}</td>
              <td class="text-end">
                <router-link :to="{ name: 'admin-order-detail', params: { id: o.id } }" class="btn btn-sm btn-outline-secondary rounded-pill">
                  Chi tiết
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="card-body d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">Trang {{ page + 1 }} / {{ totalPages }} — {{ totalElements }} đơn hàng</small>
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

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Từ chối yêu cầu hoàn trả" size="sm" @close="closeReject">
      <div>
        <p class="text-sm text-slate-600 mb-3">Từ chối yêu cầu hoàn trả cho đơn <strong>{{ rejectingId }}</strong>.</p>
        <label class="form-label text-xs text-muted text-uppercase fw-semibold">Ghi chú (không bắt buộc)</label>
        <textarea v-model="rejectNote" class="form-control" rows="3" placeholder="Lý do từ chối..."></textarea>
      </div>
      <template #footer>
        <button class="btn btn-light rounded-xl" :disabled="submittingReject" @click="closeReject">Hủy</button>
        <button class="btn btn-danger rounded-xl" :disabled="submittingReject" @click="confirmReject">
          <span v-if="submittingReject"><span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...</span>
          <span v-else><i class="bi bi-x-circle me-1"></i>Từ chối</span>
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminOrderService } from '@/services/adminOrder.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import { useAdminNotificationsStore } from '@/stores/adminNotifications'
import { useAdminSse } from '@/composables/useAdminSse'
import BaseModal from '@/components/common/BaseModal.vue'

const notify = useNotifyStore()
const dialog = useDialogs()
const notifStore = useAdminNotificationsStore()
const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const filterStatus = ref('PENDING')
const loading = ref(false)
const cleaningExpired = ref(false)

async function cleanupExpiredOrders() {
  const ok = await dialog.confirm('Bạn có chắc muốn quét và hủy toàn bộ đơn hàng chưa thanh toán quá 15 phút không? Tồn kho giữ chỗ sẽ được giải phóng lập tức.')
  if (!ok) return
  cleaningExpired.value = true
  try {
    const res = await adminOrderService.cleanupExpired()
    const count = res?.data ?? res ?? 0
    notify.push(`Đã hoàn tất quét: Đã hủy ${count} đơn quá hạn và giải phóng kho!`, 'success')
    await load()
  } catch (err) {
    notify.push(err?.response?.data?.message || 'Lỗi khi quét đơn quá hạn', 'danger')
  } finally {
    cleaningExpired.value = false
  }
}

// Reject modal
const showRejectModal = ref(false)
const rejectingId = ref(null)
const rejectNote = ref('')
const submittingReject = ref(false)

function statusBadgeClass(status) {
  switch (status) {
    case 'PENDING': return 'bg-secondary'
    case 'CONFIRMED': return 'bg-info'
    case 'PACKED': return 'bg-primary'
    case 'SHIPPING': return 'bg-warning text-dark'
    case 'DELIVERED': return 'bg-success'
    case 'COMPLETED': return 'bg-success'
    case 'CANCELLED': return 'bg-danger'
    case 'RETURN_REQUESTED': return 'bg-orange text-white'
    case 'RETURNED': return 'bg-dark'
    default: return 'bg-light text-dark'
  }
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
    const res = await adminOrderService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length
  } catch (e) {} finally {
    loading.value = false
  }
}

async function handleApprove(orderId) {
  const ok = await dialog.confirm('Xác nhận duyệt yêu cầu hoàn trả cho đơn hàng này?', {
    title: 'Duyệt yêu cầu hoàn trả',
    variant: 'success',
    confirmText: 'Duyệt',
  })
  if (!ok) return
  try {
    await adminOrderService.approveReturn(orderId)
    notify.push('Đã duyệt yêu cầu hoàn trả thành công!', 'success')
    load()
  } catch (e) {
    notify.push('Không thể duyệt yêu cầu. Vui lòng thử lại.', 'danger')
  }
}

function handleReject(orderId) {
  rejectingId.value = orderId
  rejectNote.value = ''
  showRejectModal.value = true
}

function closeReject() {
  showRejectModal.value = false
  rejectingId.value = null
  rejectNote.value = ''
}

async function confirmReject() {
  submittingReject.value = true
  try {
    await adminOrderService.rejectReturn(rejectingId.value, rejectNote.value || null)
    notify.push('Đã từ chối yêu cầu hoàn trả.', 'info')
    closeReject()
    load()
  } catch (e) {
    notify.push('Không thể từ chối yêu cầu. Vui lòng thử lại.', 'danger')
  } finally {
    submittingReject.value = false
  }
}

onMounted(load)

// Realtime (SSE): new order created, paid, shipped, cancelled + return requests.
useAdminSse({
  streams: [
    {
      topic: 'orders',
      callback: (msg) => {
        const payload = msg?.payload ?? msg
        notifStore.push(msg)
        const totalVnd = payload?.totalAmount != null
          ? `${Number(payload.totalAmount).toLocaleString('vi-VN')}₫`
          : ''
        const status = payload?.status ? ` — ${payload.status}` : ''
        notify.push(
          `Đơn hàng: #${payload?.orderCode || payload?.orderId || '—'}${status} ${totalVnd}`.trim(),
          msg?.type === 'ORDER_CANCELLED' ? 'warning' : 'info',
          6000,
        )
        // Prepend new row on first page with no filter for ORDER_CREATED.
        if (msg?.type === 'ORDER_CREATED' && page.value === 0 && !filterStatus.value) {
          const newOrder = {
            id: payload?.id ?? payload?.orderId ?? Date.now(),
            orderCode: payload?.orderCode || `NEW-${Date.now()}`,
            buyerEmail: payload?.buyerEmail || payload?.buyerId || '',
            sellerEmail: payload?.sellerEmail || payload?.sellerId || '',
            totalAmount: payload?.totalAmount ?? 0,
            paymentStatus: payload?.paymentStatus || 'UNPAID',
            status: payload?.status || 'PENDING',
            createdAt: msg?.occurredAt ?? new Date().toISOString(),
          }
          items.value = [newOrder, ...items.value].slice(0, size.value)
        } else if (page.value === 0) {
          // For PAID/SHIPPED/CANCELLED, refresh the list to reflect the new status.
          load()
        }
      },
    },
    {
      topic: 'returns',
      callback: (msg) => {
        const payload = msg?.payload ?? msg
        notifStore.push(msg)
        notify.push(
          `Yêu cầu hoàn trả: Đơn #${payload?.orderCode || payload?.orderId || '—'} — ${payload?.reason || ''}`,
          'warning',
          8000,
        )
        // Refresh the list to show the updated status
        if (page.value === 0) {
          load()
        }
      },
    },
  ],
})
</script>
