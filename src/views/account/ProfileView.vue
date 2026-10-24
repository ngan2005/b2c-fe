<template>
  <div class="nomall-profile-page">
    <!-- Breadcrumb bar -->
    <div class="nomall-breadcrumb-bar">
      <div class="container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right"></i>
          <span>Tài khoản</span>
          <i class="bi bi-chevron-right"></i>
          <span class="breadcrumb-active">Hồ sơ cá nhân</span>
        </nav>
      </div>
    </div>

    <!-- Main Container -->
    <div class="container py-4">
      <LoadingSpinner v-if="loading" text="Đang tải hồ sơ..." class="my-5" />
      <ErrorState v-else-if="errorMsg" :message="errorMsg" @retry="fetchProfile" class="my-5" />

      <div v-else class="row g-4">
        <!-- ── Left Column: Account Navigation Sidebar ────────────── -->
        <div class="col-lg-3 col-md-4">
          <AccountSidebar
            :avatar-url="profile.avatarUrl"
            :full-name="profile.fullName"
            :email="profile.email"
            @trigger-upload="triggerUpload"
          />
        </div>

        <!-- ── Right Column: Profile Content Card ─────────────────── -->
        <div class="col-lg-9 col-md-8">
          <div class="nomall-card nomall-profile-card">
            <!-- Card Header -->
            <div class="profile-card-header">
              <div class="d-flex align-items-center gap-3">
                <div class="profile-header-icon">
                  <i class="bi bi-person-badge"></i>
                </div>
                <div>
                  <h1 class="profile-card-title">Hồ Sơ Của Tôi</h1>
                  <p class="profile-card-subtitle">
                    Quản lý thông tin hồ sơ để bảo mật và tối ưu trải nghiệm mua sắm
                  </p>
                </div>
              </div>
            </div>

            <!-- Card Body -->
            <form @submit.prevent="handleSaveProfile" class="profile-form">
              <div class="row g-4 align-items-start">
                <!-- Left Form Fields -->
                <div class="col-lg-8 order-2 order-lg-1">
                  <!-- Email field -->
                  <div class="mb-3.5">
                    <label class="nomall-form-label d-flex align-items-center justify-content-between">
                      <span><i class="bi bi-envelope me-1.5 text-muted"></i>Địa chỉ Email</span>
                      <span class="badge bg-light text-muted fw-normal" style="font-size: 0.6875rem;">
                        <i class="bi bi-lock-fill me-1"></i>Không thể thay đổi
                      </span>
                    </label>
                    <input
                      type="email"
                      class="nomall-form-control input-readonly"
                      :value="profile.email"
                      readonly
                      disabled
                    />
                    <small class="form-hint text-muted">Email liên kết với tài khoản NO MALL của bạn.</small>
                  </div>

                  <!-- Role field -->
                  <div class="mb-3.5">
                    <label class="nomall-form-label">
                      <i class="bi bi-shield-check me-1.5 text-muted"></i>Vai trò tài khoản
                    </label>
                    <div>
                      <span class="nomall-role-pill">
                        <i class="bi bi-person-check-fill me-1 text-danger"></i>
                        {{ profile.role === 'BUYER' ? 'Người mua hàng (BUYER)' : (profile.role || 'BUYER') }}
                      </span>
                    </div>
                  </div>

                  <!-- Full name field -->
                  <div class="mb-3.5">
                    <label class="nomall-form-label">
                      <i class="bi bi-person me-1.5 text-muted"></i>Họ và tên <span class="text-danger">*</span>
                    </label>
                    <input
                      v-model.trim="form.fullName"
                      type="text"
                      class="nomall-form-control"
                      placeholder="Nhập họ và tên đầy đủ"
                      required
                    />
                  </div>

                  <!-- Phone field -->
                  <div class="mb-3.5">
                    <label class="nomall-form-label">
                      <i class="bi bi-telephone me-1.5 text-muted"></i>Số điện thoại
                    </label>
                    <input
                      v-model.trim="form.phone"
                      type="tel"
                      class="nomall-form-control"
                      placeholder="Ví dụ: 0901234567"
                    />
                  </div>

                  <!-- Gender selection -->
                  <div class="mb-3.5">
                    <label class="nomall-form-label">
                      <i class="bi bi-gender-ambiguous me-1.5 text-muted"></i>Giới tính
                    </label>
                    <div class="gender-radio-group">
                      <label class="gender-radio-item" :class="{ selected: form.gender === 'MALE' }">
                        <input
                          type="radio"
                          v-model="form.gender"
                          value="MALE"
                          class="gender-radio-input"
                        />
                        <span class="gender-radio-text"><i class="bi bi-gender-male me-1 text-primary"></i>Nam</span>
                      </label>

                      <label class="gender-radio-item" :class="{ selected: form.gender === 'FEMALE' }">
                        <input
                          type="radio"
                          v-model="form.gender"
                          value="FEMALE"
                          class="gender-radio-input"
                        />
                        <span class="gender-radio-text"><i class="bi bi-gender-female me-1 text-danger"></i>Nữ</span>
                      </label>

                      <label class="gender-radio-item" :class="{ selected: form.gender === 'OTHER' }">
                        <input
                          type="radio"
                          v-model="form.gender"
                          value="OTHER"
                          class="gender-radio-input"
                        />
                        <span class="gender-radio-text"><i class="bi bi-asterisk me-1 text-secondary"></i>Khác</span>
                      </label>
                    </div>
                  </div>

                  <!-- Date of birth -->
                  <div class="mb-4">
                    <label class="nomall-form-label">
                      <i class="bi bi-calendar3 me-1.5 text-muted"></i>Ngày sinh
                    </label>
                    <input
                      v-model="form.dateOfBirth"
                      type="date"
                      class="nomall-form-control"
                    />
                  </div>

                  <!-- Submit button -->
                  <div class="pt-3 border-top d-flex align-items-center gap-3">
                    <button
                      type="submit"
                      class="nomall-btn-primary"
                      :disabled="saving"
                    >
                      <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                      <i v-else class="bi bi-check2-circle me-1"></i>
                      {{ saving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi' }}
                    </button>

                    <button
                      type="button"
                      class="nomall-btn-outline"
                      @click="resetForm"
                      :disabled="saving"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>

                <!-- Right Avatar Upload Section -->
                <div class="col-lg-4 order-1 order-lg-2">
                  <div class="avatar-upload-panel text-center">
                    <div class="avatar-preview-box mx-auto">
                      <img
                        v-if="profile.avatarUrl"
                        :src="profile.avatarUrl"
                        :alt="profile.fullName || 'Avatar'"
                        class="avatar-large-img"
                      />
                      <div v-else class="avatar-large-placeholder">
                        {{ userInitials }}
                      </div>

                      <div v-if="uploading" class="avatar-loading-mask">
                        <span class="spinner-border text-light"></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="nomall-btn-outline mt-3 btn-sm"
                      :disabled="uploading"
                      @click="triggerUpload"
                    >
                      <i class="bi bi-cloud-arrow-up me-1"></i>
                      {{ uploading ? 'Đang tải lên...' : 'Chọn ảnh đại diện' }}
                    </button>

                    <input
                      ref="fileInput"
                      type="file"
                      class="d-none"
                      accept="image/jpeg,image/png,image/webp"
                      @change="handleFileSelected"
                    />

                    <div class="avatar-guidelines mt-3">
                      <p class="mb-1"><i class="bi bi-info-circle me-1 text-muted"></i>Dung lượng tối đa: <strong>5 MB</strong></p>
                      <p class="mb-0">Định dạng hỗ trợ: <strong>JPEG, PNG, WebP</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { userAddressService } from '@/services/userAddress.service'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import AccountSidebar from '@/components/buyer/AccountSidebar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const authStore = useAuthStore()
const notify = useNotifyStore()

const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')
const profile = ref({})
const form = reactive({ fullName: '', phone: '', gender: 'OTHER', dateOfBirth: '' })

// ── Avatar Upload ─────────────────────────────────────────────
const fileInput = ref(null)
const uploading = ref(false)
const MAX_FILE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const triggerUpload = () => {
  if (!uploading.value) fileInput.value?.click()
}

const handleFileSelected = async (event) => {
  const file = event.target?.files?.[0]
  event.target.value = ''
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    notify.push('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.', 'warning')
    return
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    notify.push(`Ảnh quá lớn. Tối đa ${MAX_FILE_MB}MB.`, 'warning')
    return
  }

  uploading.value = true
  try {
    const result = await userAddressService.uploadAvatar(file)
    profile.value.avatarUrl = result.avatarUrl
    if (authStore.user) {
      authStore.user.avatarUrl = result.avatarUrl
    }
    notify.push('Đã cập nhật ảnh đại diện thành công!', 'success')
  } catch (err) {
    const message = err?.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
    notify.push(message, 'danger')
  } finally {
    uploading.value = false
  }
}

const userInitials = computed(() => {
  const name = profile.value.fullName || profile.value.email || 'U'
  return name.charAt(0).toUpperCase()
})

const fetchProfile = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await userAddressService.getProfile()
    profile.value = data || {}
    populateForm(data)
  } catch (_) {
    errorMsg.value = 'Không thể nạp thông tin hồ sơ.'
  } finally {
    loading.value = false
  }
}

