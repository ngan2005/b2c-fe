<template>
  <div class="seller-wallet-page p-3 p-md-4">
    <!-- Breadcrumb & Header -->
    <div class="d-flex flex-column flex-md-row md:items-center justify-content-between gap-3 mb-4">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1 text-xs text-slate-500">
            <li class="breadcrumb-item"><router-link :to="{ name: 'seller-dashboard' }" class="text-slate-500 hover:text-indigo-600">Kênh Người Bán</router-link></li>
            <li class="breadcrumb-item active text-slate-800 font-semibold" aria-current="page">Ví & Quyết Toán</li>
          </ol>
        </nav>
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight d-flex align-items-center gap-2">
          <span>Ví Tiền & Quyết Toán Doanh Thu</span>
          <span class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-full font-medium">Escrow Bảo Đảm</span>
        </h1>
        <p class="text-xs md:text-sm text-slate-500 mt-1 mb-0">
          Theo dõi số dư khả dụng, tiền giữ bảo đảm Escrow và lịch sử quyết toán tiền về tài khoản ngân hàng.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm px-3 py-2 d-inline-flex align-items-center gap-2 rounded-xl"
          :disabled="loading"
          @click="loadAll"
        >
          <i class="bi bi-arrow-clockwise" :class="{ 'spin-anim': loading }"></i>
          <span>Làm mới</span>
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm px-3.5 py-2 d-inline-flex align-items-center gap-2 rounded-xl shadow-sm"
          :disabled="loading || readyAmount <= 0"
          @click="openWithdrawModal"
        >
          <i class="bi bi-bank"></i>
          <span class="font-semibold">Yêu Cầu Rút Tiền</span>
        </button>
      </div>
    </div>

    <!-- Escrow Mechanism Info Card -->
    <div class="mb-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 p-3.5 rounded-2xl border border-blue-100/80 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 text-xs text-slate-600">
      <div class="d-flex align-items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-blue-600 text-white d-flex align-items-center justify-content-center shrink-0 shadow-sm">
          <i class="bi bi-shield-lock-fill text-sm"></i>
        </div>
        <div>
          <span class="font-bold text-slate-800">Cơ chế Tạm giữ Escrow An Toàn:</span>
          <span> Tiền hàng từ các đơn giao thành công được tạm giữ an toàn trong thời gian đối soát. Khi đơn đạt điều kiện hoặc Shop yêu cầu rút tiền, sàn sẽ đối soát và giải ngân ngay về tài khoản ngân hàng.</span>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3 shrink-0 text-slate-500">
        <span class="d-inline-flex align-items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Đơn Hoàn Tất</span>
        <i class="bi bi-arrow-right text-slate-400"></i>
        <span class="d-inline-flex align-items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Tạm Giữ Escrow</span>
        <i class="bi bi-arrow-right text-slate-400"></i>
        <span class="d-inline-flex align-items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Giải Ngân</span>
      </div>
    </div>

    <!-- 4 Bento Balance Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
      <!-- Card 1: Khả dụng -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
        <div class="d-flex align-items-center justify-content-between text-slate-500 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Số Dư Khả Dụng</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 d-flex align-items-center justify-content-center">
            <i class="bi bi-wallet2 text-base"></i>
          </div>
        </div>
        <div class="text-xl md:text-2xl font-black text-emerald-600 tracking-tight font-mono">
          {{ formatVnd(wallet.totalReady) }}
        </div>
        <div class="mt-2 text-[11px] text-slate-500 d-flex align-items-center justify-content-between">
          <span>Sẵn sàng rút về tài khoản</span>
          <span v-if="readyAmount > 0" class="badge bg-emerald-100 text-emerald-800 font-bold">Có thể rút</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
      </div>

      <!-- Card 2: Đang tạm giữ Escrow -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
        <div class="d-flex align-items-center justify-content-between text-slate-500 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Đang Giữ Escrow</span>
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 d-flex align-items-center justify-content-center">
            <i class="bi bi-hourglass-split text-base"></i>
          </div>
        </div>
        <div class="text-xl md:text-2xl font-black text-amber-600 tracking-tight font-mono">
          {{ formatVnd(wallet.totalPending) }}
        </div>
        <div class="mt-2 text-[11px] text-slate-500 d-flex align-items-center justify-content-between">
          <span>Tiền đơn hàng đang đối soát</span>
          <span class="badge bg-amber-50 text-amber-700 font-mono">PENDING</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
      </div>

      <!-- Card 3: Đã quyết toán -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
        <div class="d-flex align-items-center justify-content-between text-slate-500 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Đã Thanh Toán</span>
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 d-flex align-items-center justify-content-center">
            <i class="bi bi-check2-circle text-base"></i>
          </div>
        </div>
        <div class="text-xl md:text-2xl font-black text-blue-600 tracking-tight font-mono">
          {{ formatVnd(wallet.totalPaid) }}
        </div>
        <div class="mt-2 text-[11px] text-slate-500 d-flex align-items-center justify-content-between">
          <span>Đã chuyển về ngân hàng</span>
          <span class="badge bg-blue-50 text-blue-700 font-mono">PAID</span>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
      </div>

      <!-- Card 4: Tổng doanh thu tích lũy -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
        <div class="d-flex align-items-center justify-content-between text-slate-500 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Doanh Thu Tích Lũy</span>
          <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 d-flex align-items-center justify-content-center">
            <i class="bi bi-graph-up-arrow text-base"></i>
          </div>
        </div>
        <div class="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-mono">
          {{ formatVnd(wallet.lifetimeEarned) }}
        </div>
        <div class="mt-2 text-[11px] text-slate-500 d-flex align-items-center justify-content-between">
          <span>Tổng thu nhập ròng từ trước tới nay</span>
          <i class="bi bi-stars text-purple-500"></i>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
      </div>
    </div>

    <!-- Financial Ledger & History Section -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <!-- Toolbar & Status Tabs -->
      <div class="p-3.5 border-b border-slate-100 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-1.5 overflow-x-auto pb-1 pb-md-0">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            type="button"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 d-inline-flex align-items-center gap-1.5"
            :class="selectedStatus === tab.value
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'"
            @click="setStatusFilter(tab.value)"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.badge"
              class="px-1.5 py-0.2 rounded-full text-[10px]"
              :class="selectedStatus === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'"
            >
              {{ tab.badge }}
            </span>
          </button>
        </div>

        <div class="text-xs text-slate-500">
          Hiển thị <strong>{{ payouts.length }}</strong> / <strong>{{ totalElements }}</strong> bản ghi quyết toán
        </div>
      </div>

      <!-- Ledger Table -->
      <div class="table-responsive">
        <table class="table align-middle mb-0 text-sm">
          <thead class="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th scope="col" class="py-3 px-3.5">Mã Phiếu / Ngày</th>
              <th scope="col" class="py-3 px-3">Mã Đơn Hàng</th>
              <th scope="col" class="py-3 px-3 text-end">Doanh Thu Gốc</th>
              <th scope="col" class="py-3 px-3 text-end">Phí Sàn</th>
              <th scope="col" class="py-3 px-3 text-end">Thực Nhận (Net)</th>
              <th scope="col" class="py-3 px-3 text-center">Trạng Thái</th>
              <th scope="col" class="py-3 px-3.5 text-slate-600">Mã Giao Dịch Ngân Hàng</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading skeleton -->
            <tr v-if="loading && payouts.length === 0">
              <td colspan="7" class="text-center py-5 text-slate-400">
                <i class="bi bi-arrow-clockwise spin-anim text-xl d-block mb-2"></i>
                <span>Đang tải dữ liệu quyết toán tài chính...</span>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="!loading && payouts.length === 0">
              <td colspan="7" class="text-center py-5 text-slate-400">
                <div class="w-12 h-12 mx-auto mb-2 rounded-2xl bg-slate-100 d-flex align-items-center justify-content-center text-slate-400">
                  <i class="bi bi-wallet2 text-2xl"></i>
                </div>
                <div class="font-semibold text-slate-700">Chưa có bản ghi quyết toán nào</div>
                <div class="text-xs text-slate-400 mt-1">Khi khách hàng đặt đơn và giao thành công, doanh thu sẽ hiển thị ở đây.</div>
              </td>
            </tr>

            <!-- Payout items -->
            <tr v-for="p in payouts" :key="p.id" class="hover:bg-slate-50/60 transition-colors">
              <!-- Mã Phiếu & Ngày -->
              <td class="py-3 px-3.5">
                <div class="font-mono font-bold text-slate-800 text-xs">#PAY-{{ String(p.id).padStart(6, '0') }}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">{{ formatDateTime(p.createdAt) }}</div>
              </td>

              <!-- Mã Đơn Hàng -->
              <td class="py-3 px-3">
                <router-link
                  v-if="p.orderId"
                  :to="{ name: 'seller-order-detail', params: { id: p.orderId } }"
                  class="font-mono text-xs font-semibold text-indigo-600 hover:text-indigo-800 d-inline-flex align-items-center gap-1"
                >
                  <span>{{ p.orderCode || ('Đơn #' + p.orderId) }}</span>
                  <i class="bi bi-box-arrow-up-right text-[10px]"></i>
                </router-link>
                <span v-else class="text-slate-400 text-xs">—</span>
              </td>

              <!-- Doanh thu gốc -->
              <td class="py-3 px-3 text-end font-mono text-xs text-slate-700">
                {{ formatVnd(p.grossAmount) }}
              </td>

              <!-- Phí sàn -->
              <td class="py-3 px-3 text-end font-mono text-xs text-rose-500">
                -{{ formatVnd(p.commissionAmount) }}
              </td>

              <!-- Thực nhận -->
              <td class="py-3 px-3 text-end font-mono text-sm font-bold text-emerald-600">
                +{{ formatVnd(p.netAmount) }}
              </td>

              <!-- Trạng thái -->
              <td class="py-3 px-3 text-center">
                <span
                  class="badge px-2.5 py-1 rounded-full text-xs font-medium font-mono"
                  :class="getStatusBadgeClass(p.status)"
                >
                  <i :class="getStatusIcon(p.status)" class="me-1"></i>
                  {{ getStatusLabel(p.status) }}
                </span>
              </td>

              <!-- Bank Reference -->
              <td class="py-3 px-3.5 font-mono text-xs">
                <span v-if="p.bankReference" class="badge bg-slate-100 text-slate-700 border border-slate-200">
                  <i class="bi bi-hash text-slate-400"></i>{{ p.bankReference }}
                </span>
                <span v-else-if="p.status === 'READY'" class="text-indigo-500 text-[11px]">
                  <i class="bi bi-clock me-1"></i>Sàn đang xử lý chuyển khoản
                </span>
                <span v-else-if="p.status === 'PENDING'" class="text-amber-500 text-[11px]">
                  <i class="bi bi-shield me-1"></i>Đang trong thời gian Escrow
                </span>
                <span v-else class="text-slate-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="p-3 border-t border-slate-100 d-flex align-items-center justify-content-between">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-xl px-3"
          :disabled="page <= 0 || loading"
          @click="changePage(page - 1)"
        >
          Trang trước
        </button>
        <span class="text-xs text-slate-500 font-medium">Trang {{ page + 1 }} / {{ totalPages }}</span>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-xl px-3"
          :disabled="page >= totalPages - 1 || loading"
          @click="changePage(page + 1)"
        >
          Trang sau
        </button>
      </div>
    </div>

    <!-- Modal Yêu Cầu Rút Tiền -->
    <div
      v-if="showWithdrawModal"
      class="fixed inset-0 z-50 d-flex align-items-center justify-content-center bg-black/40 backdrop-blur-xs p-3"
    >
      <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div class="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-white/20 d-flex align-items-center justify-content-center text-white">
              <i class="bi bi-bank text-lg"></i>
            </div>
            <h3 class="text-base font-bold mb-0">Xác Nhận Yêu Cầu Rút Tiền</h3>
          </div>
          <button type="button" class="btn-close btn-close-white" @click="showWithdrawModal = false"></button>
        </div>

        <div class="p-4 space-y-3.5">
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Số Tiền Rút Khả Dụng</div>
            <div class="text-2xl font-black text-emerald-600 font-mono">
              {{ formatVnd(wallet.totalReady) }}
            </div>
            <div class="text-xs text-slate-400 mt-1">
              Toàn bộ số dư khả dụng sẽ được chuyển sang trạng thái <strong>CHỜ CHUYỂN KHOẢN (READY)</strong> để Admin giải ngân về tài khoản ngân hàng của bạn.
            </div>
          </div>

          <div class="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 d-flex gap-2.5">
            <i class="bi bi-info-circle-fill text-blue-600 text-base shrink-0"></i>
            <div>
              Thời gian sàn kiểm duyệt và chuyển khoản: trong vòng <strong>24h làm việc</strong>. Sau khi chuyển, mã đối soát ngân hàng (Bank Reference) sẽ hiển thị trong sổ cái.
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-end gap-2 pt-2">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm rounded-xl px-3 py-2"
              :disabled="withdrawing"
              @click="showWithdrawModal = false"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm rounded-xl px-4 py-2 d-inline-flex align-items-center gap-2 font-semibold shadow-sm"
              :disabled="withdrawing"
              @click="confirmWithdraw"
            >
              <i v-if="withdrawing" class="bi bi-arrow-clockwise spin-anim"></i>
              <span>{{ withdrawing ? 'Đang gửi yêu cầu...' : 'Xác Nhận Rút Tiền' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sellerPayoutService } from '@/services/sellerPayout.service'
import { useNotifyStore } from '@/stores/notify'

const notify = useNotifyStore()

const loading = ref(false)
const withdrawing = ref(false)
const showWithdrawModal = ref(false)

const wallet = ref({
  totalPending: 0,
  totalReady: 0,
  totalPaid: 0,
  lifetimeEarned: 0,
  shopName: '',
})

const payouts = ref([])
const selectedStatus = ref('') // empty = all
const page = ref(0)
const size = ref(15)
const totalPages = ref(0)
const totalElements = ref(0)

const readyAmount = computed(() => Number(wallet.value.totalReady || 0))

const filterTabs = computed(() => [
  { label: 'Tất Cả', value: '' },
  { label: 'Tạm Giữ Escrow', value: 'PENDING' },
  { label: 'Chờ Chuyển Khoản', value: 'READY' },
  { label: 'Đã Nhận Tiền', value: 'PAID' },
  { label: 'Đã Hủy', value: 'CANCELLED' },
])

async function loadWallet() {
  try {
    const res = await sellerPayoutService.getWallet()
    const data = res.data || res
    wallet.value = {
      totalPending: data.totalPending ?? 0,
      totalReady: data.totalReady ?? 0,
      totalPaid: data.totalPaid ?? 0,
      lifetimeEarned: data.lifetimeEarned ?? 0,
      shopName: data.shopName ?? '',
    }
  } catch (err) {
    console.error('Failed to load seller wallet:', err)
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
    }
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    const res = await sellerPayoutService.getHistory(params)
    const pageData = res.data || res
    payouts.value = pageData.content || pageData.items || []
    totalPages.value = pageData.totalPages ?? 0
    totalElements.value = pageData.totalElements ?? payouts.value.length
  } catch (err) {
    console.error('Failed to load payout history:', err)
    notify.push('Không thể tải lịch sử quyết toán. Vui lòng thử lại!', 'danger')
  } finally {
    loading.value = false
  }
}

