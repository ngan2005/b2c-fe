<template>
  <!-- NO MALL Top Bar -->
  <div class="nomall-topbar">
    <div class="nomall-container">
      <div class="d-flex align-items-center justify-content-between gap-3 py-2">

        <!-- Logo -->
        <router-link :to="{ name: 'home' }" class="nomall-logo flex-shrink-0 text-decoration-none">
          NO <span>MALL</span>
        </router-link>

        <!-- Search bar -->
        <form @submit.prevent="onSearch" class="flex-grow-1 mx-2 mx-md-3 d-none d-md-block">
          <div class="input-group" style="max-width: 560px; margin: 0 auto;">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              aria-label="Tìm kiếm"
            />
            <button class="btn-search" type="submit">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </form>

        <!-- Right actions -->
        <div class="d-flex align-items-center gap-2 gap-lg-2 flex-shrink-0">

          <!-- Wishlist (chỉ khi đã đăng nhập) -->
          <router-link
            v-if="auth.isAuthenticated"
            :to="{ name: 'account-wishlist' }"
            class="topbar-link text-decoration-none"
            title="Yêu thích"
          >
            <i class="bi bi-heart"></i>
            <span class="d-none d-xl-inline" style="font-size: 0.6875rem;">Yêu thích</span>
          </router-link>

          <!-- Cart -->
          <router-link
            :to="{ name: 'cart' }"
            class="topbar-link text-decoration-none position-relative"
            title="Giỏ hàng"
          >
            <i class="bi bi-cart3"></i>
            <span class="d-none d-xl-inline" style="font-size: 0.6875rem;">Giỏ hàng</span>
            <span
              v-if="cartStore.totalItemsCount > 0"
              class="position-absolute d-flex align-items-center justify-content-center fw-bold"
              style="top: -4px; right: -4px; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: var(--nomall-yellow); color: var(--nomall-ink); font-size: 0.6rem; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"
            >
              {{ cartStore.totalItemsCount > 9 ? '9+' : cartStore.totalItemsCount }}
            </span>
          </router-link>

          <!-- ── Auth: Login / Register (khi CHƯA đăng nhập) ──────── -->
          <template v-if="!auth.isAuthenticated">
            <router-link
              :to="{ name: 'login' }"
              class="tb-btn tb-btn-outline"
              title="Đăng nhập"
            >
              <i class="bi bi-box-arrow-in-right"></i>
              <span class="d-none d-md-inline">Đăng nhập</span>
            </router-link>
            <router-link
              :to="{ name: 'register' }"
              class="tb-btn tb-btn-solid d-none d-md-inline-flex"
              title="Đăng ký"
            >
              <i class="bi bi-person-plus"></i>
              Đăng ký
            </router-link>
          </template>

          <!-- ── Auth: User dropdown (khi ĐÃ đăng nhập) ──────────── -->
          <div v-else class="tb-user-wrap">
            <button
              type="button"
              class="tb-user-btn"
              :class="{ open: userMenuOpen }"
              @click="toggleUserMenu"
              aria-haspopup="true"
              :aria-expanded="userMenuOpen"
            >
              <span class="tb-avatar">
                <i class="bi bi-person-fill"></i>
              </span>
              <span class="tb-user-text d-none d-xl-inline">
                <span class="tb-user-hi">Xin chào,</span>
                <span class="tb-user-name">{{ userShortName }}</span>
              </span>
              <i class="bi bi-chevron-down tb-caret" :class="{ rotate: userMenuOpen }"></i>
            </button>

            <transition name="tb-fade">
              <div v-if="userMenuOpen" class="tb-user-menu" @click.stop>
                <div class="tb-user-head">
                  <div class="tb-user-head-name">{{ userFullName }}</div>
                  <div class="tb-user-head-email">{{ userEmail }}</div>
                </div>
                <ul class="tb-user-list">
                  <li>
                    <router-link :to="{ name: 'account-profile' }" class="tb-user-item" @click="closeUserMenu">
                      <i class="bi bi-person"></i>
                      <span>Tài khoản của tôi</span>
                    </router-link>
                  </li>
                  <li>
                    <router-link :to="{ name: 'account-orders' }" class="tb-user-item" @click="closeUserMenu">
                      <i class="bi bi-bag-check"></i>
                      <span>Đơn hàng của tôi</span>
                    </router-link>
                  </li>
                  <li>
                    <router-link :to="{ name: 'account-wishlist' }" class="tb-user-item" @click="closeUserMenu">
                      <i class="bi bi-heart"></i>
                      <span>Sản phẩm yêu thích</span>
                    </router-link>
                  </li>
                  <li v-if="auth.role === 'SELLER'">
                    <router-link :to="{ name: 'seller-dashboard' }" class="tb-user-item" @click="closeUserMenu">
                      <i class="bi bi-shop"></i>
                      <span>Kênh người bán</span>
                    </router-link>
                  </li>
                  <li v-if="auth.role === 'ADMIN'">
                    <router-link :to="{ name: 'admin-dashboard' }" class="tb-user-item" @click="closeUserMenu">
                      <i class="bi bi-shield-lock"></i>
                      <span>Quản trị</span>
                    </router-link>
                  </li>
                  <li class="tb-user-divider"></li>
                  <li>
                    <button class="tb-user-item tb-user-logout" type="button" @click="handleLogout" :disabled="loggingOut">
                      <i class="bi bi-box-arrow-right"></i>
                      <span>{{ loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất' }}</span>
                    </button>
                  </li>
                </ul>
              </div>
            </transition>
          </div>

        </div>
      </div>

      <!-- Mobile search (visible only on small screens) -->
      <form @submit.prevent="onSearch" class="d-md-none pb-2">
        <div class="input-group" style="max-width: 100%;">
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Tìm kiếm sản phẩm..."
            aria-label="Tìm kiếm"
          />
          <button class="btn-search" type="submit">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useNotifyStore } from '@/stores/notify'

const router = useRouter()
const auth = useAuthStore()
const cartStore = useCartStore()
const notify = useNotifyStore()

const searchQuery = ref('')
const userMenuOpen = ref(false)
const loggingOut = ref(false)

const userFullName = computed(() => {
  const u = auth.user
  if (!u) return 'Khách'
  return u.fullName || u.name || u.username || u.email || 'Người dùng'
})

const userEmail = computed(() => auth.user?.email || '')

const userShortName = computed(() => {
  const name = userFullName.value
  if (!name || name === 'Khách') return 'bạn'
  const first = String(name).trim().split(/\s+/).pop()
  return first.length > 14 ? first.slice(0, 14) + '…' : first
})

const onSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    router.push({ name: 'products', query: { q } })
  } else {
    router.push({ name: 'products' })
  }
}

