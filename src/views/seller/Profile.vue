<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import { sellerProfileService } from '@/services/sellerProfile.service'

const auth = useAuthStore()
const notify = useNotifyStore()
const profile = ref(null)
const loading = ref(true)

// ── Avatar upload ─────────────────────────────────────────────
const fileInput = ref(null)
const uploading = ref(false)
const MAX_FILE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const triggerUpload = () => {
  if (!uploading.value) fileInput.value?.click()
}

const handleFileSelected = async (event) => {
  const file = event.target?.files?.[0]
  // Reset the input so selecting the same file twice still fires a change event.
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
    const result = await sellerProfileService.uploadLogo(file)
    if (profile.value) profile.value.logoUrl = result.logoUrl
    notify.push('Đã cập nhật ảnh đại diện gian hàng!', 'success')
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      'Không thể tải ảnh lên. Vui lòng thử lại.'
    notify.push(message, 'danger')
  } finally {
    uploading.value = false
  }
}

const statusMap = {
  ACTIVE:    { label: 'Đang hoạt động', color: '#00a650', bg: '#f0fdf4' },
  PENDING:   { label: 'Chờ duyệt',      color: '#f59e0b', bg: '#fffbeb' },
  SUSPENDED: { label: 'Tạm khóa',       color: '#ef4444', bg: '#fef2f2' },
  BANNED:    { label: 'Bị cấm',         color: '#6b7280', bg: '#f3f4f6' },
}

const businessTypeMap = {
  INDIVIDUAL: 'Cá nhân',
  ENTERPRISE: 'Doanh nghiệp',
  OFFICIAL:   'Gian hàng chính hãng',
}

const statusInfo = computed(() =>
  statusMap[profile.value?.status] ?? statusMap.PENDING
)
const businessTypeLabel = computed(() =>
  businessTypeMap[profile.value?.businessType] ?? profile.value?.businessType ?? '—'
)

const shopInitial = computed(() =>
  (profile.value?.shopName || auth.user?.fullName || 'S').charAt(0).toUpperCase()
)

const ratingStars = computed(() => {
  const avg = Number(profile.value?.ratingAvg || 0)
  return Array.from({ length: 5 }, (_, i) => i < Math.round(avg) ? 'full' : 'empty')
})

const memberSince = computed(() => {
  if (!profile.value?.createdAt) return '—'
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(profile.value.createdAt))
})

