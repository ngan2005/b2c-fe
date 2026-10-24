<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sellerProductService } from '@/services/sellerProduct.service'
import { catalogService } from '@/services/catalog.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'

const route = useRoute()
const router = useRouter()
const notify = useNotifyStore()
const dialog = useDialogs()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)

const form = ref({
  name: '',
  slug: '',
  categoryId: null,
  brand: '',
  description: '',
  thumbnailUrl: '',
  minPrice: 0,
  maxPrice: 0,
  weightGram: null,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
})
const categories = ref([])

// ── Gallery state ─────────────────────────────────────────────────────────────
const gallery = ref([])
const uploading = ref(false)
const uploadQueue = ref([])
const pendingThumbnailId = ref(null)
const isDragOver = ref(false)

const MAX_IMAGES = 10
const MAX_FILE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const CONCURRENT_UPLOADS = 4

async function load() {
  loading.value = true
  try {
    const tree = await catalogService.getCategoryTree()
    const flat = []
    function walk(nodes, depth = 0) {
      for (const c of nodes || []) {
        flat.push({ id: c.id, label: '— '.repeat(depth) + c.name })
        walk(c.children, depth + 1)
      }
    }
    walk(tree)
    categories.value = flat

    if (isEdit.value) {
      const p = await sellerProductService.get(route.params.id)
      form.value = {
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        brand: p.brand,
        description: p.description,
        thumbnailUrl: p.thumbnailUrl,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        weightGram: p.weightGram,
        lengthCm: p.lengthCm,
        widthCm: p.widthCm,
        heightCm: p.heightCm,
      }
      gallery.value = [...(p.images || [])].sort((a, b) => a.sortOrder - b.sortOrder)
    }
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!form.value.name || !form.value.categoryId) {
    notify.push('Vui lòng nhập tên sản phẩm và chọn danh mục', 'warning')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await sellerProductService.update(route.params.id, form.value)
      notify.push('Đã cập nhật sản phẩm', 'success')
    } else {
      await sellerProductService.create(form.value)
      notify.push('Đã tạo sản phẩm', 'success')
    }
    router.push({ name: 'seller-products' })
  } catch (e) {
    // surfaced by interceptor
  } finally {
    saving.value = false
  }
}

function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    notify.push('Vui lòng chọn một tệp hình ảnh (.jpg, .png, .webp, ...)', 'warning')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    notify.push('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.', 'warning')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    form.value.thumbnailUrl = e.target.result
    notify.push('Tải ảnh từ máy tính thành công!', 'success')
  }
  reader.readAsDataURL(file)
}

function validateFiles(files) {
  const errors = []
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      errors.push(`${f.name}: chỉ chấp nhận JPEG, PNG, WebP`)
    } else if (f.size > MAX_FILE_MB * 1024 * 1024) {
      errors.push(`${f.name}: vượt quá ${MAX_FILE_MB}MB`)
    }
  }
  return errors
}

async function handleGalleryUpload(event) {
  const rawFiles = Array.from(event.target?.files || event.dataTransfer?.files || [])
  isDragOver.value = false
  if (!rawFiles.length) return

  if (gallery.value.length + rawFiles.length > MAX_IMAGES) {
    notify.push(`Tối đa ${MAX_IMAGES} ảnh mỗi sản phẩm.`, 'warning')
    return
  }

  const errors = validateFiles(rawFiles)
  if (errors.length) {
    errors.forEach((e) => notify.push(e, 'warning'))
    return
  }

  const queueItems = rawFiles.map((file, i) => ({
    id: `new-${Date.now()}-${i}`,
    file,
    status: 'pending',
    error: null,
  }))
  uploadQueue.value.push(...queueItems)
  uploading.value = true

  const productId = route.params.id
  async function processQueue() {
    const pending = uploadQueue.value.filter((q) => q.status === 'pending')
    const batch = pending.slice(0, CONCURRENT_UPLOADS)
    if (!batch.length) return

    await Promise.all(
      batch.map(async (item) => {
        item.status = 'uploading'
        try {
          const result = await sellerProductService.uploadImage(productId, item.file, {
            altText: '',
            isThumbnail: false,
          })
          gallery.value.push({ ...result, _file: item.file })
          uploadQueue.value = uploadQueue.value.filter((q) => q.id !== item.id)
          notify.push(`Đã tải lên: ${item.file.name}`, 'success')
        } catch {
          item.status = 'error'
          item.error = 'Tải lên thất bại'
          notify.push(`Lỗi tải lên: ${item.file.name}`, 'danger')
        }
      }),
    )

    if (uploadQueue.value.some((q) => q.status === 'pending' || q.status === 'uploading')) {
      await processQueue()
    } else {
      uploading.value = false
      uploadQueue.value = []
    }
  }

  await processQueue()
}

