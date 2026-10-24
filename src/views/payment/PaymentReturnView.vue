<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 max-w-md w-full text-center space-y-6">

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 class="text-lg font-bold text-slate-800">Đang xử lý thanh toán...</h2>
        <p class="text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="status === 'success'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
          <i class="bi bi-check-circle-fill text-3xl text-emerald-600"></i>
        </div>
        <h2 class="text-xl font-extrabold text-slate-900">Thanh toán thành công!</h2>
        <p class="text-sm text-slate-600">
          Cảm ơn bạn đã đặt hàng. Đơn hàng
          <span class="font-semibold text-slate-800">{{ orderCode }}</span>
          đã được xác nhận và đang chờ xử lý.
        </p>
        <p class="text-xs text-slate-400">
          Một email xác nhận đã được gửi đến bạn.
        </p>
        <div class="pt-2">
          <BaseButton variant="primary" size="md" @click="goToOrders">
            <i class="bi bi-bag-check me-1"></i> Xem đơn hàng
          </BaseButton>
        </div>
      </div>

      <!-- Failed State -->
      <div v-else-if="status === 'failed'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
          <i class="bi bi-x-circle-fill text-3xl text-rose-500"></i>
        </div>
        <h2 class="text-xl font-extrabold text-slate-900">Thanh toán thất bại</h2>
        <p class="text-sm text-slate-600">
          Thanh toán cho đơn hàng
          <span class="font-semibold text-slate-800">{{ orderCode }}</span>
          không thành công. Đơn hàng đã bị hủy và giỏ hàng của bạn đã được hoàn trả.
        </p>
        <p class="text-xs text-slate-400">
          Bạn có thể thử đặt hàng lại với phương thức thanh toán khác.
        </p>
        <div class="pt-2 flex gap-3 justify-center flex-wrap">
          <BaseButton variant="outline" size="md" @click="goToCheckout">
            <i class="bi bi-arrow-left me-1"></i> Thử lại
          </BaseButton>
          <BaseButton variant="primary" size="md" @click="goToOrders">
            Xem đơn hàng
          </BaseButton>
        </div>
      </div>

      <!-- Error / Invalid Signature State -->
      <div v-else class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <i class="bi bi-exclamation-triangle-fill text-3xl text-amber-500"></i>
        </div>
        <h2 class="text-xl font-extrabold text-slate-900">Xác thực thất bại</h2>
        <p class="text-sm text-slate-600">
          Không thể xác minh tính hợp lệ của phản hồi thanh toán.
        </p>
        <p v-if="errorMessage" class="text-xs text-rose-500">{{ errorMessage }}</p>
        <div class="pt-2">
          <BaseButton variant="outline" size="md" @click="goToHome">
            <i class="bi bi-house me-1"></i> Về trang chủ
          </BaseButton>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const status = ref('')
const orderCode = ref('')
const errorMessage = ref('')

onMounted(() => {
  // Read query params set by the backend redirect
  status.value = route.query.status || ''
  orderCode.value = route.query.orderCode || ''
  errorMessage.value = route.query.message || ''
  loading.value = false
})

const goToOrders = () => router.push({ name: 'account-orders' })
const goToCheckout = () => router.push({ name: 'checkout' })
const goToHome = () => router.push({ name: 'home' })
</script>
