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
          <li class="breadcrumb-item active" aria-current="page">Kho voucher</li>
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
                  <h1 class="nomall-account-title mb-1">Kho Voucher Của Tôi</h1>
                  <p class="nomall-account-subtitle mb-0">
                    <span v-if="!loading && vouchers.length > 0">
                      Bạn có {{ vouchers.length }} mã khuyến mãi khả dụng
                    </span>
                    <span v-else-if="!loading">Quản lý các mã giảm giá và ưu đãi mua sắm</span>
                  </p>
                </div>
                <div class="voucher-top-badge">
                  <i class="bi bi-ticket-perforated-fill text-danger me-1"></i>
                  <span>NO MALL Ưu Đãi</span>
                </div>
              </div>
            </div>

            <!-- Loading / Error / Empty States -->
            <LoadingSpinner v-if="loading" text="Đang tải danh sách mã giảm giá..." />
            <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchVouchers" />
            <EmptyState
              v-else-if="vouchers.length === 0"
              icon="bi bi-ticket-perforated"
              title="Chưa có mã giảm giá nào"
              description="Hiện tại chưa có mã khuyến mãi nào dành cho bạn. Hãy quay lại sau nhé!"
            >
              <template #action>
                <router-link :to="{ name: 'products' }" class="nomall-btn-primary text-decoration-none">
                  Mua sắm ngay
                </router-link>
              </template>
            </EmptyState>

            <!-- Voucher Cards Grid -->
            <div v-else class="row g-3">
              <div
                v-for="voucher in vouchers"
                :key="voucher.id"
                class="col-md-6"
              >
                <div class="voucher-ticket-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <div class="voucher-code-badge">
                        <code>{{ voucher.code }}</code>
                      </div>
                      <BaseBadge :variant="getStatusVariant(voucher)" dot>
                        {{ getStatusLabel(voucher) }}
                      </BaseBadge>
                    </div>

                    <h5 class="voucher-name mb-1">{{ voucher.name }}</h5>
                    <p class="voucher-desc mb-3">
                      {{ getDiscountDescription(voucher) }}
                    </p>
                  </div>

                  <div class="voucher-bottom-row pt-3 border-top d-flex align-items-center justify-content-between">
                    <div class="voucher-meta">
                      <div v-if="voucher.minOrderValue" class="text-muted small">
                        Đơn từ: {{ formatCurrency(voucher.minOrderValue) }}
                      </div>
                      <div class="text-muted small">
                        HSD: {{ formatDate(voucher.endAt) }}
                      </div>
                    </div>
                    <div class="d-flex gap-2">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-flex align-items-center gap-1"
                        style="font-size: 0.75rem;"
                        @click="handleCopy(voucher.code)"
                      >
                        <i class="bi bi-clipboard"></i> Sao chép
                      </button>
                      <button
                        type="button"
                        class="nomall-btn-primary btn-sm px-3 py-1 rounded-pill d-flex align-items-center gap-1 text-decoration-none"
                        style="font-size: 0.75rem;"
                        @click="handleUseNow(voucher.code)"
                      >
                        <i class="bi bi-bag-check"></i> Dùng ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { promotionService } from '@/services/promotion.service'
import { useNotifyStore } from '@/stores/notify'
import AccountSidebar from '@/components/buyer/AccountSidebar.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()
const cartStore = useCartStore()
const notify = useNotifyStore()
const loading = ref(true)
const errorMsg = ref('')
const vouchers = ref([])

const handleUseNow = (code) => {
  sessionStorage.setItem('nomall_selected_voucher', code)
  notify.push(`Đã chọn mã "${code}". Đang chuyển đến bước mua sắm...`, 'success')
  if (cartStore.totalItems > 0) {
    router.push({ name: 'buyer-checkout' })
  } else {
    router.push({ name: 'products' })
  }
}

/**
 * Fetch the list of active promotions available to the buyer.
 */
const fetchVouchers = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await promotionService.listActive()
    vouchers.value = Array.isArray(data) ? data : []
  } catch (err) {
    errorMsg.value = 'Không thể tải danh sách mã giảm giá. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}

/**
 * Copy voucher code to clipboard and show a toast notification.
 * @param {string} code
 */
const handleCopy = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    notify.push(`Đã sao chép mã "${code}"`, 'success')
  } catch (_) {
    // Fallback for environments where clipboard API is unavailable
    notify.push('Không thể sao chép mã. Vui lòng sao chép thủ công.', 'warning')
  }
}

/**
 * Determine badge variant based on voucher status and expiry.
 * @param {object} voucher
 * @returns {string}
 */
const getStatusVariant = (voucher) => {
  if (!voucher.status || voucher.status === 'DISABLED') return 'danger'
  const now = new Date()
  const endAt = voucher.endAt ? new Date(voucher.endAt) : null
  if (endAt && endAt < now) return 'danger'
  if (voucher.remainingQuantity !== undefined && voucher.remainingQuantity <= 0) return 'warning'
  return 'success'
}

/**
 * Get human-readable status label.
 * @param {object} voucher
 * @returns {string}
 */
const getStatusLabel = (voucher) => {
  if (!voucher.status || voucher.status === 'DISABLED') return 'Đã tắt'
  const now = new Date()
  const endAt = voucher.endAt ? new Date(voucher.endAt) : null
  if (endAt && endAt < now) return 'Đã hết hạn'
  if (voucher.remainingQuantity !== undefined && voucher.remainingQuantity <= 0) return 'Hết lượt'
  return 'Còn hiệu lực'
}

/**
 * Build a human-readable discount description string.
 * @param {object} voucher
 * @returns {string}
 */
const getDiscountDescription = (voucher) => {
  const type = voucher.discountType
  const value = voucher.discountValue
  const max = voucher.maxDiscountAmount

  if (type === 'PERCENT') {
    let desc = `Giảm ${value}%`
    if (max) desc += ` tối đa ${formatCurrency(max)}`
    if (voucher.minOrderValue) desc += ` cho đơn từ ${formatCurrency(voucher.minOrderValue)}`
    return desc
  }
  if (type === 'FIXED_AMOUNT') {
    let desc = `Giảm ${formatCurrency(value)}`
    if (voucher.minOrderValue) desc += ` cho đơn từ ${formatCurrency(voucher.minOrderValue)}`
    return desc
  }
  if (type === 'FREE_SHIPPING') {
    return 'Miễn phí vận chuyển'
  }
  return voucher.name || 'Khuyến mãi'
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

const formatDate = (str) => {
  if (!str) return 'N/A'
  return new Date(str).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(fetchVouchers)
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

.voucher-top-badge {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--nomall-red, #e84a4a);
  background: rgba(232, 74, 74, 0.08);
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
}

.voucher-ticket-card {
  border: 1.5px dashed var(--nomall-border, #e5e7eb);
  border-radius: 14px;
  background: #ffffff;
  padding: 1.25rem;
  position: relative;
  transition: all 0.2s ease;
}

.voucher-ticket-card:hover {
  border-color: var(--nomall-red, #e84a4a);
  box-shadow: 0 4px 14px rgba(232, 74, 74, 0.08);
}

.voucher-code-badge code {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--nomall-ink, #1a1a2e);
  letter-spacing: 0.05em;
}

.voucher-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--nomall-ink, #1a1a2e);
}

.voucher-desc {
  font-size: 0.8125rem;
  color: var(--nomall-red, #e84a4a);
  font-weight: 600;
}
</style>
