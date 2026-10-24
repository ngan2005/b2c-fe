<template>
  <div class="container mx-auto px-4 py-8">
    <LoadingSpinner v-if="loading" text="Đang tải thông tin đơn hàng..." />
    <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchOrder" />

    <div v-else-if="order" class="max-w-2xl mx-auto space-y-6">

      <!-- Success Banner -->
      <div class="bg-white rounded-3xl border border-emerald-200 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-10 text-center">
          <!-- Animated checkmark -->
          <div class="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-6 d-flex align-items-center justify-content-center animate__animated animate__bounceIn">
            <i class="bi bi-check-circle-fill text-white" style="font-size: 4rem;"></i>
          </div>
          <h1 class="font-extrabold text-white text-3xl mb-2">Đặt hàng thành công!</h1>
          <p class="text-white/80 text-sm">Cảm ơn bạn đã mua sắm tại B2C Market</p>
        </div>

        <!-- Order Code + Payment Status -->
        <div class="px-8 py-6 space-y-4 border-t border-emerald-100">
          <!-- Order code -->
          <div class="bg-slate-50 rounded-2xl p-4 d-flex align-items-center justify-content-between gap-3">
            <div>
              <p class="text-xs text-slate-500 mb-0.5">Mã đơn hàng</p>
              <p class="font-extrabold text-slate-900 text-xl mb-0 tracking-wide">{{ order.orderCode }}</p>
            </div>
            <button
              class="btn btn-sm btn-outline-secondary rounded-xl d-flex align-items-center gap-1"
              @click="copyOrderCode"
              title="Sao chép mã đơn hàng"
            >
              <i :class="['bi', copied ? 'bi-check2' : 'bi-clipboard']"></i>
              {{ copied ? 'Đã chép!' : 'Sao chép' }}
            </button>
          </div>

          <!-- Payment status -->
          <div class="d-flex align-items-center gap-3">
            <div :class="['w-10 h-10 rounded-xl d-flex align-items-center justify-content-center text-lg',
              order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600']">
              <i :class="['bi', order.paymentStatus === 'PAID' ? 'bi-check-circle-fill' : 'bi-clock-fill']"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-0.5">Trạng thái thanh toán</p>
              <p :class="['font-semibold text-sm mb-0', order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600']">
                {{ order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
              </p>
            </div>
          </div>

          <!-- Payment method -->
          <div class="d-flex align-items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 d-flex align-items-center justify-content-center text-lg">
              <i :class="paymentIcon"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-0.5">Phương thức thanh toán</p>
              <p class="font-semibold text-sm text-slate-800 mb-0">{{ paymentMethodLabel }}</p>
            </div>
          </div>

          <!-- VNPay warning (unpaid) -->
          <div v-if="order.paymentMethod === 'VNPAY' && order.paymentStatus !== 'PAID'" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 d-flex align-items-start gap-3">
            <i class="bi bi-exclamation-triangle-fill text-amber-500 mt-0.5"></i>
            <div>
              <p class="font-semibold text-amber-800 text-sm mb-0.5">Thanh toán chưa hoàn tất</p>
              <p class="text-xs text-amber-600 mb-0">Vui lòng hoàn tất thanh toán để đơn hàng được xử lý.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary Card -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 class="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 m-0 d-flex align-items-center gap-2">
          <i class="bi bi-bag-check text-blue-600"></i> Tổng quan đơn hàng
        </h3>

        <!-- Items -->
        <div class="space-y-3">
          <div v-for="item in order.items" :key="item.id" class="d-flex align-items-center gap-3">
            <img
              :src="item.imageUrl || placeholderImg"
              class="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
            />
            <div class="flex-grow-1 min-w-0">
              <h5 class="font-semibold text-slate-800 text-sm mb-0.5 truncate">{{ item.productName }}</h5>
              <span class="text-xs text-slate-400">{{ item.variantName || '' }}</span>
            </div>
            <div class="text-end">
              <div class="font-bold text-slate-900 text-sm">x{{ item.quantity }}</div>
              <div class="font-extrabold text-blue-600 text-sm">{{ formatCurrency(item.totalPrice) }}</div>
            </div>
          </div>
        </div>

        <!-- Recipient -->
        <div class="pt-4 border-t border-slate-100">
          <div class="d-flex align-items-start gap-2">
            <i class="bi bi-geo-alt-fill text-rose-400 mt-0.5"></i>
            <div>
              <p class="font-semibold text-slate-800 text-sm mb-0.5">Địa chỉ giao hàng</p>
              <p class="text-xs text-slate-500 mb-0 leading-relaxed">
                <strong>{{ order.receiverName }}</strong> · {{ order.receiverPhone }}<br>
                {{ order.shippingAddress }}
              </p>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
          <div class="d-flex justify-content-between">
            <span>Tạm tính</span>
            <span class="font-semibold text-slate-800">{{ formatCurrency(order.subtotal) }}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span>Phí vận chuyển</span>
            <span class="font-semibold text-emerald-600">{{ formatCurrency(order.shippingFee) }}</span>
          </div>
          <div v-if="order.discountAmount > 0" class="d-flex justify-content-between text-emerald-600">
            <span>Giảm giá</span>
            <span class="font-semibold">-{{ formatCurrency(order.discountAmount) }}</span>
          </div>
          <div class="d-flex justify-content-between font-extrabold text-slate-900 pt-2 border-t border-slate-100">
            <span>Tổng cộng</span>
            <span class="text-blue-600 text-xl">{{ formatCurrency(order.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex gap-3">
        <router-link
          :to="{ name: 'account-order-detail', params: { id: order.id } }"
          class="btn btn-primary flex-grow-1 rounded-2xl py-3 d-flex align-items-center justify-content-center gap-2"
        >
          <i class="bi bi-eye"></i> Xem chi tiết đơn hàng
        </router-link>
        <router-link
          :to="{ name: 'home' }"
          class="btn btn-outline-secondary flex-grow-1 rounded-2xl py-3 d-flex align-items-center justify-content-center gap-2"
        >
          <i class="bi bi-bag"></i> Tiếp tục mua sắm
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { buyerOrderService } from '@/services/buyerOrder.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const loading = ref(true)
const errorMsg = ref('')
const order = ref(null)
const copied = ref(false)
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

const paymentMethodLabel = computed(() => {
  switch (order.value?.paymentMethod) {
    case 'VNPAY': return 'VNPay / Thẻ ATM nội địa'
    case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng'
    case 'COD': return 'Thanh toán khi nhận hàng (COD)'
    default: return order.value?.paymentMethod || 'COD'
  }
})

const paymentIcon = computed(() => {
  switch (order.value?.paymentMethod) {
    case 'VNPAY': return 'bi-qr-code-scan'
    case 'BANK_TRANSFER': return 'bi-bank'
    default: return 'bi-cash-coin'
  }
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

const fetchOrder = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    order.value = await buyerOrderService.getOrder(props.id)
  } catch (err) {
    if (err?.response?.status === 404) {
      errorMsg.value = 'Không tìm thấy đơn hàng này.'
    } else {
      errorMsg.value = 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.'
    }
  } finally {
    loading.value = false
  }
}

const copyOrderCode = async () => {
  try {
    await navigator.clipboard.writeText(order.value.orderCode)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (_) {}
}

onMounted(fetchOrder)
</script>
