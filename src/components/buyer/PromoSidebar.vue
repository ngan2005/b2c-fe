<template>
  <div class="nomall-promo-hub d-flex flex-column gap-3">
    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 1. VOUCHER CENTER (KHO VOUCHER HOT)                          -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div class="hub-card">
      <div class="hub-card-header d-flex align-items-center justify-content-between mb-2.5">
        <div class="d-flex align-items-center gap-1.5 text-truncate">
          <div class="hub-icon-wrap voucher-icon-wrap">
            <i class="bi bi-ticket-perforated-fill"></i>
          </div>
          <div class="text-truncate">
            <h6 class="hub-title mb-0 text-truncate">MÃ GIẢM GIÁ</h6>
            <span class="hub-subtitle">Số lượng có hạn</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-1 flex-shrink-0">
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-1.5 py-0.5 fw-bold" style="font-size: 0.6rem;">
            LIVE
          </span>
          <button
            v-if="collapsible"
            class="btn-collapse-promo"
            type="button"
            @click.stop="$emit('collapse')"
            title="Thu hẹp ưu đãi"
          >
            <i class="bi bi-chevron-bar-right"></i>
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingVouchers" class="py-3 text-center text-muted">
        <div class="spinner-border spinner-border-sm text-danger me-1"></div>
        <small>Đang nạp ưu đãi...</small>
      </div>

      <!-- Vouchers List -->
      <div v-else class="voucher-list d-flex flex-column gap-2.5">
        <div
          v-for="v in displayVouchers"
          :key="v.code"
          class="voucher-ticket"
          :class="{ 'copied': copiedCode === v.code }"
        >
          <!-- Left Ticket Stub: Discount Value -->
          <div class="ticket-left">
            <div class="ticket-val">{{ formatDiscount(v) }}</div>
            <div class="ticket-type">{{ v.discountType === 'FREESHIP' ? 'Freeship' : 'Giảm giá' }}</div>
          </div>

          <!-- Divider line with cutouts -->
          <div class="ticket-cutout-top"></div>
          <div class="ticket-divider"></div>
          <div class="ticket-cutout-bottom"></div>

          <!-- Right Ticket Content -->
          <div class="ticket-right d-flex flex-column justify-content-between">
            <div>
              <div class="ticket-name text-truncate">{{ v.name || v.code }}</div>
              <div class="ticket-cond text-truncate">
                Đơn từ {{ formatCurrency(v.minOrderValue || 0) }}
              </div>
            </div>
            <div class="d-flex align-items-center justify-content-between mt-1">
              <code class="ticket-code">{{ v.code }}</code>
              <button
                class="btn-save-voucher"
                :class="{ 'btn-saved': copiedCode === v.code }"
                @click="copyVoucher(v.code)"
                :title="'Sao chép mã ' + v.code"
              >
                <i v-if="copiedCode === v.code" class="bi bi-check2"></i>
                <span>{{ copiedCode === v.code ? 'Đã lưu' : 'Lưu mã' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Link to full voucher page -->
      <div class="text-center mt-3 pt-2 border-top border-slate-100">
        <router-link
          :to="{ name: 'account-vouchers' }"
          class="hub-more-link"
        >
          Xem tất cả mã giảm giá <i class="bi bi-chevron-right ms-0.5"></i>
        </router-link>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 2. TOP BESTSELLERS (TOP BÁN CHẠY TUẦN NÀY)                    -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div class="hub-card">
      <div class="hub-card-header d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center gap-2">
          <div class="hub-icon-wrap rank-icon-wrap">
            <i class="bi bi-trophy-fill"></i>
          </div>
          <div>
            <h6 class="hub-title mb-0">TOP BÁN CHẠY</h6>
            <span class="hub-subtitle">Xu hướng mua sắm</span>
          </div>
        </div>
        <router-link
          :to="{ name: 'products', query: { sortBy: 'sold', sortDir: 'desc' } }"
          class="hub-header-link"
          title="Xem tất cả sản phẩm bán chạy"
        >
          Xem thêm
        </router-link>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingTop" class="py-3 text-center text-muted">
        <div class="spinner-border spinner-border-sm text-warning me-1"></div>
        <small>Đang nạp bảng xếp hạng...</small>
      </div>

      <!-- Top products list -->
      <div v-else class="top-list d-flex flex-column gap-2.5">
        <div
          v-for="(p, idx) in topProducts"
          :key="p.id"
          class="top-item d-flex align-items-center gap-2.5 cursor-pointer"
          @click="goToProduct(p)"
        >
          <!-- Rank Badge -->
          <div class="rank-badge" :class="'rank-' + (idx + 1)">
            {{ idx + 1 }}
          </div>

          <!-- Product Image -->
          <div class="top-thumb-wrap">
            <img
              :src="p.thumbnailUrl || placeholderImg"
              :alt="p.name"
              class="top-thumb"
              loading="lazy"
              @error="(e) => e.target.src = placeholderImg"
            />
          </div>

          <!-- Product Details -->
          <div class="min-w-0 flex-grow-1">
            <div class="top-pname line-clamp-1" :title="p.name">
              {{ p.name }}
            </div>
            <div class="top-price">{{ formatCurrency(p.minPrice || p.price || 0) }}</div>
            <div class="top-sold d-flex align-items-center gap-1">
              <i class="bi bi-fire text-danger" style="font-size: 0.7rem;"></i>
              <span>Đã bán {{ formatSold(p.soldCount) }}</span>
            </div>
          </div>
        </div>

        <div v-if="!topProducts.length" class="text-center text-muted small py-3">
          Chưa có sản phẩm nổi bật
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { promotionService } from '@/services/promotion.service'
import { catalogService } from '@/services/catalog.service'
import { useNotifyStore } from '@/stores/notify'

const router = useRouter()
const notify = useNotifyStore()

defineProps({
  collapsible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['collapse'])

const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

// ── Vouchers State ───────────────────────────────────────────
const vouchers = ref([])
const loadingVouchers = ref(true)
const copiedCode = ref(null)

// Fallback high-conversion sample vouchers if DB has no active ones yet
const sampleVouchers = [
  {
    code: 'FREESHIP15K',
    name: 'Miễn phí vận chuyển',
    discountType: 'FREESHIP',
    discountValue: 15000,
    minOrderValue: 99000,
  },
  {
    code: 'NOMALL10',
    name: 'Giảm 10% đơn từ 200k',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 200000,
  },
  {
    code: 'CHAOBAN50K',
    name: 'Giảm 50.000đ thành viên mới',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000,
    minOrderValue: 350000,
  },
]

const displayVouchers = computed(() => {
  if (vouchers.value && vouchers.value.length > 0) {
    return vouchers.value.slice(0, 3)
  }
  return sampleVouchers
})

// ── Top Products State ───────────────────────────────────────
const topProducts = ref([])
const loadingTop = ref(true)

// ── Helpers ──────────────────────────────────────────────────
function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

function formatDiscount(v) {
  if (v.discountType === 'PERCENT') return `${v.discountValue}%`
  if (v.discountType === 'FREESHIP') return 'Free'
  if (v.discountValue >= 1000) return `${Math.round(v.discountValue / 1000)}K`
  return `${v.discountValue}đ`
}

function formatSold(val) {
  const count = val || 0
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  if (count > 0) return `${count}`
  return '100+'
}

async function copyVoucher(code) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    }
  } catch (_) {}
  copiedCode.value = code
  notify.push(`Đã lưu mã giảm giá ${code}!`, 'success')
  setTimeout(() => {
    if (copiedCode.value === code) {
      copiedCode.value = null
    }
  }, 2500)
}