async function setAsThumbnail(image) {
  if (!isEdit.value || pendingThumbnailId.value) return
  pendingThumbnailId.value = image.id
  try {
    const updated = await sellerProductService.promoteThumbnail(route.params.id, image.id)
    gallery.value = gallery.value.map((img) =>
      img.id === updated.id
        ? { ...img, isThumbnail: true }
        : { ...img, isThumbnail: false },
    )
    form.value.thumbnailUrl = updated.imageUrl
    notify.push('Đã đặt làm ảnh đại diện', 'success')
  } catch {
    // surfaced by interceptor
  } finally {
    pendingThumbnailId.value = null
  }
}

async function confirmDeleteImage(image) {
  const ok = await dialog.confirm(`Xóa ảnh này?`, {
    title: 'Xóa ảnh',
    variant: 'danger',
    confirmText: 'Xóa',
  })
  if (!ok) return
  const productId = route.params.id
  try {
    await sellerProductService.deleteImage(productId, image.id)
    gallery.value = gallery.value.filter((img) => img.id !== image.id)
    notify.pushUndo({
      message: 'Đã xóa ảnh.',
      variant: 'success',
      actionLabel: 'Hoàn tác',
      onAction: async () => {
        try {
          await sellerProductService.restoreImage(productId, image.id)
          notify.push('Đã khôi phục ảnh.', 'success')
        } catch (e) {
          notify.push('Không thể khôi phục ảnh.', 'danger')
        } finally {
          try { await load() } catch { /* best effort */ }
        }
      },
    })
  } catch (e) {
    notify.push('Không thể xóa ảnh. Vui lòng thử lại.', 'danger')
  }
}

onMounted(load)
</script>

