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

      <!-- Row 4: Payout Management & Escrow Auditing -->
      <div class="card border-0 shadow-sm rounded-2xl overflow-hidden">
        <div class="card-header bg-white py-3.5 px-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 border-bottom">
          <div>
            <div class="fw-bold text-slate-800 d-flex align-items-center gap-2">
              <i class="bi bi-wallet2 text-indigo-600"></i>
              <span>Sổ Cái Đối Soát & Giải Ngân Cho Seller</span>
              <span class="badge bg-indigo-50 text-indigo-700 text-xs font-mono">Escrow Settlement</span>
            </div>
            <div class="text-xs text-slate-400 mt-0.5">Xử lý yêu cầu rút tiền của Seller và ghi nhận mã đối soát ngân hàng</div>
          </div>

          <!-- Status Filters -->
          <div class="d-flex align-items-center gap-1.5 flex-wrap">
            <button
              v-for="st in payoutStatusTabs"
              :key="st.value"
              type="button"
              class="btn btn-sm rounded-xl px-3 py-1 font-semibold text-xs"
              :class="selectedPayoutStatus === st.value ? 'btn-dark' : 'btn-outline-secondary'"
              @click="setPayoutStatus(st.value)"
            >
              {{ st.label }}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary rounded-xl px-2.5 py-1"
              :disabled="payoutsLoading"
              @click="loadPayouts"
            >
              <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': payoutsLoading }"></i>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th class="py-3 px-3.5">Mã Phiếu / Ngày</th>
                <th class="py-3 px-3">Shop / Seller</th>
                <th class="py-3 px-3">Mã Đơn Hàng</th>
                <th class="py-3 px-3 text-end">Doanh Thu Gốc</th>
                <th class="py-3 px-3 text-end">Hoa Hồng Sàn</th>
                <th class="py-3 px-3 text-end">Tiền Chuyển Seller</th>
                <th class="py-3 px-3 text-center">Trạng Thái</th>
                <th class="py-3 px-3.5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="payoutsLoading && payouts.length === 0">
                <td colspan="8" class="text-center py-4 text-slate-400">
                  <span class="spinner-border spinner-border-sm me-2"></span> Đang tải danh sách quyết toán...
                </td>
              </tr>
              <tr v-else-if="!payoutsLoading && payouts.length === 0">
                <td colspan="8" class="text-center py-4 text-slate-400">
                  Không tìm thấy bản ghi quyết toán nào phù hợp.
                </td>
              </tr>
              <tr v-for="p in payouts" :key="p.id">
                <td class="py-3 px-3.5">
                  <div class="font-mono font-bold text-slate-800 text-xs">#PAY-{{ String(p.id).padStart(6, '0') }}</div>
                  <div class="text-[11px] text-slate-400">{{ formatDateTime(p.createdAt) }}</div>
                </td>
                <td class="py-3 px-3">
                  <span class="fw-semibold text-slate-800">{{ p.shopName || ('Seller #' + p.sellerId) }}</span>
                </td>
                <td class="py-3 px-3">
                  <span class="badge bg-slate-100 text-slate-700 font-mono">{{ p.orderCode || ('Đơn #' + p.orderId) }}</span>
                </td>
                <td class="py-3 px-3 text-end font-mono text-xs">
                  {{ formatCurrency(p.grossAmount) }}
                </td>
                <td class="py-3 px-3 text-end font-mono text-xs text-rose-500">
                  -{{ formatCurrency(p.commissionAmount) }}
                </td>
                <td class="py-3 px-3 text-end font-mono text-sm font-bold text-emerald-600">
                  {{ formatCurrency(p.netAmount) }}
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="badge px-2.5 py-1 rounded-full text-xs font-mono" :class="getPayoutBadgeClass(p.status)">
                    {{ getPayoutLabel(p.status) }}
                  </span>
                  <div v-if="p.bankReference" class="text-[10px] font-mono text-slate-400 mt-0.5">
                    Ref: {{ p.bankReference }}
                  </div>
                </td>
                <td class="py-3 px-3.5 text-center">
                  <div class="d-inline-flex gap-1.5">
                    <button
                      v-if="p.status === 'READY' || p.status === 'PENDING'"
                      type="button"
                      class="btn btn-sm btn-success rounded-xl px-2.5 py-1 text-xs fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                      @click="openDisburseModal(p)"
                    >
                      <i class="bi bi-send-check"></i>
                      <span>Giải Ngân</span>
                    </button>
                    <span v-else-if="p.status === 'PAID'" class="badge bg-emerald-50 text-emerald-700 text-xs">
                      <i class="bi bi-check2-all me-1"></i>Đã Chuyển
                    </span>
                    <span v-else class="text-slate-400 text-xs">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Giải Ngân Cho Seller -->
    <div
      v-if="showDisburseModal"
      class="fixed inset-0 z-50 d-flex align-items-center justify-content-center bg-black/40 backdrop-blur-xs p-3"
    >
      <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div class="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bank text-xl"></i>
            <h3 class="text-base font-bold mb-0">Xác Nhận Giải Ngân Tiền Cho Seller</h3>
          </div>
          <button type="button" class="btn-close btn-close-white" @click="showDisburseModal = false"></button>
        </div>

        <div class="p-4 space-y-3">
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div class="text-xs text-slate-500 mb-1">Mã Phiếu Quyết Toán</div>
            <div class="font-mono font-bold text-slate-800">#PAY-{{ String(selectedPayout?.id).padStart(6, '0') }}</div>
            <div class="d-flex justify-content-between mt-2 text-xs">
              <span class="text-slate-500">Shop Nhận:</span>
              <span class="font-semibold text-slate-800">{{ selectedPayout?.shopName || ('Seller #' + selectedPayout?.sellerId) }}</span>
            </div>
            <div class="d-flex justify-content-between mt-1 text-xs">
              <span class="text-slate-500">Số tiền chuyển:</span>
              <span class="font-mono font-bold text-emerald-600 text-sm">{{ formatCurrency(selectedPayout?.netAmount) }}</span>
            </div>
          </div>

          <div>
            <label class="form-label text-xs font-semibold text-slate-700">Mã Giao Dịch Ngân Hàng (Bank Reference) <span class="text-danger">*</span></label>
            <input
              v-model="disburseBankRef"
              type="text"
              class="form-control form-control-sm rounded-xl font-mono"
              placeholder="VD: MB-20261107-987654 hoặc VCB-FT123"
            />
            <div class="form-text text-[11px] text-slate-400">
              Nhập mã ủy nhiệm chi / mã giao dịch chuyển khoản thành công của ngân hàng.
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-end gap-2 pt-2">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm rounded-xl px-3"
              :disabled="disbursing"
              @click="showDisburseModal = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-success btn-sm rounded-xl px-4 py-2 font-semibold shadow-xs d-inline-flex align-items-center gap-1.5"
              :disabled="disbursing || !disburseBankRef.trim()"
              @click="confirmDisburse"
            >
              <span v-if="disbursing" class="spinner-border spinner-border-sm"></span>
              <span>{{ disbursing ? 'Đang xử lý...' : 'Xác Nhận Đã Chuyển Khoản' }}</span>
            </button>
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

