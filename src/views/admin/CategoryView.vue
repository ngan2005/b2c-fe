<template>
  <div class="space-y-6">
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl">Quản Lý Danh Mục Sản Phẩm</h1>
        <p class="text-xs text-slate-500 mb-0">Cây phân cấp danh mục toàn hệ thống</p>
      </div>
      <BaseButton variant="primary" size="sm" @click="openAdd">
        + Thêm danh mục mới
      </BaseButton>
    </div>

    <LoadingSpinner v-if="loading" text="Đang nạp danh mục..." />
    <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchCategories" />

    <div v-else class="row g-6">
      <!-- Tree View Column -->
      <div class="col-lg-8">
        <BaseCard title="Cây Danh Mục Hàng Hóa">
          <div class="space-y-2">
            <div v-for="cat in categoryTree" :key="cat.id" class="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2 font-bold text-slate-800 text-sm">
                  <i :class="cat.iconUrl || 'bi bi-folder-fill text-blue-600'"></i>
                  <span>{{ cat.name }}</span>
                  <span class="text-xs text-slate-400 font-normal">({{ cat.slug }})</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <BaseBadge :variant="cat.isActive !== false ? 'success' : 'secondary'">
                    {{ cat.isActive !== false ? 'Active' : 'Inactive' }}
                  </BaseBadge>
                  <button class="btn btn-sm btn-light text-slate-600" @click="openEdit(cat)"><i class="bi bi-pencil-square"></i></button>
                  <button class="btn btn-sm btn-light text-rose-600" @click="confirmDelete(cat)"><i class="bi bi-trash"></i></button>
                </div>
              </div>

              <!-- Children Subcategories -->
              <div v-if="cat.children && cat.children.length > 0" class="mt-3 ms-4 space-y-1.5 border-s-2 border-blue-200 ps-3">
                <div v-for="child in cat.children" :key="child.id" class="p-2 bg-white rounded-xl border border-slate-100 d-flex align-items-center justify-content-between text-xs">
                  <span class="font-medium text-slate-700">↳ {{ child.name }}</span>
                  <div class="d-flex align-items-center gap-1">
                    <span class="badge" :class="child.isActive !== false ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'" style="font-size:0.65rem">
                      {{ child.isActive !== false ? 'Active' : 'Inactive' }}
                    </span>
                    <button class="btn btn-sm btn-light py-0 px-1" @click="openEdit(child)"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-light text-rose-600 py-0 px-1" @click="confirmDelete(child)"><i class="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Quick Info Box -->
      <div class="col-lg-4">
        <BaseCard title="Thông Tin Phân Cấp">
          <div class="text-xs text-slate-600 space-y-2">
            <p class="mb-0">Hệ thống hỗ trợ cây danh mục đa cấp (Root category và Subcategory con).</p>
            <p class="mb-0">Tất cả sản phẩm đều được gán theo danh mục để phục vụ bộ lọc tìm kiếm cho người mua.</p>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <BaseModal v-model="showModal" :title="editingCat ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'" @close="closeModal">
      <div class="space-y-3">
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Tên danh mục</label>
          <input v-model="form.name" class="form-control" placeholder="Thời trang Nam..." />
          <div v-if="formErrors.name" class="text-danger small mt-1">{{ formErrors.name }}</div>
        </div>
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Slug đường dẫn</label>
          <input v-model="form.slug" class="form-control" placeholder="thoi-trang-nam" />
          <div v-if="formErrors.slug" class="text-danger small mt-1">{{ formErrors.slug }}</div>
        </div>
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Danh mục cha (tùy chọn)</label>
          <select v-model="form.parentId" class="form-select">
            <option :value="null">— Không có (danh mục gốc) —</option>
            <option v-for="cat in flatCategories" :key="cat.id" :value="cat.id" :disabled="editingCat && (cat.id === editingCat.id || cat.parentId === editingCat.id)">
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label text-xs text-slate-500 fw-semibold">Icon class (Bootstrap Icons)</label>
          <input v-model="form.icon" class="form-control" placeholder="bi bi-folder-fill" />
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 w-100">
          <BaseButton variant="ghost" size="sm" @click="closeModal">Hủy</BaseButton>
          <BaseButton variant="primary" size="sm" :disabled="saving" @click="saveCategory">
            <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...</span>
            <span v-else>{{ editingCat ? 'Lưu thay đổi' : 'Tạo danh mục' }}</span>
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Confirm Delete Modal -->
    <BaseModal v-model="showDeleteModal" title="Xác Nhận Xóa" size="sm" @close="showDeleteModal = false">
      <p class="text-sm text-slate-600">
        Xóa danh mục <strong>{{ deletingCat?.name }}</strong>?
        <span v-if="deletingCat?.productCount" class="text-danger d-block mt-1">
          Cảnh báo: Có {{ deletingCat.productCount }} sản phẩm đang thuộc danh mục này.
        </span>
      </p>
      <template #footer>
        <BaseButton variant="ghost" size="sm" @click="showDeleteModal = false">Hủy</BaseButton>
        <BaseButton variant="danger" size="sm" :disabled="deleting" @click="doDelete">
          <span v-if="deleting"><span class="spinner-border spinner-border-sm me-1"></span>Đang xóa...</span>
          <span v-else><i class="bi bi-trash me-1"></i>Xóa</span>
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { adminCategoryService } from '@/services/adminCategory.service'
import { useNotifyStore } from '@/stores/notify'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const notify = useNotifyStore()
const loading = ref(true)
const errorMsg = ref('')
const categoryTree = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingCat = ref(null)
const deletingCat = ref(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({ name: '', slug: '', parentId: null, icon: '' })
const formErrors = reactive({ name: '', slug: '' })

// Flatten tree for parent dropdown, excluding current editing item
const flatCategories = computed(() => {
  const flat = []
  const traverse = (nodes, depth = 0) => {
    for (const n of nodes) {
      flat.push({ ...n, depth })
      if (n.children?.length) traverse(n.children, depth + 1)
    }
  }
  traverse(categoryTree.value)
  return flat
})

const fetchCategories = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await adminCategoryService.getTree()
    categoryTree.value = Array.isArray(data) ? data : (data.content || [])
  } catch (err) {
    errorMsg.value = 'Không thể nạp cây danh mục.'
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingCat.value = null
  Object.assign(form, { name: '', slug: '', parentId: null, icon: '' })
  Object.assign(formErrors, { name: '', slug: '' })
  showModal.value = true
}

