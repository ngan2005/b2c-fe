<template>
  <div class="nomall-password-page">
    <!-- Breadcrumb bar -->
    <div class="nomall-breadcrumb-bar">
      <div class="container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right"></i>
          <span>Tài khoản</span>
          <i class="bi bi-chevron-right"></i>
          <span class="breadcrumb-active">Đổi mật khẩu</span>
        </nav>
      </div>
    </div>

    <!-- Main Container -->
    <div class="container py-4">
      <div class="row g-4">
        <!-- ── Left Column: Account Navigation Sidebar ────────────── -->
        <div class="col-lg-3 col-md-4">
          <AccountSidebar />
        </div>

        <!-- ── Right Column: Password Form ────────────────────────── -->
        <div class="col-lg-9 col-md-8">
          <div class="nomall-card p-4 p-md-5">
            <!-- Header -->
            <div class="profile-card-header">
              <div class="d-flex align-items-center gap-3">
                <div class="profile-header-icon">
                  <i class="bi bi-shield-lock"></i>
                </div>
                <div>
                  <h1 class="profile-card-title">Đổi Mật Khẩu</h1>
                  <p class="profile-card-subtitle">
                    Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
                  </p>
                </div>
              </div>
            </div>

            <!-- Error banner -->
            <div v-if="formError" class="alert alert-danger py-2.5 px-3 small rounded-3 mb-4 d-flex align-items-center gap-2">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>{{ formError }}</span>
            </div>

            <form @submit.prevent="onSubmit" class="password-form" style="max-width: 32rem;">
              <div class="mb-3.5">
                <label class="nomall-form-label">
                  Mật khẩu hiện tại <span class="text-danger">*</span>
                </label>
                <div class="position-relative">
                  <input
                    v-model="currentPassword"
                    :type="showCurrent ? 'text' : 'password'"
                    class="nomall-form-control pe-5"
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                    :disabled="submitting"
                  />
                  <button
                    type="button"
                    class="btn-toggle-eye"
                    @click="showCurrent = !showCurrent"
                  >
                    <i :class="showCurrent ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="mb-3.5">
                <label class="nomall-form-label">
                  Mật khẩu mới <span class="text-danger">*</span>
                </label>
                <div class="position-relative">
                  <input
                    v-model="newPassword"
                    :type="showNew ? 'text' : 'password'"
                    class="nomall-form-control pe-5"
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    :disabled="submitting"
                  />
                  <button
                    type="button"
                    class="btn-toggle-eye"
                    @click="showNew = !showNew"
                  >
                    <i :class="showNew ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
                <small v-if="newPassword && !newValid" class="text-danger d-block mt-1 small">
                  <i class="bi bi-x-circle me-1"></i>Mật khẩu phải có tối thiểu 8 ký tự
                </small>
                <small v-else-if="newPassword && !newDifferent" class="text-danger d-block mt-1 small">
                  <i class="bi bi-x-circle me-1"></i>Mật khẩu mới phải khác mật khẩu hiện tại
                </small>
              </div>

              <div class="mb-4">
                <label class="nomall-form-label">
                  Xác nhận mật khẩu mới <span class="text-danger">*</span>
                </label>
                <div class="position-relative">
                  <input
                    v-model="confirmPassword"
                    :type="showConfirm ? 'text' : 'password'"
                    class="nomall-form-control pe-5"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    :disabled="submitting"
                  />
                  <button
                    type="button"
                    class="btn-toggle-eye"
                    @click="showConfirm = !showConfirm"
                  >
                    <i :class="showConfirm ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
                <small v-if="confirmPassword && !confirmValid" class="text-danger d-block mt-1 small">
                  <i class="bi bi-x-circle me-1"></i>Mật khẩu xác nhận không khớp
                </small>
              </div>

              <div class="pt-3 border-top">
                <button
                  type="submit"
                  class="nomall-btn-primary"
                  :disabled="submitting || !canSubmit"
                >
                  <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-shield-check me-1"></i>
                  {{ submitting ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { userAddressService } from '@/services/userAddress.service'
import { useNotifyStore } from '@/stores/notify'
import AccountSidebar from '@/components/buyer/AccountSidebar.vue'

const router = useRouter()
const notify = useNotifyStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const submitting = ref(false)
const formError = ref('')

const newValid = computed(() => newPassword.value.length >= 8)
const newDifferent = computed(() => newPassword.value !== currentPassword.value)
const confirmValid = computed(() => confirmPassword.value === newPassword.value)
const canSubmit = computed(() => {
  return (
    currentPassword.value &&
    newPassword.value &&
    confirmPassword.value &&
    newValid.value &&
    newDifferent.value &&
    confirmValid.value
  )
})

const onSubmit = async () => {
  if (!canSubmit.value) return
  submitting.value = true
  formError.value = ''
  try {
    await userAddressService.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    notify.push('Đổi mật khẩu thành công!', 'success')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    router.push({ name: 'account-profile' })
  } catch (err) {
    formError.value = err?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.nomall-password-page {
  background-color: var(--nomall-bg);
  min-height: calc(100vh - 120px);
}

.nomall-breadcrumb-bar {
  background: #ffffff;
  border-bottom: 1px solid var(--nomall-border);
  padding: 0.625rem 0;
}

.nomall-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--nomall-muted);
}

.nomall-breadcrumb a {
  color: var(--nomall-muted);
  font-weight: 600;
  text-decoration: none;
}

.nomall-breadcrumb a:hover {
  color: var(--nomall-red);
}

.nomall-breadcrumb i {
  font-size: 0.625rem;
}

.breadcrumb-active {
  color: var(--nomall-red);
  font-weight: 700;
}

.profile-card-header {
  padding-bottom: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1.5px solid var(--nomall-border);
}

.profile-header-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 10px;
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.profile-card-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--nomall-ink);
  margin: 0;
  letter-spacing: -0.01em;
}

.profile-card-subtitle {
  font-size: 0.8125rem;
  color: var(--nomall-muted);
  margin: 0.25rem 0 0;
}

.nomall-form-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--nomall-ink);
  margin-bottom: 0.35rem;
  display: block;
}

.nomall-form-control {
  border: 1.5px solid var(--nomall-border);
  border-radius: 8px;
  font-size: 0.875rem;
  padding: 0.55rem 0.875rem;
  color: var(--nomall-ink);
  background: #ffffff;
  transition: all 0.2s;
  width: 100%;
}

.nomall-form-control:focus {
  outline: none;
  border-color: var(--nomall-red);
  box-shadow: 0 0 0 3px rgba(232, 74, 74, 0.12);
}

.btn-toggle-eye {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--nomall-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle-eye:hover {
  color: var(--nomall-ink);
}
</style>