onMounted(async () => {
  try {
    profile.value = await sellerProfileService.getProfile()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="sp-page">

    <!-- Loading skeleton -->
    <div v-if="loading" class="sp-loading">
      <div class="sp-skeleton sp-skeleton-hero"></div>
      <div class="sp-skeleton-body">
        <div class="sp-skeleton sp-skeleton-avatar"></div>
        <div>
          <div class="sp-skeleton sp-skeleton-line sp-skeleton-lg"></div>
          <div class="sp-skeleton sp-skeleton-line sp-skeleton-md mt-2"></div>
        </div>
      </div>
    </div>

    <template v-else-if="profile">

      <!-- ── Hero / Cover ─────────────────────────────────────── -->
      <div class="sp-hero">
        <div class="sp-cover">
          <!-- Gradient cover pattern -->
          <div class="sp-cover-gradient"></div>
          <div class="sp-cover-pattern"></div>
        </div>

        <div class="sp-hero-content">
          <!-- Avatar -->
          <div class="sp-avatar-wrap">
            <div class="sp-avatar">
              <img v-if="profile.logoUrl" :src="profile.logoUrl" :alt="profile.shopName" class="sp-avatar-img" />
              <span v-else class="sp-avatar-initial">{{ shopInitial }}</span>
              <!-- Upload overlay -->
              <button
                type="button"
                class="sp-avatar-overlay"
                :disabled="uploading"
                :aria-label="uploading ? 'Đang tải ảnh lên' : 'Đổi ảnh đại diện'"
                @click="triggerUpload"
              >
                <span v-if="uploading" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-camera"></i>
              </button>
            </div>
            <div class="sp-avatar-badge" :style="{ background: statusInfo.color }"></div>
            <input
              ref="fileInput"
              type="file"
              class="sp-avatar-input"
              accept="image/jpeg,image/png,image/webp"
              @change="handleFileSelected"
            />
          </div>

          <!-- Shop info -->
          <div class="sp-hero-info">
            <div class="sp-hero-top">
              <div>
                <h1 class="sp-shop-name">{{ profile.shopName }}</h1>
                <div class="sp-shop-meta">
                  <span class="sp-status-chip" :style="{ color: statusInfo.color, background: statusInfo.bg }">
                    <span class="sp-status-dot" :style="{ background: statusInfo.color }"></span>
                    {{ statusInfo.label }}
                  </span>
                  <span class="sp-meta-sep">·</span>
                  <span class="sp-business-type">
                    <i class="bi bi-building"></i> {{ businessTypeLabel }}
                  </span>
                  <span class="sp-meta-sep">·</span>
                  <span class="sp-member-since">
                    <i class="bi bi-calendar3"></i> Tham gia {{ memberSince }}
                  </span>
                </div>
              </div>

              <div class="sp-hero-actions">
                <a :href="`/shop/${profile.slug}`" target="_blank" class="sp-btn sp-btn-outline">
                  <i class="bi bi-box-arrow-up-right"></i> Xem trang shop
                </a>
              </div>
            </div>

            <!-- Rating bar -->
            <div class="sp-rating-row">
              <div class="sp-stars">
                <i v-for="(s, i) in ratingStars" :key="i"
                  class="bi" :class="s === 'full' ? 'bi-star-fill' : 'bi-star'"></i>
              </div>
              <span class="sp-rating-score">{{ Number(profile.ratingAvg || 0).toFixed(1) }}</span>
              <span class="sp-rating-count">({{ (profile.ratingCount || 0).toLocaleString('vi-VN') }} đánh giá)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Stats bar ─────────────────────────────────────────── -->
      <div class="sp-stats-bar">
        <div class="sp-stat">
          <span class="sp-stat-value">{{ (profile.totalProduct || 0).toLocaleString('vi-VN') }}</span>
          <span class="sp-stat-label">Sản phẩm</span>
        </div>
        <div class="sp-stat-divider"></div>
        <div class="sp-stat">
          <span class="sp-stat-value">{{ (profile.followerCount || 0).toLocaleString('vi-VN') }}</span>
          <span class="sp-stat-label">Người theo dõi</span>
        </div>
        <div class="sp-stat-divider"></div>
        <div class="sp-stat">
          <span class="sp-stat-value" style="color: #f59e0b;">
            {{ Number(profile.ratingAvg || 0).toFixed(1) }} ⭐
          </span>
          <span class="sp-stat-label">Đánh giá TB</span>
        </div>
        <div class="sp-stat-divider"></div>
        <div class="sp-stat">
          <span class="sp-stat-value">{{ (profile.ratingCount || 0).toLocaleString('vi-VN') }}</span>
          <span class="sp-stat-label">Lượt đánh giá</span>
        </div>
      </div>

      <!-- ── Main content ──────────────────────────────────────── -->
      <div class="sp-body">

        <!-- Left: Info cards -->
        <div class="sp-col-main">

          <!-- Thông tin gian hàng -->
          <div class="sp-card">
            <div class="sp-card-header">
              <div class="sp-card-icon" style="background:#eff6ff;">
                <i class="bi bi-shop" style="color:#1a56db;"></i>
              </div>
              <h2 class="sp-card-title">Thông tin gian hàng</h2>
            </div>
            <div class="sp-card-body">

              <div class="sp-info-grid">
                <div class="sp-info-item">
                  <span class="sp-info-label"><i class="bi bi-tag"></i> Tên gian hàng</span>
                  <span class="sp-info-value">{{ profile.shopName }}</span>
                </div>
                <div class="sp-info-item">
                  <span class="sp-info-label"><i class="bi bi-link-45deg"></i> Slug URL</span>
                  <span class="sp-info-value">
                    <code class="sp-code">{{ profile.slug }}</code>
                  </span>
                </div>
                <div class="sp-info-item">
                  <span class="sp-info-label"><i class="bi bi-building"></i> Loại hình</span>
                  <span class="sp-info-value">{{ businessTypeLabel }}</span>
                </div>
                <div class="sp-info-item">
                  <span class="sp-info-label"><i class="bi bi-shield-check"></i> Trạng thái</span>
                  <span class="sp-status-chip" :style="{ color: statusInfo.color, background: statusInfo.bg }">
                    <span class="sp-status-dot" :style="{ background: statusInfo.color }"></span>
                    {{ statusInfo.label }}
                  </span>
                </div>
              </div>

              <div v-if="profile.description" class="sp-description">
                <span class="sp-info-label"><i class="bi bi-card-text"></i> Mô tả gian hàng</span>
                <p class="sp-desc-text">{{ profile.description }}</p>
              </div>
              <div v-else class="sp-no-desc">
                <i class="bi bi-card-text"></i>
                <span>Chưa có mô tả gian hàng</span>
              </div>

            </div>
          </div>

          <!-- Liên hệ & địa chỉ -->
          <div class="sp-card">
            <div class="sp-card-header">
              <div class="sp-card-icon" style="background:#eff6ff;">
                <i class="bi bi-geo-alt" style="color:#3b82f6;"></i>
              </div>
              <h2 class="sp-card-title">Liên hệ & địa chỉ</h2>
            </div>
            <div class="sp-card-body">
              <div class="sp-info-grid">
                <div class="sp-info-item">
                  <span class="sp-info-label"><i class="bi bi-person"></i> Chủ sở hữu</span>
                  <span class="sp-info-value">{{ auth.user?.fullName || '—' }}</span>
                </div>
                <div class="sp-info-item">
                  <span class="sp-info-label"><i class="bi bi-envelope"></i> Email</span>
                  <span class="sp-info-value">{{ auth.user?.email || '—' }}</span>
                </div>
                <div class="sp-info-item" v-if="profile.phone">
                  <span class="sp-info-label"><i class="bi bi-telephone"></i> Điện thoại</span>
                  <span class="sp-info-value">{{ profile.phone }}</span>
                </div>
                <div class="sp-info-item" v-if="profile.address">
                  <span class="sp-info-label"><i class="bi bi-geo-alt"></i> Địa chỉ</span>
                  <span class="sp-info-value">{{ profile.address }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right: Side cards -->
        <div class="sp-col-side">

          <!-- Hiệu suất gian hàng -->
          <div class="sp-card">
            <div class="sp-card-header">
              <div class="sp-card-icon" style="background:#f0fdf4;">
                <i class="bi bi-graph-up" style="color:#00a650;"></i>
              </div>
              <h2 class="sp-card-title">Hiệu suất</h2>
            </div>
            <div class="sp-card-body sp-perf-body">

              <div class="sp-perf-item">
                <div class="sp-perf-icon" style="background:#eff6ff;">
                  <i class="bi bi-box-seam" style="color:#1a56db;"></i>
                </div>
                <div class="sp-perf-info">
                  <span class="sp-perf-label">Tổng sản phẩm</span>
                  <span class="sp-perf-value">{{ (profile.totalProduct || 0).toLocaleString('vi-VN') }}</span>
                </div>
              </div>

              <div class="sp-perf-item">
                <div class="sp-perf-icon" style="background:#eff6ff;">
                  <i class="bi bi-people" style="color:#3b82f6;"></i>
                </div>
                <div class="sp-perf-info">
                  <span class="sp-perf-label">Người theo dõi</span>
                  <span class="sp-perf-value">{{ (profile.followerCount || 0).toLocaleString('vi-VN') }}</span>
                </div>
              </div>

              <div class="sp-perf-item">
                <div class="sp-perf-icon" style="background:#fffbeb;">
                  <i class="bi bi-star" style="color:#f59e0b;"></i>
                </div>
                <div class="sp-perf-info">
                  <span class="sp-perf-label">Đánh giá trung bình</span>
                  <div class="sp-rating-mini">
                    <span class="sp-perf-value" style="color:#f59e0b;">{{ Number(profile.ratingAvg || 0).toFixed(1) }}</span>
                    <div class="sp-stars-mini">
                      <i v-for="(s, i) in ratingStars" :key="i"
                        class="bi" :class="s === 'full' ? 'bi-star-fill' : 'bi-star'" style="color:#f59e0b;font-size:11px;"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sp-perf-item">
                <div class="sp-perf-icon" style="background:#f0fdf4;">
                  <i class="bi bi-chat-left-text" style="color:#00a650;"></i>
                </div>
                <div class="sp-perf-info">
                  <span class="sp-perf-label">Tổng đánh giá</span>
                  <span class="sp-perf-value">{{ (profile.ratingCount || 0).toLocaleString('vi-VN') }}</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Quick links -->
          <div class="sp-card">
            <div class="sp-card-header">
              <div class="sp-card-icon" style="background:#faf5ff;">
                <i class="bi bi-lightning" style="color:#8b5cf6;"></i>
              </div>
              <h2 class="sp-card-title">Truy cập nhanh</h2>
            </div>
            <div class="sp-card-body sp-links-body">
              <router-link :to="{ name: 'seller-products' }" class="sp-quick-link">
                <i class="bi bi-box-seam"></i>
                <span>Quản lý sản phẩm</span>
                <i class="bi bi-chevron-right sp-link-arrow"></i>
              </router-link>
              <router-link :to="{ name: 'seller-orders' }" class="sp-quick-link">
                <i class="bi bi-receipt"></i>
                <span>Quản lý đơn hàng</span>
                <i class="bi bi-chevron-right sp-link-arrow"></i>
              </router-link>
              <router-link :to="{ name: 'seller-promotions' }" class="sp-quick-link">
                <i class="bi bi-tag-fill"></i>
                <span>Khuyến mãi & Voucher</span>
                <i class="bi bi-chevron-right sp-link-arrow"></i>
              </router-link>
              <router-link :to="{ name: 'seller-reviews' }" class="sp-quick-link">
                <i class="bi bi-star-fill"></i>
                <span>Đánh giá sản phẩm</span>
                <i class="bi bi-chevron-right sp-link-arrow"></i>
              </router-link>
              <router-link :to="{ name: 'seller-stats' }" class="sp-quick-link">
                <i class="bi bi-graph-up"></i>
                <span>Thống kê doanh thu</span>
                <i class="bi bi-chevron-right sp-link-arrow"></i>
              </router-link>
            </div>
          </div>

          <!-- Notice card -->
          <div class="sp-notice-card">
            <i class="bi bi-info-circle-fill sp-notice-icon"></i>
            <div>
              <p class="sp-notice-title">Cập nhật ảnh đại diện</p>
              <p class="sp-notice-desc">Nhấn vào ảnh đại diện góc trên để tải lên logo mới (JPEG, PNG, WebP · tối đa 5MB). Muốn đổi tên gian hàng hoặc thông tin khác, liên hệ bộ phận hỗ trợ seller hoặc gọi <strong>1900 6868</strong>.</p>
            </div>
          </div>

        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else class="sp-error">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <p>Không thể tải thông tin hồ sơ gian hàng.</p>
    </div>

  </div>
</template>

<style scoped>
/* ── Page ───────────────────────────────────────────────── */
.sp-page {
  min-height: 100%;
}

/* ── Loading ────────────────────────────────────────────── */
.sp-loading { padding: 0; }
.sp-skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 8px;
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.sp-skeleton-hero { height: 180px; border-radius: 0; margin-bottom: 0; }
.sp-skeleton-body { display: flex; align-items: flex-end; gap: 16px; padding: 0 24px; margin-top: -40px; margin-bottom: 24px; }
.sp-skeleton-avatar { width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0; }
.sp-skeleton-line { height: 14px; }
.sp-skeleton-lg { width: 200px; }
.sp-skeleton-md { width: 140px; }
.mt-2 { margin-top: 8px; }

/* ── Hero / Cover ───────────────────────────────────────── */
.sp-hero {
  position: relative;
  margin-bottom: 0;
}
.sp-cover {
  height: 180px;
  position: relative;
  overflow: hidden;
}
.sp-cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a56db 0%, #2563eb 45%, #3b82f6 100%);
}
.sp-cover-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
    radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, white 1px, transparent 1px);
  background-size: 40px 40px, 60px 60px, 80px 80px;
}

.sp-hero-content {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  padding: 0 24px 20px;
  margin-top: -52px;
  position: relative;
  flex-wrap: wrap;
}

/* ── Avatar ─────────────────────────────────────────────── */
.sp-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.sp-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 4px solid #fff;
  overflow: hidden;
  background: linear-gradient(135deg, #1a56db, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  position: relative;
}
.sp-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sp-avatar-initial {
  font-size: 36px;
  font-weight: 800;
  color: #fff;
}

/* Upload overlay — camera button on hover */
.sp-avatar-overlay {
  position: absolute;
  inset: 0;
  border: none;
  border-radius: 50%;
  background: rgba(26, 86, 219, 0.65);
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}
.sp-avatar:hover .sp-avatar-overlay,
.sp-avatar-overlay:focus-visible {
  opacity: 1;
}
.sp-avatar-overlay:disabled {
  cursor: wait;
  opacity: 1;
}
.sp-avatar-overlay:hover:not(:disabled) {
  background: rgba(26, 86, 219, 0.8);
}

/* Hidden native file input */
.sp-avatar-input {
  display: none;
}
.sp-avatar-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
}

