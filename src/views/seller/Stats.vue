<script setup>
import { ref, onMounted } from 'vue'
import { statsService } from '@/services/stats.service'
import { useNotifyStore } from '@/stores/notify'

const notify = useNotifyStore()

const overview = ref(null)
const revenueSeries = ref([])
const loading = ref(true)
const days = ref(30)

function vnd(value) {
  if (value == null) return '0'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

async function loadStats() {
  loading.value = true
  try {
    const [ov, rev] = await Promise.all([
      statsService.sellerOverview(),
      statsService.sellerRevenue(days.value),
    ])
    overview.value = ov
    revenueSeries.value = rev || []
  } catch {
    // interceptor
  } finally {
    loading.value = false
  }
}

function changeRange(d) {
  days.value = d
  loadStats()
}

function chartHeight(revenue) {
  const max = Math.max(1, ...revenueSeries.value.map((r) => Number(r.revenue) || 0))
  return Math.max(4, Math.min(100, ((Number(revenue) || 0) / max) * 100))
}

onMounted(loadStats)
</script>

<template>
  <div class="seller-stats-container space-y-6">
    <!-- ── Hero Banner: Operations Analytics (Unified Dark Slate Theme) ── -->
    <div class="seller-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="seller-hero-pill">ANALYTICS & REVENUE HUB</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span>
              Phân tích hiệu quả kinh doanh
            </span>
          </div>
          <h1 class="seller-hero-title">Báo Cáo Thống Kê Chi Tiết</h1>
          <p class="seller-hero-desc">
            Theo dõi dòng tiền doanh thu, khối lượng đơn hàng và chỉ số hài lòng khách hàng theo thời gian thực
          </p>
        </div>

        <!-- Filter Range & Actions -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap">
          <!-- Range Tabs -->
          <div class="seller-range-pill-group">
            <button
              v-for="r in [
                { d: 7, l: '7 ngày' },
                { d: 30, l: '30 ngày' },
                { d: 90, l: '90 ngày' }
              ]"
              :key="r.d"
              @click="changeRange(r.d)"
              :class="['seller-range-btn', { 'active': days === r.d }]"
            >
              {{ r.l }}
            </button>
          </div>

          <button class="seller-hero-btn" @click="loadStats" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <!-- ── 4 Bento KPI Metric Cards ──────────────────────── -->
    <div class="row g-3">
      <!-- KPI 1: Tổng doanh thu -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="seller-kpi-card">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="seller-kpi-label">Tổng doanh thu</div>
              <div class="seller-kpi-value text-emerald-600 font-mono mt-1">
                {{ vnd(overview?.revenueLast30Days ?? overview?.totalRevenue) }}
              </div>
            </div>
            <div class="seller-kpi-icon bg-emerald-50 text-emerald-600 border border-emerald-100">
              <i class="bi bi-cash-stack"></i>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between text-xs">
            <span class="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-bold">
              <i class="bi bi-graph-up me-1"></i>Hoạt động tốt
            </span>
            <span class="text-slate-400 font-medium">Trong {{ days }} ngày qua</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Tổng đơn hàng -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="seller-kpi-card">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="seller-kpi-label">Tổng đơn hàng</div>
              <div class="seller-kpi-value text-indigo-600 font-mono mt-1">
                {{ overview?.totalOrders ?? 0 }} <span class="text-xs text-slate-400 font-normal">đơn</span>
              </div>
            </div>
            <div class="seller-kpi-icon bg-indigo-50 text-indigo-600 border border-indigo-100">
              <i class="bi bi-bag-check"></i>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between text-xs">
            <span class="text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full font-bold">
              <i class="bi bi-check2-circle me-1"></i>Đã hoàn tất
            </span>
            <span class="text-slate-400 font-medium">Toàn thời gian</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Sản phẩm đang bán -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="seller-kpi-card">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="seller-kpi-label">Sản phẩm đang bán</div>
              <div class="seller-kpi-value text-sky-600 font-mono mt-1">
                {{ overview?.activeProducts ?? 0 }} <span class="text-xs text-slate-400 font-normal">/ {{ overview?.totalProducts ?? 0 }}</span>
              </div>
            </div>
            <div class="seller-kpi-icon bg-sky-50 text-sky-600 border border-sky-100">
              <i class="bi bi-box-seam"></i>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between text-xs">
            <span class="text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full font-bold">
              Kiểm duyệt Mall
            </span>
            <span class="text-slate-400 font-medium">Đang hiển thị</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Đánh giá trung bình -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="seller-kpi-card">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="seller-kpi-label">Đánh giá trung bình</div>
              <div class="seller-kpi-value text-amber-600 font-mono mt-1">
                {{ overview?.avgRating ?? '5.0' }} <span class="text-amber-500 text-sm">★</span>
              </div>
            </div>
            <div class="seller-kpi-icon bg-amber-50 text-amber-600 border border-amber-100">
              <i class="bi bi-star-fill"></i>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between text-xs">
            <span class="text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full font-bold">
              99% hài lòng
            </span>
            <span class="text-slate-400 font-medium">{{ overview?.totalReviews ?? 0 }} đánh giá</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Revenue Trend Chart Section ───────────────────── -->
    <div class="seller-surface-card">
      <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="seller-card-title mb-1">Xu Hướng Doanh Thu Bán Hàng</h2>
          <p class="seller-card-sub mb-0">Biểu diễn dòng tiền ghi nhận theo từng ngày trong khoảng {{ days }} ngày qua</p>
        </div>

        <div class="d-flex align-items-center gap-3 text-xs">
          <div class="d-flex align-items-center gap-1.5">
            <span class="seller-legend-dot"></span>
            <span class="text-slate-700 font-semibold">Doanh thu ghi nhận (VNĐ)</span>
          </div>
        </div>
      </div>

      <!-- Chart Bars -->
      <div class="seller-chart-container position-relative">
        <div v-if="loading" class="seller-chart-loading">
          <div class="spinner-border spinner-border-sm text-indigo-600 me-2"></div>
          Đang tải dữ liệu biểu đồ...
        </div>

        <div v-else-if="!revenueSeries.length" class="seller-chart-empty">
          <i class="bi bi-bar-chart text-3xl text-slate-300 d-block mb-2"></i>
          Chưa có dữ liệu giao dịch phát sinh trong khoảng thời gian này.
        </div>

        <div v-else class="h-100 d-flex align-items-end gap-1 pt-4">
          <div
            v-for="(p, idx) in revenueSeries"
            :key="idx"
            class="flex-grow-1 seller-chart-bar group position-relative"
            :style="{ height: chartHeight(p.revenue) + '%' }"
          >
            <!-- Hover Tooltip -->
            <div class="seller-chart-tooltip">
              <div class="fw-bold text-slate-300">{{ p.date }}</div>
              <div class="text-emerald-400 font-mono fw-bold">{{ vnd(p.revenue) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Labels -->
      <div v-if="revenueSeries.length" class="d-flex justify-content-between text-xs text-slate-400 mt-2 px-1 font-mono">
        <span>{{ revenueSeries[0]?.date }}</span>
        <span>{{ revenueSeries[revenueSeries.length - 1]?.date }}</span>
      </div>
    </div>

    <!-- ── Top Products Table Section ────────────────────── -->
    <div class="seller-surface-card">
      <div class="d-flex align-items-center justify-content-between pb-3 border-bottom border-slate-100 mb-4">
        <div>
          <h2 class="seller-card-title mb-1">Sản Phẩm Bán Chạy Nhất</h2>
          <p class="seller-card-sub mb-0">Top các sản phẩm đóng góp doanh số cao nhất cho gian hàng</p>
        </div>
        <router-link :to="{ name: 'seller-products' }" class="text-xs text-indigo-600 font-bold hover:underline d-flex align-items-center gap-1 text-decoration-none">
          Xem tất cả kho hàng <i class="bi bi-arrow-right"></i>
        </router-link>
      </div>

      <div v-if="overview?.topProducts?.length" class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50 text-slate-500 font-semibold text-xs border-bottom border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0 rounded-start-3" style="width: 50px;">#</th>
              <th class="py-3 px-3.5 border-0">SẢN PHẨM</th>
              <th class="py-3 px-3.5 text-end border-0">ĐÃ BÁN</th>
              <th class="py-3 px-3.5 text-end border-0">DOANH THU</th>
              <th class="py-3 px-3.5 text-end border-0 rounded-end-3">XẾP HẠNG</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(p, idx) in overview.topProducts" :key="p.id || idx" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-3.5 py-3.5 font-bold text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="px-3.5 py-3.5">
                <div class="d-flex align-items-center gap-3">
                  <img
                    v-if="p.thumbnailUrl"
                    :src="p.thumbnailUrl"
                    alt=""
                    style="width: 44px; height: 44px; object-fit: cover;"
                    class="rounded-xl border border-slate-200"
                  />
                  <div v-else class="bg-slate-100 rounded-xl d-flex align-items-center justify-content-center text-slate-400" style="width: 44px; height: 44px;">
                    <i class="bi bi-image"></i>
                  </div>
                  <div>
                    <div class="fw-bold text-slate-800">{{ p.name }}</div>
                    <div class="text-slate-400 text-xs font-mono">{{ vnd(p.price) }}</div>
                  </div>
                </div>
              </td>
              <td class="px-3.5 py-3.5 text-end font-mono font-bold text-slate-800">{{ p.soldCount ?? 0 }}</td>
              <td class="px-3.5 py-3.5 text-end font-mono font-black text-emerald-600">{{ vnd(p.revenue) }}</td>
              <td class="px-3.5 py-3.5 text-end">
                <span class="badge bg-amber-100 text-amber-800 border border-amber-200 rounded-pill px-2.5 py-1 font-bold">
                  Top {{ idx + 1 }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center text-slate-400 py-5">
        <i class="bi bi-box-seam d-block mb-2 fs-2 text-slate-300"></i>
        Chưa có sản phẩm phát sinh doanh thu vượt trội.
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-stats-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Hero Operational Dark Slate Banner ──────────────────── */
.seller-hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.seller-hero-pill {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.35);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.seller-live-badge {
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

.seller-hero-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.seller-hero-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 0;
  max-width: 620px;
  line-height: 1.45;
}

.seller-range-pill-group {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.25rem;
  gap: 0.25rem;
  backdrop-filter: blur(8px);
}

.seller-range-btn {
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.seller-range-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.seller-range-btn.active {
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
}

.seller-hero-btn {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  transition: all 0.15s;
  cursor: pointer;
}

.seller-hero-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* ── Bento KPI Cards ────────────────────────────────────── */
.seller-kpi-card {
  background: #ffffff;
  padding: 1.35rem 1.4rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  transition: all 0.2s ease;
}

.seller-kpi-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px -3px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.seller-kpi-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.seller-kpi-value {
  font-size: 1.5rem;
  font-weight: 900;
}

.seller-kpi-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

/* ── Surface Card & Chart ───────────────────────────────── */
.seller-surface-card {
  background: #ffffff;
  padding: 1.75rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.seller-card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.seller-card-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

.seller-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4f46e5;
  box-shadow: 0 0 6px rgba(79, 70, 229, 0.4);
}

.seller-chart-container {
  height: 280px;
  width: 100%;
}

.seller-chart-loading,
.seller-chart-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.8125rem;
}

.seller-chart-bar {
  background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 4px;
}

.seller-chart-bar:hover {
  background: linear-gradient(180deg, #818cf8 0%, #4338ca 100%);
  filter: brightness(1.1);
}

.seller-chart-tooltip {
  opacity: 0;
  pointer-events: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #ffffff;
  font-size: 0.72rem;
  padding: 0.4rem 0.65rem;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  z-index: 20;
  transition: opacity 0.15s ease;
}

.seller-chart-bar:hover .seller-chart-tooltip {
  opacity: 1;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
