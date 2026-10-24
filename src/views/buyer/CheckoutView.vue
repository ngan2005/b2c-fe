<template>
  <!-- NO MALL Checkout View -->
  <div style="background: var(--nomall-bg); min-height: 100vh;" class="pb-5">

    <!-- Breadcrumb -->
    <div style="background: #fff; border-bottom: 1px solid var(--nomall-border); padding: 0.5rem 0;">
      <div class="container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
          <router-link :to="{ name: 'cart' }">Giỏ hàng</router-link>
          <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
          <span style="color: var(--nomall-red); font-weight: 700;">Thanh toán</span>
        </nav>
      </div>
    </div>

    <!-- Step progress -->
    <div style="background: #fff; border-bottom: 1px solid var(--nomall-border); padding: 0.75rem 0;">
      <div class="container">
        <div class="d-flex align-items-center justify-content-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <div class="nomall-step-dot active">1</div>
            <span style="font-size: 0.8125rem; font-weight: 700; color: var(--nomall-ink);">Địa chỉ</span>
          </div>
          <div style="width: 2rem; height: 1.5px; background: var(--nomall-border);"></div>
          <div class="d-flex align-items-center gap-2">
            <div class="nomall-step-dot" :class="{ active: currentStep >= 2 }">2</div>
            <span style="font-size: 0.8125rem; font-weight: 600;" :style="currentStep >= 2 ? 'color: var(--nomall-ink);' : 'color: var(--nomall-muted);'">Thanh toán</span>
          </div>
          <div style="width: 2rem; height: 1.5px; background: var(--nomall-border);"></div>
          <div class="d-flex align-items-center gap-2">
            <div class="nomall-step-dot" :class="{ active: currentStep >= 3 }">3</div>
            <span style="font-size: 0.8125rem; font-weight: 600;" :style="currentStep >= 3 ? 'color: var(--nomall-ink);' : 'color: var(--nomall-muted);'">Xác nhận</span>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loadingAddresses" text="Đang tải thông tin..." class="my-5" />

    <div v-else class="container mt-3">
      <div class="row g-4">

        <!-- ── LEFT: Address + Payment ──────────────── -->
        <div class="col-lg-8 d-flex flex-column gap-3">

          <!-- Address card -->
          <div class="nomall-card p-3">
            <h3 class="fw-bold mb-3 pb-3" style="font-size: 1rem; color: var(--nomall-ink); border-bottom: 1.5px solid var(--nomall-border);">
              <i class="bi bi-geo-alt me-2" style="color: var(--nomall-red);"></i>Địa Chỉ Nhận Hàng
            </h3>

            <!-- Saved addresses -->
            <div v-if="addresses.length > 0" class="d-flex flex-column gap-2">
              <div
                v-for="addr in addresses"
                :key="addr.id"
                class="d-flex align-items-start gap-3 p-3"
                :style="selectedAddressId === addr.id
                  ? 'border: 2px solid var(--nomall-red); border-radius: 12px; background: var(--nomall-red-bg); cursor: pointer;'
                  : 'border: 1.5px solid var(--nomall-border); border-radius: 12px; background: var(--nomall-bg); cursor: pointer;'"
                @click="selectedAddressId = addr.id"
              >
                <input type="radio" name="shippingAddress" :checked="selectedAddressId === addr.id" class="form-check-input mt-1" style="accent-color: var(--nomall-red); flex-shrink: 0;" />
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span class="fw-bold" style="font-size: 0.875rem; color: var(--nomall-ink);">{{ addr.recipientName }}</span>
                    <span style="font-size: 0.8125rem; color: var(--nomall-muted);">({{ addr.phone }})</span>
                    <span v-if="addr.isDefault" class="badge" style="background: var(--nomall-red); color: #fff; font-size: 0.6875rem; font-weight: 800; padding: 0.1rem 0.5rem; border-radius: 4px;">Mặc định</span>
                  </div>
                  <p style="font-size: 0.8125rem; color: var(--nomall-muted); margin: 0; line-height: 1.5;">{{ addr.fullAddress }}</p>
                </div>
              </div>
            </div>

            <!-- Manual form when no saved address -->
            <div v-else class="d-flex flex-column gap-3 p-3" style="background: var(--nomall-bg); border-radius: 12px; border: 1.5px solid var(--nomall-border);">
              <p style="font-size: 0.8125rem; color: var(--nomall-muted); margin: 0;">Chưa có địa chỉ lưu sẵn. Nhập thông tin bên dưới:</p>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="nomall-form-label">Họ và tên *</label>
                  <input v-model="manualAddress.recipientName" type="text" class="nomall-form-control" placeholder="Nguyễn Văn A" />
                </div>
                <div class="col-md-6">
                  <label class="nomall-form-label">Số điện thoại *</label>
                  <input v-model="manualAddress.phone" type="tel" class="nomall-form-control" placeholder="0901234567" />
                </div>
                <div class="col-12">
                  <label class="nomall-form-label">Địa chỉ đầy đủ *</label>
                  <input v-model="manualAddress.fullAddress" type="text" class="nomall-form-control" placeholder="Số 123, Đường ABC, Phường X, Quận Y, TP.HCM" />
                </div>
              </div>
            </div>

            <button class="nomall-btn-outline mt-3" style="font-size: 0.8125rem; padding: 0.4rem 0.875rem;" @click="showAddressModal = true">
              <i class="bi bi-plus-lg"></i> Thêm địa chỉ mới
            </button>
          </div>

          <!-- Payment method card -->
          <div class="nomall-card p-3">
            <h3 class="fw-bold pb-3 mb-3" style="font-size: 1rem; color: var(--nomall-ink); border-bottom: 1.5px solid var(--nomall-border);">
              <i class="bi bi-credit-card-2-front me-2" style="color: var(--nomall-red);"></i>Phương Thức Thanh Toán
            </h3>
            <div class="d-flex flex-column gap-2">
              <label
                v-for="method in paymentMethods"
                :key="method.value"
                class="d-flex align-items-center gap-3 p-3"
                :style="selectedPaymentMethod === method.value
                  ? 'border: 2px solid var(--nomall-red); border-radius: 12px; background: var(--nomall-red-bg); cursor: pointer;'
                  : 'border: 1.5px solid var(--nomall-border); border-radius: 12px; background: var(--nomall-bg); cursor: pointer;'"
              >
                <input type="radio" name="paymentMethod" :value="method.value" v-model="selectedPaymentMethod" class="form-check-input" style="accent-color: var(--nomall-red); flex-shrink: 0;" />
                <div class="d-flex align-items-center justify-content-center flex-shrink-0"
                  :style="'width: 2.5rem; height: 2.5rem; border-radius: 10px; background: ' + method.bg + '; color: ' + method.color + '; font-size: 1.25rem;'">
                  <i :class="method.icon"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0.5" style="font-size: 0.875rem; color: var(--nomall-ink);">{{ method.label }}</h4>
                  <p style="font-size: 0.75rem; color: var(--nomall-muted); margin: 0;">{{ method.desc }}</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Order note -->
          <div class="nomall-card p-3">
            <label class="nomall-form-label">
              <i class="bi bi-chat-left-text me-1" style="color: var(--nomall-red);"></i>Ghi chú đơn hàng (không bắt buộc)
            </label>
            <textarea v-model="orderNote" class="nomall-form-control" rows="2" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."></textarea>
          </div>
        </div>

        <!-- ── RIGHT: Order Summary ────────────────── -->
        <div class="col-lg-4">
          <div class="nomall-card p-3 position-sticky" style="top: 100px;">
            <h3 class="fw-bold pb-3 mb-3" style="font-size: 1rem; color: var(--nomall-ink); border-bottom: 1.5px solid var(--nomall-border);">
              Sản Phẩm Đặt Mua
            </h3>

            <div class="d-flex flex-column gap-2 mb-3" style="max-height: 14rem; overflow-y: auto;">
              <div v-for="item in selectedCartItems" :key="item.id" class="d-flex align-items-center gap-2">
                <img :src="item.thumbnailUrl || item.imageUrl || placeholderImg" style="width: 3rem; height: 3rem; object-fit: cover; border-radius: 8px; border: 1px solid var(--nomall-border); flex-shrink: 0;" />
                <div class="flex-grow-1 min-w-0">
                  <p class="mb-0 fw-bold truncate" style="font-size: 0.8125rem; color: var(--nomall-ink);">{{ item.productName }}</p>
                  <span style="font-size: 0.75rem; color: var(--nomall-muted);">SL: {{ item.quantity }}</span>
                </div>
                <span class="fw-bold" style="font-size: 0.875rem; color: var(--nomall-ink); flex-shrink: 0;">
                  {{ formatCurrency(item.priceSnapshot * item.quantity) }}
                </span>
              </div>
            </div>

            <!-- Voucher Section -->
            <div class="nomall-card p-3 mb-3" style="background: #ffffff; border: 1.5px dashed var(--nomall-border); border-radius: 12px;">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold" style="font-size: 0.875rem; color: var(--nomall-ink);">
                  <i class="bi bi-ticket-perforated-fill text-danger me-1"></i> Mã Giảm Giá NO MALL
                </span>
                <button
                  type="button"
                  class="btn btn-sm text-danger p-0 fw-semibold text-decoration-none"
                  style="font-size: 0.8125rem;"
                  @click="openVoucherModal"
                >
                  Chọn voucher <i class="bi bi-chevron-right"></i>
                </button>
              </div>

              <!-- When voucher is applied -->
              <div v-if="appliedVoucher" class="d-flex align-items-center justify-content-between p-2 rounded-3" style="background: rgba(232, 74, 74, 0.08); border: 1px solid var(--nomall-red);">
                <div class="min-w-0 me-2">
                  <div class="fw-bold text-danger d-flex align-items-center gap-1" style="font-size: 0.875rem;">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>{{ appliedVoucher.code }}</span>
                  </div>
                  <div class="text-muted small text-truncate">
                    Giảm {{ formatCurrency(appliedDiscount) }}
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill"
                  style="font-size: 0.75rem;"
                  @click="removeVoucher"
                >
                  Gỡ
                </button>
              </div>

              <!-- Input form -->
              <div v-else class="input-group input-group-sm">
                <input
                  v-model="voucherCodeInput"
                  type="text"
                  class="form-control"
                  placeholder="Nhập mã voucher..."
                  style="text-transform: uppercase; font-weight: 600;"
                  @keyup.enter="applyVoucher()"
                />
                <button
                  class="btn btn-danger"
                  type="button"
                  :disabled="validatingVoucher || !voucherCodeInput"
                  @click="applyVoucher()"
                >
                  <span v-if="validatingVoucher" class="spinner-border spinner-border-sm me-1"></span>
                  Áp dụng
                </button>
              </div>
            </div>

            <div class="d-flex flex-column gap-2 pt-3 mb-3" style="border-top: 1.5px solid var(--nomall-border); font-size: 0.875rem;">
              <div class="d-flex justify-content-between"><span style="color: var(--nomall-muted);">Tạm tính</span><span class="fw-bold" style="color: var(--nomall-ink);">{{ formatCurrency(cartStore.subtotalPrice) }}</span></div>
              <div class="d-flex justify-content-between"><span style="color: var(--nomall-muted);">Phí vận chuyển</span><span class="fw-bold" style="color: #5bb88a;">Miễn phí</span></div>
              <div v-if="appliedDiscount > 0" class="d-flex justify-content-between">
                <span class="text-danger fw-semibold">
                  <i class="bi bi-tag-fill me-1"></i>Giảm giá voucher
                </span>
                <span class="fw-bold text-danger">-{{ formatCurrency(appliedDiscount) }}</span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-baseline pt-3 mb-4" style="border-top: 1.5px solid var(--nomall-border);">
              <span class="fw-bold" style="font-size: 0.9375rem; color: var(--nomall-ink);">Thành tiền</span>
              <span class="fw-extrabold" style="font-size: 1.5rem; color: var(--nomall-red);">{{ formatCurrency(computedFinalTotal) }}</span>
            </div>

            <button
              id="btn-place-order"
              class="nomall-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              :disabled="selectedCartItems.length === 0 || submitting"
              style="font-size: 0.9375rem; padding: 0.75rem;"
              @click="placeOrder"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Xác Nhận Đặt Hàng <i class="bi bi-check-circle"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add address modal -->
    <div v-if="showAddressModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius: 16px; border: none;">
          <div class="modal-header" style="border-bottom: 1.5px solid var(--nomall-border); padding: 1rem 1.25rem;">
            <h5 class="modal-title fw-bold" style="font-size: 1rem; color: var(--nomall-ink);">
              <i class="bi bi-plus-lg me-1" style="color: var(--nomall-red);"></i>Thêm Địa Chỉ Mới
            </h5>
            <button type="button" class="btn-close" @click="showAddressModal = false"></button>
          </div>
          <div class="modal-body" style="padding: 1.25rem;">
            <div class="d-flex flex-column gap-3">
              <div>
                <label class="nomall-form-label">Họ và tên người nhận *</label>
                <input v-model="newAddress.recipientName" type="text" class="nomall-form-control" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label class="nomall-form-label">Số điện thoại *</label>
                <input v-model="newAddress.phone" type="tel" class="nomall-form-control" placeholder="0901234567" />
              </div>
              <div>
                <label class="nomall-form-label">Địa chỉ đầy đủ *</label>
                <input v-model="newAddress.fullAddress" type="text" class="nomall-form-control" placeholder="Số 123, Đường ABC, Phường X, Quận Y, TP.HCM" />
              </div>
            </div>
          </div>
          <div class="modal-footer" style="border-top: 1.5px solid var(--nomall-border); padding: 1rem 1.25rem;">
            <button class="nomall-btn-outline" @click="showAddressModal = false" style="font-size: 0.875rem; padding: 0.5rem 1rem;">Hủy</button>
            <button class="nomall-btn-primary" @click="handleSaveNewAddress" :disabled="savingAddress" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
              <span v-if="savingAddress" class="spinner-border spinner-border-sm me-1"></span>
              Lưu địa chỉ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Voucher Selection Modal -->
    <div v-if="showVoucherModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content" style="border-radius: 16px; border: none;">
          <div class="modal-header" style="border-bottom: 1.5px solid var(--nomall-border); padding: 1rem 1.25rem;">
            <h5 class="modal-title fw-bold" style="font-size: 1rem; color: var(--nomall-ink);">
              <i class="bi bi-ticket-perforated-fill text-danger me-1"></i>Chọn NO MALL Voucher
            </h5>
            <button type="button" class="btn-close" @click="showVoucherModal = false"></button>
          </div>
          <div class="modal-body p-3">
            <!-- Manual input inside modal -->
            <div class="input-group mb-3">
              <input
                v-model="voucherCodeInput"
                type="text"
                class="form-control"
                placeholder="Nhập mã ưu đãi..."
                style="text-transform: uppercase; font-weight: 600;"
                @keyup.enter="applyVoucher()"
              />
              <button
                class="btn btn-danger"
                type="button"
                :disabled="validatingVoucher || !voucherCodeInput"
                @click="applyVoucher()"
              >
                <span v-if="validatingVoucher" class="spinner-border spinner-border-sm me-1"></span>
                Áp dụng
              </button>
            </div>

            <div class="fw-bold mb-2 small text-muted">Mã giảm giá khả dụng:</div>

            <LoadingSpinner v-if="loadingVouchers" text="Đang tải danh sách voucher..." />

            <div v-else-if="availableVouchers.length === 0" class="text-center py-4 text-muted small">
              <i class="bi bi-ticket-perforated text-secondary d-block fs-2 mb-2"></i>
              Hiện chưa có mã giảm giá nào khả dụng.
            </div>

            <div v-else class="d-flex flex-column gap-2">
              <div
                v-for="v in availableVouchers"
                :key="v.id"
                class="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-2"
                :style="appliedVoucher?.code === v.code
                  ? 'border-color: var(--nomall-red) !important; background: rgba(232, 74, 74, 0.05);'
                  : 'border-color: var(--nomall-border); background: #ffffff;'"
              >
                <div class="min-w-0">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge bg-danger-subtle text-danger fw-bold border border-danger-subtle px-2 py-1">
                      {{ v.code }}
                    </span>
                    <span class="fw-bold text-truncate" style="font-size: 0.875rem; color: var(--nomall-ink);">
                      {{ v.name }}
                    </span>
                  </div>
                  <div class="text-muted small">
                    {{ getDiscountText(v) }}
                  </div>
                  <div v-if="v.minOrderValue" class="text-muted small" style="font-size: 0.75rem;">
                    Đơn tối thiểu: {{ formatCurrency(v.minOrderValue) }}
                  </div>
                </div>

                <button
                  v-if="appliedVoucher?.code === v.code"
                  type="button"
                  class="btn btn-sm btn-outline-danger rounded-pill px-3 flex-shrink-0"
                  @click="removeVoucher"
                >
                  Bỏ chọn
                </button>
                <button
                  v-else
                  type="button"
                  class="nomall-btn-primary btn-sm px-3 flex-shrink-0"
                  :disabled="validatingVoucher || !isEligible(v)"
                  @click="applyVoucher(v.code)"
                >
                  Dùng mã
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="border-top: 1.5px solid var(--nomall-border); padding: 0.75rem 1.25rem;">
            <button type="button" class="nomall-btn-outline btn-sm px-3" @click="showVoucherModal = false">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { userAddressService } from '@/services/userAddress.service'
