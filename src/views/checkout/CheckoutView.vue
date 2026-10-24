<template>
  <!-- [PASTEL-REDESIGN] CheckoutView -->
  <div class="bg-cream min-vh-100 py-4">
    <div class="container">

      <!-- Title -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="d-flex align-items-center justify-content-center"
          style="width: 3rem; height: 3rem; border-radius: 16px; background: var(--pastel-coral); color: #fff; font-size: 1.25rem;">
          <i class="bi bi-credit-card-2-front"></i>
        </div>
        <h1 style="font-size: 1.75rem; font-weight: 800; color: var(--pastel-ink); margin: 0; letter-spacing: -0.02em;">Thanh Toán Đơn Hàng</h1>
      </div>

      <!-- Step dots progress -->
      <div class="d-flex align-items-center justify-content-center gap-4 mb-4">
        <div class="d-flex align-items-center gap-2">
          <div class="step-dot active">1</div>
          <span style="font-size: 0.8125rem; font-weight: 700; color: var(--pastel-ink);">Địa chỉ</span>
        </div>
        <div style="width: 2rem; height: 1.5px; background: var(--pastel-border);"></div>
        <div class="d-flex align-items-center gap-2">
          <div class="step-dot" :class="{ active: true }" style="background: var(--pastel-mint); border-color: var(--pastel-mint); color: #2d6a4f;">2</div>
          <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Thanh toán</span>
        </div>
        <div style="width: 2rem; height: 1.5px; background: var(--pastel-border);"></div>
        <div class="d-flex align-items-center gap-2">
          <div class="step-dot">3</div>
          <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-muted);">Xác nhận</span>
        </div>
      </div>

      <LoadingSpinner v-if="loadingAddresses" text="Đang tải thông tin giao hàng..." />

      <div v-else class="row g-4">
        <!-- ── Left: Address + Payment ──────────────────── -->
        <div class="col-lg-8 d-flex flex-column gap-4">

          <!-- Address Card -->
          <div class="card-pastel">
            <div class="d-flex align-items-center justify-content-between pb-3 mb-3" style="border-bottom: 1.5px solid var(--pastel-border);">
              <h3 class="m-0 fw-bold d-flex align-items-center gap-2" style="font-size: 1rem; color: var(--pastel-ink);">
                <i class="bi bi-geo-alt" style="color: var(--pastel-coral-dark);"></i> Địa Chỉ Nhận Hàng
              </h3>
              <button class="btn-coral" @click="showAddressModal = true" style="font-size: 0.8125rem; padding: 0.4rem 0.875rem;">
                + Thêm địa chỉ mới
              </button>
            </div>

            <!-- Saved addresses -->
            <div v-if="addresses.length > 0" class="d-flex flex-column gap-2">
              <div
                v-for="addr in addresses"
                :key="addr.id"
                @click="selectedAddressId = addr.id"
                class="d-flex align-items-start gap-3 p-3 cursor-pointer"
                :style="selectedAddressId === addr.id
                  ? 'border: 2px solid var(--pastel-coral); border-radius: 16px; background: rgba(255,138,138,0.06);'
                  : 'border: 1.5px solid var(--pastel-border); border-radius: 16px; background: var(--pastel-cream);'"
              >
                <input type="radio" name="shippingAddress" :checked="selectedAddressId === addr.id" class="form-check-input mt-1"
                  style="flex-shrink: 0;" />
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="fw-bold" style="font-size: 0.875rem; color: var(--pastel-ink);">{{ addr.recipientName }}</span>
                    <span style="font-size: 0.8125rem; color: var(--pastel-muted);">({{ addr.phone }})</span>
                    <span v-if="addr.isDefault" class="pill-chip pill-chip-coral" style="font-size: 0.65rem;">Mặc định</span>
                  </div>
                  <p style="font-size: 0.8125rem; color: var(--pastel-muted); margin: 0; line-height: 1.5;">{{ addr.fullAddress }}</p>
                </div>
              </div>
            </div>

            <!-- Manual address form -->
            <div v-else class="d-flex flex-column gap-3 p-3" style="background: var(--pastel-cream); border-radius: 16px; border: 1.5px solid var(--pastel-border);">
              <p style="font-size: 0.8125rem; color: var(--pastel-muted);">Bạn chưa có địa chỉ lưu sẵn. Vui lòng nhập thông tin bên dưới:</p>
              <div class="row g-3">
                <div class="col-md-6"><BaseInput v-model="manualAddress.recipientName" label="Họ và tên" placeholder="Nguyễn Văn A" required /></div>
                <div class="col-md-6"><BaseInput v-model="manualAddress.phone" label="Số điện thoại" placeholder="0901234567" required /></div>
                <div class="col-12"><BaseInput v-model="manualAddress.fullAddress" label="Địa chỉ chi tiết" placeholder="Số 123, Đường ABC, Phường X, Quận Y, Hà Nội" required /></div>
              </div>
            </div>
          </div>

          <!-- Payment Card -->
          <div class="card-pastel">
            <h3 class="fw-bold pb-3 mb-3" style="font-size: 1rem; color: var(--pastel-ink); border-bottom: 1.5px solid var(--pastel-border);">
              <i class="bi bi-credit-card-2-front me-2" style="color: var(--pastel-coral-dark);"></i>Phương Thức Thanh Toán
            </h3>
            <div class="d-flex flex-column gap-2">
              <label
                v-for="method in paymentMethods"
                :key="method.value"
                class="d-flex align-items-center gap-3 p-3 cursor-pointer"
                :style="selectedPaymentMethod === method.value
                  ? 'border: 2px solid var(--pastel-coral); border-radius: 16px; background: rgba(255,138,138,0.06);'
                  : 'border: 1.5px solid var(--pastel-border); border-radius: 16px; background: var(--pastel-cream);'"
              >
                <input type="radio" name="paymentMethod" :value="method.value" v-model="selectedPaymentMethod" class="form-check-input"
                  style="flex-shrink: 0;" />
                <div class="d-flex align-items-center justify-content-center flex-shrink-0"
                  :style="'width: 2.5rem; height: 2.5rem; border-radius: 12px; background: ' + method.bg + '; color: ' + method.color + '; font-size: 1.25rem;'">
                  <i :class="method.icon"></i>
                </div>
                <div>
                  <h4 class="fw-bold mb-0.5" style="font-size: 0.875rem; color: var(--pastel-ink);">{{ method.label }}</h4>
                  <p style="font-size: 0.75rem; color: var(--pastel-muted); margin: 0;">{{ method.desc }}</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Order note -->
          <div class="card-pastel">
            <BaseInput v-model="orderNote" label="Ghi chú đơn hàng (không bắt buộc)" placeholder="Ví dụ: Giao giờ hành chính..." />
          </div>

          <!-- Voucher -->
          <div class="card-pastel">
            <h3 class="fw-bold pb-3 mb-3" style="font-size: 1rem; color: var(--pastel-ink); border-bottom: 1.5px solid var(--pastel-border);">
              <i class="bi bi-ticket-perforated me-2" style="color: var(--pastel-coral-dark);"></i>Mã Giảm Giá
            </h3>
            <div v-if="appliedVoucher"
              class="d-flex align-items-center justify-content-between p-3"
              style="border: 1.5px solid var(--pastel-mint); border-radius: 16px; background: rgba(184,232,212,0.2);">
              <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center justify-content-center" style="width:2.5rem;height:2.5rem;border-radius:12px;background:var(--pastel-mint);color:#2d6a4f;font-size:1.25rem;">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <div>
                  <p class="fw-bold mb-0" style="font-size: 0.875rem; color: var(--pastel-ink);">{{ appliedVoucher.name || appliedVoucher.code }}</p>
                  <p style="font-size: 0.75rem; color: #5bb88a; font-weight: 700; margin: 0;">-{{ formatCurrency(appliedVoucher.discountAmount) }}</p>
                </div>
              </div>
              <button class="btn" @click="handleRemoveVoucher" style="color: var(--pastel-coral-dark); font-size: 0.8125rem; font-weight: 700; border: none; background: none;">Hủy</button>
            </div>
            <div v-else class="d-flex gap-2">
              <div class="flex-grow-1"><BaseInput v-model="voucherInput" placeholder="Nhập mã giảm giá..." @keyup.enter="handleApplyVoucher" /></div>
              <button class="btn-coral" :loading="validatingVoucher" @click="handleApplyVoucher" style="font-size: 0.875rem; padding: 0.5rem 1rem; white-space: nowrap;">Áp dụng</button>
            </div>
          </div>
        </div>

        <!-- ── Right: Order Summary ──────────────────────────── -->
        <div class="col-lg-4">
          <div class="card-pastel sticky-top" style="top: 5rem; z-index: 10;">
            <h3 class="fw-bold pb-3 mb-3" style="font-size: 1rem; color: var(--pastel-ink); border-bottom: 1.5px solid var(--pastel-border);">
              Sản Phẩm Đặt Mua
            </h3>

            <div class="d-flex flex-column gap-2 mb-3" style="max-height: 14rem; overflow-y: auto;">
              <div v-for="item in selectedCartItems" :key="item.id" class="d-flex align-items-center gap-2">
                <img :src="item.imageUrl || placeholderImg" style="width: 3rem; height: 3rem; object-fit: cover; border-radius: 10px; border: 1px solid var(--pastel-border); flex-shrink: 0;" />
                <div class="flex-grow-1 min-w-0">
                  <p class="mb-0 fw-bold truncate" style="font-size: 0.8125rem; color: var(--pastel-ink);">{{ item.productName }}</p>
                  <span style="font-size: 0.75rem; color: var(--pastel-muted);">SL: {{ item.quantity }}</span>
                </div>
                <span class="fw-bold" style="font-size: 0.875rem; color: var(--pastel-ink);">{{ formatCurrency(item.priceSnapshot * item.quantity) }}</span>
              </div>
            </div>

            <div class="d-flex flex-column gap-2 pt-3 mb-3" style="border-top: 1.5px solid var(--pastel-border); font-size: 0.875rem;">
              <div class="d-flex justify-content-between"><span style="color: var(--pastel-muted);">Tạm tính</span><span class="fw-bold" style="color: var(--pastel-ink);">{{ formatCurrency(cartStore.subtotalPrice) }}</span></div>
              <div v-if="appliedVoucher" class="d-flex justify-content-between"><span style="color: #5bb88a;"><i class="bi bi-ticket-perforated me-1"></i>Mã giảm giá</span><span class="fw-bold" style="color: #5bb88a;">-{{ formatCurrency(voucherDiscount) }}</span></div>
              <div class="d-flex justify-content-between"><span style="color: var(--pastel-muted);">Phí vận chuyển</span><span class="fw-bold" style="color: #5bb88a;">Miễn phí</span></div>
            </div>

            <div class="d-flex justify-content-between align-items-baseline pt-3 mb-4" style="border-top: 1.5px solid var(--pastel-border);">
              <span class="fw-bold" style="font-size: 0.9375rem; color: var(--pastel-ink);">Thành tiền</span>
              <span class="fw-extrabold" style="font-size: 1.5rem; color: var(--pastel-coral-dark);">{{ formatCurrency(orderTotal) }}</span>
            </div>

            <button class="btn-coral w-100 d-flex align-items-center justify-content-center gap-2"
              :loading="submitting" :disabled="selectedCartItems.length === 0"
              style="font-size: 0.9375rem; padding: 0.75rem;"
              @click="placeOrder">
              Xác Nhận Đặt Hàng <i class="bi bi-check-circle"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add address modal -->
    <BaseModal v-model="showAddressModal" title="Thêm Địa Chỉ Mới">
      <div class="d-flex flex-column gap-3">
        <BaseInput v-model="newAddress.recipientName" label="Họ và tên người nhận" placeholder="Nguyễn Văn A" required />
        <BaseInput v-model="newAddress.phone" label="Số điện thoại" placeholder="0901234567" required />
        <BaseInput v-model="newAddress.streetDetail" label="Số nhà, tên đường" placeholder="123 Đường Nguyễn Trãi" required />
        <BaseInput v-model="newAddress.fullAddress" label="Địa chỉ đầy đủ" placeholder="Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh" required />
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 w-100">
          <button class="btn-pastel" @click="showAddressModal = false" style="font-size: 0.875rem; padding: 0.5rem 1rem;">Hủy</button>
          <button class="btn-coral" :loading="savingAddress" @click="handleSaveNewAddress" style="font-size: 0.875rem; padding: 0.5rem 1rem;">Lưu địa chỉ</button>
        </div>
      </template>
    </BaseModal>
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
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
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
const newAddress = reactive({ recipientName: '', phone: '', streetDetail: '', fullAddress: '', isDefault: false })
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt cho shipper khi nhận hàng', icon: 'bi-cash-coin', bg: 'var(--pastel-mint)', color: '#2d6a4f' },
  { value: 'VNPAY', label: 'Thanh toán trực tuyến VNPAY', desc: 'Thanh toán qua quét mã QR hoặc thẻ ATM', icon: 'bi-qr-code-scan', bg: 'var(--pastel-lavender)', color: '#5b3a9e' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trực tiếp vào tài khoản ngân hàng', icon: 'bi-bank', bg: 'var(--pastel-butter)', color: '#7a5f00' },
]

