<script setup>
import { ref, onMounted, computed } from 'vue'
import { sellerOrderService } from '@/services/sellerOrder.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const notify = useNotifyStore()
const dialog = useDialogs()

const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(15)
const status = ref('')
const searchKeyword = ref('')
const loading = ref(false)

function vnd(value) {
  if (value == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

function formatDate(str) {
  if (!str) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(str))
  } catch {
    return str
  }
}

function statusConfig(s) {
  switch (s) {
    case 'PENDING':
      return { label: 'Chờ xác nhận', class: 'status-pending', icon: 'bi-clock-history' }
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', class: 'status-confirmed', icon: 'bi-check-circle-fill' }
    case 'PACKED':
      return { label: 'Đã đóng gói', class: 'status-packed', icon: 'bi-box-seam-fill' }
    case 'SHIPPING':
      return { label: 'Đang giao hàng', class: 'status-shipping', icon: 'bi-truck' }
    case 'DELIVERED':
      return { label: 'Đã giao tới nơi', class: 'status-delivered', icon: 'bi-geo-alt-fill' }
    case 'COMPLETED':
      return { label: 'Hoàn tất', class: 'status-completed', icon: 'bi-patch-check-fill' }
    case 'CANCELLED':
      return { label: 'Đã hủy đơn', class: 'status-cancelled', icon: 'bi-x-circle-fill' }
    case 'RETURNED':
      return { label: 'Hoàn trả hàng', class: 'status-returned', icon: 'bi-arrow-return-left' }
    default:
      return { label: s || 'N/A', class: 'status-default', icon: 'bi-info-circle' }
  }
}

function paymentConfig(method, pStatus) {
  const isPaid = pStatus === 'PAID'
  return {
    methodLabel: method || 'COD',
    statusLabel: isPaid ? 'Đã thanh toán' : pStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chưa thanh toán',
    statusClass: isPaid ? 'pay-paid' : pStatus === 'REFUNDED' ? 'pay-refunded' : 'pay-unpaid',
  }
}

async function load(showToast = false) {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (status.value) params.status = status.value
    if (searchKeyword.value.trim()) params.q = searchKeyword.value.trim()

    const res = await sellerOrderService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length

    if (showToast) {
      notify.push('Đã làm mới danh sách đơn hàng', 'success')
    }
  } catch (err) {
    notify.push('Không thể tải danh sách đơn hàng.', 'danger')
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (!searchKeyword.value.trim()) return items.value
  const q = searchKeyword.value.trim().toLowerCase()
  return items.value.filter(
    (o) =>
      (o.orderCode && o.orderCode.toLowerCase().includes(q)) ||
      (o.receiverName && o.receiverName.toLowerCase().includes(q)) ||
      (o.receiverPhone && o.receiverPhone.includes(q))
  )
})

// KPI Quick Counts
const kpiCounts = computed(() => {
  const all = items.value
  return {
    pending: all.filter((o) => o.status === 'PENDING').length,
    packed: all.filter((o) => o.status === 'CONFIRMED' || o.status === 'PACKED').length,
    shipping: all.filter((o) => o.status === 'SHIPPING').length,
    completed: all.filter((o) => o.status === 'COMPLETED').length,
  }
})

const nextStatuses = computed(() => (order) => {
  switch (order.status) {
    case 'PENDING':
      return [
        { v: 'CONFIRMED', l: 'Xác nhận đơn', icon: 'bi-check2-circle', primary: true },
        { v: 'CANCELLED', l: 'Hủy đơn', icon: 'bi-x-lg', danger: true },
      ]
    case 'CONFIRMED':
      return [
        { v: 'PACKED', l: 'Đóng gói xong', icon: 'bi-box-seam', primary: true },
        { v: 'CANCELLED', l: 'Hủy đơn', icon: 'bi-x-lg', danger: true },
      ]
    case 'PACKED':
      return [
        { v: 'SHIPPING', l: 'Giao cho shipper', icon: 'bi-truck', primary: true },
        { v: 'CANCELLED', l: 'Hủy đơn', icon: 'bi-x-lg', danger: true },
      ]
    case 'SHIPPING':
      return [{ v: 'DELIVERED', l: 'Xác nhận đã giao', icon: 'bi-geo-alt', primary: true }]
    case 'DELIVERED':
      return [{ v: 'COMPLETED', l: 'Hoàn tất đơn', icon: 'bi-patch-check', primary: true }]
    default:
      return []
  }
})

