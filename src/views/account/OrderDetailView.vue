<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Top Header & Navigation -->
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <router-link :to="{ name: 'account-orders' }" class="text-xs text-blue-600 font-semibold hover:underline">
            <i class="bi bi-arrow-left me-1"></i> Quay lại danh sách đơn hàng
          </router-link>
          <h1 class="font-extrabold text-slate-900 text-2xl md:text-3xl mt-1 m-0">
            Chi Tiết Đơn Hàng #{{ order?.orderCode || $route.params.id }}
          </h1>
        </div>
        <BaseBadge v-if="order" :variant="getStatusVariant(order.status)" dot size="lg">
          {{ order.status }}
        </BaseBadge>
      </div>

      <LoadingSpinner v-if="loading" text="Đang nạp chi tiết đơn hàng..." />
      <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchOrder" />

      <div v-else-if="order" class="space-y-6">
        <!-- Unpaid Online Order TTL Countdown Banner -->
        <div
          v-if="isUnpaidOnlineOrder"
          class="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3"
        >
          <div class="d-flex align-items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white d-flex align-items-center justify-content-center text-xl shrink-0 shadow-sm">
              <i class="bi bi-clock-history"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h5 class="text-sm font-bold text-amber-950 m-0">Đơn hàng đang chờ bạn thanh toán!</h5>
                <span class="badge bg-rose-600 text-white font-mono px-2 py-1 text-xs d-flex align-items-center gap-1 shadow-xs">
                  <i class="bi bi-hourglass-split"></i> {{ ttlCountdownText }}
                </span>
              </div>
              <p class="text-xs text-amber-800 mb-0 leading-relaxed">
                Vui lòng thanh toán trước khi thời gian kết thúc (15 phút). Hết thời gian đơn sẽ tự động hủy và giải phóng kho cho người mua khác.
              </p>
            </div>
          </div>
          <button
            class="btn btn-danger rounded-2xl font-bold px-4 py-2.5 shadow-md d-flex align-items-center gap-2 hover:scale-105 transition-transform"
            :disabled="retryingPay || remainingSeconds <= 0"
            @click="handleRetryPay"
          >
            <span v-if="retryingPay" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-credit-card-2-front-fill"></i>
            Thanh Toán Ngay Qua VNPay
          </button>
        </div>

        <!-- Cancelled Order Info Banner -->
        <div
          v-else-if="order.status === 'CANCELLED'"
          class="p-4 bg-rose-50 rounded-3xl border border-rose-200 d-flex align-items-center gap-3"
        >
          <div class="w-10 h-10 rounded-2xl bg-rose-600 text-white d-flex align-items-center justify-content-center text-lg shrink-0">
            <i class="bi bi-x-circle-fill"></i>
          </div>
          <div>
            <h5 class="text-sm font-bold text-rose-950 mb-0.5">Đơn hàng này đã bị hủy</h5>
            <p class="text-xs text-rose-800 mb-0">
              Lý do: <strong>{{ order.cancelReason || 'Hết thời gian thanh toán hoặc người mua yêu cầu hủy' }}</strong>
              <span v-if="order.cancelledAt" class="text-slate-500 ms-1">({{ formatDate(order.cancelledAt) }})</span>
            </p>
          </div>
        </div>

        <!-- Order Progress Steps Timeline -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div class="row text-center g-3">
            <div
              v-for="step in orderSteps"
              :key="step.status"
              class="col"
            >
              <div :class="['w-10 h-10 rounded-full mx-auto d-flex align-items-center justify-content-center text-base mb-2', isStepPassed(step.status) ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400']">
                <i :class="step.icon"></i>
              </div>
              <h6 class="font-bold text-xs text-slate-800 m-0">{{ step.label }}</h6>
            </div>
          </div>
        </div>

        <!-- Recipient & Shipping Information Grid -->
        <div class="row g-4">
          <div class="col-md-6">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-100 space-y-3">
              <h4 class="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 m-0 d-flex align-items-center gap-2">
                <i class="bi bi-geo-alt text-blue-600"></i> Thông Tin Giao Hàng
              </h4>
              <p class="text-xs text-slate-700 mb-1"><strong>Người nhận:</strong> {{ order.receiverName || 'N/A' }}</p>
              <p class="text-xs text-slate-700 mb-1"><strong>Số điện thoại:</strong> {{ order.receiverPhone || 'N/A' }}</p>
              <p class="text-xs text-slate-700 mb-0 leading-relaxed"><strong>Địa chỉ nhận:</strong> {{ order.shippingAddress || 'N/A' }}</p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-100 space-y-3">
              <h4 class="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 m-0 d-flex align-items-center gap-2">
                <i class="bi bi-credit-card text-blue-600"></i> Thanh Toán & Ghi Chú
              </h4>
              <p class="text-xs text-slate-700 mb-1"><strong>Phương thức thanh toán:</strong> {{ order.paymentMethod || 'COD' }}</p>
              <p class="text-xs text-slate-700 mb-1">
                <strong>Trạng thái thanh toán:</strong>
                <span :class="['ms-1 font-semibold', order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600']">
                  {{ order.paymentStatus || 'UNPAID' }}
                </span>
              </p>
              <p class="text-xs text-slate-700 mb-0"><strong>Ghi chú đơn:</strong> {{ order.note || 'Không có ghi chú' }}</p>
            </div>
          </div>
        </div>

        <!-- Return / Cancel Action Buttons -->
        <div class="d-flex align-items-center justify-content-end gap-3 flex-wrap">
          <!-- Return request button (only for DELIVERED, within 7 days, not yet requested) -->
          <button
            v-if="canRequestReturn"
            class="btn btn-outline-danger rounded-2xl d-flex align-items-center gap-2"
            @click="openReturnModal"
          >
            <i class="bi bi-arrow-counterclockwise"></i> Yêu cầu hoàn trả
          </button>
          <!-- Return requested info badge -->
          <div v-else-if="isReturnRequested" class="d-flex align-items-center gap-2 text-sm text-danger">
            <i class="bi bi-hourglass-split"></i> Đã yêu cầu hoàn trả
            <span v-if="order.returnRequestedAt" class="text-slate-400">({{ formatDate(order.returnRequestedAt) }})</span>
          </div>
          <!-- Cancel button (only for PENDING/CONFIRMED) -->
          <button
            v-if="canCancel"
            class="btn btn-outline-secondary rounded-2xl d-flex align-items-center gap-2"
            @click="openCancelModal"
          >
            <i class="bi bi-x-circle"></i> Hủy đơn hàng
          </button>
        </div>
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <h4 class="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 m-0 mb-4">
            Danh Sách Sản Phẩm ({{ order.items?.length || 0 }})
          </h4>

          <div class="divide-y divide-slate-100">
            <div v-for="item in order.items" :key="item.id" class="py-3 d-flex align-items-center justify-content-between gap-4">
              <div class="d-flex align-items-center gap-3">
                <img :src="item.imageUrl || placeholderImg" class="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
                <div>
                  <h5 class="font-semibold text-slate-800 text-sm mb-1">{{ item.productName }}</h5>
                  <span v-if="item.variantName" class="text-xs text-slate-400">Phân loại: {{ item.variantName }}</span>
                </div>
              </div>
              <div class="text-end">
                <div class="font-bold text-slate-900 text-sm">{{ formatCurrency(item.unitPrice) }} x {{ item.quantity }}</div>
                <div class="font-extrabold text-blue-600 text-sm mt-0.5">{{ formatCurrency(item.totalPrice) }}</div>
                <!-- Review Button (only for COMPLETED orders, per item) -->
                <div v-if="isCompleted && !item.isReviewed" class="mt-2">
                  <button
                    class="btn btn-sm btn-outline-warning rounded-xl d-flex align-items-center gap-1 ms-auto"
                    @click="openReviewModal(item)"
                  >
                    <i class="bi bi-star"></i> Viết đánh giá
                  </button>
                </div>
                <div v-else-if="isCompleted && item.isReviewed" class="mt-2">
                  <span class="badge bg-success-subtle text-success border border-success-subtle text-xs d-flex align-items-center gap-1 w-fit ms-auto">
                    <i class="bi bi-check-circle"></i> Đã đánh giá
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Calculation -->
          <div class="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600 max-w-xs ms-auto mt-4">
            <div class="d-flex justify-content-between">
              <span>Tạm tính</span>
              <span class="font-semibold text-slate-800">{{ formatCurrency(order.subtotal) }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span>Phí vận chuyển</span>
              <span class="font-semibold text-slate-800">{{ formatCurrency(order.shippingFee) }}</span>
            </div>
            <div class="d-flex justify-content-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Tổng cộng</span>
              <span class="text-blue-600 text-xl">{{ formatCurrency(order.totalAmount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Review Modal -->
  <BaseModal v-model="showReviewModal" title="Viết đánh giá" size="md" @close="closeReviewModal">
    <div v-if="reviewingItem">
      <p class="text-sm text-slate-600 mb-4">
        Đánh giá sản phẩm: <strong class="text-slate-800">{{ reviewingItem.productName }}</strong>
      </p>

      <!-- Star Rating -->
      <div class="mb-4">
        <label class="form-label text-xs font-semibold text-slate-700 text-uppercase tracking-wider">Xếp hạng *</label>
        <div class="d-flex align-items-center gap-2">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="btn btn-link p-0 text-decoration-none"
            @click="reviewForm.rating = star"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
          >
            <i :class="['bi', star <= (hoverRating || reviewForm.rating) ? 'bi-star-fill' : 'bi-star', 'text-2xl', star <= (hoverRating || reviewForm.rating) ? 'text-amber-400' : 'text-slate-300']"></i>
          </button>
          <span class="ms-2 text-sm text-slate-500">
            {{ ratingLabels[reviewForm.rating - 1] || '' }}
          </span>
        </div>
        <div v-if="reviewErrors.rating" class="text-danger text-xs mt-1">{{ reviewErrors.rating }}</div>
      </div>

      <!-- Comment -->
      <div class="mb-4">
        <label class="form-label text-xs font-semibold text-slate-700 text-uppercase tracking-wider">Nhận xét</label>
        <textarea
          v-model="reviewForm.comment"
          class="form-control"
          rows="4"
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
          maxlength="500"
        ></textarea>
        <div class="text-end text-xs text-slate-400 mt-1">
          {{ reviewForm.comment?.length || 0 }} / 500
        </div>
      </div>

      <!-- Anonymous option -->
      <div class="form-check mb-4">
        <input id="reviewAnonymous" v-model="reviewForm.isAnonymous" class="form-check-input" type="checkbox" />
        <label for="reviewAnonymous" class="form-check-label text-sm text-slate-600">
          Gửi đánh giá ẩn danh
        </label>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-light rounded-xl" :disabled="submitting" @click="closeReviewModal">
        Hủy
      </button>
      <button type="button" class="btn btn-primary rounded-xl" :disabled="submitting" @click="submitReview">
        <span v-if="submitting">
          <span class="spinner-border spinner-border-sm me-1"></span> Đang gửi...
        </span>
        <span v-else>
          <i class="bi bi-send me-1"></i> Gửi đánh giá
        </span>
      </button>
    </template>
  </BaseModal>

  <!-- Return Request Modal -->
  <BaseModal v-model="showReturnModal" title="Yêu cầu hoàn trả đơn hàng" size="md" @close="closeReturnModal">
    <div>
      <p class="text-sm text-slate-600 mb-4">
        Yêu cầu hoàn trả cho đơn hàng <strong class="text-slate-800">{{ order?.orderCode }}</strong>.
        Bạn có thể yêu cầu hoàn trả trong vòng <strong>7 ngày</strong> kể từ khi nhận được hàng.
      </p>

      <!-- Reason -->
      <div class="mb-4">
        <label class="form-label text-xs font-semibold text-slate-700 text-uppercase tracking-wider">Lý do hoàn trả *</label>
        <select v-model="returnForm.reason" class="form-select">
          <option value="" disabled>-- Chọn lý do --</option>
          <option value="DAMAGED">Sản phẩm bị hư hỏng / lỗi</option>
          <option value="WRONG_ITEM">Sai sản phẩm đã đặt</option>
          <option value="NOT_AS_DESCRIBED">Không đúng mô tả trên website</option>
          <option value="CHANGED_MIND">Đổi ý / không cần nữa</option>
          <option value="OTHER">Lý do khác</option>
        </select>
        <div v-if="returnErrors.reason" class="text-danger text-xs mt-1">{{ returnErrors.reason }}</div>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="form-label text-xs font-semibold text-slate-700 text-uppercase tracking-wider">Mô tả chi tiết (không bắt buộc)</label>
        <textarea
          v-model="returnForm.description"
          class="form-control"
          rows="4"
          placeholder="Mô tả chi tiết vấn đề gặp phải..."
          maxlength="1000"
        ></textarea>
        <div class="text-end text-xs text-slate-400 mt-1">
          {{ returnForm.description?.length || 0 }} / 1000
        </div>
      </div>

      <!-- Partial return info -->
      <div class="bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 d-flex align-items-start gap-2">
        <i class="bi bi-info-circle mt-0.5"></i>
        <span>Nếu bạn chỉ muốn hoàn trả một số sản phẩm trong đơn, vui lòng liên hệ bộ phận hỗ trợ sau khi gửi yêu cầu.</span>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-light rounded-xl" :disabled="submittingReturn" @click="closeReturnModal">
        Hủy
      </button>
      <button type="button" class="btn btn-danger rounded-xl" :disabled="submittingReturn" @click="submitReturn">
        <span v-if="submittingReturn">
          <span class="spinner-border spinner-border-sm me-1"></span> Đang gửi...
        </span>
        <span v-else>
          <i class="bi bi-send me-1"></i> Gửi yêu cầu hoàn trả
        </span>
      </button>
    </template>
  </BaseModal>

  <!-- Cancel Order Modal -->
  <BaseModal v-model="showCancelModal" title="Hủy đơn hàng" size="md" @close="closeCancelModal">
    <div>
      <p class="text-sm text-slate-600 mb-4">
        Bạn có chắc chắn muốn hủy đơn hàng <strong class="text-slate-800">{{ order?.orderCode }}</strong> không?
      </p>
      <div>
        <label class="form-label text-xs font-semibold text-slate-700 text-uppercase tracking-wider">Lý do hủy (không bắt buộc)</label>
        <textarea
          v-model="cancelReason"
          class="form-control"
          rows="3"
          placeholder="Cho chúng tôi biết lý do bạn hủy đơn..."
          maxlength="500"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-light rounded-xl" :disabled="submittingCancel" @click="closeCancelModal">
        Không, giữ đơn
      </button>
      <button type="button" class="btn btn-outline-danger rounded-xl" :disabled="submittingCancel" @click="submitCancel">
        <span v-if="submittingCancel">
          <span class="spinner-border spinner-border-sm me-1"></span> Đang hủy...
        </span>
        <span v-else>
          <i class="bi bi-x-circle me-1"></i> Xác nhận hủy
        </span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { buyerOrderService } from '@/services/buyerOrder.service'
import { reviewService } from '@/services/review.service'
import { useNotifyStore } from '@/stores/notify'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const route = useRoute()
const notify = useNotifyStore()
const loading = ref(true)
const errorMsg = ref('')
const order = ref(null)
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

// Unpaid online TTL Countdown & Retry Pay
const retryingPay = ref(false)
const remainingSeconds = ref(0)
let timerInterval = null

const isUnpaidOnlineOrder = computed(() => {
  return (
    order.value?.status === 'PENDING' &&
    order.value?.paymentStatus !== 'PAID' &&
    order.value?.paymentMethod?.toUpperCase() !== 'COD'
  )
})

const ttlCountdownText = computed(() => {
  if (remainingSeconds.value <= 0) return '00:00 (Hết hạn)'
  const mins = Math.floor(remainingSeconds.value / 60)
  const secs = remainingSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const updateCountdown = () => {
  if (!order.value?.createdAt || !isUnpaidOnlineOrder.value) {
    remainingSeconds.value = 0
    return
  }
  const created = new Date(order.value.createdAt).getTime()
  const expireAt = created + 15 * 60 * 1000 // 15 minutes TTL
  const now = Date.now()
  const diffSecs = Math.max(0, Math.floor((expireAt - now) / 1000))
  remainingSeconds.value = diffSecs
  if (diffSecs <= 0 && order.value.status === 'PENDING') {
    setTimeout(fetchOrder, 2500)
  }
}

const handleRetryPay = async () => {
  if (!order.value?.id) return
  try {
    retryingPay.value = true
    const res = await buyerOrderService.retryPay(order.value.id)
    const url = res.data?.data?.paymentUrl || res.data?.paymentUrl
    if (url) {
      window.location.href = url
    } else {
      notify.push('Không lấy được liên kết thanh toán. Vui lòng thử lại!', 'danger')
    }
  } catch (err) {
    notify.push(err.response?.data?.message || 'Lỗi khi mở cổng thanh toán', 'danger')
  } finally {
    retryingPay.value = false
  }
}

// Review modal state
const showReviewModal = ref(false)
const reviewingItem = ref(null)
const submitting = ref(false)
const hoverRating = ref(0)
const reviewErrors = ref({})
const reviewForm = ref({
  rating: 0,
  comment: '',
  isAnonymous: false,
})
const ratingLabels = ['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng']

// Return modal state
const showReturnModal = ref(false)
const submittingReturn = ref(false)
const returnErrors = ref({})
const returnForm = ref({
  reason: '',
  description: '',
  orderItemIds: null,
})

// Cancel modal state
const showCancelModal = ref(false)
const cancelReason = ref('')
const submittingCancel = ref(false)

const isCompleted = computed(() =>
  order.value?.status === 'COMPLETED' || order.value?.status === 'DELIVERED'
)

const canCancel = computed(() =>
  order.value?.status === 'PENDING' || order.value?.status === 'CONFIRMED'
)

const canRequestReturn = computed(() => {
  if (order.value?.status !== 'DELIVERED') return false
  if (order.value?.returnRequestedAt) return false
  if (!order.value?.deliveredAt) return false
  // Within 7-day window
  const delivered = new Date(order.value.deliveredAt)
  const now = new Date()
  const diffDays = (now - delivered) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
})

const isReturnRequested = computed(() =>
  order.value?.status === 'RETURN_REQUESTED' || !!order.value?.returnRequestedAt
)

const orderSteps = [
  { status: 'PENDING', label: 'Đặt hàng', icon: 'bi-file-earmark-plus' },
  { status: 'CONFIRMED', label: 'Xác nhận', icon: 'bi-check-circle' },
  { status: 'PACKED', label: 'Đóng gói', icon: 'bi-box-seam' },
  { status: 'SHIPPING', label: 'Giao hàng', icon: 'bi-truck' },
  { status: 'DELIVERED', label: 'Đã giao', icon: 'bi-house-check' },
]

const fetchOrder = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await buyerOrderService.getOrder(route.params.id)
    order.value = data
  } catch (err) {
    errorMsg.value = 'Không thể nạp chi tiết đơn hàng.'
  } finally {
    loading.value = false
  }
}

const isStepPassed = (stepStatus) => {
  if (!order.value?.status) return false
  const orderIndex = orderSteps.findIndex((s) => s.status === order.value.status)
  const stepIndex = orderSteps.findIndex((s) => s.status === stepStatus)
  return stepIndex <= orderIndex && order.value.status !== 'CANCELLED'
}

const getStatusVariant = (status) => {
  switch (status) {
    case 'DELIVERED':
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'danger'
    case 'RETURN_REQUESTED': return 'warning'
    case 'RETURNED': return 'info'
    default: return 'warning'
  }
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

const openReviewModal = (item) => {
  reviewingItem.value = item
  reviewForm.value = { rating: 0, comment: '', isAnonymous: false }
  reviewErrors.value = {}
  hoverRating.value = 0
  showReviewModal.value = true
}

const closeReviewModal = () => {
  showReviewModal.value = false
  reviewingItem.value = null
}

const submitReview = async () => {
  // Validate
  reviewErrors.value = {}
  if (!reviewForm.value.rating || reviewForm.value.rating < 1 || reviewForm.value.rating > 5) {
    reviewErrors.value.rating = 'Vui lòng chọn xếp hạng từ 1 đến 5 sao.'
    return
  }

  submitting.value = true
  try {
    await reviewService.create({
      orderItemId: reviewingItem.value.id,
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment || null,
      isAnonymous: reviewForm.value.isAnonymous || false,
    })
    notify.push('Đánh giá của bạn đã được gửi thành công! Cảm ơn bạn.', 'success')
    closeReviewModal()
    await fetchOrder()
  } catch (err) {
    notify.push(err?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.', 'danger')
  } finally {
    submitting.value = false
  }
}

// Return request modal
const openReturnModal = () => {
  returnForm.value = { reason: '', description: '', orderItemIds: null }
  returnErrors.value = {}
  showReturnModal.value = true
}

const closeReturnModal = () => {
  showReturnModal.value = false
  returnForm.value = { reason: '', description: '', orderItemIds: null }
}

const submitReturn = async () => {
  returnErrors.value = {}
  if (!returnForm.value.reason) {
    returnErrors.value.reason = 'Vui lòng chọn lý do hoàn trả.'
    return
  }
  submittingReturn.value = true
  try {
    await buyerOrderService.requestReturn(route.params.id, {
      reason: returnForm.value.reason,
      description: returnForm.value.description || null,
      orderItemIds: returnForm.value.orderItemIds,
    })
    notify.push('Yêu cầu hoàn trả đã được gửi thành công!', 'success')
    closeReturnModal()
    await fetchOrder()
  } catch (err) {
    notify.push(err?.response?.data?.message || 'Không thể gửi yêu cầu hoàn trả. Vui lòng thử lại.', 'danger')
  } finally {
    submittingReturn.value = false
  }
}

// Cancel order modal
const openCancelModal = () => {
  cancelReason.value = ''
  showCancelModal.value = true
}

const closeCancelModal = () => {
  showCancelModal.value = false
  cancelReason.value = ''
}

const submitCancel = async () => {
  submittingCancel.value = true
  try {
    await buyerOrderService.cancelOrder(route.params.id, cancelReason.value)
    notify.push('Đơn hàng đã được hủy thành công.', 'success')
    closeCancelModal()
    await fetchOrder()
  } catch (err) {
    notify.push(err?.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.', 'danger')
  } finally {
    submittingCancel.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

onMounted(async () => {
  await fetchOrder()
  updateCountdown()
  timerInterval = setInterval(updateCountdown, 1000)

  if (route.query.action === 'review' && isCompleted.value) {
    const unreviewed = order.value?.items?.find((it) => !it.isReviewed)
    if (unreviewed) {
      openReviewModal(unreviewed)
    }
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})
</script>
