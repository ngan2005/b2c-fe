<template>
  <div class="seller-shell min-h-screen bg-slate-50 d-flex flex-column font-sans">
    <!-- ── Dedicated Seller Portal Topbar ────────────────── -->
    <header class="seller-topbar sticky-top z-40 px-4 py-2.5">
      <div class="d-flex align-items-center justify-content-between gap-3">
        <!-- Left: Brand & Shop Identity -->
        <div class="d-flex align-items-center gap-3">
          <router-link :to="{ name: 'seller-dashboard' }" class="d-flex align-items-center gap-2.5 text-decoration-none">
            <div class="seller-logo-icon">
              <i class="bi bi-shop-window"></i>
            </div>
            <div class="d-flex flex-column">
              <span class="seller-brand-title">NO MALL</span>
              <span class="seller-brand-badge">SELLER CENTER</span>
            </div>
          </router-link>

          <span class="seller-topbar-divider d-none d-sm-block"></span>

          <!-- Store Badge & Live Status -->
          <div class="seller-store-pill d-none d-sm-flex align-items-center gap-2">
            <div class="seller-store-icon">
              <i class="bi bi-shield-check"></i>
            </div>
            <div class="d-flex flex-column leading-none">
              <span class="seller-store-name">{{ auth.user?.fullName || 'Gian Hàng của bạn' }}</span>
              <span class="seller-live-indicator">
                <span class="seller-live-dot"></span> Đang trực tuyến
              </span>
            </div>
            <span class="seller-partner-badge">Official Mall</span>
          </div>
        </div>

        <!-- Center Search Bar -->
        <div class="flex-grow-1 max-w-md mx-3 d-none d-md-block">
          <div class="seller-search-box">
            <i class="bi bi-search text-slate-400"></i>
            <input
              type="text"
              class="seller-search-input"
              placeholder="Tìm kiếm đơn hàng, mã SKU, khách hàng... (⌘K)"
            />
            <span class="seller-search-kbd">⌘K</span>
          </div>
        </div>

        <!-- Right Quick Tools & Account Profile -->
        <div class="d-flex align-items-center gap-2.5">
          <!-- Switch to Buyer Portal -->
          <router-link
            :to="{ name: 'home' }"
            class="seller-btn-ghost d-flex align-items-center gap-1.5 text-decoration-none"
            title="Đến trang mua sắm dành cho khách hàng"
          >
            <i class="bi bi-bag-check text-indigo-500"></i>
            <span class="d-none d-lg-inline">Xem trang Buyer</span>
          </router-link>

          <!-- Notifications bell dropdown -->
          <div v-if="auth.isSeller" class="position-relative">
            <button
              ref="bellRef"
              class="seller-icon-btn position-relative"
              type="button"
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-label="Thông báo"
              @show.bs.dropdown="onBellOpen"
            >
              <i class="bi bi-bell"></i>
              <span
                v-if="notifStore.unreadCount > 0"
                class="seller-bell-badge"
              >
                {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
              </span>
            </button>
            <ul
              class="dropdown-menu dropdown-menu-end seller-dropdown-menu p-0 text-xs shadow-2xl"
              style="width: 360px; max-height: 480px; overflow-y: auto;"
            >
              <li class="px-3.5 py-3 border-bottom border-slate-100 d-flex align-items-center justify-content-between bg-slate-50/70">
                <div class="d-flex align-items-center gap-2">
                  <span class="font-bold text-slate-800 text-sm">Thông Báo Gian Hàng</span>
                  <span v-if="notifStore.unreadCount > 0" class="badge bg-indigo-100 text-indigo-700 rounded-pill">
                    {{ notifStore.unreadCount }} mới
                  </span>
                </div>
                <button
                  v-if="notifStore.unreadCount > 0"
                  class="btn btn-link text-indigo-600 p-0 text-xs text-decoration-none font-semibold"
                  @click.stop="handleMarkAllRead"
                >
                  Đánh dấu đã đọc
                </button>
              </li>

              <li v-if="notifStore.notifications.length === 0" class="px-4 py-6 text-center text-slate-400">
                <i class="bi bi-bell-slash text-2xl d-block mb-2 text-slate-300"></i>
                Chưa có thông báo nào mới
              </li>

              <li
                v-for="n in notifStore.notifications.slice(0, 10)"
                :key="n.notificationId || n.occurredAt"
                class="border-bottom border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer"
                @click="router.push({ name: 'seller-fees' })"
              >
                <div class="py-2.5 px-3.5 d-flex flex-column gap-1">
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="font-semibold text-slate-800">{{ n.ruleName || 'Thông báo từ sàn' }}</span>
                    <span class="badge bg-indigo-50 text-indigo-700 text-[10px]">Xem biểu phí</span>
                  </div>
                  <span class="text-slate-500 text-[11px] leading-tight">
                    {{ n.action === 'CREATED' ? '📜 Quy định phí mới được áp dụng' : n.action === 'UPDATED' ? '✏️ Quy định phí được cập nhật' : '🚫 Quy định phí bị vô hiệu hóa' }}
                  </span>
                  <span class="text-slate-400 text-[10px]">{{ relativeTime(n.occurredAt) }}</span>
                </div>
              </li>
            </ul>
          </div>

          <!-- Chat Shortcut -->
          <router-link
            :to="{ name: 'seller-chat' }"
            class="seller-icon-btn position-relative text-decoration-none"
            title="Hội thoại tin nhắn với khách hàng"
          >
            <i class="bi bi-chat-dots"></i>
            <span class="seller-pulse-dot-green"></span>
          </router-link>

          <!-- User Profile Dropdown -->
          <div class="dropdown">
            <button
              class="seller-profile-btn"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="seller-avatar-ring">
                {{ userInitials }}
              </div>
              <div class="text-start d-none d-lg-block leading-tight">
                <span class="seller-profile-name">{{ auth.user?.fullName }}</span>
                <span class="seller-profile-role">Seller Partner</span>
              </div>
              <i class="bi bi-chevron-down text-[10px] text-slate-400 ms-1"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end seller-dropdown-menu p-2 text-xs mt-2 shadow-2xl">
              <li class="px-3 py-2.5 border-b border-slate-100 mb-1 bg-slate-50/50 rounded-lg">
                <p class="font-bold text-slate-800 mb-0.5">{{ auth.user?.fullName }}</p>
                <p class="text-slate-400 text-[11px] mb-0">{{ auth.user?.email }}</p>
              </li>
              <li>
                <router-link :to="{ name: 'seller-profile' }" class="dropdown-item seller-menu-item">
                  <i class="bi bi-shop text-indigo-500"></i> Hồ sơ gian hàng
                </router-link>
              </li>
              <li>
                <router-link :to="{ name: 'account-profile' }" class="dropdown-item seller-menu-item">
                  <i class="bi bi-person text-slate-500"></i> Tài khoản cá nhân
                </router-link>
              </li>
              <li class="border-t border-slate-100 mt-1 pt-1">
                <button class="dropdown-item seller-menu-item text-rose-600 hover:bg-rose-50" @click="logout">
                  <i class="bi bi-box-arrow-right"></i> Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Main Workspace Layout ────────────────────────── -->
    <div class="d-flex flex-grow-1">
      <!-- Modern Categorized Sidebar Navigation -->
      <aside class="seller-sidebar d-flex flex-column">
        <div class="seller-sidebar-scroll flex-grow-1 p-3">
          <!-- Loop through grouped clusters -->
          <div v-for="(group, gIdx) in navGroups" :key="gIdx" class="seller-nav-group mb-4">
            <div class="seller-nav-group-title">
              {{ group.title }}
            </div>
            <ul class="nav flex-column gap-1">
              <li v-for="item in group.items" :key="item.name" class="nav-item">
                <router-link
                  v-if="!item.requiresBuyerRole || (auth.user?.roles || []).includes('BUYER')"
                  :to="{ name: item.name }"
                  :class="[
                    'seller-nav-link d-flex align-items-center gap-3',
                    isNavActive(item.name) ? 'active' : ''
                  ]"
                >
                  <div class="seller-nav-icon-wrap" :class="{ 'active': isNavActive(item.name) }">
                    <i :class="['bi', item.icon]"></i>
                  </div>
                  <span class="seller-nav-label flex-grow-1">{{ item.label }}</span>
                  <span v-if="item.badge" class="seller-nav-badge">{{ item.badge }}</span>
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Main Content View Area -->
      <main class="seller-main-content flex-grow-1 p-4 md:p-6" style="min-width: 0;">
        <router-view />
      </main>
    </div>
    <ToastHost />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useSellerNotificationsStore } from '@/stores/sellerNotifications'
