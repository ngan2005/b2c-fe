<template>
  <div class="nomall-account-page py-4">
    <div class="container">
      <!-- Breadcrumb -->
      <nav class="nomall-breadcrumb mb-4" aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item">
            <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          </li>
          <li class="breadcrumb-item">
            <router-link :to="{ name: 'account-profile' }">Tài khoản</router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Đơn mua</li>
        </ol>
      </nav>

      <div class="row g-4">
        <!-- Sidebar -->
        <div class="col-lg-3">
          <AccountSidebar />
        </div>

        <!-- Main Content -->
        <div class="col-lg-9">
          <div class="nomall-account-card">
            <!-- Header -->
            <div class="nomall-account-header">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h1 class="nomall-account-title mb-1">Đơn Mua Của Tôi</h1>
                  <p class="nomall-account-subtitle mb-0">Theo dõi tiến độ đơn hàng và lịch sử mua sắm của bạn</p>
                </div>
              </div>
            </div>

            <!-- Status Tabs -->
            <div class="order-status-tabs mb-4">
              <div class="d-flex gap-2 flex-wrap pb-2 border-bottom">
                <button
                  v-for="tab in statusTabs"
                  :key="tab.value"
                  type="button"
                  class="order-tab-btn"
                  :class="{ active: selectedStatus === tab.value }"
                  @click="onSelectStatus(tab.value)"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <LoadingSpinner v-if="loading" text="Đang tải danh sách đơn hàng..." />
            <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchOrders" />
            <EmptyState
              v-else-if="orders.length === 0"
              icon="bi bi-bag-x"
              title="Chưa có đơn hàng nào"
              description="Bạn chưa có đơn hàng nào trong mục này."
            >
              <template #action>
                <router-link :to="{ name: 'products' }" class="nomall-btn-primary text-decoration-none">
                  <i class="bi bi-cart-plus me-1"></i> Khám phá sản phẩm
                </router-link>
              </template>
            </EmptyState>

            <!-- Orders list -->
            <div v-else class="d-flex flex-column gap-3">
              <div v-for="order in orders" :key="order.id" class="order-item-card">
                <!-- Order Header -->
                <div class="order-item-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-receipt text-danger"></i>
                    <span class="order-code">Mã đơn: #{{ order.orderCode || order.id }}</span>
                    <span class="order-date text-muted">• {{ formatDate(order.createdAt) }}</span>
                  </div>
                  <span class="order-status-badge" :class="'badge-' + (order.status || '').toLowerCase()">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>

                <!-- Order items -->
                <div class="order-item-body">
                  <div v-for="item in (order.items || []).slice(0, 3)" :key="item.id" class="order-product-row">
                    <img :src="item.imageUrl || placeholderImg" class="order-prod-img" alt="product" />
                    <div class="order-prod-info flex-grow-1 min-w-0">
                      <div class="order-prod-name text-truncate">{{ item.productName }}</div>
                      <div class="order-prod-meta">Số lượng: x{{ item.quantity }}</div>
                    </div>
                    <div class="order-prod-price text-end">
                      <div class="order-unit-price">{{ formatCurrency(item.unitPrice) }}</div>
                      <div class="order-subtotal fw-bold">{{ formatCurrency(item.totalPrice) }}</div>
                    </div>
                  </div>
                  <div v-if="order.items && order.items.length > 3" class="text-muted small ps-2 pt-1 fst-italic">
                    + Thêm {{ order.items.length - 3 }} sản phẩm khác...
                  </div>
                </div>

                <!-- Order footer -->
                <div class="order-item-footer d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div class="d-flex align-items-baseline gap-2">
                    <span class="text-muted small">Thành tiền:</span>
                    <span class="order-total-price">{{ formatCurrency(order.totalAmount) }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button
                      v-if="['PENDING', 'CONFIRMED'].includes(order.status)"
                      type="button"
                      class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                      @click="openCancelModal(order)"
                    >
                      Hủy đơn
                    </button>
                    <router-link
                      v-if="['DELIVERED', 'COMPLETED'].includes(order.status)"
                      :to="{ name: 'account-order-detail', params: { id: order.id }, query: { action: 'review' } }"
                      class="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 d-flex align-items-center gap-1 shadow-xs"
                    >
                      <i class="bi bi-star-fill text-amber-700"></i> Đánh giá
                    </router-link>
                    <router-link
                      :to="{ name: 'account-order-detail', params: { id: order.id } }"
                      class="nomall-btn-outline text-decoration-none btn-sm px-3"
                    >
                      Chi tiết
                    </router-link>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div class="mt-3">
                <BasePagination
                  v-if="pageData.totalPages > 1"
                  :current-page="pageData.page"
                  :total-pages="pageData.totalPages"
                  :total-elements="pageData.totalElements"
                  :is-first="pageData.first"
                  :is-last="pageData.last"
                  @change="onPageChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel modal -->
    <BaseModal v-model="showCancelModal" title="Hủy Đơn Hàng">
      <div class="d-flex flex-column gap-3">
        <p class="text-muted small mb-0">Vui lòng nhập lý do bạn muốn hủy đơn hàng này:</p>
        <BaseInput v-model="cancelReason" label="Lý do hủy" placeholder="Thay đổi ý định mua, chọn nhầm mẫu..." required />
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 w-100">
          <button type="button" class="btn btn-outline-secondary rounded-pill px-3" @click="showCancelModal = false">
            Đóng
          </button>
          <button type="button" class="nomall-btn-primary px-4" :disabled="cancelling" @click="handleConfirmCancel">
            <span v-if="cancelling" class="spinner-border spinner-border-sm me-1"></span>
            Xác nhận hủy
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { buyerOrderService } from '@/services/buyerOrder.service'
import { useNotifyStore } from '@/stores/notify'
import AccountSidebar from '@/components/buyer/AccountSidebar.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const notify = useNotifyStore()
const loading = ref(true)
const errorMsg = ref('')
const selectedStatus = ref('')
const orders = ref([])
const showCancelModal = ref(false)
const cancelling = ref(false)
const targetOrder = ref(null)
const cancelReason = ref('')
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'
const pageData = ref({ page: 0, totalPages: 1, totalElements: 0, first: true, last: true })

const statusTabs = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang giao', value: 'SHIPPING' },
  { label: 'Đã giao', value: 'DELIVERED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

const statusColorMap = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PACKED: 'primary',
  SHIPPING: 'primary',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger'
}

const fetchOrders = async (page = 0) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const params = { page, size: 10 }
    if (selectedStatus.value) params.status = selectedStatus.value
    const res = await buyerOrderService.listOrders(params)
    orders.value = res?.content || []
    pageData.value = {
      page: res?.page || 0,
      totalPages: res?.totalPages || 1,
      totalElements: res?.totalElements || 0,
      first: res?.first ?? true,
      last: res?.last ?? true
    }
  } catch (_) {
    errorMsg.value = 'Không thể nạp danh sách đơn hàng.'
  } finally {
    loading.value = false
  }
}

