<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl">Quản Lý Phí Sàn (Commission Rules)</h1>
        <p class="text-xs text-slate-500 mb-0">
          Thiết lập phần trăm phí sàn theo danh mục hoặc toàn sàn.
        </p>
      </div>
      <div class="d-flex gap-2">
        <BaseButton variant="outline-secondary" size="sm" @click="handleBackfill" :disabled="backfilling">
          <i class="bi bi-arrow-repeat me-1"></i>
          Backfill đơn cũ
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="openCreate">
          + Tạo rule mới
        </BaseButton>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center text-muted py-5">
      <div class="spinner-border spinner-border-sm me-2"></div> Đang tải...
    </div>
    <div v-else-if="loadError" class="alert alert-danger">{{ loadError }}</div>

    <!-- Rules Table -->
    <BaseCard v-else>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Phạm vi</th>
              <th>% Phí</th>
              <th>Tối thiểu</th>
              <th>Cap</th>
              <th>Active</th>
              <th>Hiệu lực</th>
              <th class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!rules.length">
              <td colspan="9" class="text-center text-muted py-4">Chưa có rule nào.</td>
            </tr>
            <tr v-for="rule in rules" :key="rule.id">
              <td class="font-mono text-xs text-slate-400">#{{ rule.id }}</td>
              <td class="fw-semibold text-slate-800">{{ rule.name }}</td>
              <td>
                <span v-if="rule.categoryName" class="badge bg-info text-dark">{{ rule.categoryName }}</span>
                <span v-else class="badge bg-secondary">Toàn sàn</span>
              </td>
              <td class="fw-bold">{{ rule.percent }}%</td>
              <td class="small text-muted">{{ rule.minOrderValue ? formatCurrency(rule.minOrderValue) : '—' }}</td>
              <td class="small text-muted">{{ rule.maxCommission != null ? formatCurrency(rule.maxCommission) : '—' }}</td>
              <td>
                <BaseBadge :variant="rule.isActive ? 'success' : 'secondary'">
                  {{ rule.isActive ? 'Active' : 'Inactive' }}
                </BaseBadge>
              </td>
              <td class="text-xs text-muted">
                {{ formatDate(rule.effectiveFrom) }}
                <span v-if="rule.effectiveTo"> → {{ formatDate(rule.effectiveTo) }}</span>
                <span v-else> → ∞</span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-light text-blue-600"
                    title="Sửa"
                    @click="openEdit(rule)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button
                    v-if="rule.isActive"
                    class="btn btn-light text-orange-600"
                    title="Vô hiệu hóa"
                    @click="handleDisable(rule)"
                  >
                    <i class="bi bi-slash-circle"></i>
                  </button>
                  <button
                    class="btn btn-light text-rose-600"
                    title="Xóa"
                    @click="requestDelete(rule)"
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
        <small class="text-muted">{{ totalElements }} rules — trang {{ page + 1 }} / {{ totalPages }}</small>
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

    <!-- Create / Edit Modal -->
    <BaseModal v-model="showModal" :title="isEditing ? 'Sửa Commission Rule' : 'Tạo Commission Rule Mới'" size="md" @close="closeModal">
      <div class="space-y-3">
        <!-- Name -->
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">
            Tên rule <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            class="form-control"
            placeholder="VD: Phí sàn 5% cho điện tử"
            maxlength="150"
          />
          <div v-if="formErrors.name" class="text-danger small mt-1">{{ formErrors.name }}</div>
          <div class="text-muted small text-end">{{ form.name.length }}/150</div>
        </div>

        <!-- Category dropdown -->
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Phạm vi áp dụng</label>
          <select v-model="form.categoryId" class="form-select">
            <option :value="null">Toàn sàn (global)</option>
            <option
              v-for="cat in flatCategories"
              :key="cat.id"
              :value="cat.id"
            >{{ cat.indentLabel }}</option>
          </select>
        </div>

        <!-- Percent + Min Order -->
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label text-xs text-slate-500 fw-semibold">
              % Phí sàn <span class="text-danger">*</span>
            </label>
            <input
              v-model.number="form.percent"
              type="number"
              class="form-control"
              placeholder="5"
              min="0"
              max="100"
              step="0.01"
            />
            <div v-if="formErrors.percent" class="text-danger small mt-1">{{ formErrors.percent }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label text-xs text-slate-500 fw-semibold">Giá trị đơn tối thiểu (VND)</label>
            <input
              v-model.number="form.minOrderValue"
              type="number"
              class="form-control"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <!-- Max Commission + Active -->
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label text-xs text-slate-500 fw-semibold">Cap phí tối đa (VND)</label>
            <input
              v-model.number="form.maxCommission"
              type="number"
              class="form-control"
              placeholder="Không giới hạn"
              min="0"
            />
            <div class="form-text text-xs">Để trống nếu không có giới hạn.</div>
          </div>
          <div class="col-md-6 d-flex align-items-center">
            <div class="form-check mt-4">
              <input v-model="form.isActive" class="form-check-input" type="checkbox" id="isActiveCheck" />
              <label class="form-check-label fw-semibold text-slate-700" for="isActiveCheck">
                Rule đang hoạt động
              </label>
            </div>
          </div>
        </div>

        <!-- Effective dates -->
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label text-xs text-slate-500 fw-semibold">Ngày bắt đầu</label>
            <input v-model="form.effectiveFrom" type="date" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label text-xs text-slate-500 fw-semibold">Ngày kết thúc</label>
            <input v-model="form.effectiveTo" type="date" class="form-control" />
            <div v-if="formErrors.effectiveTo" class="text-danger small mt-1">{{ formErrors.effectiveTo }}</div>
            <div class="form-text text-xs">Để trống nếu không có ngày kết thúc.</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="d-flex justify-content-end gap-2 w-100">
          <BaseButton variant="ghost" size="sm" @click="closeModal">Hủy</BaseButton>
          <BaseButton variant="primary" size="sm" :disabled="saving" @click="handleSave">
            {{ saving ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo rule') }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="`Xóa rule &quot;${deleteRule?.name}&quot;?`"
      :message="'Hành động này không thể hoàn tác.'"
      confirm-text="Xóa"
      cancel-text="Hủy"
      confirm-variant="danger"
      :loading="deleting"
      :error="deleteError"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { adminCommissionService } from '@/services/adminCommission.service'
import { catalogService } from '@/services/catalog.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const notify = useNotifyStore()
const dialog = useDialogs()

// ── State ──────────────────────────────────────────────────────────────
const loading = ref(false)
const loadError = ref('')
const rules = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const backfilling = ref(false)
const editingId = ref(null)
const deleteRule = ref(null)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const deleteError = ref('')

// Category tree
const categoryTree = ref([])

// ── Form ───────────────────────────────────────────────────────────────
const defaultForm = () => ({
  name: '',
  categoryId: null,
  percent: 0,
  minOrderValue: 0,
  maxCommission: null,
  isActive: true,
  effectiveFrom: '',
  effectiveTo: '',
})

const form = reactive(defaultForm())
const formErrors = reactive({
  name: '',
  percent: '',
  effectiveTo: '',
})

// ── Category flattening ────────────────────────────────────────────────
const flatCategories = computed(() => {
  const result = []
  function traverse(cats, level = 0) {
    for (const cat of cats) {
      const indent = '　'.repeat(level)
      result.push({
        id: cat.id,
        name: cat.name,
        indentLabel: level > 0 ? indent + cat.name : cat.name,
      })
      if (cat.children?.length) {
        traverse(cat.children, level + 1)
      }
    }
  }
  traverse(categoryTree.value)
  return result
})

// ── Formatting helpers ──────────────────────────────────────────────────
function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

// ── Load rules ─────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await adminCommissionService.list({
      page: page.value,
      size: size.value,
      activeOnly: false,
    })
    rules.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? rules.value.length
  } catch (e) {
    loadError.value = 'Không thể tải danh sách commission rules.'
  } finally {
    loading.value = false
  }
}

