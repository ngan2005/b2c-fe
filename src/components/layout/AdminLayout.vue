<template>
  <div class="admin-app-shell">
    <!-- ── TOP NAVBAR ──────────────────────────────────────── -->
    <header class="admin-topbar">
      <div class="admin-topbar-inner">
        <!-- Left: Brand / Logo -->
        <div class="admin-brand-area">
          <router-link :to="{ name: 'admin-dashboard' }" class="admin-brand-link">
            <div class="admin-brand-icon">
              <i class="bi bi-shield-shaded"></i>
            </div>
            <div class="admin-brand-text">
              <span class="admin-brand-name">NO MALL</span>
              <span class="admin-brand-badge">ADMIN</span>
            </div>
          </router-link>
        </div>

        <!-- Center: Search -->
        <div class="admin-search-area d-none d-md-flex">
          <div class="admin-search-box">
            <i class="bi bi-search admin-search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              class="admin-search-input"
              placeholder="Tìm kiếm người dùng, sản phẩm, đơn hàng..."
              @keyup.enter="handleSearch"
            />
            <span class="admin-search-kbd">⌘K</span>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="admin-actions-area">
          <!-- View Buyer Portal -->
          <router-link :to="{ name: 'home' }" class="admin-action-btn" title="Xem trang Buyer">
            <i class="bi bi-bag-check"></i>
            <span class="d-none d-lg-inline">Trang Buyer</span>
          </router-link>

          <!-- View Seller Portal -->
          <router-link :to="{ name: 'seller-dashboard' }" class="admin-action-btn" title="Kênh người bán">
            <i class="bi bi-shop"></i>
            <span class="d-none d-lg-inline">Kênh Seller</span>
          </router-link>

          <!-- Notifications Dropdown -->
          <div class="position-relative">
            <button
              class="admin-icon-btn position-relative"
              type="button"
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-label="Thông báo"
            >
              <i class="bi bi-bell"></i>
              <span v-if="notifStore.unreadCount > 0" class="admin-notif-dot"></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end admin-notif-menu shadow-lg">
              <li class="admin-notif-header">
                <span class="fw-bold">Thông Báo Hệ Thống</span>
                <button
                  v-if="notifStore.unreadCount > 0"
                  class="btn btn-link btn-sm p-0 text-decoration-none"
                  @click.stop="notifStore.markAllRead()"
                >
                  Đọc tất cả
                </button>
              </li>
              <li v-if="notifStore.notifications.length === 0" class="admin-notif-empty">
                <i class="bi bi-bell-slash fs-4 text-muted d-block mb-1"></i>
                <span>Chưa có thông báo mới</span>
              </li>
              <li v-for="n in notifStore.notifications.slice(0, 6)" :key="n.id" class="admin-notif-item">
                <router-link v-if="n.link" :to="n.link" class="dropdown-item admin-notif-link">
                  <div class="admin-notif-title">{{ n.title }}</div>
                  <div class="admin-notif-body">{{ n.body }}</div>
                </router-link>
                <div v-else class="admin-notif-link p-2">
                  <div class="admin-notif-title">{{ n.title }}</div>
                  <div class="admin-notif-body">{{ n.body }}</div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Admin Profile Dropdown -->
          <div class="dropdown">
            <button class="admin-profile-btn" type="button" data-bs-toggle="dropdown">
              <div class="admin-avatar">
                <span>{{ userInitial }}</span>
              </div>
              <div class="admin-profile-info d-none d-sm-block text-start">
                <div class="admin-profile-name">{{ auth.user?.fullName || 'Quản Trị Viên' }}</div>
                <div class="admin-profile-role">Super Admin</div>
              </div>
              <i class="bi bi-chevron-down admin-chevron d-none d-sm-block"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end admin-user-dropdown shadow-lg">
              <li class="dropdown-header">
                <strong>{{ auth.user?.email || 'admin@nomall.vn' }}</strong>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <router-link :to="{ name: 'account-profile' }" class="dropdown-item">
                  <i class="bi bi-person me-2"></i> Hồ sơ tài khoản
                </router-link>
              </li>
              <li>
                <a href="#" class="dropdown-item text-danger" @click.prevent="logout">
                  <i class="bi bi-box-arrow-right me-2"></i> Đăng xuất
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- ── BODY: SIDEBAR + MAIN CONTENT ────────────────────── -->
    <div class="admin-body">
      <!-- Left Sidebar -->
      <aside class="admin-sidebar">
        <div class="admin-sidebar-scroll">
          <nav class="admin-nav">
            <!-- Group: Tổng quan -->
            <div class="admin-nav-group-title">TỔNG QUAN</div>
            <router-link
              :to="{ name: 'admin-dashboard' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-dashboard' }"
            >
              <i class="bi bi-speedometer2"></i>
              <span>Tổng Quan Dashboard</span>
            </router-link>

            <!-- Group: Quản lý thương mại -->
            <div class="admin-nav-group-title">VẬN HÀNH THƯƠNG MẠI</div>
            <router-link
              :to="{ name: 'admin-products' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-products' }"
            >
              <i class="bi bi-box-seam"></i>
              <span>Kiểm Duyệt Sản Phẩm</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-orders' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-orders' || route.name === 'admin-order-detail' }"
            >
              <i class="bi bi-receipt"></i>
              <span>Quản Lý Đơn Hàng</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-promotions' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-promotions' }"
            >
              <i class="bi bi-ticket-perforated"></i>
              <span>Khuyến Mãi & Voucher</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-commission-rules' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-commission-rules' }"
            >
              <i class="bi bi-percent"></i>
              <span>Phí Sàn & Hoa Hồng</span>
            </router-link>

            <!-- Group: Đối tác & Người dùng -->
            <div class="admin-nav-group-title">ĐỐI TÁC & NGƯỜI DÙNG</div>
            <router-link
              :to="{ name: 'admin-seller-applications' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-seller-applications' || route.name === 'admin-seller-application-detail' }"
            >
              <i class="bi bi-file-earmark-check"></i>
              <span>Duyệt Đơn Nhà Bán</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-sellers' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-sellers' }"
            >
              <i class="bi bi-shop"></i>
              <span>Quản Lý Nhà Bán</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-users' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-users' }"
            >
              <i class="bi bi-people"></i>
              <span>Quản Lý Người Dùng</span>
            </router-link>

            <!-- Group: Hệ thống & Tài chính -->
            <div class="admin-nav-group-title">HỆ THỐNG & TÀI CHÍNH</div>
            <router-link
              :to="{ name: 'admin-finance' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-finance' }"
            >
              <i class="bi bi-wallet2"></i>
              <span>Tài Chính Sàn (GMV)</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-disputes' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-disputes' }"
            >
              <i class="bi bi-shield-exclamation"></i>
              <span>Khiếu Nại Đơn Hàng</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-inventory' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-inventory' }"
            >
              <i class="bi bi-cpu"></i>
              <span>Tồn Kho & Load-Test</span>
            </router-link>

            <router-link
              :to="{ name: 'admin-categories' }"
              class="admin-nav-item"
              :class="{ active: route.name === 'admin-categories' }"
            >
              <i class="bi bi-diagram-3"></i>
              <span>Quản Lý Danh Mục</span>
            </router-link>
          </nav>
        </div>

        <!-- Sidebar Footer -->
        <div class="admin-sidebar-footer">
          <div class="d-flex align-items-center gap-2">
            <span class="system-status-pulse"></span>
            <span class="small text-slate-400">Hệ thống trực tuyến</span>
          </div>
          <span class="badge bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">API v1</span>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="admin-main">
        <router-view />
      </main>
    </div>

    <ToastHost />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminNotificationsStore } from '@/stores/adminNotifications'