/* ── Hero info ──────────────────────────────────────────── */
.sp-hero-info {
  flex: 1;
  min-width: 0;
  padding-top: 56px;
}
.sp-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.sp-shop-name {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 6px;
  line-height: 1.2;
}
.sp-shop-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
.sp-meta-sep { color: #d1d5db; }
.sp-business-type,
.sp-member-since {
  display: flex;
  align-items: center;
  gap: 4px;
}
.sp-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}
.sp-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.sp-rating-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.sp-stars {
  display: flex;
  gap: 2px;
  color: #f59e0b;
  font-size: 13px;
}
.sp-rating-score {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}
.sp-rating-count {
  font-size: 12px;
  color: #9ca3af;
}

/* ── Hero actions ───────────────────────────────────────── */
.sp-hero-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.sp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
  border: none;
}
.sp-btn-outline {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
}
.sp-btn-outline:hover {
  background: #f9fafb;
  color: #111827;
}

/* ── Stats bar ──────────────────────────────────────────── */
.sp-stats-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  padding: 16px 24px;
  margin-bottom: 24px;
  gap: 0;
  overflow-x: auto;
}
.sp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 100px;
}
.sp-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.sp-stat-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sp-stat-divider {
  width: 1px;
  height: 36px;
  background: #f3f4f6;
  flex-shrink: 0;
  margin: 0 16px;
}

