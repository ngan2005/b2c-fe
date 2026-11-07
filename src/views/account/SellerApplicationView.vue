<template>
  <!-- [PASTEL-REDESIGN] SellerApplicationView -->
  <div class="bg-cream min-vh-100 py-5">
    <div class="container" style="max-width: 44rem;">

      <!-- Title -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="d-flex align-items-center justify-content-center"
          style="width:3rem;height:3rem;border-radius:16px;background:var(--pastel-mint);color:#2d6a4f;font-size:1.25rem;">
          <i class="bi bi-shop"></i>
        </div>
        <h1 style="font-size: 1.75rem; font-weight: 800; color: var(--pastel-ink); margin: 0; letter-spacing: -0.02em;">Đăng Ký Trở Thành Nhà Bán Hàng</h1>
      </div>

      <div class="card-pastel">

        <!-- Header -->
        <div class="text-center mb-4">
          <!-- Inline SVG illustration -->
          <svg width="80" height="80" viewBox="0 0 100 100" class="anim-float mb-3" style="display: block; margin: 0 auto;">
            <circle cx="50" cy="50" r="45" fill="var(--pastel-mint)" opacity="0.3"/>
            <rect x="25" y="40" width="50" height="40" rx="10" fill="var(--pastel-mint)"/>
            <path d="M33 40 Q33 25 50 25 Q67 25 67 40" stroke="var(--pastel-coral)" stroke-width="5" fill="none" stroke-linecap="round"/>
            <rect x="25" y="40" width="50" height="12" rx="10" fill="var(--pastel-coral)" opacity="0.6"/>
            <circle cx="50" cy="65" r="8" fill="white" opacity="0.8"/>
            <path d="M46 65 L49 68 L55 62" stroke="var(--pastel-coral-dark)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2 class="fw-extrabold mb-2" style="font-size: 1.25rem; color: var(--pastel-ink);">Mở Gian Hàng Trên B2C Market</h2>
          <p style="font-size: 0.875rem; color: var(--pastel-muted);">Điền thông tin bên dưới để gửi hồ sơ xét duyệt tới Quản trị viên.</p>
        </div>

        <!-- ── Success: submitted (new) ────────────────────────── -->
        <div v-if="submitted && !wasUpgraded"
          class="p-4 mb-4 text-center"
          style="border-radius: 16px; background: rgba(184,232,212,0.2); border: 1.5px solid var(--pastel-mint);">
          <i class="bi bi-check-circle-fill fs-1 d-block mb-2" style="color: #5bb88a;"></i>
          <h4 class="fw-bold mb-1" style="color: #2d6a4f;">Đơn Đăng Ký Đã Được Gửi!</h4>
          <p style="font-size: 0.875rem; color: var(--pastel-muted);">Hồ sơ của bạn đang được Ban quản trị duyệt. Bạn sẽ nhận thông báo sau khi được phê duyệt.</p>
          <router-link :to="{ name: 'home' }" class="btn-coral text-decoration-none d-inline-flex align-items-center gap-2" style="font-size: 0.875rem; padding: 0.5rem 1.25rem;">
            Quay về trang chủ <i class="bi bi-arrow-right" style="font-size: 0.75rem;"></i>
          </router-link>
        </div>

        <!-- ── Success: upgraded ───────────────────────────────── -->
        <div v-if="submitted && wasUpgraded"
          class="p-4 mb-4 text-center"
          style="border-radius: 16px; background: rgba(214,197,240,0.2); border: 1.5px solid var(--pastel-lavender);">
          <i class="bi bi-stars fs-1 d-block mb-2" style="color: #9b74d1;"></i>
          <h4 class="fw-bold mb-1" style="color: #5b3a9e;">Nâng Cấp Thành Công!</h4>
          <p style="font-size: 0.875rem; color: var(--pastel-muted);">Tài khoản đã được nâng cấp lên Seller. Đơn hàng cũ được giữ nguyên.</p>
          <router-link :to="{ name: 'seller-dashboard' }" class="btn-coral text-decoration-none d-inline-flex align-items-center gap-2" style="font-size: 0.875rem; padding: 0.5rem 1.25rem;">
            Đi tới Kênh Nhà Bán <i class="bi bi-arrow-right" style="font-size: 0.75rem;"></i>
          </router-link>
        </div>

        <!-- ── Application Form ─────────────────────────────────── -->
        <form v-if="!submitted" @submit.prevent="handleSubmit" class="d-flex flex-column gap-3">

          <!-- Mode radio group -->
          <div class="card-pastel" style="padding: 1rem; border-color: var(--pastel-pink) !important;">
            <label class="form-label fw-bold mb-3" style="color: var(--pastel-ink);">Bạn muốn đăng ký với email nào?</label>
            <div class="d-flex flex-column gap-2">
              <div class="form-check">
                <input id="mode-new" v-model="formMode" class="form-check-input" type="radio" value="new" />
                <label for="mode-new" class="form-check-label" style="font-size: 0.875rem; font-weight: 600; color: var(--pastel-ink);">
                  <strong>Dùng email khác</strong> — Tạo tài khoản Seller mới (hồ sơ sẽ được duyệt)
                </label>
              </div>
              <div class="form-check">
                <input id="mode-upgrade" v-model="formMode" class="form-check-input" type="radio" value="upgrade" />
                <label for="mode-upgrade" class="form-check-label" style="font-size: 0.875rem; font-weight: 600; color: var(--pastel-ink);">
                  <strong>Dùng email hiện tại (nâng cấp nhanh)</strong> — Nâng cấp tài khoản hiện tại lên Seller ngay lập tức
                </label>
              </div>
            </div>
          </div>

          <!-- Upgrade warning -->
          <div v-if="formMode === 'upgrade'"
            class="p-3" style="border-radius: 16px; background: rgba(255,217,179,0.3); border: 1.5px solid var(--pastel-peach);">
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" style="color: #8a5a20;"></i>
              <div style="font-size: 0.8125rem; color: var(--pastel-ink);">
                <p class="mb-1 fw-bold">Tài khoản này sẽ được nâng cấp lên Seller ngay lập tức.</p>
                <p class="mb-1">Email: <strong>{{ auth.user?.email }}</strong></p>
                <p class="mb-0">Đơn hàng cũ được giữ nguyên.</p>
              </div>
            </div>
            <div class="form-check mt-2">
              <input id="upgrade-confirm" v-model="upgradeConfirmed" class="form-check-input" type="checkbox" />
              <label for="upgrade-confirm" class="form-check-label" style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-ink);">
                Tôi hiểu và đồng ý nâng cấp
              </label>
            </div>
          </div>

          <!-- Form fields -->
          <BaseInput v-model="form.shopName" label="Tên gian hàng / Shop Name" placeholder="Ví dụ: Shop Thời Trang ABC" required />

          <!-- FIX: Changed PERSONAL -> INDIVIDUAL to match backend BusinessType enum -->
          <BaseSelect v-model="form.businessType" label="Loại hình kinh doanh"
            :options="[
              { value: 'INDIVIDUAL', label: 'Cá nhân / Hộ kinh doanh' },
              { value: 'COMPANY', label: 'Doanh nghiệp / Công ty' }
            ]" required />

          <!-- FIX: Added phone field (required by CreateSellerApplicationRequest) -->
          <BaseInput
            v-if="formMode === 'new'"
            v-model="form.phone"
            label="Số điện thoại liên hệ"
            placeholder="Ví dụ: 0901234567"
            required />

          <!-- FIX: Added address field (required by CreateSellerApplicationRequest) -->
          <BaseInput
            v-if="formMode === 'new'"
            v-model="form.address"
            label="Địa chỉ kho / Gian hàng"
            placeholder="Ví dụ: 123 Lê Lợi, Quận 1, TP.HCM"
            required />

          <BaseInput v-model="form.idCardNumber" label="Số CMND / CCCD (tùy chọn)" placeholder="012345678912" />

          <div>
            <label class="form-label">Giới thiệu gian hàng</label>
            <textarea v-model="form.description" class="form-control" rows="3"
              placeholder="Mô tả sản phẩm, thế mạnh kinh doanh của shop..."></textarea>
          </div>

          <div class="d-flex justify-content-end gap-3 pt-3" style="border-top: 1.5px solid var(--pastel-border);">
            <router-link :to="{ name: 'home' }" class="btn-pastel text-decoration-none" style="font-size: 0.875rem; padding: 0.5rem 1rem;">Hủy</router-link>
            <button type="submit" class="btn-coral d-flex align-items-center gap-2"
              :disabled="submitting || (formMode === 'upgrade' && !upgradeConfirmed)"
              style="font-size: 0.875rem; padding: 0.5rem 1.25rem;">
              <i class="bi bi-send"></i> {{ formMode === 'upgrade' ? 'Nâng Cấp Ngay' : 'Gửi Hồ Sơ Xét Duyệt' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { sellerApplicationService } from '@/services/sellerApplication.service'
import { useNotifyStore } from '@/stores/notify'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const notify = useNotifyStore()
const auth = useAuthStore()
const router = useRouter()
const submitting = ref(false)
const submitted = ref(false)
const wasUpgraded = ref(false)
const formMode = ref('new')
const upgradeConfirmed = ref(false)

const form = reactive({
  shopName: '',
  businessType: 'INDIVIDUAL',   // FIX: was 'PERSONAL', must match backend enum BusinessType.INDIVIDUAL
  phone: '',                     // FIX: added — required by CreateSellerApplicationRequest
  address: '',                   // FIX: added — required by CreateSellerApplicationRequest
  idCardNumber: '',
  description: '',
})

const handleSubmit = async () => {
  // FIX: validate phone + address for 'new' (submit) mode
  if (!form.shopName) { notify.push('Vui lòng nhập tên gian hàng!', 'warning'); return }
  if (formMode.value === 'new') {
    if (!form.phone) { notify.push('Vui lòng nhập số điện thoại liên hệ!', 'warning'); return }
    if (!form.address) { notify.push('Vui lòng nhập địa chỉ kho / gian hàng!', 'warning'); return }
  }

  submitting.value = true
  try {
    if (formMode.value === 'upgrade') {
      // POST /api/v1/seller-applications/quick-upgrade
      const data = await sellerApplicationService.quickUpgrade({
        shopName: form.shopName,
        businessType: form.businessType,
        shopDescription: form.description,
        idCardNumber: form.idCardNumber || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      auth.setSession(data.accessToken, {
        id: data.userId, email: data.email, fullName: data.fullName,
        role: data.role, roles: data.roles,
      }, data.refreshToken)
      wasUpgraded.value = true; submitted.value = true
      notify.push('Đã nâng cấp thành Seller!', 'success')
    } else {
      // POST /api/v1/seller-applications
      await sellerApplicationService.submit({
        shopName: form.shopName,
        businessType: form.businessType,
        shopDescription: form.description,
        phone: form.phone,
        address: form.address,
      })
      wasUpgraded.value = false; submitted.value = true
      notify.push('Đơn đăng ký Seller đã được gửi!', 'success')
    }
  } catch (err) {
    const status = err?.response?.status
    if (status === 409) notify.push('Bạn đã là Seller hoặc đã có đơn đăng ký đang chờ duyệt.', 'warning')
    else if (status === 400) notify.push('Thông tin không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.', 'danger')
    else if (status === 403) notify.push('Tài khoản của bạn không có quyền đăng ký Seller. Vui lòng đăng nhập lại.', 'danger')
    else notify.push('Không thể gửi đơn đăng ký. Vui lòng thử lại.', 'danger')
  } finally { submitting.value = false }
}
</script>