async function advance(order, nextStatus) {
  let note = ''
  if (nextStatus === 'CANCELLED') {
    note = await dialog.prompt(`Nhập lý do hủy đơn hàng "${order.orderCode}":`, {
      title: 'Xác nhận hủy đơn hàng',
      inputPlaceholder: 'Ví dụ: Hết hàng trong kho, Khách yêu cầu hủy...',
      confirmText: 'Xác nhận hủy',
      variant: 'danger',
    })
    if (!note || !note.trim()) return
  }

  try {
    await sellerOrderService.updateStatus(order.id, nextStatus, note)
    notify.push(`Đã cập nhật đơn hàng ${order.orderCode} sang trạng thái ${nextStatus}`, 'success')
    load()
  } catch (e) {
    notify.push('Không thể cập nhật trạng thái đơn hàng.', 'danger')
  }
}

function handleStatusFilter(s) {
  status.value = s
  page.value = 0
  load()
}

function copyOrderCode(code) {
  if (!code) return
  navigator.clipboard.writeText(code)
  notify.push(`Đã sao chép mã đơn: ${code}`, 'info')
}

onMounted(load)
</script>

<template>
  <div class="seller-orders-container">
    <!-- ── Hero Banner & Operational KPIs ────────────────── -->
    <div class="seller-hero-card mb-4">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1.5">
            <span class="seller-hero-pill">OPERATIONS HUB</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span> Đồng bộ tự động
            </span>
          </div>
          <h1 class="seller-hero-title">Quản Lý Đơn Hàng Gian Hàng</h1>
          <p class="seller-hero-desc">
            Theo dõi quy trình xử lý, đóng gói và điều phối vận chuyển đơn hàng theo thời gian thực
          </p>
        </div>

        <!-- Quick Operational Actions -->
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button class="seller-action-btn" @click="load(true)" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới
          </button>
          <router-link :to="{ name: 'seller-stats' }" class="seller-action-btn seller-action-btn-primary text-decoration-none">
            <i class="bi bi-graph-up-arrow me-1.5"></i>
            Báo cáo doanh thu
          </router-link>
        </div>
      </div>

      <!-- 4 Quick KPI Summary Cards -->
      <div class="row g-3 mt-2">
        <div class="col-6 col-lg-3">
          <div class="seller-kpi-tile" @click="handleStatusFilter('PENDING')">
            <div class="seller-kpi-icon bg-amber-50 text-amber-600">
              <i class="bi bi-clock-history"></i>
            </div>
            <div>
              <div class="seller-kpi-num text-amber-600">{{ kpiCounts.pending }}</div>
              <div class="seller-kpi-name">Chờ xác nhận</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="seller-kpi-tile" @click="handleStatusFilter('CONFIRMED')">
            <div class="seller-kpi-icon bg-indigo-50 text-indigo-600">
              <i class="bi bi-box-seam"></i>
            </div>
            <div>
              <div class="seller-kpi-num text-indigo-600">{{ kpiCounts.packed }}</div>
              <div class="seller-kpi-name">Cần đóng gói</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="seller-kpi-tile" @click="handleStatusFilter('SHIPPING')">
            <div class="seller-kpi-icon bg-blue-50 text-blue-600">
              <i class="bi bi-truck"></i>
            </div>
            <div>
              <div class="seller-kpi-num text-blue-600">{{ kpiCounts.shipping }}</div>
              <div class="seller-kpi-name">Đang vận chuyển</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="seller-kpi-tile" @click="handleStatusFilter('COMPLETED')">
            <div class="seller-kpi-icon bg-emerald-50 text-emerald-600">
              <i class="bi bi-patch-check-fill"></i>
            </div>
            <div>
              <div class="seller-kpi-num text-emerald-600">{{ kpiCounts.completed }}</div>
              <div class="seller-kpi-name">Hoàn tất thành công</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Filter & Search Toolbar ───────────────────────── -->
    <div class="seller-filter-card mb-4">
      <!-- Status Tabs Ribbon -->
      <div class="seller-status-tabs">
        <button
          v-for="tab in [
            { key: '', label: 'Tất cả đơn' },
            { key: 'PENDING', label: 'Chờ xác nhận' },
            { key: 'CONFIRMED', label: 'Đã xác nhận' },
            { key: 'PACKED', label: 'Đã đóng gói' },
            { key: 'SHIPPING', label: 'Đang giao' },
            { key: 'DELIVERED', label: 'Đã giao' },
            { key: 'COMPLETED', label: 'Hoàn tất' },
            { key: 'CANCELLED', label: 'Đã hủy' },
            { key: 'RETURNED', label: 'Hoàn trả' },
          ]"
          :key="tab.key"
          class="seller-tab-btn"
          :class="{ active: status === tab.key }"
          @click="handleStatusFilter(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input row -->
      <div class="d-flex align-items-center justify-content-between gap-3 p-3 pt-2 flex-wrap">
        <div class="seller-table-search flex-grow-1 max-w-md">
          <i class="bi bi-search text-slate-400"></i>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng, số điện thoại..."
            class="seller-table-search-input"
            @keyup.enter="load"
          />
          <button v-if="searchKeyword" class="btn btn-sm p-0 text-slate-400 hover:text-slate-600" @click="searchKeyword = ''; load()">
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="text-xs text-slate-500">
            Hiển thị <strong class="text-slate-800">{{ filteredItems.length }}</strong> đơn hàng
          </span>
        </div>
      </div>
    </div>

    <!-- ── Modern Orders Table ───────────────────────────── -->
    <div class="seller-table-card">
      <div class="table-responsive">
        <table class="seller-orders-table align-middle mb-0">
          <thead>
            <tr>
              <th style="width: 170px;">MÃ ĐƠN HÀNG</th>
              <th>KHÁCH HÀNG</th>
              <th>THANH TOÁN</th>
              <th>TRẠNG THÁI</th>
              <th class="text-end">TỔNG TIỀN</th>
              <th>NGÀY TẠO</th>
              <th class="text-end" style="width: 220px;">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton -->
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5 text-slate-400">
                <div class="spinner-border spinner-border-sm text-indigo-600 me-2" role="status"></div>
                <span class="text-xs font-semibold">Đang nạp dữ liệu đơn hàng...</span>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="!filteredItems.length">
              <td colspan="7" class="text-center py-5">
                <div class="seller-empty-state">
                  <div class="seller-empty-icon">
                    <i class="bi bi-inbox-fill"></i>
                  </div>
                  <h4 class="text-sm font-bold text-slate-700 mt-2 mb-1">Chưa có đơn hàng nào</h4>
                  <p class="text-xs text-slate-400 mb-0">
                    {{ status ? 'Không tìm thấy đơn hàng ở trạng thái này' : 'Các đơn hàng mới của khách sẽ xuất hiện ở đây' }}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Order Rows -->
            <tr v-for="o in filteredItems" :key="o.id" class="seller-order-row">
              <!-- Order Code -->
              <td>
                <div class="d-flex align-items-center gap-1.5">
                  <router-link
                    :to="{ name: 'seller-order-detail', params: { id: o.id } }"
                    class="seller-order-code text-decoration-none"
                    title="Bấm để xem chi tiết đơn hàng"
                  >
                    <code>{{ o.orderCode }}</code>
                  </router-link>
                  <button
                    class="seller-copy-btn"
                    title="Sao chép mã đơn"
                    @click="copyOrderCode(o.orderCode)"
                  >
                    <i class="bi bi-copy"></i>
                  </button>
                </div>
              </td>

              <!-- Customer Info -->
              <td>
                <div class="seller-customer-cell">
                  <div class="seller-customer-avatar">
                    {{ (o.receiverName || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div class="d-flex flex-column leading-tight">
                    <span class="seller-customer-name">{{ o.receiverName || 'Khách vãng lai' }}</span>
                    <span v-if="o.receiverPhone" class="seller-customer-phone">
                      <i class="bi bi-telephone me-1"></i>{{ o.receiverPhone }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Payment Info -->
              <td>
                <div class="d-flex flex-column gap-1 leading-tight">
                  <span class="seller-pay-method">{{ o.paymentMethod || 'COD' }}</span>
                  <span
                    class="seller-pay-badge"
                    :class="paymentConfig(o.paymentMethod, o.paymentStatus).statusClass"
                  >
                    {{ paymentConfig(o.paymentMethod, o.paymentStatus).statusLabel }}
                  </span>
                </div>
              </td>

              <!-- Status Badge -->
              <td>
                <span class="seller-status-chip" :class="statusConfig(o.status).class">
                  <i :class="['bi me-1', statusConfig(o.status).icon]"></i>
                  {{ statusConfig(o.status).label }}
                </span>
              </td>

              <!-- Total Amount -->
              <td class="text-end">
                <div class="seller-total-price">{{ vnd(o.totalAmount) }}</div>
              </td>

              <!-- Created Date -->
              <td class="seller-created-date">
                {{ formatDate(o.createdAt) }}
              </td>

              <!-- Action Buttons -->
              <td class="text-end">
                <div class="d-flex align-items-center justify-content-end gap-1.5">
                  <template v-for="t in nextStatuses(o)" :key="t.v">
                    <button
                      v-if="t.primary"
                      class="seller-btn-advance seller-btn-advance-primary"
                      @click="advance(o, t.v)"
                    >
                      <i :class="['bi me-1', t.icon]"></i> {{ t.l }}
                    </button>
                    <button
                      v-else-if="t.danger"
                      class="seller-btn-advance seller-btn-advance-danger"
                      @click="advance(o, t.v)"
                      title="Hủy đơn hàng"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </template>

                  <router-link
                    :to="{ name: 'seller-order-detail', params: { id: o.id } }"
                    class="seller-btn-view"
                    title="Xem chi tiết đơn hàng"
                  >
                    <i class="bi bi-eye"></i>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div v-if="totalPages > 1" class="seller-pagination-bar d-flex align-items-center justify-content-between p-3">
        <span class="text-xs text-slate-500">
          Trang <strong class="text-slate-800">{{ page + 1 }}</strong> / <strong>{{ totalPages }}</strong>
        </span>
        <div class="d-flex gap-1.5">
          <button
            class="seller-page-btn"
            :disabled="page === 0"
            @click="page--; load()"
          >
            <i class="bi bi-chevron-left me-1"></i> Trước
          </button>
          <button
            class="seller-page-btn"
            :disabled="page + 1 >= totalPages"
            @click="page++; load()"
          >
            Sau <i class="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seller-orders-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Hero Operational Hub ───────────────────────────────── */
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
  font-size: 0.65rem;
  font-weight: 600;
  color: #34d399;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.seller-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.seller-hero-title {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
  color: #ffffff;
}

.seller-hero-desc {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin-bottom: 0;
}

.seller-action-btn {
  font-size: 0.78rem;
  font-weight: 600;
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s;
}

.seller-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.seller-action-btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
}

.seller-action-btn-primary:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
}

/* ── KPI Tiles ─────────────────────────────────────────── */
.seller-kpi-tile {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.seller-kpi-tile:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.seller-kpi-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.seller-kpi-num {
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.1;
}

.seller-kpi-name {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Filter Toolbar ────────────────────────────────────── */
.seller-filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.seller-status-tabs {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid #f1f5f9;
  padding: 0.35rem 0.5rem 0;
  scrollbar-width: none;
}

.seller-tab-btn {
  padding: 0.65rem 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}

.seller-tab-btn:hover {
  color: #1e293b;
}

.seller-tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
  font-weight: 700;
}

.seller-table-search {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seller-table-search-input {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  outline: none;
  width: 100%;
}

/* ── Table Card ────────────────────────────────────────── */
.seller-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.seller-orders-table {
  width: 100%;
}

.seller-orders-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.seller-orders-table th {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.06em;
  padding: 0.85rem 1.25rem;
  border: none;
}

.seller-orders-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.seller-order-row {
  transition: background 0.15s;
}

.seller-order-row:hover {
  background: #fbfcfe;
}

.seller-order-code {
  font-size: 0.78rem;
  font-weight: 700;
  color: #4f46e5;
  background: #eef2ff;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.seller-copy-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 0.2rem;
  cursor: pointer;
}

.seller-copy-btn:hover {
  color: #4f46e5;
}

.seller-customer-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.seller-customer-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.seller-customer-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1e293b;
}

.seller-customer-phone {
  font-size: 0.72rem;
  color: #64748b;
}

.seller-pay-method {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
}

.seller-pay-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  display: inline-block;
  width: fit-content;
}

.pay-paid {
  background: #ecfdf5;
  color: #059669;
}

.pay-unpaid {
  background: #fffbeb;
  color: #d97706;
}

.pay-refunded {
  background: #f5f3ff;
  color: #7c3aed;
}

/* Status Chips */
.seller-status-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

.status-pending { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
.status-confirmed { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
.status-packed { background: #eef2ff; color: #4338ca; border: 1px solid #e0e7ff; }
.status-shipping { background: #ecfeff; color: #0e7490; border: 1px solid #cffafe; }
.status-delivered { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.status-completed { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.status-cancelled { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
.status-returned { background: #faf5ff; color: #7e22ce; border: 1px solid #f3e8ff; }
.status-default { background: #f1f5f9; color: #475569; }

.seller-total-price {
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
  font-family: monospace;
}

.seller-created-date {
  font-size: 0.75rem;
  color: #64748b;
}

/* Buttons */
.seller-btn-advance {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s;
}

.seller-btn-advance-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.seller-btn-advance-primary:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
  color: #ffffff;
}

.seller-btn-advance-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 0.35rem 0.55rem;
}

.seller-btn-advance-danger:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.seller-btn-view {
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.15s;
}

.seller-btn-view:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.seller-page-btn {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.seller-page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.seller-page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spinAnim 1s linear infinite;
}

@keyframes spinAnim {
  100% { transform: rotate(360deg); }
}
</style>