/* ── Body layout ────────────────────────────────────────── */
.sp-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  padding: 0 24px 24px;
}
@media (max-width: 900px) {
  .sp-body { grid-template-columns: 1fr; padding: 0 16px 16px; }
  .sp-hero-content { padding: 0 16px 16px; }
  .sp-stats-bar { padding: 12px 16px; }
}

/* ── Card ───────────────────────────────────────────────── */
.sp-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.sp-col-main .sp-card:last-child,
.sp-col-side .sp-card:last-child { margin-bottom: 0; }
.sp-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #f9fafb;
}
.sp-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.sp-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.sp-card-body {
  padding: 18px;
}

/* ── Info grid ──────────────────────────────────────────── */
.sp-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 600px) {
  .sp-info-grid { grid-template-columns: 1fr; }
}
.sp-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sp-info-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sp-info-label .bi { font-size: 12px; }
.sp-info-value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}
.sp-code {
  background: #f3f4f6;
  color: #1a56db;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

/* Description */
.sp-description {
  padding-top: 16px;
  border-top: 1px solid #f9fafb;
}
.sp-desc-text {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.7;
  margin: 8px 0 0;
  white-space: pre-line;
}
.sp-no-desc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
  color: #9ca3af;
  border: 1px dashed #e5e7eb;
}

