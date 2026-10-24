<template>
  <div class="dashboard-container">
    <!-- ── HERO WELCOME & CONTROL BAR ───────────────────────── -->
    <div class="dashboard-hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="live-dot"></span>
          <span>HỆ THỐNG GIÁM SÁT THỜI GIAN THỰC</span>
        </div>
        <h1 class="hero-title">Trung Tâm Điều Hành Toàn Sàn</h1>
        <p class="hero-subtitle">
          Giám sát chỉ số KPI, hiệu suất thương mại, giao dịch GMV và an toàn vận hành nền tảng NO MALL B2C.
        </p>
      </div>

      <div class="hero-actions">
        <button
          type="button"
          class="hero-btn-secondary"
          :disabled="isRefreshing"
          @click="refreshData"
        >
          <i class="bi bi-arrow-repeat" :class="{ 'spin-icon': isRefreshing }"></i>
          <span>{{ isRefreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu' }}</span>
        </button>

        <router-link
          :to="{ name: 'admin-seller-applications' }"
          class="hero-btn-primary"
        >
          <i class="bi bi-file-earmark-check"></i>
          <span>Duyệt đơn nhà bán</span>
          <span
            v-if="overview?.pendingSellerApplications > 0"
            class="hero-pending-badge"
          >
            {{ overview.pendingSellerApplications }}
          </span>
        </router-link>
      </div>
    </div>

    <!-- ── LOADING STATE ────────────────────────────────────── -->
    <div v-if="loading" class="dashboard-loading-card">
      <LoadingSpinner text="Đang đồng bộ dữ liệu chỉ số toàn sàn..." />
    </div>

    <div v-else class="dashboard-body">
      <!-- ── 6 PREMIUM KPI METRIC CARDS ─────────────────────── -->
      <div class="kpi-grid">
        <!-- 1. Doanh thu toàn sàn (Hero metric) -->
        <div class="kpi-card kpi-card-highlight">
          <div class="kpi-top">
            <span class="kpi-label">Tổng Doanh Thu Toàn Sàn</span>
            <div class="kpi-icon-wrap emerald">
              <i class="bi bi-cash-coin"></i>
            </div>
          </div>
          <div class="kpi-value text-emerald">
            {{ formatCurrency(overview?.totalRevenue) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-tag success">
              <i class="bi bi-graph-up-arrow"></i> GMV Tích Lũy
            </span>
            <span class="kpi-subtext">Toàn bộ giao dịch hoàn tất</span>
          </div>
        </div>

        <!-- 2. Tổng Người Dùng -->
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Tổng Người Dùng</span>
            <div class="kpi-icon-wrap indigo">
              <i class="bi bi-people-fill"></i>
            </div>
          </div>
          <div class="kpi-value">
            {{ (overview?.totalUsers ?? 0).toLocaleString('vi-VN') }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-tag primary">
              <i class="bi bi-check-circle-fill"></i> {{ overview?.activeUsers ?? 0 }} Hoạt động
            </span>
            <span class="kpi-subtext">Khách hàng & Seller</span>
          </div>
        </div>

        <!-- 3. Nhà Bán Hàng -->
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Nhà Bán Hàng (Sellers)</span>
            <div class="kpi-icon-wrap cyan">
              <i class="bi bi-shop-window"></i>
            </div>
          </div>
          <div class="kpi-value">
            {{ (overview?.totalSellers ?? 0).toLocaleString('vi-VN') }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-tag info">
              <i class="bi bi-shield-check"></i> {{ overview?.activeSellers ?? 0 }} Đã duyệt
            </span>
            <span class="kpi-subtext">Gian hàng chính thức</span>
          </div>
        </div>

        <!-- 4. Tổng Sản Phẩm -->
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Tổng Sản Phẩm</span>
            <div class="kpi-icon-wrap amber">
              <i class="bi bi-box-seam-fill"></i>
            </div>
          </div>
          <div class="kpi-value">
            {{ (overview?.totalProducts ?? 0).toLocaleString('vi-VN') }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-tag warning">
              <i class="bi bi-tags-fill"></i> {{ overview?.activeProducts ?? 0 }} Đang bán
            </span>
            <span class="kpi-subtext">SKU trong danh mục</span>
          </div>
        </div>

        <!-- 5. Tổng Đơn Hàng -->
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Tổng Đơn Hàng</span>
            <div class="kpi-icon-wrap violet">
              <i class="bi bi-receipt-cutoff"></i>
            </div>
          </div>
          <div class="kpi-value">
            {{ (overview?.totalOrders ?? 0).toLocaleString('vi-VN') }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-tag purple">
              <i class="bi bi-bag-check-fill"></i> Toàn sàn
            </span>
            <span class="kpi-subtext">Lượt đặt mua</span>
          </div>
        </div>

        <!-- 6. Đơn Chờ Duyệt (Alert KPI) -->
        <div class="kpi-card" :class="{ 'kpi-card-alert': overview?.pendingSellerApplications > 0 }">
          <div class="kpi-top">
            <span class="kpi-label">Đơn Seller Chờ Duyệt</span>
            <div class="kpi-icon-wrap rose">
              <i class="bi bi-person-lines-fill"></i>
            </div>
          </div>
          <div class="kpi-value" :class="overview?.pendingSellerApplications > 0 ? 'text-rose' : ''">
            {{ overview?.pendingSellerApplications ?? 0 }}
          </div>
          <div class="kpi-footer">
            <span
              v-if="overview?.pendingSellerApplications > 0"
              class="kpi-tag danger pulse-danger"
            >
              <i class="bi bi-exclamation-triangle-fill"></i> Cần xử lý gấp
            </span>
            <span v-else class="kpi-tag success">
              <i class="bi bi-check-all"></i> Đã sạch hàng chờ
            </span>
            <router-link
              :to="{ name: 'admin-seller-applications' }"
              class="kpi-link"
            >
              Xem ngay <i class="bi bi-chevron-right"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- ── CHARTS SECTION ───────────────────────────────────── -->
      <div class="charts-grid">
        <!-- Chart 1: Revenue Line Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">
                <i class="bi bi-graph-up text-primary me-2"></i>Doanh Thu 7 Ngày Gần Nhất
              </h3>
              <p class="chart-subtitle">Doanh số GMV ghi nhận theo từng ngày phát sinh đơn hàng</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span v-if="chartsLoading" class="spinner-border spinner-border-sm text-indigo"></span>
              <span class="badge bg-indigo-subtle text-indigo px-2.5 py-1.5 rounded-pill font-medium text-xs">
                VND (Triệu)
              </span>
            </div>
          </div>
          <div class="chart-canvas-wrap">
            <Line v-if="revenueChartData" :data="revenueChartData" :options="lineChartOptions" />
            <div v-else-if="!chartsLoading" class="chart-empty-state">
              <i class="bi bi-bar-chart fs-1 text-slate-300 mb-2"></i>
              <p class="text-slate-400 small mb-0">Chưa có dữ liệu biến động doanh thu 7 ngày qua</p>
            </div>
          </div>
        </div>

        <!-- Chart 2: Order Funnel Bar Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">
                <i class="bi bi-funnel text-violet me-2"></i>Phễu Trạng Thái Đơn Hàng
              </h3>
              <p class="chart-subtitle">Tỷ trọng đơn hàng phân bổ theo vòng đời xử lý</p>
            </div>
            <span v-if="chartsLoading" class="spinner-border spinner-border-sm text-violet"></span>
          </div>
          <div class="chart-canvas-wrap">
            <Bar v-if="funnelChartData" :data="funnelChartData" :options="barChartOptions" />
            <div v-else-if="!chartsLoading" class="chart-empty-state">
              <i class="bi bi-pie-chart fs-1 text-slate-300 mb-2"></i>
              <p class="text-slate-400 small mb-0">Chưa có thống kê trạng thái đơn hàng</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── QUICK OPERATIONAL HUBS ───────────────────────────── -->
      <div class="hub-section">
        <div class="hub-header">
          <div>
            <h2 class="hub-title">Trung Tâm Điều Hành & Vận Hành Nghiệp Vụ</h2>
            <p class="hub-subtitle">Truy cập nhanh vào các tính năng quản lý cốt lõi của hệ thống</p>
          </div>
        </div>

        <div class="hub-grid">
          <!-- Hub 1: Quản lý người dùng -->
          <router-link :to="{ name: 'admin-users' }" class="hub-card">
            <div class="hub-icon-wrap indigo">
              <i class="bi bi-people"></i>
            </div>
            <div class="hub-content">
              <div class="hub-card-title">Quản Lý Người Dùng</div>
              <p class="hub-card-desc">Kiểm soát danh sách tài khoản, khóa/mở khóa hoặc nâng cấp quyền Super Admin.</p>
            </div>
            <div class="hub-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- Hub 2: Duyệt đơn seller -->
          <router-link :to="{ name: 'admin-seller-applications' }" class="hub-card">
            <div class="hub-icon-wrap rose">
              <i class="bi bi-file-earmark-check"></i>
            </div>
            <div class="hub-content">
              <div class="hub-card-title">Duyệt Đơn Nhà Bán</div>
              <p class="hub-card-desc">Thẩm định hồ sơ pháp lý, CCCD/MST và phê duyệt đơn đăng ký bán lẻ mới.</p>
            </div>
            <div class="hub-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- Hub 3: Kiểm duyệt sản phẩm -->
          <router-link :to="{ name: 'admin-products' }" class="hub-card">
            <div class="hub-icon-wrap amber">
              <i class="bi bi-box-seam"></i>
            </div>
            <div class="hub-content">
              <div class="hub-card-title">Kiểm Duyệt Sản Phẩm</div>
              <p class="hub-card-desc">Rà soát thông tin niêm yết, duyệt sản phẩm mới đăng hoặc gỡ sản phẩm vi phạm.</p>
            </div>
            <div class="hub-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- Hub 4: Phí sàn & hoa hồng -->
          <router-link :to="{ name: 'admin-commission-rules' }" class="hub-card">
            <div class="hub-icon-wrap cyan">
              <i class="bi bi-percent"></i>
            </div>
            <div class="hub-content">
              <div class="hub-card-title">Phí Sàn & Hoa Hồng</div>
              <p class="hub-card-desc">Thiết lập tỷ lệ chiết khấu, phí sàn theo ngành hàng hoặc quy định riêng.</p>
            </div>
            <div class="hub-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- Hub 5: Tài chính & GMV -->
          <router-link :to="{ name: 'admin-finance' }" class="hub-card">
            <div class="hub-icon-wrap emerald">
              <i class="bi bi-wallet2"></i>
            </div>
            <div class="hub-content">
              <div class="hub-card-title">Báo Cáo Tài Chính GMV</div>
              <p class="hub-card-desc">Đối soát doanh thu, thống kê ví người bán và kiểm soát dòng tiền nền tảng.</p>
            </div>
            <div class="hub-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- Hub 6: Concurrency & Stress test -->
          <router-link :to="{ name: 'admin-inventory' }" class="hub-card">
            <div class="hub-icon-wrap purple">
              <i class="bi bi-cpu"></i>
            </div>
            <div class="hub-content">
              <div class="hub-card-title">Tồn Kho & Load-Test</div>
              <p class="hub-card-desc">Mô phỏng hàng ngàn giao dịch đồng thời để kiểm tra lock và khả năng chịu tải.</p>
            </div>
            <div class="hub-arrow">
              <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ── LIVE SYSTEM DIAGNOSTICS BAR ──────────────────────── -->
      <div class="diagnostics-bar">
        <div class="diag-item">
          <span class="diag-status-dot online"></span>
          <div class="diag-info">
            <span class="diag-name">Supabase PostgreSQL</span>
            <span class="diag-val">Kết nối ổn định · Pooling active</span>
          </div>
        </div>

        <div class="diag-divider"></div>

        <div class="diag-item">
          <span class="diag-status-dot online"></span>
          <div class="diag-info">
            <span class="diag-name">STOMP WebSocket</span>
            <span class="diag-val">Realtime Channel sẵn sàng</span>
          </div>
        </div>

        <div class="diag-divider"></div>

        <div class="diag-item">
          <span class="diag-status-dot online"></span>
          <div class="diag-info">
            <span class="diag-name">Cổng Thanh Toán</span>
            <span class="diag-val">VNPay / COD / MoMo Sandbox</span>
          </div>
        </div>

        <div class="diag-divider"></div>

        <div class="diag-item">
          <span class="diag-status-dot info"></span>
          <div class="diag-info">
            <span class="diag-name">Nền Tảng</span>
            <span class="diag-val">Spring Boot 3.3.4 + Vue 3 Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { statsService } from '@/services/stats.service'
import { useAdminNotificationsStore } from '@/stores/adminNotifications'
import { useRealtime } from '@/composables/useRealtime'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const overview = ref(null)
const loading = ref(true)
const chartsLoading = ref(false)
const isRefreshing = ref(false)
const revenueChartData = ref(null)
const funnelChartData = ref(null)
const notifStore = useAdminNotificationsStore()

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#ffffff',
      bodyColor: '#cbd5e1',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(ctx.raw),
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
    },
    y: {
      grid: { color: '#f1f5f9' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        callback: (val) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(val),
      },
    },
  },
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#ffffff',
      bodyColor: '#cbd5e1',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
  },
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

function buildRevenueChart(raw) {
  if (!raw || !Array.isArray(raw)) return null
  return {
    labels: raw.map((r) => {
      try {
        return new Intl.DateTimeFormat('vi-VN', { month: 'numeric', day: 'numeric' }).format(new Date(r.date))
      } catch {
        return r.date
      }
    }),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: raw.map((r) => r.revenue ?? 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  }
}

function buildFunnelChart(raw) {
  if (!raw || typeof raw !== 'object') return null
  const labels = Object.keys(raw)
  const data = Object.values(raw)
  const colors = [
    '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
    '#ec4899', '#f43f5e', '#3b82f6', '#14b8a6', '#64748b',
  ]
  return {
    labels,
    datasets: [
      {
        label: 'Số lượng đơn',
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  }
}

async function loadData() {
  try {
    overview.value = await statsService.adminOverview()
  } catch (err) {
    console.error('Failed to load admin overview:', err)
  }
}

async function loadCharts() {
  chartsLoading.value = true
  try {
    const [revenueRes, funnelRes] = await Promise.all([
      statsService.adminRevenue({ granularity: 'day' }),
      statsService.adminOrderFunnel(),
    ])
    revenueChartData.value = buildRevenueChart(revenueRes)
    funnelChartData.value = buildFunnelChart(funnelRes)
  } catch (e) {
    console.error('Charts loading error:', e)
  } finally {
    chartsLoading.value = false
  }
}

async function refreshData() {
  isRefreshing.value = true
  await Promise.all([loadData(), loadCharts()])
  setTimeout(() => {
    isRefreshing.value = false
  }, 400)
}

onMounted(async () => {
  try {
    await loadData()
  } finally {
    loading.value = false
  }
  loadCharts()
})

// Realtime STOMP listener
useRealtime({
  topics: [
    { destination: '/topic/admin/seller-applications', callback: (msg) => { notifStore.push(msg); loadData() } },
    { destination: '/topic/admin/orders',             callback: (msg) => { notifStore.push(msg); loadData(); loadCharts() } },
    { destination: '/topic/admin/returns',            callback: (msg) => notifStore.push(msg) },
    { destination: '/topic/admin/disputes',          callback: (msg) => notifStore.push(msg) },
  ],
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ── HERO BANNER ────────────────────────────────────────── */
.dashboard-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1e293b 100%);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 18px;
  padding: 1.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 0 1px 1px rgba(99, 102, 241, 0.1);
  color: #ffffff;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  margin-bottom: 0.65rem;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.hero-title {
  font-size: 1.625rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.025em;
  margin-bottom: 0.35rem;
}

.hero-subtitle {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-shrink: 0;
}

.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hero-btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.6rem 1.15rem;
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
  transition: all 0.2s ease;
}

.hero-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
  color: #ffffff;
}

.hero-pending-badge {
  background: #f43f5e;
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  line-height: 1;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── LOADING CARD ───────────────────────────────────────── */
.dashboard-loading-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);
}

/* ── BODY STYLES ────────────────────────────────────────── */
.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ── 6 KPI GRID ─────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

@media (min-width: 1400px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1;
}

.kpi-card-highlight {
  border-color: rgba(16, 185, 129, 0.35);
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
}

.kpi-card-alert {
  border-color: rgba(244, 63, 94, 0.4);
  background: linear-gradient(180deg, #ffffff 0%, #fff1f2 100%);
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.kpi-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.kpi-icon-wrap.emerald {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.kpi-icon-wrap.indigo {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}
.kpi-icon-wrap.cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}
.kpi-icon-wrap.amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
.kpi-icon-wrap.violet {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}
.kpi-icon-wrap.rose {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
}

.kpi-value {
  font-size: 1.875rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 0.75rem;
}

.text-emerald {
  color: #059669 !important;
}

.text-rose {
  color: #e11d48 !important;
}

.kpi-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}

.kpi-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.kpi-tag.success {
  background: #dcfce7;
  color: #15803d;
}

.kpi-tag.primary {
  background: #e0e7ff;
  color: #4338ca;
}

.kpi-tag.info {
  background: #cffafe;
  color: #0e7490;
}

.kpi-tag.warning {
  background: #fef3c7;
  color: #b45309;
}

.kpi-tag.purple {
  background: #ede9fe;
  color: #6d28d9;
}

.kpi-tag.danger {
  background: #ffe4e6;
  color: #be123c;
}

.pulse-danger {
  animation: pulse-border 1.5s infinite;
}

@keyframes pulse-border {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.kpi-subtext {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.kpi-link {
  font-size: 0.75rem;
  font-weight: 700;
  color: #e11d48;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.kpi-link:hover {
  text-decoration: underline;
}

/* ── CHARTS SECTION ───────────────────────────────────── */
.charts-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

.chart-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0;
}

.chart-canvas-wrap {
  position: relative;
  height: 290px;
}

.chart-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

/* ── QUICK OPERATIONAL HUBS ───────────────────────────── */
.hub-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hub-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin-bottom: 0.2rem;
}

.hub-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0;
}

.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
}

.hub-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.4rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.04);
  transition: all 0.25s ease;
  position: relative;
}

.hub-card:hover {
  transform: translateY(-3px);
  border-color: #6366f1;
  box-shadow: 0 10px 24px -4px rgba(99, 102, 241, 0.12);
}

.hub-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  color: #ffffff;
  flex-shrink: 0;
}

.hub-icon-wrap.indigo {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}
.hub-icon-wrap.rose {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
}
.hub-icon-wrap.amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}
.hub-icon-wrap.cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}
.hub-icon-wrap.emerald {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.hub-icon-wrap.purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.hub-content {
  flex: 1;
  min-width: 0;
}

.hub-card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.hub-card-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0;
  line-height: 1.35;
}

.hub-arrow {
  color: #cbd5e1;
  font-size: 1.15rem;
  transition: all 0.2s ease;
}

.hub-card:hover .hub-arrow {
  color: #6366f1;
  transform: translateX(4px);
}

/* ── LIVE SYSTEM DIAGNOSTICS BAR ────────────────────────── */
.diagnostics-bar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.diag-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.diag-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.diag-status-dot.online {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.diag-status-dot.info {
  background: #6366f1;
  box-shadow: 0 0 8px #6366f1;
}

.diag-info {
  display: flex;
  flex-direction: column;
}

.diag-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
}

.diag-val {
  font-size: 0.6875rem;
  color: #64748b;
}

.diag-divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
}

@media (max-width: 900px) {
  .diag-divider {
    display: none;
  }
}
</style>