import { useRealtime } from '@/composables/useRealtime'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import { sellerNotificationService } from '@/services/sellerNotification.service'
import { relativeTime } from '@/utils/relativeTime'
import ToastHost from '@/components/common/ToastHost.vue'

const dialog = useDialogs()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cartStore = useCartStore()
const notifyStore = useNotifyStore()

const userInitials = computed(() => {
  const name = auth.user?.fullName || auth.user?.email || 'S'
  return name.charAt(0).toUpperCase()
})

function isNavActive(itemName) {
  return route.name === itemName || route.meta?.activeNav === itemName
}

// ── 4 Categorized Functional Groups for Merchant Center ─────
const navGroups = [
  {
    title: 'TỔNG QUAN & TÀI CHÍNH',
    items: [
      { name: 'seller-dashboard', label: 'Tổng quan Dashboard', icon: 'bi-grid-1x2-fill' },
      { name: 'seller-stats',    label: 'Thống Kê Doanh Thu', icon: 'bi-graph-up-arrow' },
      { name: 'seller-fees',     label: 'Biểu Phí Sàn',       icon: 'bi-percent' },
    ],
  },
  {
    title: 'VẬN HÀNH ĐƠN HÀNG',
    items: [
      { name: 'seller-orders',   label: 'Quản Lý Đơn Hàng',   icon: 'bi-receipt-cutoff' },
      { name: 'account-orders',  label: 'Lịch sử mua hàng',   icon: 'bi-bag-heart-fill', requiresBuyerRole: true },
    ],
  },
  {
    title: 'KHO & SẢN PHẨM',
    items: [
      { name: 'seller-products',  label: 'Quản Lý Sản Phẩm',   icon: 'bi-box-seam-fill' },
      { name: 'seller-inventory', label: 'Quản Lý Kho Hàng',   icon: 'bi-boxes' },
      { name: 'seller-reviews',   label: 'Đánh Giá Sản Phẩm',  icon: 'bi-star-fill' },
    ],
  },
  {
    title: 'TIẾP THỊ & GIAN HÀNG',
    items: [
      { name: 'seller-promotions', label: 'Khuyến Mãi & Voucher', icon: 'bi-tag-fill' },
      { name: 'seller-chat',     label: 'Hội Thoại Khách Hàng', icon: 'bi-chat-dots-fill' },
      { name: 'seller-profile',  label: 'Hồ Sơ Gian Hàng',    icon: 'bi-shop-window' },
    ],
  },
]