// ── Load category tree ──────────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await catalogService.getCategoryTree()
    categoryTree.value = res || []
  } catch {
    // categories are optional for the dropdown
    categoryTree.value = []
  }
}

// ── Modal helpers ──────────────────────────────────────────────────────
function resetForm() {
  Object.assign(form, defaultForm())
  Object.assign(formErrors, { name: '', percent: '', effectiveTo: '' })
}

function openCreate() {
  resetForm()
  isEditing.value = false
  editingId.value = null
  showModal.value = true
}

function openEdit(rule) {
  resetForm()
  isEditing.value = true
  editingId.value = rule.id
  form.name = rule.name ?? ''
  form.categoryId = rule.categoryId ?? null
  form.percent = rule.percent ?? 0
  form.minOrderValue = rule.minOrderValue ?? 0
  form.maxCommission = rule.maxCommission ?? null
  form.isActive = rule.isActive ?? true

  // Normalize date strings to YYYY-MM-DD for date inputs
  form.effectiveFrom = rule.effectiveFrom ? rule.effectiveFrom.split('T')[0] : ''
  form.effectiveTo = rule.effectiveTo ? rule.effectiveTo.split('T')[0] : ''

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

// ── Validation ─────────────────────────────────────────────────────────
function validateForm() {
  let valid = true

  formErrors.name = ''
  formErrors.percent = ''
  formErrors.effectiveTo = ''

  if (!form.name.trim()) {
    formErrors.name = 'Tên rule không được để trống.'
    valid = false
  } else if (form.name.trim().length > 150) {
    formErrors.name = 'Tên rule không được vượt quá 150 ký tự.'
    valid = false
  }

  if (form.percent === '' || form.percent === null || form.percent === undefined) {
    formErrors.percent = '% phí sàn không được để trống.'
    valid = false
  } else if (form.percent < 0 || form.percent > 100) {
    formErrors.percent = '% phí sàn phải nằm trong khoảng 0 – 100.'
    valid = false
  }

  if (form.effectiveFrom && form.effectiveTo) {
    if (form.effectiveTo <= form.effectiveFrom) {
      formErrors.effectiveTo = 'Ngày kết thúc phải sau ngày bắt đầu.'
      valid = false
    }
  }

  return valid
}

// ── Save (create / update) ──────────────────────────────────────────────
async function handleSave() {
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId || null,
      percent: Number(form.percent),
      minOrderValue: Number(form.minOrderValue) || 0,
      maxCommission: form.maxCommission != null && form.maxCommission !== '' ? Number(form.maxCommission) : null,
      isActive: !!form.isActive,
      // Backend DTO expects LocalDateTime (ISO 8601). HTML <input type="date"> only
      // gives us "YYYY-MM-DD", so append a time component before sending.
      effectiveFrom: form.effectiveFrom ? `${form.effectiveFrom}T00:00:00` : null,
      effectiveTo: form.effectiveTo ? `${form.effectiveTo}T23:59:59` : null,
    }

    if (isEditing.value) {
      await adminCommissionService.update(editingId.value, payload)
      notify.push('Cập nhật rule thành công!', 'success')
    } else {
      await adminCommissionService.create(payload)
      notify.push('Tạo rule thành công!', 'success')
    }

    closeModal()
    load()
  } catch (e) {
    console.error('Failed to save commission rule:', e?.response?.data || e)
    notify.push('Không thể lưu rule. Vui lòng thử lại.', 'danger')
  } finally {
    saving.value = false
  }
}

