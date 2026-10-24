<template>
  <div class="space-y-6">
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl">Quản Lý Khuyến Mãi & Mã Giảm Giá</h1>
        <p class="text-xs text-slate-500 mb-0">
          Giao diện quản lý mã giảm giá Voucher toàn sàn
        </p>
      </div>
      <BaseButton variant="primary" size="sm" @click="openCreate">
        + Tạo mã giảm giá mới
      </BaseButton>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center text-muted py-5">
      <div class="spinner-border spinner-border-sm me-2"></div> Đang tải...
    </div>
    <div v-else-if="loadError" class="alert alert-danger">{{ loadError }}</div>

    <!-- Promotions Table -->
    <BaseCard v-else>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Mã Voucher</th>
              <th>Tên chương trình</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Lượt dùng</th>
              <th>Thời hạn</th>
              <th>Trạng thái</th>
              <th class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!promotions.length">
              <td colspan="8" class="text-center text-muted py-4">Chưa có khuyến mãi nào.</td>
            </tr>
            <tr v-for="promo in promotions" :key="promo.id">
              <td class="font-bold text-blue-600 font-mono">{{ promo.code }}</td>
              <td class="fw-semibold text-slate-800">{{ promo.name }}</td>
              <td><BaseBadge variant="info">{{ promo.discountType }}</BaseBadge></td>
              <td class="fw-bold">
                {{ promo.discountType === 'PERCENT' ? promo.discountValue + '%'
                  : promo.discountType === 'FREESHIP' ? 'Miễn phí ship'
                  : formatCurrency(promo.discountValue) }}
              </td>
              <td class="small">{{ promo.usedCount ?? 0 }} / {{ promo.quantity ?? '∞' }}</td>
              <td class="text-xs text-muted">
                {{ promo.startAt ? formatDate(promo.startAt) : '—' }}
                đến
                {{ promo.endAt ? formatDate(promo.endAt) : '—' }}
              </td>
              <td><BaseBadge :variant="statusVariant(promo.status)">{{ promo.status }}</BaseBadge></td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-light text-blue-600"
                    title="Sửa voucher"
                    @click="openEdit(promo)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button
                    v-if="promo.status === 'ACTIVE' || promo.status === 'ENABLED'"
                    class="btn btn-light text-orange-600"
                    title="Vô hiệu hóa"
                    @click="handleDisable(promo)"
                  >
                    <i class="bi bi-slash-circle"></i>
                  </button>
                  <button
                    class="btn btn-light text-rose-600"
                    title="Xóa"
                    @click="handleDelete(promo)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="card-body d-flex justify-content-between align-items-center" v-if="totalPages > 1">
        <small class="text-muted">{{ totalElements }} khuyến mãi — trang {{ page + 1 }} / {{ totalPages }}</small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; load() }">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; load() }">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- Create / Edit Promotion Modal -->
    <BaseModal v-model="showAddModal" :title="mode === 'edit' ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'">
      <div class="space-y-3">
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Mã voucher (UPPERCASE)</label>
          <input v-model="form.code" class="form-control" :class="{ 'is-invalid': formErrors.code }" placeholder="SALE50K" />
          <div v-if="formErrors.code" class="text-danger small mt-1">{{ formErrors.code }}</div>
        </div>
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Tên chương trình</label>
          <input v-model="form.name" class="form-control" :class="{ 'is-invalid': formErrors.name }" placeholder="Giảm 50k cho đơn từ 200k" />
          <div v-if="formErrors.name" class="text-danger small mt-1">{{ formErrors.name }}</div>
        </div>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Loại khuyến mãi</label>
            <select v-model="form.discountType" class="form-select">
              <option value="FIXED">Số tiền cố định (VND)</option>
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="FREESHIP">Miễn phí vận chuyển</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Giá trị giảm</label>
            <input
              v-model.number="form.discountValue"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': formErrors.discountValue }"
              :disabled="form.discountType === 'FREESHIP'"
              :placeholder="form.discountType === 'FREESHIP' ? 'Không cần nhập' : '50000'"
              min="0"
            />
            <div v-if="formErrors.discountValue" class="text-danger small mt-1">{{ formErrors.discountValue }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Tổng lượt dùng</label>
            <input
              v-model.number="form.quantity"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': formErrors.quantity }"
              placeholder="100"
              min="1"
            />
            <div v-if="formErrors.quantity" class="text-danger small mt-1">{{ formErrors.quantity }}</div>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Giới hạn/người</label>
            <input
              v-model.number="form.limitPerUser"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': formErrors.limitPerUser }"
              placeholder="1"
              min="1"
            />
            <div v-if="formErrors.limitPerUser" class="text-danger small mt-1">{{ formErrors.limitPerUser }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Phạm vi áp dụng</label>
            <select v-model="form.applyScope" class="form-select">
              <option value="ALL">Tất cả sản phẩm</option>
              <option value="CATEGORY">Theo danh mục</option>
              <option value="PRODUCT">Sản phẩm cụ thể</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Đơn tối thiểu (VND)</label>
            <input v-model.number="form.minOrderValue" type="number" class="form-control" placeholder="0" min="0" />
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Giảm tối đa (VND)</label>
            <input v-model.number="form.maxDiscountAmount" type="number" class="form-control" placeholder="Không giới hạn" min="0" />
          </div>
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Ngày bắt đầu</label>
            <input v-model="form.startAt" type="datetime-local" class="form-control" :class="{ 'is-invalid': formErrors.startAt }" />
            <div v-if="formErrors.startAt" class="text-danger small mt-1">{{ formErrors.startAt }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label text-xs text-slate-500 fw-semibold">Ngày kết thúc</label>
            <input v-model="form.endAt" type="datetime-local" class="form-control" :class="{ 'is-invalid': formErrors.endAt }" />
            <div v-if="formErrors.endAt" class="text-danger small mt-1">{{ formErrors.endAt }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 w-100">
          <BaseButton variant="ghost" size="sm" @click="showAddModal = false">Hủy</BaseButton>
          <BaseButton variant="primary" size="sm" :disabled="creating" @click="handleCreate">
            {{ mode === 'edit' ? 'Lưu thay đổi' : 'Tạo voucher' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminPromotionService } from '@/services/adminPromotion.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const notify = useNotifyStore()
const dialog = useDialogs()
const showAddModal = ref(false)
const loading = ref(false)
const loadError = ref('')
const promotions = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const creating = ref(false)
// 'create' | 'edit' — drives the modal title, button label and submit target.
const mode = ref('create')
const editingId = ref(null)

const form = reactive({
  code: '',
  name: '',
  discountType: 'FIXED',
  discountValue: 0,
  quantity: 100,
  limitPerUser: 1,
  applyScope: 'ALL',
  minOrderValue: 0,
  maxDiscountAmount: null,
  startAt: '',
  endAt: '',
})
const formErrors = reactive({
  code: '',
  name: '',
  discountValue: '',
  quantity: '',
  limitPerUser: '',
  startAt: '',
  endAt: '',
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

function resetForm() {
  Object.assign(form, {
    code: '',
    name: '',
    discountType: 'FIXED',
    discountValue: 0,
    quantity: 100,
    limitPerUser: 1,
    applyScope: 'ALL',
    minOrderValue: 0,
    maxDiscountAmount: null,
    startAt: '',
    endAt: '',
  })
  Object.keys(formErrors).forEach((k) => {
    formErrors[k] = ''
  })
}

/** Opens the modal in edit mode, pre-filled with the voucher's current values. */
function openEdit(promo) {
  Object.assign(form, {
    code: promo.code ?? '',
    name: promo.name ?? '',
    discountType: promo.discountType ?? 'FIXED',
    discountValue: promo.discountType === 'FREESHIP' ? 0 : (promo.discountValue ?? 0),
    quantity: promo.quantity ?? 100,
    limitPerUser: promo.limitPerUser ?? 1,
    applyScope: promo.applyScope ?? 'ALL',
    minOrderValue: promo.minOrderValue ?? 0,
    maxDiscountAmount: promo.maxDiscountAmount ?? null,
    startAt: toLocalInput(promo.startAt),
    endAt: toLocalInput(promo.endAt),
  })
  mode.value = 'edit'
  editingId.value = promo.id
  showAddModal.value = true
}

/** Opens the modal in create mode with a blank form. */
function openCreate() {
  resetForm()
  mode.value = 'create'
  editingId.value = null
  showAddModal.value = true
}

function statusVariant(s) {
  switch (s) {
    case 'ACTIVE': case 'ENABLED': return 'success'
    case 'DISABLED': return 'secondary'
    case 'EXPIRED': return 'warning'
    default: return 'neutral'
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(dateStr))
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminPromotionService.list({ page: page.value, size: size.value })
    promotions.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? promotions.value.length
  } catch (e) {
    loadError.value = 'Không thể tải danh sách khuyến mãi.'
  } finally {
    loading.value = false
  }
}

function validateForm() {
  formErrors.code = form.code.trim() ? '' : 'Mã voucher không được để trống.'
  formErrors.name = form.name.trim() ? '' : 'Tên chương trình không được để trống.'
  formErrors.discountValue =
    form.discountType === 'FREESHIP'
      ? ''
      : Number(form.discountValue) > 0
        ? ''
        : 'Giá trị giảm phải lớn hơn 0.'
  formErrors.quantity = Number.isInteger(Number(form.quantity)) && Number(form.quantity) >= 1
    ? ''
    : 'Tổng lượt dùng phải là số nguyên ≥ 1.'
  formErrors.limitPerUser = Number.isInteger(Number(form.limitPerUser)) && Number(form.limitPerUser) >= 1
    ? ''
    : 'Giới hạn/người phải là số nguyên ≥ 1.'
  formErrors.startAt = form.startAt ? '' : 'Vui lòng chọn ngày bắt đầu.'
  formErrors.endAt = !form.endAt
    ? 'Vui lòng chọn ngày kết thúc.'
    : form.startAt && new Date(form.endAt) <= new Date(form.startAt)
      ? 'Ngày kết thúc phải sau ngày bắt đầu.'
      : ''
  return !Object.values(formErrors).some(Boolean)
}

async function handleCreate() {
  if (!validateForm()) return
  creating.value = true
  try {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      discountType: form.discountType,
      discountValue: form.discountType === 'FREESHIP' ? 0 : Number(form.discountValue) || 0,
      quantity: Number(form.quantity) || 100,
      limitPerUser: Number(form.limitPerUser) || 1,
      applyScope: form.applyScope,
      minOrderValue: Number(form.minOrderValue) || 0,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      startAt: form.startAt,
      endAt: form.endAt,
    }
    if (mode.value === 'edit') {
      await adminPromotionService.update(editingId.value, payload)
      notify.push('Cập nhật voucher thành công!', 'success')
    } else {
      await adminPromotionService.create(payload)
      notify.push('Tạo voucher thành công!', 'success')
    }
    showAddModal.value = false
    resetForm()
    load()
  } catch (e) {
    notify.push(
      mode.value === 'edit' ? 'Không thể cập nhật voucher. Vui lòng thử lại.' : 'Không thể tạo voucher. Vui lòng thử lại.',
      'danger',
    )
  } finally {
    creating.value = false
  }
}

async function handleDisable(promo) {
  const ok = await dialog.confirm(`Vô hiệu hóa voucher "${promo.code}"?`, {
    title: 'Vô hiệu hóa voucher',
    variant: 'warning',
    confirmText: 'Vô hiệu hóa',
  })
  if (!ok) return
  try {
    await adminPromotionService.disable(promo.id)
    notify.push('Đã vô hiệu hóa voucher.', 'info')
    load()
  } catch (e) {
    notify.push('Không thể vô hiệu hóa.', 'danger')
  }
}

async function handleDelete(promo) {
  const ok = await dialog.confirm(`Xóa voucher "${promo.code}"? Hành động này không thể hoàn tác.`, {
    title: 'Xóa voucher',
    variant: 'danger',
    confirmText: 'Xóa',
  })
  if (!ok) return
  try {
    await adminPromotionService.delete(promo.id)
    notify.pushUndo({
      message: `Đã xóa voucher "${promo.code}".`,
      variant: 'success',
      actionLabel: 'Hoàn tác',
      onAction: async () => {
        try {
          await adminPromotionService.restore(promo.id)
          notify.push(`Đã khôi phục voucher "${promo.code}".`, 'success')
        } catch (e) {
          notify.push('Không thể khôi phục voucher. Vui lòng thử lại.', 'danger')
        } finally {
          load()
        }
      },
    })
  } catch (e) {
    notify.push('Không thể xóa voucher. Vui lòng thử lại.', 'danger')
  }
}

onMounted(load)
</script>
