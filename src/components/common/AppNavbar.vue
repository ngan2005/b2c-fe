<template>
  <header class="app-header">
    <!-- Top bar -->
    <div class="header-main">
      <div class="container px-4">
        <div class="header-inner">

          <!-- Brand Logo -->
          <router-link :to="logoTarget" class="brand-logo">
            <img src="/logo.png" alt="NOMALL" class="logo-img" />
          </router-link>

          <!-- Search Bar (desktop) -->
          <div class="search-wrap d-none d-md-flex">
            <form @submit.prevent="onSearch" class="search-form">
              <div class="search-input-group">
                <button
                  v-if="!auth.isAdmin"
                  class="search-cat-btn"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  {{ selectedCategoryName }}
                  <i class="bi bi-chevron-down" style="font-size: 10px;"></i>
                </button>
                <ul v-if="!auth.isAdmin" class="dropdown-menu">
                  <li><a class="dropdown-item" href="#" @click.prevent="selectCategory(null, 'Tất cả')">Tất cả danh mục</a></li>
                  <li v-for="cat in categories" :key="cat.id">
                    <a class="dropdown-item" href="#" @click.prevent="selectCategory(cat.id, cat.name)">{{ cat.name }}</a>
                  </li>
                </ul>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="search-input"
                  :placeholder="auth.isAdmin ? 'Tìm người dùng, sản phẩm...' : 'Tìm kiếm sản phẩm, thương hiệu...'"
                />
                <button class="search-btn" type="submit">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </form>
          </div>

          <!-- Right Actions -->
          <div class="header-actions">

            <!-- Kênh Người Bán (Shopee style switcher) -->
            <router-link
              v-if="auth.isSeller"
              :to="{ name: 'seller-dashboard' }"
              class="action-item"
              title="Vào Kênh Nhà Bán Hàng"
            >
              <i class="bi bi-shop action-icon text-primary"></i>
              <span class="action-label text-primary fw-bold">Kênh Nhà Bán</span>
            </router-link>
            <router-link
              v-else-if="auth.isBuyer"
              :to="{ name: 'apply-seller' }"
              class="action-item"
              title="Đăng ký mở gian hàng bán hàng"
            >
              <i class="bi bi-shop-window action-icon"></i>
              <span class="action-label">Kênh Người Bán</span>
            </router-link>

            <!-- Đơn hàng -->
            <router-link v-if="auth.isBuyer" :to="{ name: 'account-orders' }" class="action-item">
              <i class="bi bi-box-seam action-icon"></i>
              <span class="action-label">Đơn hàng</span>
            </router-link>

            <!-- Yêu thích -->
            <router-link v-if="auth.isBuyer" :to="{ name: 'account-wishlist' }" class="action-item">
              <i class="bi bi-heart action-icon"></i>
              <span class="action-label">Yêu thích</span>
            </router-link>

            <!-- Giỏ hàng -->
            <router-link v-if="auth.isBuyer" :to="{ name: 'cart' }" class="action-item position-relative">
              <i class="bi bi-cart3 action-icon"></i>
              <span class="action-label">Giỏ hàng</span>
              <span v-if="cartStore.totalItemsCount > 0" class="cart-badge">
                {{ cartStore.totalItemsCount > 9 ? '9+' : cartStore.totalItemsCount }}
              </span>
            </router-link>

            <!-- Admin Notifications -->
            <div v-if="auth.isAdmin" class="position-relative">
              <button class="action-item btn-plain" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i class="bi bi-bell action-icon"></i>
                <span class="action-label">Thông báo</span>
                <span v-if="notifStore.unreadCount > 0" class="cart-badge">
                  {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
                </span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end notif-dropdown">
                <li class="notif-header">
                  <span>Thông báo</span>
                  <button v-if="notifStore.unreadCount > 0" class="mark-read-btn" @click.stop="notifStore.markAllRead()">
                    Đánh dấu tất cả đã đọc
                  </button>
                </li>
                <li v-if="notifStore.notifications.length === 0" class="notif-empty">
                  <i class="bi bi-bell-slash"></i>
                  <span>Chưa có thông báo</span>
                </li>
                <li v-for="n in notifStore.notifications.slice(0, 10)" :key="n.id" class="notif-item">
                  <router-link v-if="n.link" :to="n.link" class="dropdown-item notif-link">
                    <span class="notif-title">{{ n.title }}</span>
                    <span class="notif-body">{{ n.body }}</span>
                    <span class="notif-time">{{ relativeTime(n.occurredAt) }}</span>
                  </router-link>
                  <div v-else class="notif-link">
                    <span class="notif-title">{{ n.title }}</span>
                    <span class="notif-body">{{ n.body }}</span>
                    <span class="notif-time">{{ relativeTime(n.occurredAt) }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- User Account (logged in) -->
            <div v-if="auth.isAuthenticated" class="dropdown">
              <button class="action-item btn-plain" type="button" data-bs-toggle="dropdown">
                <div class="user-avatar">{{ userInitials }}</div>
                <span class="action-label">Tài khoản</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end user-menu">
                <li class="user-info">
                  <p class="user-name">{{ auth.user?.fullName }}</p>
                  <p class="user-email">{{ auth.user?.email }}</p>
                </li>
                <li v-if="auth.isBuyer">
                  <router-link :to="{ name: 'account-profile' }" class="dropdown-item">
                    <i class="bi bi-person me-2"></i> Thông tin tài khoản
                  </router-link>
                </li>
                <li v-if="auth.isBuyer">
                  <router-link :to="{ name: 'account-orders' }" class="dropdown-item">
                    <i class="bi bi-box-seam me-2"></i> Đơn hàng của tôi
                  </router-link>
                </li>
                <li v-if="auth.isBuyer">
                  <router-link :to="{ name: 'account-vouchers' }" class="dropdown-item">
                    <i class="bi bi-ticket-perforated me-2"></i> Mã giảm giá
                  </router-link>
                </li>
                <li v-if="auth.isSeller" class="menu-divider">
                  <router-link :to="{ name: 'seller-dashboard' }" class="dropdown-item text-primary fw-semibold">
                    <i class="bi bi-shop me-2"></i> Kênh Nhà Bán
                  </router-link>
                </li>
                <li v-else-if="auth.isBuyer" class="menu-divider">
                  <router-link :to="{ name: 'apply-seller' }" class="dropdown-item text-success fw-semibold">
                    <i class="bi bi-shop-window me-2"></i> Đăng Ký Bán Hàng / Mở Shop
                  </router-link>
                </li>
                <li v-if="auth.isAdmin" class="menu-divider">
                  <router-link :to="{ name: 'admin-dashboard' }" class="dropdown-item text-primary fw-semibold">
                    <i class="bi bi-gear me-2"></i> Quản Trị Hệ Thống
                  </router-link>
                </li>
                <li class="menu-divider">
                  <button class="dropdown-item logout-btn" @click="logout">
                    <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
                  </button>
                </li>
              </ul>
            </div>

            <!-- Guest buttons -->
            <template v-else>
              <router-link :to="{ name: 'login' }" class="btn-auth btn-auth-outline">Đăng nhập</router-link>
              <router-link :to="{ name: 'register' }" class="btn-auth btn-auth-fill">Đăng ký</router-link>
            </template>

          </div>
        </div>

        <!-- Mobile search -->
        <div class="mt-2 d-md-none">
          <form @submit.prevent="onSearch">
            <div class="search-input-group">
              <input v-model="searchQuery" type="text" class="search-input"
                :placeholder="auth.isAdmin ? 'Tìm kiếm...' : 'Tìm sản phẩm, thương hiệu...'" />
              <button class="search-btn" type="submit">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Category nav strip (buyer only) -->
    <div v-if="!auth.isAdmin" class="header-categories">
      <div class="container px-4">
        <div class="cat-nav">
          <router-link :to="{ name: 'products' }" class="cat-link cat-link-all">
            <i class="bi bi-grid-3x3-gap-fill me-1"></i> Tất cả
          </router-link>
          <router-link
            v-for="cat in categories.slice(0, 7)"
            :key="cat.id"
            :to="{ name: 'products', query: { categoryId: cat.id } }"
            class="cat-link"
          >
            {{ cat.name }}
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useAdminNotificationsStore } from '@/stores/adminNotifications'
import { catalogService } from '@/services/catalog.service'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const cartStore = useCartStore()
const notifStore = useAdminNotificationsStore()
const router = useRouter()

const searchQuery = ref('')
const selectedCategoryId = ref(null)
const selectedCategoryName = ref('Tất cả')
const categories = ref([])

const userInitials = computed(() => {
  const name = auth.user?.fullName || auth.user?.email || 'U'
  return name.charAt(0).toUpperCase()
})

const logoTarget = computed(() => {
  if (auth.role === 'ADMIN') return { name: 'admin-dashboard' }
  if (auth.role === 'SELLER') return { name: 'seller-dashboard' }
  return { name: 'home' }
})

const selectCategory = (id, name) => {
  selectedCategoryId.value = id
  selectedCategoryName.value = name
}

onMounted(async () => {
  if (auth.isBuyer) cartStore.fetchCart()
  if (!auth.isAdmin) {
    try {
      const data = await catalogService.getRootCategories()
      categories.value = Array.isArray(data) ? data.slice(0, 8) : []
    } catch (_) {}
  }
})

const onSearch = () => {
  const q = searchQuery.value.trim()
  if (auth.isAdmin) {
    if (!q) return
    const target = selectedCategoryId.value ? 'admin-products' : 'admin-users'
    router.push({ name: target, query: { q } })
    return
  }
  if (!q && !selectedCategoryId.value) return
  const queryObj = {}
  if (q) queryObj.q = q
  if (selectedCategoryId.value) queryObj.categoryId = selectedCategoryId.value
  router.push({ name: 'products', query: queryObj })
}

const logout = () => {
  auth.clear()
  cartStore.clearCart()
  router.push({ name: 'login' })
}

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function relativeTime(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  if (diff < MINUTE) return 'Vừa xong'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`
  if (diff < 2 * DAY) return 'Hôm qua'
  return new Date(isoStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}
</script>

<style scoped>
/* ── Header wrapper ─────────────────────────────────────── */
.app-header {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* ── Main header row ────────────────────────────────────── */
.header-main {
  background: #1a56db;
  padding: 10px 0;
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ── Logo ───────────────────────────────────────────────── */
.brand-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  text-decoration: none;
}
.logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1); /* white logo on red bg */
}

/* ── Search ─────────────────────────────────────────────── */
.search-wrap {
  flex: 1;
  max-width: 680px;
}
.search-form { width: 100%; }
.search-input-group {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 2px;
  overflow: hidden;
  height: 40px;
}
.search-cat-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 100%;
  background: #f5f5f5;
  border: none;
  border-right: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.1s;
}
.search-cat-btn:hover { background: #ebebeb; }
.search-input {
  flex: 1;
  height: 100%;
  border: none !important;
  border-radius: 0 !important;
  font-size: 14px;
  padding: 0 12px;
  outline: none;
  box-shadow: none !important;
}
.search-btn {
  height: 100%;
  padding: 0 20px;
  background: #2563eb;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.1s;
  flex-shrink: 0;
}
.search-btn:hover { background: #1d4ed8; }

/* ── Right actions ──────────────────────────────────────── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 4px;
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  white-space: nowrap;
}
.action-item:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
  text-decoration: none;
}

.btn-plain {
  background: none;
  border: none;
}

.action-icon { font-size: 20px; line-height: 1; }
.action-label { font-size: 11px; font-weight: 500; opacity: 0.95; }

/* Cart badge */
.cart-badge {
  position: absolute;
  top: 2px;
  right: 6px;
  background: #fff;
  color: #1a56db;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

/* User avatar */
.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  border: 1.5px solid rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

/* Auth buttons (guest) */
.btn-auth {
  padding: 6px 14px;
  border-radius: 2px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-auth-outline {
  color: #fff;
  border: 1px solid rgba(255,255,255,0.8);
  background: transparent;
}
.btn-auth-outline:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.btn-auth-fill {
  color: #1a56db;
  background: #fff;
  border: 1px solid #fff;
}
.btn-auth-fill:hover {
  background: #f5f5f5;
  color: #1a56db;
}

/* ── Dropdown menus ─────────────────────────────────────── */
.user-menu {
  min-width: 220px;
  margin-top: 8px !important;
}
.user-info {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 4px;
}
.user-name {
  font-weight: 700;
  font-size: 14px;
  color: #212121;
  margin: 0 0 2px;
}
.user-email {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
.menu-divider {
  border-top: 1px solid #f3f4f6;
  margin-top: 4px;
  padding-top: 4px;
}
.logout-btn {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: #1a56db;
}
.logout-btn:hover { color: #1a56db; }

/* Notification dropdown */
.notif-dropdown {
  width: 340px;
  max-height: 460px;
  overflow-y: auto;
  padding: 0 !important;
}
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-weight: 700;
  font-size: 14px;
  color: #212121;
  position: sticky;
  top: 0;
  background: #fff;
}
.mark-read-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #1a56db;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #9ca3af;
  font-size: 13px;
}
.notif-empty i { font-size: 28px; }
.notif-item { border-bottom: 1px solid #f9fafb; }
.notif-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 16px;
  text-decoration: none;
}
.notif-title { font-weight: 600; font-size: 13px; color: #212121; }
.notif-body  { font-size: 12px; color: #6b7280; }
.notif-time  { font-size: 11px; color: #9ca3af; }

/* ── Category nav strip ─────────────────────────────────── */
.header-categories {
  background: #fff;
  border-top: 1px solid #f3f4f6;
}

.cat-nav {
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.cat-nav::-webkit-scrollbar { display: none; }

.cat-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  flex-shrink: 0;
}
.cat-link:hover,
.cat-link.router-link-active {
  color: #1a56db;
  border-bottom-color: #1a56db;
  text-decoration: none;
}
.cat-link-all {
  color: #1a56db;
  font-weight: 600;
}
</style>