import { buyerOrderService } from '@/services/buyerOrder.service'
import { promotionService } from '@/services/promotion.service'
import { useNotifyStore } from '@/stores/notify'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const cartStore = useCartStore()
const notify = useNotifyStore()

const loadingAddresses = ref(true)
const addresses = ref([])
const selectedAddressId = ref(null)
const manualAddress = reactive({ recipientName: '', phone: '', fullAddress: '' })
const selectedPaymentMethod = ref('COD')
const orderNote = ref('')
const submitting = ref(false)
const showAddressModal = ref(false)
const savingAddress = ref(false)
const newAddress = reactive({ recipientName: '', phone: '', fullAddress: '', isDefault: false })
const currentStep = ref(2)
const placeholderImg = 'https://picsum.photos/seed/checkout/200/200'

// Voucher states
const voucherCodeInput = ref('')
const appliedVoucher = ref(null)
const appliedDiscount = ref(0)
const validatingVoucher = ref(false)
const showVoucherModal = ref(false)
const availableVouchers = ref([])
const loadingVouchers = ref(false)

const computedFinalTotal = computed(() => {
  const sub = cartStore.subtotalPrice || 0
  const total = sub - (appliedDiscount.value || 0)
  return total > 0 ? total : 0
})

const isEligible = (v) => {
  if (!v?.minOrderValue) return true
  return (cartStore.subtotalPrice || 0) >= v.minOrderValue
}

