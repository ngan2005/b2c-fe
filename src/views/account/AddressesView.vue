<template>
  <div class="nomall-addresses-page">
    <!-- Breadcrumb bar -->
    <div class="nomall-breadcrumb-bar">
      <div class="container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right"></i>
          <span>Tài khoản</span>
          <i class="bi bi-chevron-right"></i>
          <span class="breadcrumb-active">Sổ địa chỉ</span>
        </nav>
      </div>
    </div>

    <!-- Main Container -->
    <div class="container py-4">
      <div class="row g-4">
        <!-- ── Left Column: Account Navigation Sidebar ────────────── -->
        <div class="col-lg-3 col-md-4">
          <AccountSidebar />
        </div>

        <!-- ── Right Column: Addresses List ───────────────────────── -->
        <div class="col-lg-9 col-md-8">
          <div class="nomall-card p-4">
            <!-- Header -->
            <div class="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
              <div>
                <h1 class="h5 fw-bold text-dark mb-1">Địa Chỉ Nhận Hàng</h1>
                <p class="text-muted small mb-0">Quản lý các địa chỉ nhận hàng để thanh toán nhanh chóng hơn</p>
              </div>
              <button class="nomall-btn-primary btn-sm" @click="openCreateModal">
                <i class="bi bi-plus-lg me-1"></i> Thêm địa chỉ mới
              </button>
            </div>

            <LoadingSpinner v-if="loading" text="Đang tải danh sách địa chỉ..." />
            <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchAddresses" />

            <div v-else-if="addresses.length === 0" class="nomall-empty py-5">
              <i class="bi bi-geo-alt"></i>
              <h3>Bạn chưa lưu địa chỉ nào</h3>
              <p>Thêm địa chỉ giao hàng để đặt hàng nhanh chóng hơn trên NO MALL.</p>
              <button class="nomall-btn-primary" @click="openCreateModal">
                <i class="bi bi-plus-lg me-1"></i> Thêm địa chỉ mới
              </button>
            </div>

            <!-- Address list -->
            <div v-else class="row g-3">
              <div
                v-for="addr in addresses"
                :key="addr.id"
                class="col-12 col-xl-6"
              >
                <div class="address-item-card h-100 p-3.5 d-flex flex-column justify-content-between" :class="{ 'is-default': addr.isDefault }">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="fw-bold text-dark fs-6">{{ addr.recipientName }}</span>
                      <span v-if="addr.isDefault" class="badge-default-pill">
                        <i class="bi bi-check-circle-fill me-1"></i>Mặc định
                      </span>
                    </div>

                    <p class="text-muted small mb-1.5">
                      <i class="bi bi-telephone me-1.5 text-danger"></i>{{ addr.phone }}
                    </p>
                    <p class="text-dark small mb-0 lh-base">
                      <i class="bi bi-geo-alt me-1.5 text-danger"></i>{{ addr.fullAddress }}
                    </p>
                  </div>

                  <div class="pt-3 mt-3 border-top d-flex align-items-center justify-content-between">
                    <div>
                      <button
                        v-if="!addr.isDefault"
                        class="btn-set-default"
                        @click="handleSetDefault(addr.id)"
                      >
                        Thiết lập mặc định
                      </button>
                      <span v-else class="text-success small fw-semibold">
                        <i class="bi bi-shield-check me-1"></i>Địa chỉ mặc định
                      </span>
                    </div>

                    <div class="d-flex gap-1.5">
                      <button class="btn btn-sm btn-outline-secondary" @click="openEditModal(addr)">
                        <i class="bi bi-pencil me-1"></i>Sửa
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="openDeleteConfirm(addr)">
                        <i class="bi bi-trash"></i>
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

    <!-- Create / Edit Modal -->
    <BaseModal v-model="showModal" :title="editingId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'">
      <div class="d-flex flex-column gap-3">
        <div>
          <label class="nomall-form-label">Họ và tên người nhận <span class="text-danger">*</span></label>
          <input v-model="form.recipientName" type="text" class="nomall-form-control" placeholder="Ví dụ: Nguyễn Văn A" required />
        </div>
        <div>
          <label class="nomall-form-label">Số điện thoại <span class="text-danger">*</span></label>
          <input v-model="form.phone" type="tel" class="nomall-form-control" placeholder="Ví dụ: 0901234567" required />
        </div>
        <div>
          <label class="nomall-form-label">Số nhà, tên đường <span class="text-danger">*</span></label>
          <input v-model="form.streetDetail" type="text" class="nomall-form-control" placeholder="Ví dụ: 123 Đường Lê Lợi" required />
        </div>
        <div>
          <label class="nomall-form-label">Địa chỉ chi tiết đầy đủ <span class="text-danger">*</span></label>
          <input v-model="form.fullAddress" type="text" class="nomall-form-control" placeholder="Ví dụ: Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh" required />
        </div>
        <div class="form-check pt-1">
          <input id="chkDefault" v-model="form.isDefault" type="checkbox" class="form-check-input" style="accent-color: var(--nomall-red);" />
          <label for="chkDefault" class="form-check-label small fw-semibold text-dark">
            Đặt làm địa chỉ giao hàng mặc định
          </label>
        </div>
      </div>
      <template #footer>
        <div class="d-flex justify-content-end gap-2 w-100">
          <button class="nomall-btn-outline btn-sm" @click="showModal = false">Hủy</button>
          <button class="nomall-btn-primary btn-sm" :disabled="saving" @click="handleSave">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            Lưu địa chỉ
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Xóa Địa Chỉ"
      message="Bạn có chắc chắn muốn xóa địa chỉ giao hàng này không?"
      :loading="deleting"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userAddressService } from '@/services/userAddress.service'