const onSelectStatus = (val) => {
  selectedStatus.value = val
  fetchOrders(0)
}
const onPageChange = (p) => fetchOrders(p)
const openCancelModal = (order) => {
  targetOrder.value = order
  cancelReason.value = ''
  showCancelModal.value = true
}

const handleConfirmCancel = async () => {
  if (!targetOrder.value) return
  cancelling.value = true
  try {
    await buyerOrderService.cancelOrder(targetOrder.value.id, cancelReason.value)
    notify.push('Hủy đơn hàng thành công!', 'success')
    showCancelModal.value = false
    await fetchOrders(pageData.value.page)
  } catch (_) {
  } finally {
    cancelling.value = false
  }
}

const getStatusColor = (s) => statusColorMap[s] || 'secondary'
const getStatusLabel = (s) => statusTabs.find(t => t.value === s)?.label || s
const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
const formatDate = (s) => s ? new Date(s).toLocaleString('vi-VN') : ''

onMounted(() => fetchOrders(0))
</script>

<style scoped>
.nomall-account-page {
  background-color: var(--nomall-bg, #f5f5f5);
  min-height: calc(100vh - 140px);
}

.nomall-account-card {
  background: var(--nomall-card, #ffffff);
  border-radius: 16px;
  border: 1px solid var(--nomall-border, #e5e7eb);
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nomall-account-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--nomall-border, #e5e7eb);
  margin-bottom: 1.25rem;
}

.nomall-account-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--nomall-ink, #1a1a2e);
}

.nomall-account-subtitle {
  font-size: 0.8125rem;
  color: var(--nomall-muted, #6b7280);
}

.order-status-tabs {
  margin-top: -0.5rem;
}

.order-tab-btn {
  background: none;
  border: none;
  border-radius: 9999px;
  padding: 0.4rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nomall-muted, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-tab-btn:hover {
  color: var(--nomall-red, #e84a4a);
  background-color: rgba(232, 74, 74, 0.06);
}

.order-tab-btn.active {
  background-color: var(--nomall-red, #e84a4a);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(232, 74, 74, 0.25);
}

.order-item-card {
  border: 1px solid var(--nomall-border, #e5e7eb);
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.order-item-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.order-item-header {
  padding: 0.875rem 1.25rem;
  background-color: #fafafa;
  border-bottom: 1px solid var(--nomall-border, #e5e7eb);
}

.order-code {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--nomall-ink, #1a1a2e);
}

.order-date {
  font-size: 0.8125rem;
}

.order-status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

.badge-pending {
  background: #fef3c7;
  color: #b45309;
}

.badge-confirmed {
  background: #e0e7ff;
  color: #4338ca;
}

.badge-shipping {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-delivered, .badge-completed {
  background: #d1fae5;
  color: #065f46;
}

.badge-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.order-item-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.order-product-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.order-prod-img {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--nomall-border, #e5e7eb);
  flex-shrink: 0;
}

.order-prod-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--nomall-ink, #1a1a2e);
  margin-bottom: 0.25rem;
}

.order-prod-meta {
  font-size: 0.75rem;
  color: var(--nomall-muted, #6b7280);
}

.order-unit-price {
  font-size: 0.75rem;
  color: var(--nomall-muted, #6b7280);
}

.order-subtotal {
  font-size: 0.875rem;
  color: var(--nomall-ink, #1a1a2e);
}

.order-item-footer {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--nomall-border, #e5e7eb);
  background-color: #fafafa;
}

.order-total-price {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--nomall-red, #e84a4a);
}
</style>