function openEdit(cat) {
  editingCat.value = cat
  Object.assign(form, {
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId || null,
    icon: cat.iconUrl || '',
  })
  Object.assign(formErrors, { name: '', slug: '' })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCat.value = null
}

function validateForm() {
  formErrors.name = form.name.trim() ? '' : 'Tên danh mục không được để trống.'
  formErrors.slug = form.slug.trim() ? '' : 'Slug không được để trống.'
  return !formErrors.name && !formErrors.slug
}

async function saveCategory() {
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      parentId: form.parentId || null,
      icon: form.icon.trim() || null,
    }
    if (editingCat.value) {
      await adminCategoryService.update(editingCat.value.id, payload)
      notify.push('Đã cập nhật danh mục.', 'success')
    } else {
      await adminCategoryService.create(payload)
      notify.push('Đã tạo danh mục mới.', 'success')
    }
    closeModal()
    await fetchCategories()
  } catch (e) {
    notify.push('Không thể lưu danh mục. Vui lòng thử lại.', 'danger')
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat) {
  deletingCat.value = cat
  showDeleteModal.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await adminCategoryService.remove(deletingCat.value.id)
    notify.push('Đã xóa danh mục.', 'success')
    showDeleteModal.value = false
    await fetchCategories()
  } catch (e) {
    notify.push('Không thể xóa danh mục. Có thể còn sản phẩm liên kết.', 'danger')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchCategories)
</script>
