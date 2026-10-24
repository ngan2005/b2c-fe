<script setup>
import { ref, onMounted } from 'vue'
import { promotionService } from '@/services/promotion.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const notify = useNotifyStore()
const dialog = useDialogs()

const items = ref([])
const totalPages = ref(0)
const page = ref(0)
const size = ref(20)
const loading = ref(false)

// Create/Edit modal state
const showModal = ref(false)
const submitting = ref(false)
const errors = ref({})
// 'create' | 'edit' — drives the modal title, button label and submit target.
const mode = ref('create')
const editingId = ref(null)
const form = ref({
  code: '',
  name: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderValue: 0,
  maxDiscountAmount: '',
  applyScope: 'ALL',
  startAt: '',
  endAt: '',
  quantity: 1,
  limitPerUser: 1,
})

const emptyForm = () => ({
  code: '',
  name: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderValue: 0,
  maxDiscountAmount: '',
  applyScope: 'ALL',
  startAt: '',
  endAt: '',
  quantity: 1,
  limitPerUser: 1,
})

/**
 * Converts an ISO timestamp from the API into the `YYYY-MM-DDTHH:mm` shape
 * that `<input type="datetime-local">` expects.
 *
 * The API returns a LocalDateTime (no timezone suffix), so it is sliced
 * rather than parsed — going through `new Date()` would reinterpret the
 * value in the browser's timezone and shift it by the UTC offset.
 */
function toLocalInput(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 16)
}