/* ── Performance ────────────────────────────────────────── */
.sp-perf-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sp-perf-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  transition: background 0.15s;
}
.sp-perf-item:hover { background: #f5f5f5; }
.sp-perf-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.sp-perf-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.sp-perf-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}
.sp-perf-value {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}
.sp-rating-mini {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sp-stars-mini {
  display: flex;
  gap: 1px;
}

/* ── Quick links ────────────────────────────────────────── */
.sp-links-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sp-quick-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  transition: all 0.15s;
}
.sp-quick-link:hover {
  background: #eff6ff;
  color: #1a56db;
}
.sp-quick-link .bi:first-child {
  width: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 15px;
}
.sp-quick-link:hover .bi:first-child { color: #1a56db; }
.sp-link-arrow {
  margin-left: auto;
  font-size: 11px;
  color: #d1d5db;
}
.sp-quick-link:hover .sp-link-arrow { color: #1a56db; }

/* ── Notice card ────────────────────────────────────────── */
.sp-notice-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
}
.sp-notice-icon {
  color: #3b82f6;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
.sp-notice-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 4px;
}
.sp-notice-desc {
  font-size: 12px;
  color: #3b82f6;
  margin: 0;
  line-height: 1.5;
}

/* ── Error ──────────────────────────────────────────────── */
.sp-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 24px;
  color: #9ca3af;
  text-align: center;
}
.sp-error i { font-size: 40px; color: #f59e0b; }
.sp-error p { font-size: 14px; margin: 0; }
</style>

