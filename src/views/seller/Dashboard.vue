<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { statsService } from '@/services/stats.service'
import { sellerOrderService } from '@/services/sellerOrder.service'
import { sellerProfileService } from '@/services/sellerProfile.service'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const overview = ref(null)
const profile = ref(null)
const revenueSeries = ref([])
const recentOrders = ref([])
const loading = ref(true)

const liveClock = ref('')
let clockTimer = null

const activeFilter = ref('today')

function vnd(value) {
  if (value == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

function updateClock() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  liveClock.value = `${hours}:${minutes}:${seconds}`
}

function statusBadge(s) {
  switch (s) {
    case 'PENDING':
      return { label: 'Chờ xác nhận', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'PACKED':
      return { label: 'Đã đóng gói', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    case 'SHIPPING':
      return { label: 'Đang giao', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
    case 'DELIVERED':
      return { label: 'Đã giao', bg: 'bg-teal-50 text-teal-700 border-teal-200' }
    case 'COMPLETED':
      return { label: 'Hoàn tất', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'CANCELLED':
      return { label: 'Đã hủy', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
    default:
      return { label: s || 'N/A', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  }
}

async function loadDashboardData() {
  loading.value = true
  try {
    const [ov, rev, orders, prof] = await Promise.all([
      statsService.sellerOverview(),
      statsService.sellerRevenue(30),
      sellerOrderService.list({ size: 5 }),
      sellerProfileService.getProfile().catch(() => null),
    ])
    overview.value = ov
    revenueSeries.value = rev || []
    recentOrders.value = orders?.items || orders?.content || []
    profile.value = prof
  } catch (e) {
    // Interceptor notification
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  loadDashboardData()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <div class="seller-dash-container space-y-6">
    <!-- ── Hero Banner: Operations Overview (Unified Dark Slate Theme) ── -->
    <div class="seller-dash-hero">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="seller-dash-pill">OPERATIONS OVERVIEW</span>
            <span class="seller-dash-live">
              <span class="seller-live-dot"></span>
              Đồng bộ thời gian thực: <strong class="font-mono">{{ liveClock }}</strong>
            </span>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-black text-white m-0 tracking-tight">
              Xin chào, {{ profile?.shopName || auth.user?.fullName || 'Gian Hàng của bạn' }}! 👋
            </h1>
            <span class="seller-partner-badge">
              <i class="bi bi-shop me-1"></i> {{ (profile?.ratingCount > 10) ? 'Đối tác Uy Tín' : 'Gian Hàng Mới' }}
            </span>
          </div>
          <p class="text-slate-400 text-xs mt-1.5 mb-0">
            Hệ thống đang vận hành trơn tru • Tất cả luồng đơn và giao vận đều ở trạng thái bình thường
          </p>
        </div>

        <!-- Quick Filters & Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Filter Tabs -->
          <div class="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 gap-1 text-xs backdrop-blur-sm">
            <button
              v-for="filter in [
                { key: 'today', label: 'Hôm nay' },
                { key: '7d', label: '7 ngày qua' },
                { key: '30d', label: '30 ngày qua' },
                { key: 'month', label: 'Tháng này' }
              ]"
              :key="filter.key"
              @click="activeFilter = filter.key"
              :class="[
                'px-3 py-1.5 rounded-lg transition-all font-medium border-0 cursor-pointer',
                activeFilter === filter.key
                  ? 'bg-indigo-600 text-white shadow-md font-semibold'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
              ]"
            >
              {{ filter.label }}
            </button>
          </div>

          <button @click="loadDashboardData" class="seller-dash-btn-ghost" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise text-sm', { 'spin': loading }]"></i> Làm mới
          </button>
          <router-link :to="{ name: 'seller-product-new' }" class="seller-dash-btn-primary text-decoration-none">
            <i class="bi bi-plus-lg text-sm"></i> Thêm sản phẩm
          </router-link>
        </div>
      </div>
    </div>

    <!-- ── Priority Action Strip (To-Do List) ──────────────── -->
    <div>
      <div class="flex items-center justify-between px-1 mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Việc cần xử lý ngay</span>
        </div>
        <span class="text-xs text-slate-500 font-medium">
          Tổng cộng: <strong class="text-indigo-600">{{ (overview?.pendingOrders || 0) + (overview?.lowStockProducts || 0) }}</strong> đầu mục cần chú ý
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Item 1: Đơn chờ xác nhận -->
        <router-link
          :to="{ name: 'seller-orders' }"
          class="seller-action-card group text-decoration-none"
        >
          <div class="flex items-center gap-3">
            <div class="seller-action-icon bg-indigo-50 text-indigo-600 border border-indigo-100">
              <i class="bi bi-hourglass-split"></i>
            </div>
            <div>
              <div class="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {{ overview?.pendingOrders ?? 0 }}
              </div>
              <div class="text-xs text-slate-500 font-medium">Đơn chờ xác nhận</div>
            </div>
          </div>
          <i class="bi bi-chevron-right text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all"></i>
        </router-link>

        <!-- Item 2: Khiếu nại / Đổi trả -->
        <div class="seller-action-card group cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="seller-action-icon bg-rose-50 text-rose-600 border border-rose-100">
              <i class="bi bi-arrow-return-left"></i>
            </div>
            <div>
              <div class="text-xl font-black text-rose-600">0</div>
              <div class="text-xs text-slate-500 font-medium">Khiếu nại / Đổi trả</div>
            </div>
          </div>
          <i class="bi bi-chevron-right text-slate-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all"></i>
        </div>

        <!-- Item 3: Sắp hết hàng -->
        <router-link
          :to="{ name: 'seller-products' }"
          class="seller-action-card group text-decoration-none"
        >
          <div class="flex items-center gap-3">
            <div class="seller-action-icon bg-amber-50 text-amber-600 border border-amber-100">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <div>
              <div class="text-xl font-black text-amber-600">
                {{ overview?.lowStockProducts ?? 0 }}
              </div>
              <div class="text-xs text-slate-500 font-medium">Sản phẩm sắp hết hàng</div>
            </div>
          </div>
          <i class="bi bi-chevron-right text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all"></i>
        </router-link>

        <!-- Item 4: Tin nhắn chưa đọc -->
        <router-link
          :to="{ name: 'seller-chat' }"
          class="seller-action-card group text-decoration-none"
        >
          <div class="flex items-center gap-3">
            <div class="seller-action-icon bg-emerald-50 text-emerald-600 border border-emerald-100">
              <i class="bi bi-chat-dots"></i>
            </div>
            <div>
              <div class="text-xl font-black text-emerald-600">0</div>
              <div class="text-xs text-slate-500 font-medium">Tin nhắn khách chưa đọc</div>
            </div>
          </div>
          <i class="bi bi-chevron-right text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all"></i>
        </router-link>
      </div>
    </div>

    <!-- ── Primary Metric Cards (Bento KPIs) ──────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Metric 1: Revenue -->
      <div class="seller-kpi-card">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh thu 30 ngày</span>
            <div class="text-2xl font-black text-slate-900 font-mono mt-1">{{ vnd(overview?.revenueLast30Days) }}</div>
          </div>
          <div class="seller-kpi-icon-wrap bg-emerald-50 text-emerald-600 border border-emerald-100">
            <i class="bi bi-cash-stack"></i>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="inline-flex items-center text-slate-500 font-bold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
            {{ overview?.revenueLast30Days > 0 ? '+0%' : 'Chưa có biến động' }}
          </span>
          <span class="text-slate-400 font-medium">so với tháng trước</span>
        </div>
      </div>

      <!-- Metric 2: Completed Orders -->
      <div class="seller-kpi-card">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng đơn hàng</span>
            <div class="text-2xl font-black text-slate-900 font-mono mt-1">
              {{ overview?.totalOrders ?? 0 }} <span class="text-xs text-slate-400 font-normal">đơn</span>
            </div>
          </div>
          <div class="seller-kpi-icon-wrap bg-indigo-50 text-indigo-600 border border-indigo-100">
            <i class="bi bi-bag-check"></i>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="inline-flex items-center text-slate-500 font-bold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
            {{ overview?.totalOrders > 0 ? '+0%' : 'Chưa có biến động' }}
          </span>
          <span class="text-slate-400 font-medium">so với tuần trước</span>
        </div>
      </div>

      <!-- Metric 3: Active Products -->
      <div class="seller-kpi-card">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Sản phẩm đang bán</span>
            <div class="text-2xl font-black text-slate-900 font-mono mt-1">
              {{ overview?.activeProducts ?? 0 }} <span class="text-xs text-slate-400 font-normal">/ {{ overview?.totalProducts ?? 0 }}</span>
            </div>
          </div>
          <div class="seller-kpi-icon-wrap bg-sky-50 text-sky-600 border border-sky-100">
            <i class="bi bi-box-seam"></i>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-sky-700 font-bold bg-sky-50 border border-sky-200/60 px-2.5 py-0.5 rounded-full">
            Đang hoạt động tốt
          </span>
          <span class="text-slate-400 font-medium">Đã kiểm duyệt</span>
        </div>
      </div>

      <!-- Metric 4: Conversion Rate / Rating -->
      <div class="seller-kpi-card">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Đánh giá gian hàng</span>
            <div class="text-2xl font-black text-slate-900 font-mono mt-1">
              {{ (profile?.ratingAvg && Number(profile.ratingAvg) > 0) ? Number(profile.ratingAvg).toFixed(1) : '0.0' }}
              <span class="text-amber-500 text-sm font-normal">★ / 5.0</span>
            </div>
          </div>
          <div class="seller-kpi-icon-wrap bg-amber-50 text-amber-600 border border-amber-100">
            <i class="bi bi-star-fill"></i>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
            {{ (profile?.ratingCount && profile.ratingCount > 0) ? `${profile.ratingAvg} ★` : 'Chưa có đánh giá' }}
          </span>
          <span class="text-slate-400 font-medium">Từ {{ profile?.ratingCount || 0 }} đánh giá</span>
        </div>
      </div>
    </div>

    <!-- ── Charts & Analytics Section ─────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Sales & Order Trend Chart (8 Columns) -->
      <div class="lg:col-span-8 seller-surface-card flex flex-col justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-900 m-0">Biểu Đồ Doanh Thu</h2>
            <p class="text-xs text-slate-400 mb-0">Thống kê doanh thu bán hàng theo mốc ngày</p>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-indigo-600 shadow-sm shadow-indigo-500/50"></span>
              <span class="text-slate-700 font-medium">Doanh thu (VNĐ)</span>
            </div>
          </div>
        </div>

        <!-- Chart Visualization -->
        <div class="relative w-full h-64 mt-4">
          <div v-if="!revenueSeries.length" class="h-full flex items-center justify-center text-slate-400 text-sm">
            Chưa có dữ liệu doanh thu
          </div>
          <div v-else class="h-full flex items-end gap-1.5 pt-4">
            <div
              v-for="(p, idx) in revenueSeries"
              :key="idx"
              class="flex-grow-1 bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 rounded-t-lg transition-all position-relative group cursor-pointer shadow-sm"
              :style="{
                height: Math.max(4, Math.min(100, (Number(p.revenue) / Math.max(1, Math.max(...revenueSeries.map(r => Number(r.revenue))))) * 100)) + '%',
              }"
            >
              <!-- Tooltip on Hover -->
              <div class="opacity-0 group-hover:opacity-100 transition-opacity position-absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-xl border border-slate-700">
                <div class="font-bold text-slate-300">{{ p.date }}</div>
                <div class="text-emerald-400 font-mono font-bold">{{ vnd(p.revenue) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversion Funnel & Operational Metrics (4 Columns) -->
      <div class="lg:col-span-4 seller-surface-card flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-base font-bold text-slate-900 m-0">Hiệu Quả Vận Hành</h2>
            <span class="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              {{ (profile?.ratingCount > 10) ? 'Chuẩn Mall' : 'Gian Hàng Mới' }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mb-4">Các chỉ số phục vụ gian hàng cam kết</p>

          <div class="space-y-4">
            <!-- Metric 1 -->
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="font-semibold text-slate-700">Tỷ lệ giao đúng hạn</span>
                <span class="font-bold text-emerald-600 font-mono">{{ overview?.totalOrders > 0 ? '100%' : 'Chưa có đơn' }}</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" :style="{ width: overview?.totalOrders > 0 ? '100%' : '0%' }"></div>
              </div>
            </div>

            <!-- Metric 2 -->
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="font-semibold text-slate-700">Phản hồi chat (&le; 5 phút)</span>
                <span class="font-bold text-indigo-600 font-mono">100% (Mới)</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style="width: 100%;"></div>
              </div>
            </div>

            <!-- Metric 3 -->
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="font-semibold text-slate-700">Tỷ lệ hủy do shop</span>
                <span class="font-bold text-slate-800 font-mono">0%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-sky-500 h-2 rounded-full" style="width: 0%;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
          <i class="bi bi-info-circle-fill text-indigo-600 text-sm shrink-0"></i>
          <span>Gian hàng đã sẵn sàng đăng bán sản phẩm và tiếp nhận đơn hàng đầu tiên!</span>
        </div>
      </div>
    </div>

    <!-- ── Recent Orders Table ────────────────────────────── -->
    <div class="seller-surface-card">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900 m-0">Đơn Hàng Mới Nhất</h2>
          <p class="text-xs text-slate-400 mb-0">Các đơn hàng vừa phát sinh tại gian hàng</p>
        </div>
        <router-link
          :to="{ name: 'seller-orders' }"
          class="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1.5 text-decoration-none"
        >
          Xem tất cả đơn hàng <i class="bi bi-arrow-right"></i>
        </router-link>
      </div>

      <div class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50/80 text-slate-500 font-semibold text-xs border-b border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0 rounded-l-xl">MÃ ĐƠN HÀNG</th>
              <th class="py-3 px-3.5 border-0">NGƯỜI NHẬN</th>
              <th class="py-3 px-3.5 border-0">TRẠNG THÁI</th>
              <th class="py-3 px-3.5 text-end border-0">TỔNG TIỀN</th>
              <th class="py-3 px-3.5 text-end border-0 rounded-r-xl">NGÀY TẠO</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="!recentOrders.length">
              <td colspan="5" class="text-center text-slate-400 py-8">Chưa có đơn hàng nào phát sinh.</td>
            </tr>
            <tr v-for="o in recentOrders" :key="o.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-3.5 py-3.5 font-mono text-indigo-600 font-bold">
                <router-link :to="{ name: 'seller-orders' }" class="text-indigo-600 text-decoration-none hover:underline">
                  {{ o.orderCode }}
                </router-link>
              </td>
              <td class="px-3.5 py-3.5 font-semibold text-slate-800">{{ o.receiverName }}</td>
              <td class="px-3.5 py-3.5">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1',
                    statusBadge(o.status).bg
                  ]"
                >
                  {{ statusBadge(o.status).label }}
                </span>
              </td>
              <td class="px-3.5 py-3.5 text-end font-mono font-black text-slate-900">{{ vnd(o.totalAmount) }}</td>
              <td class="px-3.5 py-3.5 text-end text-xs text-slate-400 font-medium">
                {{ new Date(o.createdAt).toLocaleDateString('vi-VN') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-dash-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Hero Dark Slate Banner ─────────────────────────────── */
.seller-dash-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.seller-dash-pill {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.35);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.seller-dash-live {
  font-size: 0.68rem;
  font-weight: 600;
  color: #34d399;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.seller-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: livePulse 2s infinite;
}

@keyframes livePulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.seller-partner-badge {
  font-size: 0.68rem;
  font-weight: 800;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  letter-spacing: 0.03em;
}

.seller-dash-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 0.85rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.seller-dash-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.seller-dash-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.seller-dash-btn-primary:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
  transform: translateY(-1px);
}

/* ── Priority Action Cards ──────────────────────────────── */
.seller-action-card {
  background: #ffffff;
  padding: 1.15rem 1.25rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.seller-action-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.seller-action-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* ── Primary Bento Metric Cards ─────────────────────────── */
.seller-kpi-card {
  background: #ffffff;
  padding: 1.35rem 1.4rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.seller-kpi-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px -3px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.seller-kpi-icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

/* ── Surface Cards ──────────────────────────────────────── */
.seller-surface-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
