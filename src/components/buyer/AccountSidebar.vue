<template>
  <div class="nomall-account-sidebar nomall-card p-3">
    <!-- User summary card -->
    <div class="sidebar-user-header d-flex align-items-center gap-3 pb-3 mb-3">
      <div class="sidebar-avatar-wrap">
        <img
          v-if="userAvatar"
          :src="userAvatar"
          :alt="userName"
          class="sidebar-avatar-img"
        />
        <div v-else class="sidebar-avatar-placeholder">
          {{ userInitial }}
        </div>
        <button
          type="button"
          class="avatar-camera-btn"
          title="Đổi ảnh đại diện"
          @click="$emit('trigger-upload')"
        >
          <i class="bi bi-camera-fill"></i>
        </button>
      </div>
      <div class="min-w-0 flex-grow-1">
        <h4 class="sidebar-user-name text-truncate mb-0" :title="userName">
          {{ userName }}
        </h4>
        <span class="sidebar-role-badge">
          <i class="bi bi-patch-check-fill me-1"></i>Thành viên NO MALL
        </span>
      </div>
    </div>

    <!-- Navigation groups -->
    <nav class="sidebar-nav d-flex flex-column gap-1">
      <!-- Group: Tài khoản của tôi -->
      <div class="nav-group-label">
        <i class="bi bi-person me-1.5"></i>Tài khoản của tôi
      </div>

      <router-link
        :to="{ name: 'account-profile' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'account-profile' }"
      >
        <i class="bi bi-person-gear"></i>
        <span>Hồ sơ cá nhân</span>
      </router-link>

      <router-link
        :to="{ name: 'account-addresses' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'account-addresses' }"
      >
        <i class="bi bi-geo-alt"></i>
        <span>Địa chỉ nhận hàng</span>
      </router-link>

      <router-link
        :to="{ name: 'account-change-password' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'account-change-password' }"
      >
        <i class="bi bi-shield-lock"></i>
        <span>Đổi mật khẩu</span>
      </router-link>

      <!-- Group: Đơn mua -->
      <div class="nav-group-label mt-2">
        <i class="bi bi-bag-check me-1.5"></i>Đơn hàng
      </div>

      <router-link
        :to="{ name: 'account-orders' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'account-orders' || currentRouteName === 'account-order-detail' }"
      >
        <i class="bi bi-box-seam"></i>
        <span>Đơn hàng của tôi</span>
      </router-link>

      <!-- Group: Ưu đãi & Yêu thích -->
      <div class="nav-group-label mt-2">
        <i class="bi bi-stars me-1.5"></i>Quan tâm
      </div>

      <router-link
        :to="{ name: 'account-wishlist' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'account-wishlist' }"
      >
        <i class="bi bi-heart"></i>
        <span>Sản phẩm yêu thích</span>
      </router-link>

      <router-link
        :to="{ name: 'account-vouchers' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'account-vouchers' }"
      >
        <i class="bi bi-ticket-perforated"></i>
        <span>Kho voucher</span>
      </router-link>

      <!-- Group: Kênh người bán -->
      <div class="nav-group-label mt-2">
        <i class="bi bi-shop me-1.5"></i>Kênh người bán
      </div>

      <router-link
        :to="{ name: 'apply-seller' }"
        class="sidebar-nav-item"
        :class="{ active: currentRouteName === 'apply-seller' }"
      >
        <i class="bi bi-shop-window"></i>
        <span>Đăng ký bán hàng</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  avatarUrl: { type: String, default: '' },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
})

defineEmits(['trigger-upload'])

const route = useRoute()
const authStore = useAuthStore()

const currentRouteName = computed(() => route.name)

const userName = computed(() => {
  return props.fullName || authStore.user?.fullName || authStore.user?.email || 'Người dùng'
})

const userEmail = computed(() => {
  return props.email || authStore.user?.email || ''
})

const userAvatar = computed(() => {
  return props.avatarUrl || authStore.user?.avatarUrl || ''
})

const userInitial = computed(() => {
  const name = userName.value
  return (name ? name.charAt(0) : 'U').toUpperCase()
})
</script>

<style scoped>
.nomall-account-sidebar {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid var(--nomall-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sidebar-user-header {
  border-bottom: 1.5px solid var(--nomall-border);
}

.sidebar-avatar-wrap {
  position: relative;
  width: 3.25rem;
  height: 3.25rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--nomall-yellow);
  box-shadow: 0 2px 8px rgba(232, 74, 74, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.sidebar-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.sidebar-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--nomall-red) 0%, #ff7b72 100%);
  color: #fff;
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-camera-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 50%;
  background: var(--nomall-ink);
  color: #fff;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-camera-btn:hover {
  background: var(--nomall-red);
  transform: scale(1.1);
}

.sidebar-user-name {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--nomall-ink);
}

.sidebar-role-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #166534;
  background: #dcfce7;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  margin-top: 0.25rem;
}

.nav-group-label {
  font-size: 0.6875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--nomall-muted);
  padding: 0.375rem 0.5rem 0.25rem;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nomall-ink);
  text-decoration: none;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.sidebar-nav-item i {
  font-size: 1rem;
  color: var(--nomall-muted);
  transition: color 0.15s ease;
  width: 1.25rem;
  text-align: center;
}

.sidebar-nav-item:hover {
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  text-decoration: none;
}

.sidebar-nav-item:hover i {
  color: var(--nomall-red);
}

.sidebar-nav-item.active {
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  font-weight: 700;
  border-left-color: var(--nomall-red);
}

.sidebar-nav-item.active i {
  color: var(--nomall-red);
}
</style>
