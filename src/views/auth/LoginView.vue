<template>
  <div class="nomall-auth-wrapper min-vh-100 d-flex align-items-center justify-content-center py-5">
    <div class="w-100 px-3" style="max-width: 58rem;">
      <div class="nomall-auth-card">
        <div class="row g-0">

          <!-- Left: Illustration panel (hidden on mobile) -->
          <div class="col-lg-5 d-none d-lg-flex flex-column align-items-center justify-content-center p-5 position-relative nomall-auth-illustration">
            <!-- Decorative floating background elements -->
            <svg class="position-absolute" style="top: -15%; right: -20%; width: 75%; opacity: 0.15; pointer-events: none;" viewBox="0 0 500 500">
              <path fill="#ffffff" d="M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,354Q39,301,29.5,227Q20,153,70,99Q120,45,193.5,25Q267,5,323.5,60Q380,115,425.5,192.5Q471,270,440.5,320.5Z"/>
            </svg>
            <svg class="position-absolute" style="bottom: -20%; left: -15%; width: 65%; opacity: 0.12; pointer-events: none;" viewBox="0 0 500 500">
              <circle cx="250" cy="250" r="200" fill="#ffffff"/>
            </svg>

            <!-- Inline SVG Illustration: NO MALL Shopping Bag -->
            <svg width="190" height="190" viewBox="0 0 200 200" style="position: relative; z-index: 1;" class="anim-float">
              <!-- Bag shadow -->
              <ellipse cx="100" cy="175" rx="55" ry="12" fill="rgba(0,0,0,0.15)" />
              <!-- Bag body -->
              <rect x="50" y="70" width="100" height="90" rx="18" fill="#ffffff" />
              <!-- Bag handle -->
              <path d="M72 70 Q72 36 100 36 Q128 36 128 70" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round"/>
              <!-- Top accent banner (Yellow brand accent) -->
              <rect x="50" y="70" width="100" height="22" rx="16" fill="#FFC947" opacity="0.9" />
              <!-- Heart on bag (Red brand color) -->
              <path d="M100 114 C93 105 80 105 80 117 C80 126 100 137 100 137 C100 137 120 126 120 117 C120 105 107 105 100 114Z" fill="#E84A4A" />
              <!-- Golden & white sparkles -->
              <circle cx="165" cy="35" r="6" fill="#FFC947" />
              <circle cx="36" cy="62" r="5" fill="#FFE08A" />
              <circle cx="165" cy="145" r="5" fill="#ffffff" opacity="0.9" />
              <polygon points="175,80 178,88 186,91 178,94 175,102 172,94 164,91 172,88" fill="#FFC947" opacity="0.85" />
            </svg>

            <h3 class="position-relative text-center mt-4 fw-extrabold text-white" style="font-size: 1.55rem; line-height: 1.25; z-index: 1;">
              Mua sắm thông minh,<br/>tiết kiệm mỗi ngày
            </h3>
            <p class="position-relative text-center mt-2 text-white text-opacity-90" style="font-size: 0.9rem; z-index: 1;">
              Khám phá hàng ngàn ưu đãi độc quyền tại NO MALL
            </p>
          </div>

          <!-- Right: Form panel -->
          <div class="col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-center">

            <!-- Brand Logo -->
            <div class="text-center mb-4">
              <router-link :to="{ name: 'home' }" class="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
                <div class="nomall-logo-badge">
                  <i class="bi bi-bag-heart-fill"></i>
                </div>
              </router-link>
              <h1 class="nomall-auth-heading">Chào Mừng Quay Lại!</h1>
              <p class="nomall-auth-subheading">Đăng nhập tài khoản NO MALL của bạn</p>
            </div>

            <!-- Error Notification -->
            <div v-if="formError" class="mb-3 p-3 text-center nomall-auth-error">
              <i class="bi bi-exclamation-circle-fill me-1"></i> {{ formError }}
            </div>

            <form @submit.prevent="onSubmit" class="d-flex flex-column gap-3">
              <BaseInput
                v-model="email"
                label="Địa chỉ Email"
                type="email"
                placeholder="name@example.com"
                prepend-icon="bi bi-envelope"
                :error="email && !emailValid ? 'Email không hợp lệ' : ''"
                required
                :disabled="submitting"
                id="login_email_field"
                spellcheck="false"
              />

              <div>
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <label class="form-label mb-0 font-medium text-slate-700 text-sm">
                    Mật khẩu <span class="text-danger">*</span>
                  </label>
                  <router-link
                    :to="{ name: 'forgot-password' }"
                    class="nomall-auth-link"
                  >
                    Quên mật khẩu?
                  </router-link>
                </div>
                <BaseInput
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  prepend-icon="bi bi-lock"
                  required
                  :disabled="submitting"
                />
              </div>

              <button
                type="submit"
                class="btn-nomall-submit mt-1 d-flex align-items-center justify-content-center gap-2"
                :disabled="!canSubmit || submitting"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm"></span>
                <span v-else>Đăng Nhập</span>
              </button>
            </form>

            <!-- Divider -->
            <div class="d-flex align-items-center gap-3 my-4">
              <div class="flex-grow-1" style="height: 1px; background: #E5E7EB;"></div>
              <span class="text-xs text-slate-400 font-semibold text-uppercase tracking-wider">hoặc</span>
              <div class="flex-grow-1" style="height: 1px; background: #E5E7EB;"></div>
            </div>

            <!-- Google OAuth -->
            <button
              type="button"
              class="btn-nomall-google d-flex align-items-center justify-content-center gap-2 w-100"
              :disabled="submitting"
              @click="loginWithGoogle"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.84h5.52c-.24 1.44-1.74 4.2-5.52 4.2-3.3 0-6-2.76-6-6.18s2.7-6.18 6-6.18c1.92 0 3.18.78 3.9 1.44l2.64-2.58C16.92 3.36 14.7 2.4 12 2.4 6.84 2.4 2.64 6.6 2.64 11.76S6.84 21.12 12 21.12c6.9 0 9.36-4.86 9.36-9.18 0-.6-.06-1.08-.12-1.56H12z"/>
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            <!-- Register link -->
            <div class="text-center mt-4 pt-3 border-top border-slate-100">
              <p class="text-sm text-slate-500 m-0">
                Chưa có tài khoản?
                <router-link :to="{ name: 'register' }" class="nomall-auth-link-bold">
                  Đăng ký ngay
                </router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import BaseInput from '@/components/common/BaseInput.vue'