const populateForm = (data) => {
  if (!data) return
  form.fullName = data.fullName || ''
  form.phone = data.phone || ''
  form.gender = data.gender || 'OTHER'
  form.dateOfBirth = data.dateOfBirth || ''
}

const resetForm = () => {
  populateForm(profile.value)
  notify.push('Đã khôi phục thông tin ban đầu', 'info')
}

const handleSaveProfile = async () => {
  saving.value = true
  try {
    await userAddressService.updateProfile(form)
    notify.push('Cập nhật hồ sơ thành công!', 'success')
    // Keep authStore in sync
    if (authStore.user) {
      authStore.user.fullName = form.fullName
    }
    await fetchProfile()
  } catch (_) {
    notify.push('Không thể lưu hồ sơ. Vui lòng thử lại.', 'danger')
  } finally {
    saving.value = false
  }
}

onMounted(fetchProfile)
</script>

<style scoped>
.nomall-profile-page {
  background-color: var(--nomall-bg);
  min-height: calc(100vh - 120px);
}

/* Breadcrumb */
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
  transition: color 0.15s;
}

.nomall-breadcrumb a:hover {
  color: var(--nomall-red);
}

.nomall-breadcrumb i {
  font-size: 0.625rem;
  color: var(--nomall-muted);
}

.breadcrumb-active {
  color: var(--nomall-red);
  font-weight: 700;
}