const selectedCartItems = computed(() => cartStore.items.filter(i => i.isSelected !== false))
const voucherInput = ref('')
const appliedVoucher = ref(null)
const validatingVoucher = ref(false)
const voucherDiscount = computed(() => appliedVoucher.value ? Number(appliedVoucher.value.discountAmount) || 0 : 0)
const orderTotal = computed(() => Math.max(0, cartStore.subtotalPrice - voucherDiscount.value))

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
    const payload = { addressId, paymentMethod: selectedPaymentMethod.value, voucherCode: appliedVoucher.value?.code || null, note: orderNote.value }
    const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const createdOrder = await buyerOrderService.createOrder(payload, idempotencyKey)
    if (createdOrder?.paymentUrl) { notify.push('Đang chuyển hướng thanh toán...', 'info'); window.location.href = createdOrder.paymentUrl; return }
    notify.push('Đặt hàng thành công! Cảm ơn bạn.', 'success')
    await cartStore.fetchCart()
    router.push({ name: 'account-order-confirmation', params: { id: createdOrder.id } })
  } catch (_) {} finally { submitting.value = false }
}

const handleApplyVoucher = async () => {
  const code = voucherInput.value.trim()
  if (!code) { notify.push('Vui lòng nhập mã giảm giá.', 'warning'); return }
  validatingVoucher.value = true
  try {
    const result = await promotionService.validate(code, cartStore.subtotalPrice || 0)
    appliedVoucher.value = result; voucherInput.value = ''
    notify.push(`Áp dụng mã "${code}" thành công! Giảm ${formatCurrency(result.discountAmount)}`, 'success')
  } catch (_) { notify.push('Mã giảm giá không hợp lệ.', 'danger') } finally { validatingVoucher.value = false }
}

const handleRemoveVoucher = () => { appliedVoucher.value = null; voucherInput.value = ''; notify.push('Đã hủy mã giảm giá.', 'info') }
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

onMounted(() => { cartStore.fetchCart(); fetchAddresses() })
</script>