function goToProduct(p) {
  if (p.slug) {
    router.push({ name: 'product-detail', params: { slug: p.slug } })
  } else {
    router.push({ name: 'products' })
  }
}

// ── Fetching Data ────────────────────────────────────────────
onMounted(async () => {
  // 1. Fetch public promotions
  try {
    const res = await promotionService.listPublic()
    const list = Array.isArray(res) ? res : res?.data || []
    vouchers.value = list
  } catch (err) {
    // Graceful fallback to sample vouchers
    vouchers.value = []
  } finally {
    loadingVouchers.value = false
  }

  // 2. Fetch top-selling products
  try {
    const res = await catalogService.listProducts({
      sortBy: 'sold',
      sortDir: 'desc',
      size: 4,
    })
    const items = res?.content || (Array.isArray(res) ? res : res?.data || [])
    topProducts.value = items.slice(0, 3)
  } catch (err) {
    topProducts.value = []
  } finally {
    loadingTop.value = false
  }
})
</script>

<style scoped>
.nomall-promo-hub {
  width: 100%;
}

.hub-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 0.75rem 0.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease;
}

.hub-card:hover {
  box-shadow: 0 4px 16px rgba(232, 74, 74, 0.08);
}

.hub-icon-wrap {
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.voucher-icon-wrap {
  background: rgba(232, 74, 74, 0.1);
  color: #e84a4a;
}

.rank-icon-wrap {
  background: rgba(255, 201, 71, 0.2);
  color: #d97706;
}

.hub-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: 0.01em;
}