/* Profile Card */
.nomall-profile-card {
  padding: 1.75rem 2rem;
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid var(--nomall-border);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.profile-card-header {
  padding-bottom: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1.5px solid var(--nomall-border);
}

.profile-header-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 10px;
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.profile-card-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--nomall-ink);
  margin: 0;
  letter-spacing: -0.01em;
}

.profile-card-subtitle {
  font-size: 0.8125rem;
  color: var(--nomall-muted);
  margin: 0.25rem 0 0;
}

/* Form Styles */
.nomall-form-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--nomall-ink);
  margin-bottom: 0.35rem;
  display: block;
}

.nomall-form-control {
  border: 1.5px solid var(--nomall-border);
  border-radius: 8px;
  font-size: 0.875rem;
  padding: 0.55rem 0.875rem;
  color: var(--nomall-ink);
  background: #ffffff;
  transition: all 0.2s;
  width: 100%;
}

.nomall-form-control:focus {
  outline: none;
  border-color: var(--nomall-red);
  box-shadow: 0 0 0 3px rgba(232, 74, 74, 0.12);
}

.input-readonly {
  background-color: #f8fafc !important;
  color: #64748b !important;
  cursor: not-allowed;
  border-color: #e2e8f0;
}

.form-hint {
  font-size: 0.725rem;
  margin-top: 0.25rem;
  display: block;
}

.nomall-role-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--nomall-ink);
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
}

/* Gender radio selector */
.gender-radio-group {
  display: flex;
  gap: 0.75rem;
}

.gender-radio-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  border: 1.5px solid var(--nomall-border);
  background: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--nomall-ink);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.gender-radio-item:hover {
  border-color: var(--nomall-red-light);
  background: var(--nomall-red-bg);
}

.gender-radio-item.selected {
  border-color: var(--nomall-red);
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  font-weight: 700;
}

.gender-radio-input {
  accent-color: var(--nomall-red);
  cursor: pointer;
}

/* Avatar Upload Panel */
.avatar-upload-panel {
  padding: 1rem;
  border-left: 1.5px solid var(--nomall-border);
}

@media (max-width: 991px) {
  .avatar-upload-panel {
    border-left: none;
    border-bottom: 1.5px solid var(--nomall-border);
    padding-bottom: 1.5rem;
    margin-bottom: 1rem;
  }
}

.avatar-preview-box {
  position: relative;
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  background: #f8fafc;
}

.avatar-large-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-large-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--nomall-red) 0%, var(--nomall-yellow) 100%);
  color: #ffffff;
  font-weight: 900;
  font-size: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-guidelines {
  font-size: 0.75rem;
  color: var(--nomall-muted);
  line-height: 1.4;
}
</style>