import { useNotifyStore } from '@/stores/notify'
import AccountSidebar from '@/components/buyer/AccountSidebar.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const notify = useNotifyStore()
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const errorMsg = ref('')

const addresses = ref([])
const showModal = ref(false)
const editingId = ref(null)

const showDeleteDialog = ref(false)
const targetDeleteId = ref(null)

const form = reactive({
  recipientName: '',
  phone: '',
  streetDetail: '',
  fullAddress: '',
  isDefault: false,
})

const fetchAddresses = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await userAddressService.getAddresses()
    addresses.value = Array.isArray(data) ? data : []
  } catch (err) {
    errorMsg.value = 'Không thể kết nối sổ địa chỉ.'
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingId.value = null
  form.recipientName = ''
  form.phone = ''
  form.streetDetail = ''
  form.fullAddress = ''
  form.isDefault = false
  showModal.value = true
}

const openEditModal = (addr) => {
  editingId.value = addr.id
  form.recipientName = addr.recipientName
  form.phone = addr.phone
  form.streetDetail = addr.streetDetail
  form.fullAddress = addr.fullAddress
  form.isDefault = addr.isDefault
  showModal.value = true
}

const handleSave = async () => {
  if (!form.recipientName || !form.phone || !form.fullAddress) {
    notify.push('Vui lòng điền đầy đủ các thông tin địa chỉ bắt buộc!', 'warning')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await userAddressService.updateAddress(editingId.value, form)
      notify.push('Cập nhật địa chỉ thành công!', 'success')
    } else {
      await userAddressService.createAddress(form)
      notify.push('Thêm địa chỉ mới thành công!', 'success')
    }
    showModal.value = false
    await fetchAddresses()
  } catch (_) {} finally {
    saving.value = false
  }
}

const handleSetDefault = async (id) => {
  try {
    await userAddressService.setDefaultAddress(id)
    notify.push('Đã đổi địa chỉ mặc định!', 'success')
    await fetchAddresses()
  } catch (_) {}
}

const openDeleteConfirm = (addr) => {
  targetDeleteId.value = addr.id
  showDeleteDialog.value = true
}

const handleConfirmDelete = async () => {
  if (!targetDeleteId.value) return
  deleting.value = true
  try {
    await userAddressService.deleteAddress(targetDeleteId.value)
    notify.push('Xóa địa chỉ thành công!', 'success')
    showDeleteDialog.value = false
    await fetchAddresses()
  } catch (_) {} finally {
    deleting.value = false
  }
}

onMounted(fetchAddresses)
</script>

<style scoped>
.nomall-addresses-page {
  background-color: var(--nomall-bg);
  min-height: calc(100vh - 120px);
}

.nomall-breadcrumb-bar {
  background: #ffffff;
  border-bottom: 1px solid var(--nomall-border);
  padding: 0.625rem 0;
}

.nomall-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--nomall-muted);
}

.nomall-breadcrumb a {
  color: var(--nomall-muted);
  font-weight: 600;
  text-decoration: none;
}

.nomall-breadcrumb a:hover {
  color: var(--nomall-red);
}

.nomall-breadcrumb i {
  font-size: 0.625rem;
}

.breadcrumb-active {
  color: var(--nomall-red);
  font-weight: 700;
}

.address-item-card {
  border: 1.5px solid var(--nomall-border);
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.2s;
}

.address-item-card:hover {
  border-color: var(--nomall-red-light);
  box-shadow: 0 4px 12px rgba(232, 74, 74, 0.08);
}

.address-item-card.is-default {
  border-color: var(--nomall-red);
  background: #fffafa;
}

.badge-default-pill {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--nomall-red);
  background: var(--nomall-red-bg);
  border: 1px solid var(--nomall-red);
  border-radius: 9999px;
  padding: 0.15rem 0.5rem;
}

.btn-set-default {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--nomall-muted);
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.15s;
}

.btn-set-default:hover {
  color: var(--nomall-red);
}
</style>