import { useGoogleLogin } from '@/composables/useGoogleLogin'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notify = useNotifyStore()
const { loginWithGoogle } = useGoogleLogin()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const formError = ref('')

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const passwordValid = computed(() => password.value.length > 0)
const canSubmit = computed(() => emailValid.value && passwordValid.value && !submitting.value)

function redirectAfterLogin() {
  const redirect = route.query.redirect
  if (redirect && typeof redirect === 'string') return router.push(redirect)
  if (auth.role === 'ADMIN') return router.push({ name: 'admin-dashboard' })
  if (auth.role === 'SELLER') return router.push({ name: 'seller-dashboard' })
  return router.push({ name: 'home' })
}

async function onSubmit() {
  formError.value = ''
  if (!emailValid.value) { formError.value = 'Địa chỉ email không đúng định dạng.'; return }
  if (!passwordValid.value) { formError.value = 'Vui lòng nhập mật khẩu.'; return }
  submitting.value = true
  try {
    const res = await authService.login({ email: email.value.trim(), password: password.value })
    if (!res?.accessToken) throw new Error('Cấu trúc phản hồi không hợp lệ')
    const user = { id: res.userId, email: res.email, fullName: res.fullName, role: res.role, roles: res.roles || (res.role ? [res.role] : []) }
    auth.setSession(res.accessToken, user, res.refreshToken)
    notify.push(`Xin chào quay lại, ${user.fullName || user.email}!`, 'success')
    redirectAfterLogin()
  } catch (err) {
    formError.value = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Đăng nhập thất bại.'
  } finally { submitting.value = false }
}

onMounted(() => { if (auth.isAuthenticated) redirectAfterLogin() })
</script>

<style scoped>
.nomall-auth-wrapper {
  background: #f8fafc;
}

.nomall-auth-card {
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 36px -10px rgba(232, 74, 74, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.nomall-auth-illustration {
  background: linear-gradient(145deg, #ff5757 0%, #e84a4a 55%, #c73838 100%);
  border-radius: 24px 0 0 24px;
}

.anim-float {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

.nomall-logo-badge {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #e84a4a 0%, #c73838 100%);
  color: #ffffff;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(232, 74, 74, 0.35);
  transition: transform 0.2s ease;
}

.nomall-logo-badge:hover {
  transform: scale(1.05);
}

.nomall-auth-heading {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.nomall-auth-subheading {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0;
}

.nomall-auth-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
}

.nomall-auth-link {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #e84a4a;
  text-decoration: none;
  transition: color 0.15s ease;
}

.nomall-auth-link:hover {
  color: #c73838;
  text-decoration: underline;
}

.nomall-auth-link-bold {
  font-weight: 800;
  color: #e84a4a;
  text-decoration: none;
  margin-left: 0.25rem;
  transition: color 0.15s ease;
}

.nomall-auth-link-bold:hover {
  color: #c73838;
  text-decoration: underline;
}

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

.btn-nomall-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-nomall-submit:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-nomall-google {
  background: #ffffff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-nomall-google:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

:deep(.form-control:focus) {
  border-color: #e84a4a !important;
  box-shadow: 0 0 0 3px rgba(232, 74, 74, 0.15) !important;
}
</style>