import ToastHost from '@/components/common/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notifStore = useAdminNotificationsStore()
const searchQuery = ref('')

const userInitial = computed(() => {
  const name = auth.user?.fullName || auth.user?.email || 'A'
  return name.charAt(0).toUpperCase()
})

const handleSearch = () => {
  if (!searchQuery.value) return
  router.push({ name: 'admin-users', query: { q: searchQuery.value } })
}

const logout = () => {
  auth.clear()
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* ── Layout Shell ────────────────────────────────────────── */
.admin-app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #0b1329;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* ── Topbar ─────────────────────────────────────────────── */
.admin-topbar {
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  height: 64px;
  flex-shrink: 0;
  z-index: 1020;
}

.admin-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1.5rem;
  gap: 1.5rem;
}

/* Brand */
.admin-brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.admin-brand-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.admin-brand-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-brand-name {
  font-weight: 800;
  font-size: 1.125rem;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.admin-brand-badge {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.4);
  font-size: 0.625rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

/* Search Box */
.admin-search-area {
  flex: 1;
  max-width: 480px;
}

.admin-search-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.admin-search-icon {
  position: absolute;
  left: 14px;
  color: #64748b;
  font-size: 0.875rem;
  pointer-events: none;
}

.admin-search-input {
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 0.5rem 2.5rem 0.5rem 2.25rem;
  color: #f1f5f9;
  font-size: 0.8125rem;
  transition: all 0.2s ease;
}

.admin-search-input:focus {
  outline: none;
  background: #0f172a;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.admin-search-input::placeholder {
  color: #64748b;
}

.admin-search-kbd {
  position: absolute;
  right: 12px;
  background: #334155;
  color: #94a3b8;
  font-size: 0.6875rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-weight: 600;
  pointer-events: none;
}

/* Right Actions */
.admin-actions-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  color: #94a3b8;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.admin-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  border-color: #475569;
}