function vnd(value) {
  if (value == null) return '0'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

function discountLabel(p) {
  if (p.discountType === 'PERCENT') return p.discountValue + '%'
  if (p.discountType === 'FIXED') return vnd(p.discountValue)
  if (p.discountType === 'FREESHIP') return 'Miễn phí vận chuyển'
  return vnd(p.discountValue)
}

function statusBadge(status) {
  if (status === 'ACTIVE') return 'bg-success'
  if (status === 'EXPIRED') return 'bg-secondary'
  if (status === 'UPCOMING') return 'bg-info'
  return 'bg-secondary'
}

async function load() {
  loading.value = true
  try {
    const res = await promotionService.listForSeller({ page: page.value, size: size.value })
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = emptyForm()
  mode.value = 'create'
  editingId.value = null
  errors.value = {}
  showModal.value = true
}

/**
 * Opens the modal in edit mode, pre-filled with the promotion's current
 * values so the seller can adjust what they need.
 */
function openEdit(p) {
  form.value = {
    code: p.code ?? '',
    name: p.name ?? '',
    discountType: p.discountType ?? 'PERCENT',
    discountValue: p.discountType === 'FREESHIP' ? 0 : (p.discountValue ?? ''),
    minOrderValue: p.minOrderValue ?? 0,
    maxDiscountAmount: p.maxDiscountAmount ?? '',
    applyScope: p.applyScope ?? 'ALL',
    startAt: toLocalInput(p.startAt),
    endAt: toLocalInput(p.endAt),
    quantity: p.quantity ?? 1,
    limitPerUser: p.limitPerUser ?? 1,
  }
  mode.value = 'edit'
  editingId.value = p.id
  errors.value = {}
  showModal.value = true
}

/**
 * Validates the create form before hitting the API.
 *
 * The backend rejects a promotion whose end timestamp is not strictly after
 * its start timestamp, but the rejection only arrives as a toast after the
 * round-trip. Catching it here surfaces the problem next to the offending
 * inputs instead.
 */
function validate() {
  const e = {}
  const f = form.value

  if (!f.code.trim()) {
    e.code = 'Mã khuyến mãi không được để trống.'
  } else if (!/^[A-Za-z0-9_-]{3,50}$/.test(f.code.trim())) {
    e.code = 'Mã chỉ gồm chữ, số, dấu gạch dưới hoặc gạch ngang (3-50 ký tự).'
  }

  if (!f.name.trim()) {
    e.name = 'Tên khuyến mãi không được để trống.'
  }

  // A free-shipping coupon has no monetary value, so 0 is valid for it.
  if (f.discountType !== 'FREESHIP') {
    const value = Number(f.discountValue)
    if (f.discountValue === '' || Number.isNaN(value) || value <= 0) {
      e.discountValue = 'Giá trị phải lớn hơn 0.'
    } else if (f.discountType === 'PERCENT' && value > 100) {
      e.discountValue = 'Phần trăm không được vượt quá 100.'
    }
  }

  const quantity = Number(f.quantity)
  if (!Number.isInteger(quantity) || quantity < 1) {
    e.quantity = 'Tổng lượt dùng phải là số nguyên ≥ 1.'
  }

  const limit = Number(f.limitPerUser)
  if (!Number.isInteger(limit) || limit < 1) {
    e.limitPerUser = 'Giới hạn/người phải là số nguyên ≥ 1.'
  }

  if (!f.startAt) {
    e.startAt = 'Vui lòng chọn ngày bắt đầu.'
  }
  if (!f.endAt) {
    e.endAt = 'Vui lòng chọn ngày kết thúc.'
  } else if (f.startAt && new Date(f.endAt) <= new Date(f.startAt)) {
    // Mirrors the backend rule: end_at must be strictly after start_at.
    e.endAt = 'Ngày kết thúc phải sau ngày bắt đầu.'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

async function submitCreate() {
  if (!validate()) {
    notify.push('Vui lòng sửa các trường được đánh dấu đỏ.', 'warning')
    return
  }
  submitting.value = true
  try {
    const payload = {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim(),
      discountType: form.value.discountType,
      discountValue: form.value.discountType === 'FREESHIP' ? 0 : Number(form.value.discountValue),
      minOrderValue: Number(form.value.minOrderValue) || 0,
      maxDiscountAmount: form.value.maxDiscountAmount ? Number(form.value.maxDiscountAmount) : null,
      applyScope: form.value.applyScope,
      startAt: form.value.startAt,
      endAt: form.value.endAt,
      quantity: Number(form.value.quantity) || 1,
      limitPerUser: Number(form.value.limitPerUser) || 1,
    }
    if (mode.value === 'edit') {
      await promotionService.updateForSeller(editingId.value, payload)
      notify.push('Cập nhật khuyến mãi thành công!', 'success')
    } else {
      await promotionService.createForSeller(payload)
      notify.push('Tạo khuyến mãi thành công!', 'success')
    }
    showModal.value = false
    load()
  } catch {
    // Global interceptor shows error
  } finally {
    submitting.value = false
  }
}

async function disable(p) {
  const ok = await dialog.confirm(`Vô hiệu khuyến mãi "${p.name}"?`, {
    title: 'Vô hiệu khuyến mãi',
    variant: 'warning',
    confirmText: 'Vô hiệu',
  })
  if (!ok) return
  promotionService.disableForSeller(p.id)
    .then(() => {
      notify.push('Đã vô hiệu khuyến mãi.', 'success')
      load()
    })
    .catch(() => {})
}

onMounted(load)
</script>

<template>
  <div class="seller-promos-container space-y-6">
    <!-- ── Hero Banner: Marketing & Vouchers (Unified Dark Slate Theme) ── -->
    <div class="seller-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="seller-hero-pill">MARKETING & CAMPAIGNS</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span>
              Kích cầu doanh số &amp; Thu hút khách mua
            </span>
          </div>
          <h1 class="seller-hero-title">Khuyến Mãi &amp; Mã Giảm Giá</h1>
          <p class="seller-hero-desc">
            Thiết lập mã giảm giá theo phần trăm, số tiền cố định hoặc voucher miễn phí vận chuyển cho gian hàng
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap">
          <button class="seller-hero-btn" @click="load" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới
          </button>
          <button class="seller-btn-primary" @click="openCreate">
            <i class="bi bi-plus-lg me-1.5"></i>
            Tạo khuyến mãi mới
          </button>
        </div>
      </div>
    </div>

    <!-- ── Promotions Table ───────────────────────────────── -->
    <div class="seller-surface-card p-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50 text-slate-500 font-semibold text-xs border-bottom border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0">MÃ VOUCHER</th>
              <th class="py-3 px-3.5 border-0">TÊN CHƯƠNG TRÌNH</th>
              <th class="py-3 px-3.5 border-0">LOẠI ƯU ĐÃI</th>
              <th class="py-3 px-3.5 text-end border-0">MỨC GIẢM</th>
              <th class="py-3 px-3.5 border-0">HIỆU LỰC TỪ</th>
              <th class="py-3 px-3.5 border-0">ĐẾN NGÀY</th>
              <th class="py-3 px-3.5 text-center border-0">TRẠNG THÁI</th>
              <th class="py-3 px-3.5 text-end border-0" style="width: 140px;">THAO TÁC</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="8" class="text-center text-slate-400 py-8">
                <div class="spinner-border spinner-border-sm text-indigo-600 me-2"></div>Đang tải dữ liệu khuyến mãi...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="8" class="text-center text-slate-400 py-8">Chưa có mã khuyến mãi nào được tạo.</td>
            </tr>
            <tr v-for="p in items" :key="p.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-3.5 py-3">
                <span class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono font-bold text-xs">
                  {{ p.code }}
                </span>
              </td>
              <td class="px-3.5 py-3">
                <div class="fw-bold text-slate-800">{{ p.name }}</div>
                <div v-if="p.description" class="small text-slate-400">{{ p.description }}</div>
              </td>
              <td class="px-3.5 py-3">
                <span v-if="p.discountType === 'PERCENT'" class="badge bg-sky-50 text-sky-700 border border-sky-200 rounded-pill px-2.5 py-1 font-bold">
                  Phần trăm
                </span>
                <span v-else-if="p.discountType === 'FIXED'" class="badge bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-pill px-2.5 py-1 font-bold">
                  Cố định
                </span>
                <span v-else-if="p.discountType === 'FREESHIP'" class="badge bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-pill px-2.5 py-1 font-bold">
                  Freeship
                </span>
                <span v-else class="badge bg-slate-100 text-slate-700 border border-slate-200 rounded-pill px-2.5 py-1 font-bold">
                  {{ p.discountType }}
                </span>
              </td>
              <td class="px-3.5 py-3 text-end font-mono font-black text-slate-800">{{ discountLabel(p) }}</td>
              <td class="px-3.5 py-3 text-slate-500 font-mono text-xs">{{ new Date(p.startAt).toLocaleDateString('vi-VN') }}</td>
              <td class="px-3.5 py-3 text-slate-500 font-mono text-xs">{{ new Date(p.endAt).toLocaleDateString('vi-VN') }}</td>
              <td class="px-3.5 py-3 text-center">
                <span class="badge" :class="statusBadge(p.status)">{{ p.status }}</span>
              </td>
              <td class="px-3.5 py-3 text-end">
                <div class="d-inline-flex gap-1.5">
                  <button
                    class="btn btn-sm btn-outline-secondary rounded-lg"
                    title="Sửa khuyến mãi"
                    @click="openEdit(p)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    v-if="p.status === 'ACTIVE'"
                    class="btn btn-sm btn-outline-danger rounded-lg"
                    title="Vô hiệu hóa"
                    @click="disable(p)"
                  >
                    <i class="bi bi-slash-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 border-top border-slate-100 d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-slate-500 font-medium">Trang <strong class="text-slate-800">{{ page + 1 }}</strong> / <strong>{{ totalPages }}</strong></small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; load() }">
            <i class="bi bi-chevron-left me-1"></i>Trước
          </button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; load() }">
            Sau<i class="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>

  <!-- Create / Edit Promotion Modal -->
  <div class="modal fade" id="createPromotionModal" tabindex="-1" :class="{ show: showModal }"
       :style="showModal ? 'display:block;' : ''" @click.self="showModal = false">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold">
            <i class="bi me-1" :class="mode === 'edit' ? 'bi-pencil-square text-indigo-600' : 'bi-tags text-indigo-600'"></i>
            {{ mode === 'edit' ? 'Cập Nhật Khuyến Mãi' : 'Tạo Khuyến Mãi Mới' }}
          </h5>
          <button type="button" class="btn-close" @click="showModal = false"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Mã khuyến mãi <span class="text-danger">*</span></label>
              <input v-model="form.code" class="form-control" :class="{ 'is-invalid': errors.code }" placeholder="VD: SUMMER2026" />
              <div v-if="errors.code" class="invalid-feedback d-block">{{ errors.code }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Tên khuyến mãi <span class="text-danger">*</span></label>
              <input v-model="form.name" class="form-control" :class="{ 'is-invalid': errors.name }" placeholder="VD: Giảm giá mùa hè" />
              <div v-if="errors.name" class="invalid-feedback d-block">{{ errors.name }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Loại <span class="text-danger">*</span></label>
              <select v-model="form.discountType" class="form-select">
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (VNĐ)</option>
                <option value="FREESHIP">Miễn phí vận chuyển</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">
                Giá trị
                <span v-if="form.discountType !== 'FREESHIP'" class="text-danger">*</span>
              </label>
              <input
                v-model="form.discountValue"
                type="number"
                class="form-control"
                :class="{ 'is-invalid': errors.discountValue }"
                :disabled="form.discountType === 'FREESHIP'"
                :placeholder="form.discountType === 'FREESHIP' ? 'Không cần nhập' : 'VD: 10'"
                min="0"
                step="0.01"
              />
              <div v-if="errors.discountValue" class="invalid-feedback d-block">{{ errors.discountValue }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Tổng lượt dùng <span class="text-danger">*</span></label>
              <input
                v-model="form.quantity"
                type="number"
                class="form-control"
                :class="{ 'is-invalid': errors.quantity }"
                placeholder="VD: 100"
                min="1"
              />
              <div v-if="errors.quantity" class="invalid-feedback d-block">{{ errors.quantity }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Giới hạn/người</label>
              <input
                v-model="form.limitPerUser"
                type="number"
                class="form-control"
                :class="{ 'is-invalid': errors.limitPerUser }"
                placeholder="VD: 1"
                min="1"
              />
              <div v-if="errors.limitPerUser" class="invalid-feedback d-block">{{ errors.limitPerUser }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Phạm vi áp dụng <span class="text-danger">*</span></label>
              <select v-model="form.applyScope" class="form-select">
                <option value="ALL">Tất cả sản phẩm</option>
                <option value="CATEGORY">Theo danh mục</option>
                <option value="PRODUCT">Sản phẩm cụ thể</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Đơn tối thiểu (VNĐ)</label>
              <input v-model="form.minOrderValue" type="number" class="form-control" placeholder="VD: 100000" min="0" />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Giảm tối đa (VNĐ)</label>
              <input v-model="form.maxDiscountAmount" type="number" class="form-control" placeholder="VD: 50000" min="0" />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Ngày bắt đầu <span class="text-danger">*</span></label>
              <input
                v-model="form.startAt"
                type="datetime-local"
                class="form-control"
                :class="{ 'is-invalid': errors.startAt }"
              />
              <div v-if="errors.startAt" class="invalid-feedback d-block">{{ errors.startAt }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Ngày kết thúc <span class="text-danger">*</span></label>
              <input
                v-model="form.endAt"
                type="datetime-local"
                class="form-control"
                :class="{ 'is-invalid': errors.endAt }"
              />
              <div v-if="errors.endAt" class="invalid-feedback d-block">{{ errors.endAt }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">Hủy</button>
          <button type="button" class="btn btn-primary" @click="submitCreate" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
            {{ mode === 'edit' ? 'Lưu thay đổi' : 'Tạo khuyến mãi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.seller-promos-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Hero Operational Dark Slate Banner ──────────────────── */
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
  font-size: 0.68rem;
  font-weight: 600;
  color: #34d399;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.seller-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.seller-hero-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.seller-hero-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 0;
  max-width: 620px;
  line-height: 1.45;
}

.seller-hero-btn {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  transition: all 0.15s;
  cursor: pointer;
}

.seller-hero-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.seller-btn-primary {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  transition: all 0.15s;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.seller-btn-primary:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
  color: #ffffff;
  transform: translateY(-1px);
}

.seller-surface-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