// ── Disable ────────────────────────────────────────────────────────────
async function handleDisable(rule) {
  const ok = await dialog.confirm(`Vô hiệu hóa rule "${rule.name}"?`, {
    title: 'Vô hiệu hóa rule',
    variant: 'warning',
    confirmText: 'Vô hiệu hóa',
  })
  if (!ok) return
  try {
    await adminCommissionService.disable(rule.id)
    notify.push('Đã vô hiệu hóa rule.', 'info')
    load()
  } catch (e) {
    console.error('Failed to disable commission rule:', e?.response?.data || e)
    notify.push('Không thể vô hiệu hóa rule.', 'danger')
  }
}

// ── Delete ─────────────────────────────────────────────────────────────
function requestDelete(rule) {
  deleteError.value = ''
  deleteRule.value = rule
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteRule.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await adminCommissionService.delete(deleteRule.value.id)
    notify.push('Đã xóa rule.', 'success')
    showDeleteConfirm.value = false
    deleteRule.value = null
    load()
  } catch (e) {
    console.error('Failed to delete commission rule:', e?.response?.data || e)
    deleteError.value = e?.response?.data?.message || e?.message || 'Không thể xóa rule.'
  } finally {
    deleting.value = false
  }
}

// ── Backfill ────────────────────────────────────────────────────────────
async function handleBackfill() {
  const ok = await dialog.confirm('Chạy backfill commission cho các đơn hoàn thành chưa có phí?', {
    title: 'Backfill commission',
    variant: 'warning',
    confirmText: 'Chạy',
  })
  if (!ok) return
  backfilling.value = true
  try {
    await adminCommissionService.backfill()
    notify.push('Backfill hoàn tất!', 'success')
    load()
  } catch (e) {
    console.error('Failed to backfill commissions:', e?.response?.data || e)
    notify.push('Backfill thất bại. Vui lòng thử lại.', 'danger')
  } finally {
    backfilling.value = false
  }
}

// ── Init ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([load(), loadCategories()])
})
</script>