const getDiscountText = (v) => {
  if (v.discountType === 'PERCENT') {
    let t = `Giảm ${v.discountValue}%`
    if (v.maxDiscountAmount) t += ` (tối đa ${formatCurrency(v.maxDiscountAmount)})`
    return t
  }
  if (v.discountType === 'FIXED') {
    return `Giảm ${formatCurrency(v.discountValue)}`
  }
  if (v.discountType === 'FREESHIP') {
    return 'Miễn phí vận chuyển'
  }
  return v.name || 'Ưu đãi đặc biệt'
}

const fetchAvailableVouchers = async () => {
  loadingVouchers.value = true
  try {
    const data = await promotionService.listActive()
    availableVouchers.value = Array.isArray(data) ? data : []
  } catch (_) {
    availableVouchers.value = []
  } finally {
    loadingVouchers.value = false
  }
}

const openVoucherModal = () => {
  showVoucherModal.value = true
  fetchAvailableVouchers()
}

const applyVoucher = async (codeOverride) => {
  const code = (codeOverride || voucherCodeInput.value || '').trim().toUpperCase()
  if (!code) {
    notify.push('Vui lòng nhập mã giảm giá!', 'warning')
    return
  }
  if (!cartStore.subtotalPrice || cartStore.subtotalPrice <= 0) {
    notify.push('Đơn hàng chưa có sản phẩm để áp dụng mã!', 'warning')
    return
  }

  validatingVoucher.value = true
  try {
    const res = await promotionService.validate(code, cartStore.subtotalPrice)
    if (res?.success) {
      appliedVoucher.value = res
      appliedDiscount.value = Number(res.discountAmount || 0)
      voucherCodeInput.value = res.code || code
      notify.push(`Áp dụng mã "${res.code || code}" thành công! Giảm ${formatCurrency(appliedDiscount.value)}`, 'success')
      showVoucherModal.value = false
    } else {
      notify.push(res?.message || 'Mã giảm giá không hợp lệ!', 'warning')
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Không thể kiểm tra mã giảm giá'
    notify.push(msg, 'error')
  } finally {
    validatingVoucher.value = false
  }
}

const removeVoucher = () => {
  appliedVoucher.value = null
  appliedDiscount.value = 0
  voucherCodeInput.value = ''
  notify.push('Đã gỡ mã giảm giá', 'info')
}

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt cho shipper khi nhận hàng', icon: 'bi-cash-coin', bg: '#b8e8d4', color: '#2d6a4f' },
  { value: 'VNPAY', label: 'Thanh toán trực tuyến VNPAY', desc: 'Quét mã QR hoặc thẻ ATM/Visa', icon: 'bi-qr-code-scan', bg: '#d6c5f0', color: '#5b3a9e' },
  { value: 'MOMO', label: 'Thanh toán MoMo', desc: 'Quét mã MoMo để thanh toán nhanh', icon: 'bi-phone', bg: '#ff8a8a', color: '#fff' },
]

