<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminOrderService } from '@/services/adminOrder.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const route = useRoute()
const router = useRouter()
const notify = useNotifyStore()

const order = ref(null)
const loading = ref(true)

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(dateStr))
}
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

onMounted(async () => {
  try {
    order.value = await adminOrderService.get(route.params.id)
  } catch (e) {
    notify.push('Không thể tải chi tiết đơn hàng.', 'danger')
    router.push({ name: 'admin-orders' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <button class="btn btn-link p-0 mb-3 text-decoration-none" @click="router.back()">
      <i class="bi bi-arrow-left me-1"></i> Quay lại danh sách đơn hàng
    </button>

    <div v-if="loading" class="text-center text-muted py-5">
      <div class="spinner-border spinner-border-sm me-2"></div> Đang tải...
    </div>

    <div v-else-if="order" class="space-y-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h2 class="fw-bold mb-0">Chi tiết đơn hàng</h2>
          <small class="text-muted font-monospace">#{{ order.id }} — {{ order.orderCode }}</small>
        </div>
        <span class="badge fs-6" :class="statusBadgeClass(order.status)">{{ order.status }}</span>
      </div>

      <div class="row g-4">
        <!-- Main Info -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-header bg-white fw-bold">Danh sách sản phẩm</div>
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-center">Số lượng</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in (order.items || order.lineItems || [])" :key="item.id">
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <img
                          :src="item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'"
                          class="rounded-3 border object-fit-cover flex-shrink-0"
                          style="width: 48px; height: 48px; min-width: 48px; background: #f8fafc;"
                          @error="(e) => e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'"
                        />
                        <div class="min-w-0">
                          <div class="fw-semibold text-slate-900">{{ item.productName || item.name }}</div>
                          <small v-if="item.variantName" class="text-muted d-block">{{ item.variantName }}</small>
                        </div>
                      </div>
                    </td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">{{ formatCurrency(item.unitPrice || item.price) }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(item.subtotal || item.quantity * (item.unitPrice || item.price)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-body text-end">
              <div class="row justify-content-end">
                <div class="col-auto">
                  <dl class="row mb-0 text-end" style="min-width:260px">
                    <dt class="col-6">Tạm tính:</dt>
                    <dd class="col-6 mb-1">{{ formatCurrency(order.subtotal) }}</dd>
                    <dt class="col-6">Giảm giá:</dt>
                    <dd class="col-6 mb-1 text-success">-{{ formatCurrency(order.discountAmount) }}</dd>
                    <dt class="col-6 fw-bold">Tổng cộng:</dt>
                    <dd class="col-6 fw-bold text-danger fs-5 mb-0">{{ formatCurrency(order.totalAmount) }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white fw-bold">Lịch sử trạng thái</div>
            <div class="card-body">
              <div class="timeline" style="position:relative;padding-left:24px">
                <div
                  v-for="(entry, i) in (order.timeline || order.history || [])"
                  :key="i"
                  class="mb-3 position-relative"
                  style="border-left:2px solid #e2e8f0;padding-left:16px"
                >
                  <div class="position-absolute rounded-circle bg-primary" style="width:10px;height:10px;left:-6px;top:4px"></div>
                  <div class="fw-semibold small">{{ entry.status || entry.action }}</div>
                  <div class="text-muted small">{{ formatDate(entry.timestamp || entry.createdAt) }}</div>
                  <div v-if="entry.note" class="text-muted small mt-1">{{ entry.note }}</div>
                </div>
                <div v-if="!(order.timeline || order.history || []).length" class="text-muted small">
                  Không có lịch sử trạng thái.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Info -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-header bg-white fw-bold">Thông tin đơn hàng</div>
            <div class="card-body">
              <dl class="row mb-2">
                <dt class="col-5 text-muted small">Mã đơn</dt>
                <dd class="col-7 font-monospace fw-semibold">{{ order.orderCode }}</dd>
                <dt class="col-5 text-muted small">Ngày tạo</dt>
                <dd class="col-7 small">{{ formatDate(order.createdAt) }}</dd>
                <dt class="col-5 text-muted small">Thanh toán</dt>
                <dd class="col-7">
                  <span class="badge" :class="order.paymentStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'">
                    {{ order.paymentStatus }}
                  </span>
                </dd>
                <dt class="col-5 text-muted small">Phương thức</dt>
                <dd class="col-7 small">{{ order.paymentMethod || '—' }}</dd>
                <dt v-if="order.shippingAddress" class="col-5 text-muted small">Địa chỉ giao</dt>
                <dd v-if="order.shippingAddress" class="col-7 small">{{ order.shippingAddress }}</dd>
              </dl>
            </div>
          </div>

          <div class="card border-0 shadow-sm mb-3">
            <div class="card-header bg-white fw-bold">Người mua</div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-4 text-muted small">Email</dt>
                <dd class="col-8 small">{{ order.buyerEmail || '—' }}</dd>
                <dt class="col-4 text-muted small">Người bán</dt>
                <dd class="col-8 small">{{ order.sellerEmail || '—' }}</dd>
              </dl>
            </div>
          </div>

          <!-- Refund button if order is RETURN_REQUESTED and not yet refunded -->
          <div v-if="order.status === 'RETURN_REQUESTED'" class="card border-0 shadow-sm">
            <div class="card-body">
              <p class="small text-muted mb-3">Đơn hàng đang chờ xác nhận hoàn trả. Bạn có thể duyệt hoặc từ chối yêu cầu.</p>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-success btn-sm flex-grow-1"
                  @click="async () => {
                    const ok = await dialog.confirm('Xác nhận duyệt hoàn tiền cho đơn này?', { title: 'Duyệt hoàn tiền', variant: 'success', confirmText: 'Duyệt' })
                    if (!ok) return
                    try {
                      await adminOrderService.approveReturn(order.id)
                      notify.push('Đã duyệt hoàn tiền thành công!', 'success')
                      order.value = await adminOrderService.get(order.id)
                    } catch (e) {
                      notify.push('Không thể duyệt. Vui lòng thử lại.', 'danger')
                    }
                  }"
                >
                  <i class="bi bi-check-circle me-1"></i> Duyệt hoàn tiền
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