<template>
  <div class="pe-page">

    <!-- Page Header -->
    <div class="pe-page-header">
      <div class="pe-header-left">
        <router-link :to="{ name: 'seller-products' }" class="pe-back-btn">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <div>
          <h1 class="pe-title">{{ isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h1>
          <p class="pe-subtitle">{{ isEdit ? 'Cập nhật thông tin sản phẩm của bạn' : 'Điền đầy đủ thông tin để đăng bán sản phẩm' }}</p>
        </div>
      </div>
      <div class="pe-header-actions">
        <router-link :to="{ name: 'seller-products' }" class="pe-btn pe-btn-ghost">Hủy bỏ</router-link>
        <button class="pe-btn pe-btn-primary" :disabled="saving" @click="onSubmit">
          <span v-if="saving" class="spinner-border spinner-border-sm"></span>
          <i v-else class="bi" :class="isEdit ? 'bi-check2' : 'bi-plus-lg'"></i>
          {{ isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="pe-loading">
      <div class="spinner-border text-primary"></div>
      <span>Đang tải dữ liệu...</span>
    </div>

    <form v-else @submit.prevent="onSubmit" class="pe-body">

      <!-- Left column -->
      <div class="pe-col-main">

        <!-- Section: Thông tin cơ bản -->
        <div class="pe-card">
          <div class="pe-card-header">
            <div class="pe-card-icon" style="background:#eff6ff;">
              <i class="bi bi-info-circle" style="color:#1a56db;"></i>
            </div>
            <div>
              <h2 class="pe-card-title">Thông tin cơ bản</h2>
              <p class="pe-card-desc">Tên, danh mục và mô tả sản phẩm</p>
            </div>
          </div>
          <div class="pe-card-body">

            <div class="pe-field-row">
              <div class="pe-field pe-field-lg">
                <label class="pe-label">Tên sản phẩm <span class="pe-required">*</span></label>
                <input v-model="form.name" class="pe-input" maxlength="255"
                  placeholder="Nhập tên sản phẩm rõ ràng, đầy đủ..."
                  required />
                <span class="pe-hint">{{ form.name.length }}/255 ký tự</span>
              </div>
              <div class="pe-field">
                <label class="pe-label">Thương hiệu</label>
                <input v-model="form.brand" class="pe-input" maxlength="150" placeholder="VD: Samsung, Apple..." />
              </div>
            </div>

            <div class="pe-field-row">
              <div class="pe-field pe-field-lg">
                <label class="pe-label">Danh mục <span class="pe-required">*</span></label>
                <select v-model="form.categoryId" class="pe-select" required>
                  <option :value="null" disabled>— Chọn danh mục —</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.label }}</option>
                </select>
              </div>
              <div class="pe-field">
                <label class="pe-label">Slug URL <span class="pe-optional">(tùy chọn)</span></label>
                <input v-model="form.slug" class="pe-input" maxlength="300"
                  placeholder="tu-dong-tao-tu-ten" />
                <span class="pe-hint">Để trống sẽ tự động tạo từ tên sản phẩm</span>
              </div>
            </div>

            <div class="pe-field">
              <label class="pe-label">Mô tả sản phẩm</label>
              <textarea v-model="form.description" class="pe-textarea" rows="5"
                placeholder="Mô tả chi tiết về sản phẩm, công dụng, chất liệu, hướng dẫn sử dụng..."></textarea>
            </div>

          </div>
        </div>

        <!-- Section: Hình ảnh -->
        <div class="pe-card">
          <div class="pe-card-header">
            <div class="pe-card-icon" style="background:#eff6ff;">
              <i class="bi bi-images" style="color:#3b82f6;"></i>
            </div>
            <div>
              <h2 class="pe-card-title">Hình ảnh sản phẩm</h2>
              <p class="pe-card-desc">Ảnh đại diện và bộ sưu tập ảnh chi tiết</p>
            </div>
          </div>
          <div class="pe-card-body">

            <!-- Thumbnail -->
            <div class="pe-field">
              <label class="pe-label">Ảnh đại diện (Thumbnail)</label>
              <div class="pe-thumbnail-wrap">
                <!-- Preview -->
                <div class="pe-thumb-preview">
                  <img v-if="form.thumbnailUrl" :src="form.thumbnailUrl" alt="Preview" class="pe-thumb-img" />
                  <div v-else class="pe-thumb-placeholder">
                    <i class="bi bi-image"></i>
                    <span>Chưa có ảnh</span>
                  </div>
                  <button v-if="form.thumbnailUrl" type="button" class="pe-thumb-remove" @click="form.thumbnailUrl = ''">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <!-- Input area -->
                <div class="pe-thumb-inputs">
                  <input v-model="form.thumbnailUrl" class="pe-input"
                    placeholder="Dán URL ảnh (https://...)" />
                  <div class="pe-thumb-divider">
                    <span>hoặc</span>
                  </div>
                  <label class="pe-upload-btn">
                    <i class="bi bi-upload"></i> Tải ảnh lên
                    <input type="file" accept="image/*" class="d-none" @change="handleFileUpload" />
                  </label>
                  <p class="pe-hint">JPEG, PNG, WebP · Tối đa 5MB</p>
                </div>
              </div>
            </div>

            <!-- Gallery (edit mode only) -->
            <div v-if="isEdit">
              <div class="pe-gallery-header">
                <label class="pe-label mb-0">Bộ sưu tập ảnh</label>
                <span class="pe-gallery-count">{{ gallery.length }}/{{ MAX_IMAGES }} ảnh</span>
              </div>

              <!-- Drop zone -->
              <div
                class="pe-dropzone"
                :class="{ 'pe-dropzone-active': isDragOver, 'pe-dropzone-uploading': uploading }"
                @dragover.prevent="isDragOver = true"
                @dragleave="isDragOver = false"
                @drop.prevent="handleGalleryUpload($event)"
              >
                <label class="pe-dropzone-label">
                  <div class="pe-dropzone-icon">
                    <span v-if="uploading" class="spinner-border text-primary"></span>
                    <i v-else class="bi bi-cloud-arrow-up"></i>
                  </div>
                  <div class="pe-dropzone-text">
                    <strong>{{ uploading ? 'Đang tải lên...' : 'Kéo thả ảnh vào đây' }}</strong>
                    <span>hoặc <u>bấm để chọn file</u></span>
                  </div>
                  <input v-if="!uploading" type="file" accept="image/jpeg,image/png,image/webp"
                    multiple class="d-none" @change="handleGalleryUpload" />
                </label>
                <p class="pe-dropzone-hint">JPEG, PNG, WebP · Tối đa {{ MAX_FILE_MB }}MB/ảnh · Nhấn Ctrl để chọn nhiều</p>
              </div>

              <!-- Upload queue -->
              <div v-if="uploadQueue.length" class="pe-queue">
                <div v-for="item in uploadQueue" :key="item.id" class="pe-queue-item">
                  <div class="pe-queue-status">
                    <span v-if="item.status === 'uploading'" class="spinner-border spinner-border-sm text-primary"></span>
                    <i v-else-if="item.status === 'done'" class="bi bi-check-circle-fill text-success"></i>
                    <i v-else-if="item.status === 'error'" class="bi bi-x-circle-fill text-danger"></i>
                    <i v-else class="bi bi-hourglass-split text-muted"></i>
                  </div>
                  <span class="pe-queue-name">{{ item.file.name }}</span>
                  <span v-if="item.status === 'error'" class="pe-queue-error">{{ item.error }}</span>
                </div>
              </div>

              <!-- Gallery grid -->
              <div v-if="gallery.length" class="pe-gallery-grid">
                <div v-for="(img, idx) in gallery" :key="img.id" class="pe-gallery-item">
                  <div class="pe-gallery-img-wrap">
                    <img :src="img.imageUrl" :alt="img.altText || `Ảnh ${idx + 1}`" class="pe-gallery-img" />
                    <div class="pe-gallery-overlay">
                      <button type="button" class="pe-gallery-action pe-gallery-star"
                        :class="{ 'active': img.isThumbnail }"
                        :disabled="img.isThumbnail || pendingThumbnailId === img.id"
                        @click="setAsThumbnail(img)"
                        :title="img.isThumbnail ? 'Ảnh đại diện' : 'Đặt làm ảnh đại diện'">
                        <span v-if="pendingThumbnailId === img.id" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi" :class="img.isThumbnail ? 'bi-star-fill' : 'bi-star'"></i>
                      </button>
                      <button type="button" class="pe-gallery-action pe-gallery-delete"
                        @click="confirmDeleteImage(img)" title="Xóa ảnh">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                    <span v-if="img.isThumbnail" class="pe-gallery-badge">
                      <i class="bi bi-star-fill me-1"></i>Đại diện
                    </span>
                  </div>
                </div>
              </div>

              <!-- Empty gallery -->
              <div v-else class="pe-gallery-empty">
                <i class="bi bi-card-image"></i>
                <p>Chưa có ảnh nào trong bộ sưu tập.<br>Kéo thả hoặc bấm để tải ảnh lên.</p>
              </div>
            </div>

            <div v-else class="pe-info-note">
              <i class="bi bi-info-circle"></i>
              Bộ sưu tập ảnh sẽ mở sau khi bạn tạo sản phẩm thành công.
            </div>

          </div>
        </div>

      </div>

      <!-- Right column -->
      <div class="pe-col-side">

        <!-- Section: Giá bán -->
        <div class="pe-card">
          <div class="pe-card-header">
            <div class="pe-card-icon" style="background:#f0fdf4;">
              <i class="bi bi-currency-dollar" style="color:#00a650;"></i>
            </div>
            <div>
              <h2 class="pe-card-title">Giá bán</h2>
              <p class="pe-card-desc">Thiết lập khoảng giá sản phẩm</p>
            </div>
          </div>
          <div class="pe-card-body">
            <div class="pe-field">
              <label class="pe-label">Giá tối thiểu <span class="pe-required">*</span></label>
              <div class="pe-input-prefix-wrap">
                <span class="pe-input-prefix">₫</span>
                <input v-model.number="form.minPrice" type="number" min="0" step="1000"
                  class="pe-input pe-input-prefixed" required placeholder="0" />
              </div>
            </div>
            <div class="pe-field">
              <label class="pe-label">Giá tối đa <span class="pe-required">*</span></label>
              <div class="pe-input-prefix-wrap">
                <span class="pe-input-prefix">₫</span>
                <input v-model.number="form.maxPrice" type="number" min="0" step="1000"
                  class="pe-input pe-input-prefixed" required placeholder="0" />
              </div>
            </div>
            <div v-if="form.minPrice > 0 && form.maxPrice > 0" class="pe-price-summary">
              <i class="bi bi-tag"></i>
              {{ new Intl.NumberFormat('vi-VN').format(form.minPrice) }}₫
              <span v-if="form.maxPrice !== form.minPrice">
                — {{ new Intl.NumberFormat('vi-VN').format(form.maxPrice) }}₫
              </span>
            </div>
          </div>
        </div>

        <!-- Section: Vận chuyển -->
        <div class="pe-card">
          <div class="pe-card-header">
            <div class="pe-card-icon" style="background:#fffbeb;">
              <i class="bi bi-truck" style="color:#f59e0b;"></i>
            </div>
            <div>
              <h2 class="pe-card-title">Thông tin vận chuyển</h2>
              <p class="pe-card-desc">Kích thước và khối lượng</p>
            </div>
          </div>
          <div class="pe-card-body">
            <div class="pe-field">
              <label class="pe-label">Khối lượng</label>
              <div class="pe-input-suffix-wrap">
                <input v-model.number="form.weightGram" type="number" min="0"
                  class="pe-input pe-input-suffixed" placeholder="0" />
                <span class="pe-input-suffix">gram</span>
              </div>
            </div>

            <label class="pe-label mt-2">Kích thước (cm)</label>
            <div class="pe-dimensions">
              <div class="pe-dimension-item">
                <span class="pe-dim-label">D</span>
                <input v-model.number="form.lengthCm" type="number" min="0" step="0.1"
                  class="pe-input" placeholder="0" />
              </div>
              <span class="pe-dim-x">×</span>
              <div class="pe-dimension-item">
                <span class="pe-dim-label">R</span>
                <input v-model.number="form.widthCm" type="number" min="0" step="0.1"
                  class="pe-input" placeholder="0" />
              </div>
              <span class="pe-dim-x">×</span>
              <div class="pe-dimension-item">
                <span class="pe-dim-label">C</span>
                <input v-model.number="form.heightCm" type="number" min="0" step="0.1"
                  class="pe-input" placeholder="0" />
              </div>
            </div>
            <p class="pe-hint mt-1">Dài × Rộng × Cao</p>
          </div>
        </div>

        <!-- Tips card -->
        <div class="pe-tips-card">
          <h3 class="pe-tips-title"><i class="bi bi-lightbulb-fill me-2"></i>Mẹo bán hàng</h3>
          <ul class="pe-tips-list">
            <li>Thêm tối thiểu <strong>3 ảnh</strong> để tăng tỷ lệ chuyển đổi</li>
            <li>Mô tả chi tiết giúp khách hàng tin tưởng hơn</li>
            <li>Đặt giá chính xác để tránh tranh chấp đơn hàng</li>
            <li>Khối lượng chính xác giúp tính phí ship đúng</li>
          </ul>
        </div>

      </div>

    </form>
  </div>
</template>

<style scoped>
/* ── Page layout ────────────────────────────────────────── */
.pe-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Page header ────────────────────────────────────────── */
.pe-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.pe-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pe-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  font-size: 16px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.pe-back-btn:hover { background: #e5e7eb; color: #111; }
.pe-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
}
.pe-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}
.pe-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Buttons ────────────────────────────────────────────── */
.pe-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}
.pe-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.pe-btn-primary {
  background: #1a56db;
  color: #fff;
}
.pe-btn-primary:hover:not(:disabled) { background: #1447bf; }
.pe-btn-ghost {
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}
.pe-btn-ghost:hover { background: #f9fafb; color: #374151; }

/* ── Loading ────────────────────────────────────────────── */
.pe-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px;
  justify-content: center;
  color: #6b7280;
}

/* ── Body layout ────────────────────────────────────────── */
.pe-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .pe-body { grid-template-columns: 1fr; }
}