async function loadAll() {
  await Promise.all([loadWallet(), loadHistory()])
}

function setStatusFilter(status) {
  if (selectedStatus.value === status) return
  selectedStatus.value = status
  page.value = 0
  loadHistory()
}

function changePage(newPage) {
  if (newPage < 0 || newPage >= totalPages.value) return
  page.value = newPage
  loadHistory()
}

function openWithdrawModal() {
  if (readyAmount.value <= 0) {
    notify.push('Hiện không có số dư khả dụng nào để rút tiền!', 'warning')
    return
  }
  showWithdrawModal.value = true
}

async function confirmWithdraw() {
  withdrawing.value = true
  try {
    await sellerPayoutService.requestPayout()
    notify.push('Yêu cầu rút tiền thành công! Admin sẽ xử lý chuyển khoản sớm.', 'success')
    showWithdrawModal.value = false
    await loadAll()
  } catch (err) {
    console.error('Failed to request payout:', err)
    const msg = err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu rút tiền. Vui lòng thử lại!'
    notify.push(msg, 'danger')
  } finally {
    withdrawing.value = false
  }
}

function formatVnd(val) {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(val) + ' ₫'
}

function formatDateTime(dt) {
  if (!dt) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dt))
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'READY':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
    case 'PAID':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-700 border border-slate-200'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'PENDING':
      return 'bi-hourglass-split'
    case 'READY':
      return 'bi-clock-history'
    case 'PAID':
      return 'bi-check-circle-fill'
    case 'CANCELLED':
      return 'bi-x-circle-fill'
    default:
      return 'bi-circle'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'PENDING':
      return 'Tạm Giữ Escrow'
    case 'READY':
      return 'Chờ Chuyển Khoản'
    case 'PAID':
      return 'Đã Chuyển Khoản'
    case 'CANCELLED':
      return 'Đã Hủy'
    default:
      return status
  }
}

onMounted(loadAll)
</script>

<style scoped>
.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