const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value }
const closeUserMenu = () => { userMenuOpen.value = false }

const onDocumentClick = (e) => {
  if (!userMenuOpen.value) return
  const wrap = e.target.closest('.tb-user-wrap')
  if (!wrap) userMenuOpen.value = false
}

const handleLogout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  closeUserMenu()
  try {
    auth.clear()
    notify.push('Đã đăng xuất thành công.', 'success')
    if (router.currentRoute.value?.name !== 'home') {
      router.push({ name: 'home' })
    }
  } catch (_) {
    notify.push('Có lỗi khi đăng xuất.', 'danger')
  } finally {
    loggingOut.value = false
  }
}

onMounted(() => { document.addEventListener('click', onDocumentClick) })
onBeforeUnmount(() => { document.removeEventListener('click', onDocumentClick) })
</script>

<style scoped>
/* ── Auth buttons (chưa đăng nhập) ─────────────────── */
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
  border: 1.5px solid transparent;
  line-height: 1;
}
.tb-btn-outline {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.55);
}
.tb-btn-outline:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #fff;
  color: #fff;
  transform: translateY(-1px);
}
.tb-btn-solid {
  background: var(--nomall-yellow);
  color: var(--nomall-ink);
  border-color: var(--nomall-yellow);
  box-shadow: 0 2px 6px rgba(255, 201, 71, 0.35);
}
.tb-btn-solid:hover {
  background: var(--nomall-yellow-dark);
  border-color: var(--nomall-yellow-dark);
  color: var(--nomall-ink);
  transform: translateY(-1px);
}
.tb-btn i { font-size: 0.875rem; }

/* ── User dropdown wrapper ─────────────────────────── */
.tb-user-wrap {
  position: relative;
}
.tb-user-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.625rem 0 0.25rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  color: #fff;
  cursor: pointer;
  transition: all 0.18s;
}
.tb-user-btn:hover,
.tb-user-btn.open {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.6);
}
.tb-avatar {
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 50%;
  background: var(--nomall-yellow);
  color: var(--nomall-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 800;
  flex-shrink: 0;
}
.tb-user-text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  text-align: left;
  max-width: 9rem;
  overflow: hidden;
}
.tb-user-hi {
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tb-user-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 9rem;
}
.tb-caret {
  font-size: 0.625rem;
  transition: transform 0.18s;
}
.tb-caret.rotate { transform: rotate(180deg); }

/* ── Dropdown menu ─────────────────────────────────── */
.tb-user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 16rem;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  z-index: 1050;
  overflow: hidden;
}
.tb-user-head {
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
  border-bottom: 1px solid #F3F4F6;
}
.tb-user-head-name {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--nomall-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tb-user-head-email {
  font-size: 0.75rem;
  color: #6B7280;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tb-user-list {
  list-style: none;
  margin: 0;
  padding: 0.375rem;
}
.tb-user-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nomall-ink);
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}
.tb-user-item i {
  width: 1.125rem;
  font-size: 0.9375rem;
  color: #6B7280;
  text-align: center;
  transition: color 0.15s;
}
.tb-user-item:hover {
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
}
.tb-user-item:hover i { color: var(--nomall-red); }

.tb-user-divider {
  height: 1px;
  background: #F3F4F6;
  margin: 0.375rem 0.25rem;
}
.tb-user-logout {
  color: #DC2626;
}
.tb-user-logout i { color: #DC2626; }
.tb-user-logout:hover {
  background: #FEF2F2;
  color: #B91C1C;
}
.tb-user-logout:hover i { color: #B91C1C; }
.tb-user-logout:disabled { opacity: 0.5; cursor: not-allowed; }

/* Fade transition */
.tb-fade-enter-active, .tb-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.tb-fade-enter-from { opacity: 0; transform: translateY(-4px); }
.tb-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* Responsive */
@media (max-width: 575px) {
  .tb-user-text { display: none; }
  .tb-user-btn { padding: 0 0.5rem; }
  .tb-user-menu { width: 14rem; }
}
</style>