/* ── Card ───────────────────────────────────────────────── */
.pe-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}
.pe-col-main .pe-card:last-child,
.pe-col-side .pe-card:last-child { margin-bottom: 0; }
.pe-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.pe-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.pe-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
}
.pe-card-desc {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
.pe-card-body {
  padding: 20px;
}

/* ── Form fields ────────────────────────────────────────── */
.pe-field {
  margin-bottom: 16px;
}
.pe-field:last-child { margin-bottom: 0; }
.pe-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 640px) {
  .pe-field-row { grid-template-columns: 1fr; }
}
.pe-field-lg { grid-column: span 1; }

.pe-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}
.pe-required { color: #1a56db; }
.pe-optional { color: #9ca3af; font-weight: 400; font-size: 12px; }
.pe-hint {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.pe-input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pe-input:focus {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(238,77,45,0.1);
}
.pe-input::placeholder { color: #d1d5db; }

.pe-select {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  outline: none;
  appearance: auto;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pe-select:focus {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(238,77,45,0.1);
}

.pe-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
  line-height: 1.6;
}
.pe-textarea:focus {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(238,77,45,0.1);
}
.pe-textarea::placeholder { color: #d1d5db; }

/* ── Prefix/suffix inputs ───────────────────────────────── */
.pe-input-prefix-wrap,
.pe-input-suffix-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pe-input-prefix-wrap:focus-within,
.pe-input-suffix-wrap:focus-within {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(238,77,45,0.1);
}
.pe-input-prefix,
.pe-input-suffix {
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  height: 38px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.pe-input-suffix {
  border-right: none;
  border-left: 1px solid #e5e7eb;
}
.pe-input-prefixed,
.pe-input-suffixed {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  flex: 1;
}

/* ── Price summary ──────────────────────────────────────── */
.pe-price-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #00a650;
}

/* ── Dimensions ─────────────────────────────────────────── */
.pe-dimensions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.pe-dimension-item {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.pe-dim-label {
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  flex-shrink: 0;
  width: 16px;
}
.pe-dim-x {
  font-size: 16px;
  color: #d1d5db;
  flex-shrink: 0;
}

/* ── Thumbnail section ──────────────────────────────────── */
.pe-thumbnail-wrap {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.pe-thumb-preview {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}
.pe-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pe-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #d1d5db;
  font-size: 24px;
}
.pe-thumb-placeholder span { font-size: 11px; }
.pe-thumb-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.pe-thumb-remove:hover { background: rgba(0,0,0,0.85); }

.pe-thumb-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pe-thumb-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
}
.pe-thumb-divider::before,
.pe-thumb-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}
.pe-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  width: fit-content;
}
.pe-upload-btn:hover {
  background: #eff6ff;
  border-color: #1a56db;
  color: #1a56db;
}

/* ── Gallery section ────────────────────────────────────── */
.pe-gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.pe-gallery-count {
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 10px;
  border-radius: 9999px;
}

/* Drop zone */
.pe-dropzone {
  border: 2px dashed #e5e7eb;
  border-radius: 10px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 12px;
}
.pe-dropzone:hover,
.pe-dropzone-active {
  border-color: #1a56db;
  background: #eff6ff;
}
.pe-dropzone-uploading {
  border-color: #3b82f6;
  background: #eff6ff;
  cursor: not-allowed;
}
.pe-dropzone-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 6px;
}
.pe-dropzone-icon {
  font-size: 28px;
  color: #9ca3af;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pe-dropzone-active .pe-dropzone-icon { color: #1a56db; }
.pe-dropzone-uploading .pe-dropzone-icon { color: #3b82f6; }
.pe-dropzone-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pe-dropzone-text strong { font-size: 14px; color: #374151; }
.pe-dropzone-text span { font-size: 12px; color: #9ca3af; }
.pe-dropzone-active .pe-dropzone-text strong { color: #1a56db; }
.pe-dropzone-hint {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
}

/* Upload queue */
.pe-queue {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}
.pe-queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}
.pe-queue-item:last-child { border-bottom: none; }
.pe-queue-status { flex-shrink: 0; font-size: 14px; }
.pe-queue-name { flex: 1; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pe-queue-error { font-size: 12px; color: #ef4444; }

/* Gallery grid */
.pe-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.pe-gallery-item {}
.pe-gallery-img-wrap {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}
.pe-gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.pe-gallery-img-wrap:hover .pe-gallery-img { transform: scale(1.04); }
.pe-gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: all 0.2s;
}
.pe-gallery-img-wrap:hover .pe-gallery-overlay {
  background: rgba(0,0,0,0.45);
  opacity: 1;
}
.pe-gallery-action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}
.pe-gallery-star {
  background: #fff;
  color: #374151;
}
.pe-gallery-star:hover:not(:disabled),
.pe-gallery-star.active {
  background: #fbbf24;
  color: #fff;
}
.pe-gallery-star:disabled { opacity: 0.6; cursor: default; }
.pe-gallery-delete {
  background: #fff;
  color: #ef4444;
}
.pe-gallery-delete:hover { background: #ef4444; color: #fff; }
.pe-gallery-badge {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(251,191,36,0.95);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}

.pe-gallery-empty {
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
}
.pe-gallery-empty i { font-size: 36px; display: block; margin-bottom: 8px; }
.pe-gallery-empty p { font-size: 13px; margin: 0; line-height: 1.6; }

/* ── Info note ──────────────────────────────────────────── */
.pe-info-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

/* ── Tips card ──────────────────────────────────────────── */
.pe-tips-card {
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 16px;
}
.pe-tips-title {
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 10px;
}
.pe-tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pe-tips-list li {
  font-size: 12px;
  color: #78350f;
  padding-left: 16px;
  position: relative;
  line-height: 1.5;
}
.pe-tips-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #d97706;
  font-weight: 700;
}
</style>

