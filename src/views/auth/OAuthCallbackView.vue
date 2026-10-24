<template>
  <div class="min-h-[85vh] d-flex align-items-center justify-content-center px-4 py-12">
    <div class="w-100 max-w-md bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
      <div v-if="status === 'pending'" class="space-y-3">
        <div class="spinner-border text-blue-600" role="status" aria-hidden="true"></div>
        <p class="text-slate-600 font-medium">Đang hoàn tất đăng nhập với Google…</p>
      </div>
      <div v-else-if="status === 'error'" class="space-y-3">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-100 d-flex align-items-center justify-content-center text-rose-600 text-2xl">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h1 class="font-bold text-slate-900 text-xl">Đăng nhập thất bại</h1>
        <p class="text-sm text-slate-500">{{ errorMessage }}</p>
        <button
          type="button"
          class="btn btn-primary"
          @click="goToLogin"
        >
          Quay lại trang đăng nhập
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notify = useNotifyStore()

const status = ref('pending') // 'pending' | 'error'
const errorMessage = ref('')

/**
 * The OAuth2SuccessHandler redirects the browser to
 * <app.oauth2.redirect-uri>#access_token=...&refresh_token=...&user_id=...&email=...&full_name=...&role=...
 * We parse the URL fragment, persist the JWT pair, then route the user to the
 * intended destination (or the role-default dashboard).
 */
function parseFragment() {
  const hash = window.location.hash || ''
  // Strip the leading '#' then split on '&', then '='
  const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash)
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    userId: params.get('user_id'),
    email: params.get('email'),
    fullName: params.get('full_name'),
    role: params.get('role'),
  }
}

function goToLogin() {
  router.replace({ name: 'login' })
}

function redirectAfterLogin() {
  const redirect = route.query.redirect
  if (redirect && typeof redirect === 'string') {
    return router.replace(redirect)
  }
  if (auth.role === 'ADMIN') return router.replace({ name: 'admin-dashboard' })
  if (auth.role === 'SELLER') return router.replace({ name: 'seller-dashboard' })
  return router.replace({ name: 'home' })
}

onMounted(() => {
  const params = parseFragment()
  if (!params.accessToken) {
    status.value = 'error'
    errorMessage.value = 'Thiếu token trong phản hồi từ máy chủ xác thực.'
    return
  }

  const user = {
    id: params.userId ? Number(params.userId) : null,
    email: params.email ?? '',
    fullName: params.fullName ?? '',
    role: (params.role || '').toUpperCase(),
    roles: (params.roles || params.role || '').toUpperCase().split(',').filter(Boolean),
  }
  try {
    auth.setSession(params.accessToken, user, params.refreshToken)
  } catch (err) {
    status.value = 'error'
    errorMessage.value = 'Không thể lưu phiên đăng nhập: ' + (err?.message || err)
    return
  }

  notify.push(`Xin chào ${user.fullName || user.email}!`, 'success')
  // Wipe the fragment so the tokens don't linger in the address bar / history.
  history.replaceState(null, '', window.location.pathname + window.location.search)
  redirectAfterLogin()
})
</script>
