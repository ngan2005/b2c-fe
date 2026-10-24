<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl">Tài Chính Sàn</h1>
        <p class="text-xs text-slate-500 mb-0">Thống kê GMV, doanh thu sàn, và đối soát seller</p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" text="Đang tải dữ liệu tài chính..." />

    <!-- Error -->
    <div v-else-if="loadError" class="alert alert-danger">{{ loadError }}</div>

    <div v-else class="space-y-6">
      <!-- Row 1: 4 KPI cards -->
      <div class="row g-4">
        <div class="col-sm-6 col-xl-3">
          <StatCard label="Tổng GMV" :value="formatCurrency(overview?.gmv)" icon="bi-cash-stack" variant="success" />
        </div>
        <div class="col-sm-6 col-xl-3">
          <StatCard label="Doanh Thu Sàn" :value="formatCurrency(overview?.platformRevenue)" icon="bi-graph-up-arrow" variant="primary" />
        </div>
        <div class="col-sm-6 col-xl-3">
          <StatCard label="Chờ Đối Soát" :value="formatCurrency(overview?.pendingPayout)" icon="bi-hourglass-split" variant="warning" />
        </div>
        <div class="col-sm-6 col-xl-3">
          <StatCard label="Đã Đối Soát" :value="formatCurrency(overview?.paidPayout)" icon="bi-check2-circle" variant="info" />
        </div>
      </div>

      <!-- Row 2: avg commission + completed orders -->
      <div class="row g-4">
        <div class="col-md-6">
          <StatCard
            label="Hoa Hồng TB / Đơn"
            :value="formatCurrency(avgCommissionPerOrder)"
            icon="bi-percent"
            variant="secondary"
          />
        </div>
        <div class="col-md-6">
          <StatCard label="Số Đơn Hoàn Thành" :value="overview?.completedOrders ?? 0" icon="bi-receipt" variant="primary" />
        </div>
      </div>

      <!-- Row 3: Charts -->
      <div class="row g-4">
        <!-- Daily revenue line chart -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-bold d-flex align-items-center justify-content-between">
              <span>Doanh Thu 30 Ngày</span>
              <span v-if="chartsLoading" class="spinner-border spinner-border-sm text-muted"></span>
            </div>
            <div class="card-body" style="position:relative;height:280px">
              <Line v-if="revenueChartData" :data="revenueChartData" :options="lineChartOptions" />
              <div v-else class="text-center text-muted py-5">Không có dữ liệu</div>
            </div>
          </div>
        </div>

        <!-- Top categories bar chart -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-bold d-flex align-items-center justify-content-between">
              <span>Top 5 Danh Mục Theo GMV</span>
              <span v-if="chartsLoading" class="spinner-border spinner-border-sm text-muted"></span>
            </div>
            <div class="card-body" style="position:relative;height:280px">
              <Bar v-if="categoryChartData" :data="categoryChartData" :options="barChartOptions" />
              <div v-else class="text-center text-muted py-5">Không có dữ liệu</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { adminFinanceService } from '@/services/adminFinance.service'
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

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
)

const overview = ref(null)
const dailySeries = ref([])
const loading = ref(true)
const chartsLoading = ref(false)
const loadError = ref('')
const revenueChartData = ref(null)
const categoryChartData = ref(null)

// Average commission per completed order
const avgCommissionPerOrder = computed(() => {
  if (!overview.value || !overview.value.completedOrders) return 0
  return overview.value.platformRevenue / overview.value.completedOrders
})

// ---------- Chart options ----------

const currencyTick = (val) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(val)

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          `${ctx.dataset.label}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(ctx.raw)}`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 10,
        callback: (val, idx, ticks) => {
          const label = ticks[idx]?.label ?? ''
          return label.length > 6 ? label.slice(5) : label
        },
      },
    },
    y: {
      ticks: { callback: (val) => currencyTick(val) },
    },
  },
}

const barChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(ctx.raw),
      },
    },
  },
  scales: {
    x: {
      ticks: { callback: (val) => currencyTick(val) },
    },
    y: { beginAtZero: true },
  },
}

// ---------- Chart builders ----------

function buildRevenueChart(raw) {
  if (!raw || !Array.isArray(raw)) return null
  return {
    labels: raw.map((r) => {
      try {
        return new Intl.DateTimeFormat('vi-VN', { month: 'short', day: 'numeric' }).format(new Date(r.date))
      } catch {
        return r.date
      }
    }),
    datasets: [
      {
        label: 'GMV',
        data: raw.map((r) => r.gmv ?? 0),
        borderColor: '#198754',
        backgroundColor: 'rgba(25,135,84,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: 'Doanh thu sàn',
        data: raw.map((r) => r.platformRevenue ?? 0),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: 'Seller net',
        data: raw.map((r) => r.sellerNet ?? 0),
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111,66,193,0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  }
}

function buildCategoryChart(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null
  const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1']
  return {
    labels: raw.map((r) => r.name ?? ''),
    datasets: [
      {
        label: 'GMV (VND)',
        data: raw.map((r) => r.gmv ?? 0),
        backgroundColor: raw.map((_, i) => colors[i % colors.length]),
        borderRadius: 6,
      },
    ],
  }
}

// ---------- Data loading ----------

async function loadOverview() {
  try {
    overview.value = await adminFinanceService.overview()
  } catch (e) {
    loadError.value = 'Không thể tải dữ liệu tài chính.'
  } finally {
    loading.value = false
  }
}

async function loadCharts() {
  chartsLoading.value = true
  try {
    const [dailyRes] = await Promise.all([
      adminFinanceService.daily(30),
    ])
    dailySeries.value = dailyRes || []
    revenueChartData.value = buildRevenueChart(dailySeries.value)
    categoryChartData.value = buildCategoryChart(overview.value?.topCategories)
  } catch {
    // charts are non-critical — leave empty
  } finally {
    chartsLoading.value = false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)
}

onMounted(async () => {
  await loadOverview()
  loadCharts()
})
</script>