const selectedCartItems = computed(() => cartStore.items.filter(i => i.isSelected !== false))

const fetchAddresses = async () => {
  loadingAddresses.value = true
  try {
    const data = await userAddressService.getAddresses()
    addresses.value = Array.isArray(data) ? data : []
    const def = addresses.value.find(a => a.isDefault) || addresses.value[0]
    if (def) selectedAddressId.value = def.id
  } catch (_) {} finally { loadingAddresses.value = false }
}

const handleSaveNewAddress = async () => {
  if (!newAddress.recipientName || !newAddress.phone || !newAddress.fullAddress) { notify.push('Vui lòng điền đầy đủ thông tin!', 'warning'); return }
  savingAddress.value = true
  try {
    const created = await userAddressService.createAddress(newAddress)
    notify.push('Đã thêm địa chỉ mới!', 'success')
    showAddressModal.value = false
    await fetchAddresses()
    if (created?.id) selectedAddressId.value = created.id
    Object.assign(newAddress, { recipientName: '', phone: '', fullAddress: '', isDefault: false })
  } catch (_) {} finally { savingAddress.value = false }
}

const placeOrder = async () => {
  if (selectedCartItems.value.length === 0) { notify.push('Chưa chọn sản phẩm nào!', 'warning'); return }
  let addressId = selectedAddressId.value
  if (!addressId) {
    if (!manualAddress.recipientName || !manualAddress.phone || !manualAddress.fullAddress) { notify.push('Vui lòng nhập địa chỉ nhận hàng!', 'warning'); return }
    try {
      const created = await userAddressService.createAddress({ recipientName: manualAddress.recipientName, phone: manualAddress.phone, streetDetail: manualAddress.fullAddress, fullAddress: manualAddress.fullAddress, isDefault: true })
      addressId = created.id
    } catch (_) { return }
  }
  submitting.value = true
  try {
    const payload = {
      addressId,
      paymentMethod: selectedPaymentMethod.value,
      note: orderNote.value,
      cartItemIds: selectedCartItems.value.map(i => i.id),
      voucherCode: appliedVoucher.value?.code || undefined,
    }
    const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const createdOrder = await buyerOrderService.createOrder(payload, idempotencyKey)
    if (createdOrder?.paymentUrl) {
      notify.push('Đang chuyển hướng thanh toán...', 'info')
      window.location.href = createdOrder.paymentUrl
      return
    }
    notify.push('Đặt hàng thành công! Cảm ơn bạn.', 'success')
    await cartStore.fetchCart()

    const orderId = createdOrder?.id || createdOrder?.orderId
    if (orderId) {
      router.push({ name: 'account-order-confirmation', params: { id: orderId } })
    } else {
      router.push({ name: 'account-orders' })
    }
  } catch (err) {
    const errorMsg = err?.response?.data?.message || err?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.'
    notify.push(errorMsg, 'error')
  } finally {
    submitting.value = false
  }
}

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

onMounted(async () => {
  await cartStore.fetchCart()
  await fetchAddresses()

  // Auto-apply if navigated from VouchersView
  const savedVoucher = sessionStorage.getItem('nomall_selected_voucher')
  if (savedVoucher) {
    voucherCodeInput.value = savedVoucher
    sessionStorage.removeItem('nomall_selected_voucher')
    await applyVoucher(savedVoucher)
  }
})
</script>
