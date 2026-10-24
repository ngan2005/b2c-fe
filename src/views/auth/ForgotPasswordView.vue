<template>
  <div class="min-h-[80vh] d-flex align-items-center justify-content-center px-4 py-12" style="background: #f8fafc;">
    <div class="w-100 max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-2xl d-inline-flex align-items-center justify-content-center text-2xl mb-3"
             style="background: rgba(232, 74, 74, 0.1); color: #e84a4a;">
          <i class="bi bi-key"></i>
        </div>
        <h1 class="font-extrabold text-slate-900 text-2xl mb-1">Quên Mật Khẩu?</h1>
        <p class="text-xs text-slate-500">
          Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi liên kết để đặt lại mật khẩu mới.
        </p>
      </div>

      <div v-if="submitted" class="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs text-center space-y-2 mb-4">
        <i class="bi bi-check-circle-fill text-xl text-emerald-600 d-block"></i>
        <p class="mb-0 font-medium">Yêu cầu đã được gửi!</p>
        <p class="text-slate-600 mb-0">Nếu tài khoản email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn thiết lập lại mật khẩu trong ít phút.</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <BaseInput
          v-model="email"
          label="Địa chỉ Email"
          type="email"
          placeholder="name@example.com"
          prepend-icon="bi bi-envelope"
          required
        />

        <button type="submit" class="btn-nomall-submit w-100 mt-2" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          Gửi yêu cầu khôi phục
        </button>
      </form>

      <div class="text-center pt-6 border-t border-slate-100 mt-6">
        <router-link :to="{ name: 'login' }" class="text-xs font-bold" style="color: #e84a4a; text-decoration: none;">
          <i class="bi bi-arrow-left me-1"></i> Quay lại trang Đăng nhập
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authService } from '@/services/auth.service'
import { useNotifyStore } from '@/stores/notify'
import BaseInput from '@/components/common/BaseInput.vue'

const notify = useNotifyStore()
const email = ref('')
const loading = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  if (!email.value.trim()) return
  loading.value = true
  try {
    await authService.forgotPassword(email.value.trim())
    submitted.value = true
  } catch (err) {
    notify.push('Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại.', 'danger')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.btn-nomall-submit {
  background: linear-gradient(135deg, #e84a4a 0%, #d43838 100%);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.75rem;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 14px rgba(232, 74, 74, 0.35);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-nomall-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #d33838 0%, #b82828 100%);
  box-shadow: 0 6px 20px rgba(232, 74, 74, 0.45);
  transform: translateY(-1px);
}

.btn-nomall-submit:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
}

:deep(.form-control:focus) {
  border-color: #e84a4a !important;
  box-shadow: 0 0 0 3px rgba(232, 74, 74, 0.15) !important;
}
</style>