// ── Notification bell ──────────────────────────────────────
const notifStore = useSellerNotificationsStore()
let notifListLoaded = false

async function loadUnreadCount() {
  try {
    const { data } = await sellerNotificationService.getUnreadCount()
    return data.data?.count ?? 0
  } catch {
    return 0
  }
}

function handleCommissionEvent(envelope) {
  if (!envelope?.payload) return
  try {
    notifStore.push(envelope.payload)
    notifyStore.push('Có thông báo mới từ sàn', 'info')
  } catch (err) {
    console.warn('[SellerLayout] handleCommissionEvent failed', err)
  }
}

useRealtime({
  topics: auth.isSeller
    ? [{ destination: '/topic/sellers/commission-rules', callback: handleCommissionEvent }]
    : [],
})

onMounted(async () => {
  if (auth.isSeller) {
    await loadUnreadCount()
  }
})

const bellRef = ref(null)

async function onBellOpen() {
  if (!notifListLoaded && notifStore.notifications.length === 0) {
    await notifStore.fetchList(0, 20)
    notifListLoaded = true
  }
}

async function handleMarkAllRead() {
  try {
    await sellerNotificationService.markAllRead()
    notifStore.markAllRead()
  } catch (err) {
    console.warn('[SellerLayout] markAllRead failed', err)
  }
}

