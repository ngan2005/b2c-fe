<template>
  <div class="min-h-[80vh] d-flex align-items-center justify-content-center px-4 py-12" style="background: #f8fafc;">
    <div class="w-100 max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
      <div class="text-center mb-6">
        <div class="w-12 h-12 rounded-2xl d-inline-flex align-items-center justify-content-center text-2xl mb-3"
             style="background: rgba(232, 74, 74, 0.1); color: #e84a4a;">
          <i class="bi bi-shield-lock"></i>
        </div>
        <h1 class="font-extrabold text-slate-900 text-2xl mb-1">Đặt Mật Khẩu Mới</h1>
        <p class="text-xs text-slate-500">
          Nhập mật khẩu mới an toàn tối thiểu 8 ký tự cho tài khoản của bạn.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <BaseInput
          v-model="newPassword"
          label="Mật khẩu mới"
          type="password"
          placeholder="••••••••"
          prepend-icon="bi bi-lock"
          required
        />
        <BaseInput
          v-model="confirmPassword"
          label="Xác nhận mật khẩu mới"
          type="password"
          placeholder="••••••••"
          prepend-icon="bi bi-shield-check"
          required
        />

        <button type="submit" class="btn-nomall-submit w-100 mt-2" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          Cập nhật mật khẩu
        </button>
      </form>

      <div class="text-center pt-6 border-t border-slate-100 mt-6">
        <router-link :to="{ name: 'login' }" class="text-xs font-bold" style="color: #e84a4a; text-decoration: none;">
          <i class="bi bi-arrow-left me-1"></i> Quay lại Đăng nhập
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { useNotifyStore } from '@/stores/notify'
import BaseInput from '@/components/common/BaseInput.vue'

const route = useRoute()
const router = useRouter()
const notify = useNotifyStore()

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  if (newPassword.value.length < 8) {
    notify.push('Mật khẩu mới phải có tối thiểu 8 ký tự.', 'warning')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    notify.push('Xác nhận mật khẩu không trùng khớp.', 'warning')
    return
  }

  const token = route.query.token
  if (!token) {
    notify.push('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'danger')
    return
  }

  loading.value = true
  try {
    await authService.resetPassword({ token, newPassword: newPassword.value })
    notify.push('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.', 'success')
    router.push({ name: 'login' })
  } catch (err) {
    notify.push('Không thể đặt lại mật khẩu. Token có thể đã hết hạn.', 'danger')
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
