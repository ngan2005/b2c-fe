<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sellerOrderService } from '@/services/sellerOrder.service'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const loading = ref(true)
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

function vnd(value) {
  if (value == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

function statusBadgeClass(status) {
  switch (status) {
    case 'PENDING': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'PACKED': return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'SHIPPING': return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    case 'DELIVERED': return 'bg-cyan-50 text-cyan-700 border border-cyan-200'
    case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'CANCELLED': return 'bg-rose-50 text-rose-700 border border-rose-200'
    case 'RETURN_REQUESTED': return 'bg-orange-50 text-orange-700 border border-orange-200'
    case 'RETURNED': return 'bg-slate-100 text-slate-700 border border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

onMounted(async () => {
  try {
    order.value = await sellerOrderService.get(route.params.id)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="seller-order-detail-page">
    <button class="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1.5 rounded-3" @click="router.back()">
      <i class="bi bi-arrow-left"></i> Quay lại danh sách
    </button>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2 text-indigo-600"></div> Đang tải chi tiết đơn hàng...
    </div>

    <div v-else-if="order" class="row g-4">
      <!-- Left Column: Order Header & Items List -->
      <div class="col-lg-8">
        <!-- Order Header Card -->
        <div class="card border-0 shadow-sm rounded-4 mb-3 p-4 bg-white">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã đơn hàng</span>
                <code class="fs-5 fw-bold text-indigo-600 font-monospace">{{ order.orderCode }}</code>
              </div>
              <small class="text-muted d-block mt-1">
                <i class="bi bi-clock me-1"></i>Đặt lúc {{ new Date(order.createdAt).toLocaleString('vi-VN') }}
              </small>
            </div>
            <span class="badge px-3 py-2 rounded-pill fw-bold text-xs uppercase" :class="statusBadgeClass(order.status)">
              <span class="me-1">●</span> {{ order.status }}
            </span>
          </div>
        </div>

        <!-- Items Table Card -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div class="card-header bg-white border-bottom border-slate-100 py-3 px-4 d-flex align-items-center justify-content-between">
            <h6 class="mb-0 fw-bold text-slate-900">Danh sách sản phẩm</h6>
            <span class="badge bg-slate-100 text-slate-600 border rounded-pill">{{ order.items?.length || 0 }} sản phẩm</span>
          </div>
          <div class="table-responsive">
            <table class="table mb-0 align-middle">
              <thead class="bg-slate-50 border-bottom border-slate-100">
                <tr>
                  <th class="ps-4 text-xs font-semibold text-slate-500 uppercase py-3">Sản phẩm</th>
                  <th class="text-end text-xs font-semibold text-slate-500 uppercase py-3">Đơn giá</th>
                  <th class="text-center text-xs font-semibold text-slate-500 uppercase py-3">SL</th>
                  <th class="text-end pe-4 text-xs font-semibold text-slate-500 uppercase py-3">Thành tiền</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="i in order.items" :key="i.id">
                  <td class="ps-4 py-3">
                    <div class="d-flex align-items-center gap-3">
                      <!-- Product Image Thumbnail -->
                      <div class="seller-item-thumb-box">
                        <img
                          :src="i.imageUrl || placeholderImg"
                          :alt="i.productName"
                          class="seller-item-thumb"
                          loading="lazy"
                          @error="(e) => e.target.src = placeholderImg"
                        />
                      </div>
                      <!-- Product Info -->
                      <div class="min-w-0">
                        <div class="fw-semibold text-slate-900 leading-snug line-clamp-2" style="max-width: 320px;">
                          {{ i.productName }}
                        </div>
                        <span v-if="i.variantName" class="badge bg-slate-100 text-slate-600 border border-slate-200 mt-1 fw-normal text-xs">
                          {{ i.variantName }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="text-end text-slate-600 text-sm py-3">{{ vnd(i.unitPrice) }}</td>
                  <td class="text-center fw-semibold text-slate-800 text-sm py-3">{{ i.quantity }}</td>
                  <td class="text-end pe-4 fw-bold text-slate-900 text-sm py-3">{{ vnd(i.totalPrice) }}</td>
                </tr>
                <tr v-if="!order.items?.length">
                  <td colspan="4" class="text-center text-muted py-4">Không có sản phẩm trong đơn.</td>
                </tr>
              </tbody>
              <tfoot v-if="order.items?.length" class="bg-slate-50 border-top border-slate-200 text-sm">
                <tr>
                  <td colspan="3" class="text-end text-slate-600 py-2">Tạm tính:</td>
                  <td class="text-end pe-4 text-slate-900 font-semibold py-2">{{ vnd(order.subtotal) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="text-end text-slate-600 py-2">Phí vận chuyển:</td>
                  <td class="text-end pe-4 text-slate-900 font-semibold py-2">{{ vnd(order.shippingFee) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="text-end text-slate-600 py-2">Giảm giá:</td>
                  <td class="text-end pe-4 text-emerald-600 font-semibold py-2">- {{ vnd(order.discountAmount) }}</td>
                </tr>
                <tr class="border-top border-slate-200 bg-white">
                  <td colspan="3" class="text-end fw-bold text-slate-900 fs-6 py-3">Tổng cộng:</td>
                  <td class="text-end pe-4 fw-black text-indigo-600 fs-5 py-3">{{ vnd(order.totalAmount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Receiver, Payment, Timeline -->
      <div class="col-lg-4">
        <!-- Receiver Info -->
        <div class="card border-0 shadow-sm rounded-4 mb-3 p-4 bg-white">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="seller-card-icon bg-indigo-50 text-indigo-600">
              <i class="bi bi-person"></i>
            </div>
            <h6 class="mb-0 fw-bold text-slate-900">Người nhận hàng</h6>
          </div>
          <div class="text-sm">
            <div class="fw-bold text-slate-900 fs-6 mb-1">{{ order.receiverName }}</div>
            <div class="text-slate-600 mb-2">
              <i class="bi bi-telephone me-1 text-slate-400"></i>{{ order.receiverPhone }}
            </div>
            <div class="p-2.5 rounded-3 bg-slate-50 border border-slate-100 text-slate-700 text-xs leading-relaxed">
              <i class="bi bi-geo-alt me-1 text-slate-400"></i>{{ order.shippingAddress }}
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="card border-0 shadow-sm rounded-4 mb-3 p-4 bg-white">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="seller-card-icon bg-emerald-50 text-emerald-600">
              <i class="bi bi-credit-card"></i>
            </div>
            <h6 class="mb-0 fw-bold text-slate-900">Thông tin thanh toán</h6>
          </div>
          <div class="text-sm space-y-2">
            <div class="d-flex justify-content-between py-1 border-bottom border-slate-100">
              <span class="text-slate-500">Phương thức:</span>
              <span class="fw-bold text-slate-800">{{ order.paymentMethod }}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom border-slate-100">
              <span class="text-slate-500">Trạng thái:</span>
              <span
                class="badge px-2 py-1 rounded-pill text-xs fw-bold"
                :class="order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
              >
                {{ order.paymentStatus }}
              </span>
            </div>
            <div v-if="order.note" class="mt-2.5 p-2 rounded-3 bg-slate-50 border text-xs text-slate-600">
              <strong>Ghi chú:</strong> {{ order.note }}
            </div>
            <div v-if="order.cancelReason" class="mt-2.5 p-2 rounded-3 bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <strong>Lý do hủy:</strong> {{ order.cancelReason }}
            </div>
          </div>
        </div>

        <!-- Timeline Info -->
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div class="seller-card-icon bg-blue-50 text-blue-600">
              <i class="bi bi-clock-history"></i>
            </div>
            <h6 class="mb-0 fw-bold text-slate-900">Tiến trình xử lý</h6>
          </div>
          <div class="seller-timeline text-xs space-y-3">
            <div v-if="order.createdAt" class="d-flex gap-2.5">
              <i class="bi bi-plus-circle text-indigo-500 mt-0.5"></i>
              <div>
                <span class="fw-bold text-slate-800 d-block">Đã tạo đơn</span>
                <span class="text-slate-500">{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</span>
              </div>
            </div>
            <div v-if="order.confirmedAt" class="d-flex gap-2.5">
              <i class="bi bi-check-circle text-blue-500 mt-0.5"></i>
              <div>
                <span class="fw-bold text-slate-800 d-block">Đã xác nhận</span>
                <span class="text-slate-500">{{ new Date(order.confirmedAt).toLocaleString('vi-VN') }}</span>
              </div>
            </div>
            <div v-if="order.shippedAt" class="d-flex gap-2.5">
              <i class="bi bi-truck text-purple-500 mt-0.5"></i>
              <div>
                <span class="fw-bold text-slate-800 d-block">Đang giao hàng</span>
                <span class="text-slate-500">{{ new Date(order.shippedAt).toLocaleString('vi-VN') }}</span>
              </div>
            </div>
            <div v-if="order.deliveredAt" class="d-flex gap-2.5">
              <i class="bi bi-box-seam text-cyan-500 mt-0.5"></i>
              <div>
                <span class="fw-bold text-slate-800 d-block">Đã giao hàng</span>
                <span class="text-slate-500">{{ new Date(order.deliveredAt).toLocaleString('vi-VN') }}</span>
              </div>
            </div>
            <div v-if="order.completedAt" class="d-flex gap-2.5">
              <i class="bi bi-check2-all text-emerald-500 mt-0.5"></i>
              <div>
                <span class="fw-bold text-slate-800 d-block">Hoàn tất</span>
                <span class="text-slate-500">{{ new Date(order.completedAt).toLocaleString('vi-VN') }}</span>
              </div>
            </div>
            <div v-if="order.cancelledAt" class="d-flex gap-2.5 text-rose-600">
              <i class="bi bi-x-circle text-rose-500 mt-0.5"></i>
              <div>
                <span class="fw-bold d-block">Đã hủy</span>
                <span class="text-slate-500">{{ new Date(order.cancelledAt).toLocaleString('vi-VN') }}</span>
              </div>
            </div>
            <div v-if="!order.confirmedAt && !order.shippedAt && !order.deliveredAt && !order.completedAt && !order.cancelledAt" class="text-slate-400 fst-italic">
              Chưa có cập nhật trạng thái mới.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-order-detail-page {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.seller-item-thumb-box {
  width: 54px;
  height: 54px;
  min-width: 54px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.seller-item-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.seller-item-thumb:hover {
  transform: scale(1.08);
}

.seller-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