const logout = () => {
  auth.clear()
  cartStore.clearCart()
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* ── Topbar Styling ─────────────────────────────────────── */
.seller-topbar {
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.25);
  height: 60px;
}

.seller-logo-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.seller-brand-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1;
}

.seller-brand-badge {
  font-size: 0.58rem;
  font-weight: 800;
  color: #818cf8;
  letter-spacing: 0.12em;
  line-height: 1;
  margin-top: 0.2rem;
}

.seller-topbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.12);
}

.seller-store-pill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.seller-store-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.seller-store-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #f1f5f9;
}

.seller-live-indicator {
  font-size: 0.65rem;
  color: #34d399;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.15rem;
}

.seller-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: sellerPulse 2s infinite;
}

@keyframes sellerPulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.seller-partner-badge {
  font-size: 0.62rem;
  font-weight: 800;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

.seller-search-box {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.4rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.seller-search-box:focus-within {
  background: rgba(255, 255, 255, 0.1);
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}

.seller-search-input {
  border: none;
  background: transparent;
  color: #f8fafc;
  font-size: 0.75rem;
  width: 100%;
  outline: none;
}

.seller-search-input::placeholder {
  color: #64748b;
}

.seller-search-kbd {
  font-size: 0.62rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.seller-btn-ghost {
  font-size: 0.75rem;
  font-weight: 600;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.45rem 0.85rem;
  border-radius: 10px;
  transition: all 0.15s;
}

.seller-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.seller-icon-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.15s;
  cursor: pointer;
}

.seller-icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.seller-bell-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.55rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0f172a;
}

.seller-pulse-dot-green {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
}

.seller-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.seller-profile-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.seller-avatar-ring {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

.seller-profile-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #f1f5f9;
  display: block;
}

.seller-profile-role {
  font-size: 0.62rem;
  color: #94a3b8;
  display: block;
}

.seller-dropdown-menu {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.seller-menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  font-weight: 600;
  color: #334155;
  border-radius: 8px;
  transition: all 0.15s;
}

.seller-menu-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* ── Sidebar Styling ────────────────────────────────────── */
.seller-sidebar {
  width: 270px;
  min-width: 270px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  z-index: 30;
  align-self: flex-start;
  flex-shrink: 0;
}

.seller-sidebar-scroll {
  overflow-y: auto;
  flex: 1;
  height: 100%;
}

.seller-sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.seller-sidebar-scroll::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}

.seller-nav-group-title {
  font-size: 0.65rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.08em;
  padding-left: 0.75rem;
  margin-bottom: 0.5rem;
}

.seller-nav-link {
  padding: 0.55rem 0.75rem;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.18s ease-in-out;
}

.seller-nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}

.seller-nav-link.active {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

.seller-nav-icon-wrap {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #818cf8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.15s;
}

.seller-nav-link:hover .seller-nav-icon-wrap {
  background: rgba(255, 255, 255, 0.1);
  color: #a5b4fc;
}

.seller-nav-link.active .seller-nav-icon-wrap {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.seller-nav-badge {
  font-size: 0.62rem;
  font-weight: 700;
  background: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
}

/* ── Main Content Area ──────────────────────────────────── */
.seller-main-content {
  background: #f8fafc;
}
</style>