.hub-subtitle {
  font-size: 0.625rem;
  color: #6b7280;
  display: block;
}

.btn-collapse-promo {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  line-height: 1;
  transition: all 0.15s ease;
}

.btn-collapse-promo:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.hub-header-link {
  font-size: 0.7rem;
  font-weight: 700;
  color: #e84a4a;
  text-decoration: none;
}

.hub-header-link:hover {
  text-decoration: underline;
}

.hub-more-link {
  font-size: 0.7rem;
  font-weight: 700;
  color: #e84a4a;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.hub-more-link:hover {
  color: #c73838;
}

/* ── Voucher Ticket Styling ──────────────────────────────── */
.voucher-ticket {
  display: flex;
  position: relative;
  background: #fff5f5;
  border: 1px dashed #fca5a5;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.voucher-ticket:hover {
  transform: translateY(-1px);
  border-color: #e84a4a;
  box-shadow: 0 3px 10px rgba(232, 74, 74, 0.1);
}

.ticket-left {
  width: 52px;
  min-width: 52px;
  background: linear-gradient(135deg, #e84a4a 0%, #c73838 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.15rem;
  text-align: center;
}

.ticket-val {
  font-size: 0.85rem;
  font-weight: 900;
  line-height: 1.1;
}

.ticket-type {
  font-size: 0.55rem;
  font-weight: 600;
  opacity: 0.9;
  margin-top: 1px;
}

.ticket-divider {
  width: 1px;
  border-left: 1px dashed #fca5a5;
}

.ticket-cutout-top,
.ticket-cutout-bottom {
  position: absolute;
  left: 47px;
  width: 10px;
  height: 10px;
  background: #ffffff;
  border: 1px dashed #fca5a5;
  border-radius: 50%;
  z-index: 2;
}

.ticket-cutout-top {
  top: -5px;
}

.ticket-cutout-bottom {
  bottom: -5px;
}

.ticket-right {
  flex: 1;
  padding: 0.35rem 0.45rem;
  min-width: 0;
  background: #ffffff;
}

.ticket-name {
  font-size: 0.68rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}

.ticket-cond {
  font-size: 0.58rem;
  color: #6b7280;
  margin-top: 1px;
}

.ticket-code {
  font-size: 0.6rem;
  font-weight: 800;
  color: #e84a4a;
  background: #fef2f2;
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
}

.btn-save-voucher {
  background: #e84a4a;
  color: #ffffff;
  border: none;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  transition: all 0.15s ease;
}

.btn-save-voucher:hover {
  background: #c73838;
}

.btn-save-voucher.btn-saved {
  background: #10b981;
  color: #ffffff;
}

/* ── Top Bestseller Item Styling ─────────────────────────── */
.top-item {
  padding: 0.3rem;
  border-radius: 10px;
  transition: background 0.15s ease;
  position: relative;
}

.top-item:hover {
  background: #f8fafc;
}

.rank-badge {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 900;
  color: #ffffff;
}

.rank-1 {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.4);
}

.rank-2 {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  box-shadow: 0 2px 4px rgba(100, 116, 139, 0.3);
}

.rank-3 {
  background: linear-gradient(135deg, #b45309 0%, #78350f 100%);
  box-shadow: 0 2px 4px rgba(180, 83, 9, 0.3);
}

.top-thumb-wrap {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.top-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.top-item:hover .top-thumb {
  transform: scale(1.06);
}

.top-pname {
  font-size: 0.68rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.25;
}

.top-price {
  font-size: 0.75rem;
  font-weight: 800;
  color: #e84a4a;
  margin-top: 1px;
}

.top-sold {
  font-size: 0.6rem;
  color: #64748b;
  margin-top: 1px;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
