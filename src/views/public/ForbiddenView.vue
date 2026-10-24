<template>
  <div class="min-h-[85vh] d-flex align-items-center justify-content-center px-4 py-12">
    <div class="w-100 max-w-md bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
      <!-- Icon -->
      <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-100 d-flex align-items-center justify-content-center">
        <i class="bi bi-shield-exclamation text-4xl text-amber-500"></i>
      </div>

      <!-- Title & description -->
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl mb-2">Không có quyền truy cập</h1>
        <p class="text-sm text-slate-500 leading-relaxed">
          Trang bạn đang cố truy cập chỉ dành cho
          <span class="font-semibold text-slate-700">
            {{ requiredRoleLabel }}
          </span>.
        </p>
        <p class="text-xs text-slate-400 mt-1">
          Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
        </p>
      </div>

      <!-- Role-specific redirect -->
      <div class="d-flex flex-column gap-2">
        <router-link
          v-if="auth.isAdmin"
          :to="{ name: 'admin-dashboard' }"
          class="btn btn-primary rounded-xl font-semibold w-100"
        >
          <i class="bi bi-speedometer2 me-2"></i> Quay về Trang Quản Trị
        </router-link>
        <router-link
          v-else-if="auth.isSeller"
          :to="{ name: 'seller-dashboard' }"
          class="btn btn-primary rounded-xl font-semibold w-100"
        >
          <i class="bi bi-shop me-2"></i> Quay về Kênh Nhà Bán
        </router-link>
        <router-link
          v-else
          :to="{ name: 'home' }"
          class="btn btn-primary rounded-xl font-semibold w-100"
        >
          <i class="bi bi-house me-2"></i> Quay về Trang Chủ
        </router-link>

        <button
          class="btn btn-light border border-slate-200 rounded-xl text-sm font-medium"
          @click="logout"
        >
          <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const auth = useAuthStore()
const cartStore = useCartStore()

// Infer the required role from the guard that sent us here.
// The router doesn't pass which role was required, so we reverse-engineer
// from the user's current role for better UX messaging.
const requiredRoleLabel = computed(() => {
  // If the user is already logged in but got blocked, the page they tried
  // to access requires a *different* role than the one they have.
  // We don't know exactly which one, so we give a generic label.
  return 'vai trò phù hợp'
})

const logout = () => {
  auth.clear()
  cartStore.clearCart()
  router.push({ name: 'login' })
}
</script>