.admin-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #334155;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.admin-notif-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 6px #ef4444;
}

/* Profile button */
.admin-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.admin-profile-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.admin-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
}

.admin-profile-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.2;
}

.admin-profile-role {
  font-size: 0.6875rem;
  color: #64748b;
}

.admin-chevron {
  color: #64748b;
  font-size: 0.75rem;
}

/* Dropdowns */
.admin-notif-menu {
  width: 320px;
  padding: 0;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #f1f5f9;
  margin-top: 8px !important;
}

.admin-notif-header {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
  font-size: 0.8125rem;
}

.admin-notif-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.8125rem;
}

.admin-notif-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.admin-notif-link {
  padding: 0.75rem 1rem;
  color: #f1f5f9;
  text-decoration: none;
  display: block;
}

.admin-notif-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

.admin-notif-title {
  font-weight: 600;
  font-size: 0.8125rem;
  margin-bottom: 0.2rem;
}

.admin-notif-body {
  font-size: 0.75rem;
  color: #94a3b8;
}

.admin-user-dropdown {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 0.5rem;
  color: #f1f5f9;
  margin-top: 8px !important;
}

.admin-user-dropdown .dropdown-item {
  color: #cbd5e1;
  font-size: 0.8125rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.admin-user-dropdown .dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

/* ── Body Container ─────────────────────────────────────── */
.admin-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* ── Sidebar ────────────────────────────────────────────── */
.admin-sidebar {
  width: 260px;
  min-width: 260px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
}

.admin-sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.75rem;
}

.admin-sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.admin-sidebar-scroll::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}

.admin-nav-group-title {
  font-size: 0.6875rem;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.08em;
  padding: 0.75rem 0.75rem 0.35rem 0.75rem;
}

.admin-nav-group-title:first-child {
  padding-top: 0.25rem;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.admin-nav-item i {
  font-size: 1rem;
  color: #64748b;
  transition: color 0.2s ease;
}

.admin-nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #f1f5f9;
}

.admin-nav-item:hover i {
  color: #818cf8;
}

.admin-nav-item.active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.16) 0%, rgba(99, 102, 241, 0.04) 100%);
  color: #ffffff;
  font-weight: 700;
  border-left: 3px solid #6366f1;
}

.admin-nav-item.active i {
  color: #818cf8;
}

.admin-sidebar-footer {
  padding: 0.875rem 1rem;
  border-top: 1px solid #1e293b;
  background: #090e1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.system-status-pulse {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
  display: inline-block;
}

/* ── Main Workspace ─────────────────────────────────────── */
.admin-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  background-color: #f8fafc;
  padding: 2rem;
}
</style>