function formatDateTime(dt) {
  if (!dt) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dt))
}

// ---------- Payouts management ----------
const payouts = ref([])
const payoutsLoading = ref(false)
const selectedPayoutStatus = ref('')
const showDisburseModal = ref(false)
const selectedPayout = ref(null)
const disburseBankRef = ref('')
const disbursing = ref(false)

const payoutStatusTabs = [
  { label: 'Tất Cả', value: '' },
  { label: 'Chờ Giải Ngân', value: 'READY' },
  { label: 'Tạm Giữ Escrow', value: 'PENDING' },
  { label: 'Đã Chuyển Tiền', value: 'PAID' },
  { label: 'Đã Hủy', value: 'CANCELLED' },
]

async function loadPayouts() {
  payoutsLoading.value = true
  try {
    const params = { page: 0, size: 30 }
    if (selectedPayoutStatus.value) {
      params.status = selectedPayoutStatus.value
    }
    const res = await adminFinanceService.listPayouts(params)
    const pageData = res.data || res
    payouts.value = pageData.content || pageData.items || []
  } catch (err) {
    console.error('Failed to load payouts:', err)
  } finally {
    payoutsLoading.value = false
  }
}

function setPayoutStatus(status) {
  if (selectedPayoutStatus.value === status) return
  selectedPayoutStatus.value = status
  loadPayouts()
}

function openDisburseModal(p) {
  selectedPayout.value = p
  disburseBankRef.value = 'MB-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100000 + Math.random() * 900000)
  showDisburseModal.value = true
}

async function confirmDisburse() {
  if (!selectedPayout.value || !disburseBankRef.value.trim()) return
  disbursing.value = true
  try {
    await adminFinanceService.markPaid(selectedPayout.value.id, disburseBankRef.value.trim())
    showDisburseModal.value = false
    await Promise.all([loadOverview(), loadPayouts()])
  } catch (err) {
    console.error('Failed to disburse payout:', err)
  } finally {
    disbursing.value = false
  }
}

function getPayoutBadgeClass(status) {
  switch (status) {
    case 'READY':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'PAID':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getPayoutLabel(status) {
  switch (status) {
    case 'READY':
      return 'Chờ Giải Ngân'
    case 'PENDING':
      return 'Tạm Giữ Escrow'
    case 'PAID':
      return 'Đã Chuyển Khoản'
    case 'CANCELLED':
      return 'Đã Hủy'
    default:
      return status
  }
}

onMounted(async () => {
  await loadOverview()
  loadCharts()
  loadPayouts()
})
</script>
