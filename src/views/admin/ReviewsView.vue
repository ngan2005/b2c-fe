<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminReviewService } from '@/services/adminReview.service'
import { useNotifyStore } from '@/stores/notify'

const notify = useNotifyStore()

// Data state
const items = ref([])
const stats = ref({
  totalReviews: 0,
  visibleCount: 0,
  hiddenCount: 0,
  averageRating: 0,
  fiveStarCount: 0,
  fourStarCount: 0,
  threeStarCount: 0,
  twoStarCount: 0,
  oneStarCount: 0
})

const page = ref(0)
const size = ref(15)
const totalPages = ref(0)
const totalElements = ref(0)
const loading = ref(false)

// Filter state
const selectedRating = ref('')
const selectedStatus = ref('')
const keyword = ref('')
let searchTimeout = null

// Preview image modal
const previewImageUrl = ref(null)

// Action loading states
const updatingId = ref(null)
const deletingId = ref(null)

function stars(n) {
  return '★'.repeat(n || 0) + '☆'.repeat(Math.max(0, 5 - (n || 0)))
}

function ratingColor(r) {
  if (r >= 4) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (r === 3) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-rose-600 bg-rose-50 border-rose-200'
}

function parseImages(imgJson) {
  if (!imgJson) return []
  if (Array.isArray(imgJson)) return imgJson
  try {
    const parsed = JSON.parse(imgJson)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return typeof imgJson === 'string' && imgJson.startsWith('http') ? [imgJson] : []
  }
}

async function loadStats() {
  try {
    const res = await adminReviewService.getStats()
    stats.value = res || {}
  } catch (err) {
    console.error('Failed to load review stats:', err)
  }
}

async function loadReviews() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      keyword: keyword.value.trim() || undefined,
      status: selectedStatus.value || undefined,
      rating: selectedRating.value ? parseInt(selectedRating.value, 10) : undefined
    }
    const res = await adminReviewService.list(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length
  } catch (err) {
    notify.push('Không thể tải danh sách đánh giá', 'danger')
  } finally {
    loading.value = false
  }
}

function refreshAll() {
  page.value = 0
  loadStats()
  loadReviews()
}

function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 0
    loadReviews()
  }, 400)
}

function setRatingFilter(r) {
  selectedRating.value = selectedRating.value === r ? '' : r
  page.value = 0
  loadReviews()
}

async function toggleStatus(review) {
  const nextStatus = review.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
  updatingId.value = review.id
  try {
    const updated = await adminReviewService.updateStatus(review.id, nextStatus)
    review.status = updated.status || nextStatus
    notify.push(
      nextStatus === 'HIDDEN'
        ? 'Đã ẩn đánh giá khỏi sản phẩm'
        : 'Đã hiển thị lại đánh giá trên sàn',
      'success'
    )
    loadStats()
  } catch (err) {
    notify.push('Không thể cập nhật trạng thái', 'danger')
  } finally {
    updatingId.value = null
  }
}

async function deleteReview(review) {
  if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn đánh giá #${review.id}? Thao tác này sẽ cập nhật lại điểm đánh giá của sản phẩm.`)) {
    return
  }
  deletingId.value = review.id
  try {
    await adminReviewService.deleteReview(review.id)
    notify.push('Đã xóa đánh giá thành công', 'success')
    items.value = items.value.filter(r => r.id !== review.id)
    loadStats()
    if (!items.value.length && page.value > 0) {
      page.value--
      loadReviews()
    }
  } catch (err) {
    notify.push('Không thể xóa đánh giá', 'danger')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  refreshAll()
})
</script>

<template>
  <div class="admin-reviews-view space-y-6">
    <!-- ── Hero Banner ──────────────────────────────────────── -->
    <div class="admin-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="admin-hero-pill">CONTENT MODERATION</span>
            <span class="admin-live-badge">
              <span class="admin-live-dot"></span>
              Kiểm duyệt nội dung sàn
            </span>
          </div>
          <h1 class="admin-hero-title">Quản Lý &amp; Kiểm Duyệt Đánh Giá</h1>
          <p class="admin-hero-desc">
            Theo dõi ý kiến phản hồi của người mua trên toàn sàn, ẩn đánh giá vi phạm/thô tục và duy trì độ tin cậy sản phẩm.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2.5 flex-wrap">
          <button class="admin-hero-btn" @click="refreshAll" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới dữ liệu
          </button>
        </div>
      </div>
    </div>

    <!-- ── KPI Stats Cards ──────────────────────────────────── -->
    <div class="row g-3">
      <!-- Card: Total Reviews -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="admin-kpi-card">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Tổng đánh giá</span>
            <div class="kpi-icon-wrap bg-indigo-50 text-indigo-600">
              <i class="bi bi-chat-square-quote"></i>
            </div>
          </div>
          <div class="kpi-value">{{ stats.totalReviews || 0 }}</div>
          <div class="kpi-subtext text-slate-500">Trên toàn hệ thống sàn</div>
        </div>
      </div>

      <!-- Card: Average Rating -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="admin-kpi-card">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Điểm đánh giá TB</span>
            <div class="kpi-icon-wrap bg-amber-50 text-amber-500">
              <i class="bi bi-star-fill"></i>
            </div>
          </div>
          <div class="kpi-value d-flex align-items-center gap-2">
            <span>{{ stats.averageRating || '0.0' }}</span>
            <span class="text-amber-500 fs-6">/ 5.0</span>
          </div>
          <div class="kpi-subtext text-amber-600 font-semibold">
            {{ stars(Math.round(stats.averageRating || 0)) }}
          </div>
        </div>
      </div>

      <!-- Card: Visible Reviews -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="admin-kpi-card">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Đang hiển thị</span>
            <div class="kpi-icon-wrap bg-emerald-50 text-emerald-600">
              <i class="bi bi-eye"></i>
            </div>
          </div>
          <div class="kpi-value text-emerald-600">{{ stats.visibleCount || 0 }}</div>
          <div class="kpi-subtext text-slate-500">Công khai cho người mua</div>
        </div>
      </div>

      <!-- Card: Hidden Reviews -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="admin-kpi-card">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="kpi-label">Đã ẩn / Vi phạm</span>
            <div class="kpi-icon-wrap bg-rose-50 text-rose-600">
              <i class="bi bi-eye-slash"></i>
            </div>
          </div>
          <div class="kpi-value text-rose-600">{{ stats.hiddenCount || 0 }}</div>
          <div class="kpi-subtext text-rose-500">Bị tạm khóa hiển thị</div>
        </div>
      </div>
    </div>

    <!-- ── Filter & Search Toolbar ──────────────────────────── -->
    <div class="admin-surface-card p-3.5">
      <div class="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3">
        <!-- Star Rating Chips -->
        <div class="d-flex align-items-center gap-1.5 flex-wrap">
          <button
            class="filter-chip"
            :class="{ active: selectedRating === '' }"
            @click="setRatingFilter('')"
          >
            Tất cả sao
          </button>
          <button
            v-for="r in [5, 4, 3, 2, 1]"
            :key="r"
            class="filter-chip"
            :class="{ active: selectedRating === String(r) }"
            @click="setRatingFilter(String(r))"
          >
            {{ r }} ★
            <span class="chip-count" v-if="r === 5">({{ stats.fiveStarCount || 0 }})</span>
            <span class="chip-count" v-else-if="r === 4">({{ stats.fourStarCount || 0 }})</span>
            <span class="chip-count" v-else-if="r === 3">({{ stats.threeStarCount || 0 }})</span>
            <span class="chip-count" v-else-if="r === 2">({{ stats.twoStarCount || 0 }})</span>
            <span class="chip-count" v-else-if="r === 1">({{ stats.oneStarCount || 0 }})</span>
          </button>
        </div>

        <!-- Right Side: Status Select & Keyword Search -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap flex-lg-nowrap">
          <!-- Status select -->
          <select
            v-model="selectedStatus"
            class="form-select form-select-sm filter-select"
            @change="() => { page = 0; loadReviews() }"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="VISIBLE">Hiển thị (VISIBLE)</option>
            <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
          </select>

          <!-- Search box -->
          <div class="input-group input-group-sm search-group">
            <span class="input-group-text bg-transparent border-end-0 text-slate-400">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="keyword"
              type="text"
              class="form-control border-start-0"
              placeholder="Tìm theo sản phẩm, shop, khách, bình luận..."
              @input="onSearchInput"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Reviews Table ────────────────────────────────────── -->
    <div class="admin-surface-card p-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50 text-slate-500 font-semibold text-xs border-bottom border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0 text-nowrap" style="width: 250px;">SẢN PHẨM &amp; GIAN HÀNG</th>
              <th class="py-3 px-3.5 border-0 text-nowrap" style="width: 170px;">NGƯỜI ĐÁNH GIÁ</th>
              <th class="py-3 px-3.5 border-0 text-nowrap" style="width: 100px;">ĐÁNH GIÁ</th>
              <th class="py-3 px-3.5 border-0 text-nowrap">NỘI DUNG NHẬN XÉT &amp; MEDIA</th>
              <th class="py-3 px-3.5 border-0 text-nowrap" style="width: 120px;">THỜI GIAN</th>
              <th class="py-3 px-3.5 text-center border-0 text-nowrap" style="width: 110px;">TRẠNG THÁI</th>
              <th class="py-3 px-3.5 text-end border-0 text-nowrap" style="width: 150px;">THAO TÁC</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="7" class="text-center text-slate-400 py-10">
                <div class="spinner-border spinner-border-sm text-indigo-600 me-2"></div>
                Đang tải danh sách đánh giá...
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center text-slate-400 py-10">
                <i class="bi bi-chat-dots fs-3 d-block mb-2 text-slate-300"></i>
                Không tìm thấy đánh giá nào phù hợp với bộ lọc.
              </td>
            </tr>

            <!-- Row item -->
            <tr v-for="r in items" :key="r.id" class="hover:bg-slate-50/70 transition-colors">
              <!-- Product info -->
              <td class="px-3.5 py-3">
                <div class="d-flex align-items-center gap-2.5">
                  <img
                    v-if="r.productThumbnail"
                    :src="r.productThumbnail"
                    alt=""
                    class="rounded-lg border border-slate-200"
                    style="width: 44px; height: 44px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="bg-indigo-50 text-indigo-600 rounded-lg d-flex align-items-center justify-content-center flex-shrink-0"
                    style="width: 44px; height: 44px;"
                  >
                    <i class="bi bi-box-seam"></i>
                  </div>
                  <div class="min-w-0">
                    <router-link
                      v-if="r.productSlug"
                      :to="`/products/${r.productSlug}`"
                      target="_blank"
                      class="small fw-bold text-slate-800 text-decoration-none hover:text-indigo-600 d-block text-truncate"
                      style="max-width: 180px;"
                      :title="r.productName || `Sản phẩm #${r.productId}`"
                    >
                      {{ r.productName || `Sản phẩm #${r.productId}` }}
                    </router-link>
                    <div v-else class="small fw-bold text-slate-800 text-truncate" style="max-width: 180px;">
                      {{ r.productName || `Sản phẩm #${r.productId}` }}
                    </div>
                    <div class="text-xs text-slate-400 d-flex align-items-center gap-1 mt-0.5">
                      <i class="bi bi-shop text-xs"></i>
                      <span class="text-truncate" style="max-width: 150px;">{{ r.shopName || `Shop #${r.sellerId}` }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Reviewer -->
              <td class="px-3.5 py-3">
                <div class="d-flex align-items-center gap-2">
                  <img
                    v-if="r.reviewerAvatar"
                    :src="r.reviewerAvatar"
                    alt=""
                    class="rounded-circle border border-slate-200 flex-shrink-0"
                    style="width: 32px; height: 32px; object-fit: cover;"
                  />
                  <div
                    v-else
                    class="bg-indigo-600 rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                    style="width: 32px; height: 32px; font-size: 12px;"
                  >
                    {{ (r.reviewerName || '?')[0].toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <div class="small fw-bold text-slate-800 text-truncate" style="max-width: 120px;">
                      {{ r.reviewerName || 'Khách hàng' }}
                    </div>
                    <span v-if="r.isAnonymous" class="badge bg-slate-100 text-slate-600 text-2xs px-1.5 py-0.5 rounded">
                      Ẩn danh
                    </span>
                  </div>
                </div>
              </td>

              <!-- Rating -->
              <td class="px-3.5 py-3">
                <div class="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill border font-bold text-xs" :class="ratingColor(r.rating)">
                  <span>{{ r.rating }}</span>
                  <i class="bi bi-star-fill text-2xs"></i>
                </div>
              </td>

              <!-- Comment & Media -->
              <td class="px-3.5 py-3">
                <!-- Comment Text -->
                <div class="small text-slate-700 mb-1.5" style="max-width: 380px; word-break: break-word;">
                  {{ r.comment || '(Không có nhận xét viết)' }}
                </div>

                <!-- Attached Photos -->
                <div v-if="parseImages(r.imageUrls).length" class="d-flex align-items-center gap-1.5 mb-2 flex-wrap">
                  <img
                    v-for="(img, idx) in parseImages(r.imageUrls)"
                    :key="idx"
                    :src="img"
                    alt=""
                    class="rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                    style="width: 42px; height: 42px; object-fit: cover;"
                    @click="previewImageUrl = img"
                    title="Bấm để xem ảnh lớn"
                  />
                </div>

                <!-- Seller Reply -->
                <div v-if="r.sellerReply" class="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 small" style="max-width: 380px;">
                  <div class="fw-bold text-indigo-700 text-xs mb-0.5 d-flex align-items-center gap-1">
                    <i class="bi bi-reply-fill"></i>
                    <span>Phản hồi từ Shop:</span>
                    <span class="text-slate-400 font-mono text-2xs ms-auto" v-if="r.repliedAt">
                      {{ new Date(r.repliedAt).toLocaleDateString('vi-VN') }}
                    </span>
                  </div>
                  <div class="text-slate-600 text-xs" style="word-break: break-word;">{{ r.sellerReply }}</div>
                </div>
              </td>

              <!-- Date -->
              <td class="px-3.5 py-3 text-slate-400 text-xs font-mono">
                {{ r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—' }}
              </td>

              <!-- Status -->
              <td class="px-3.5 py-3 text-center">
                <span
                  v-if="r.status === 'VISIBLE'"
                  class="badge bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-pill px-2.5 py-1 font-bold"
                >
                  <i class="bi bi-check-circle-fill me-1"></i>Hiển thị
                </span>
                <span
                  v-else
                  class="badge bg-rose-50 text-rose-700 border border-rose-200 rounded-pill px-2.5 py-1 font-bold"
                >
                  <i class="bi bi-eye-slash-fill me-1"></i>Đã ẩn
                </span>
              </td>

              <!-- Actions -->
              <td class="px-3.5 py-3 text-end">
                <div class="d-inline-flex align-items-center gap-1.5">
                  <!-- Toggle Visibility Button -->
                  <button
                    class="btn btn-sm"
                    :class="r.status === 'VISIBLE' ? 'btn-outline-warning' : 'btn-outline-success'"
                    :disabled="updatingId === r.id"
                    @click="toggleStatus(r)"
                    :title="r.status === 'VISIBLE' ? 'Ẩn đánh giá' : 'Cho phép hiển thị'"
                  >
                    <span v-if="updatingId === r.id" class="spinner-border spinner-border-sm"></span>
                    <i v-else :class="r.status === 'VISIBLE' ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    <span class="ms-1 d-none d-md-inline">{{ r.status === 'VISIBLE' ? 'Ẩn' : 'Hiện' }}</span>
                  </button>

                  <!-- Delete Review Button -->
                  <button
                    class="btn btn-sm btn-outline-danger"
                    :disabled="deletingId === r.id"
                    @click="deleteReview(r)"
                    title="Xóa đánh giá"
                  >
                    <span v-if="deletingId === r.id" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-3 border-top border-slate-100 d-flex justify-content-between align-items-center flex-wrap gap-2" v-if="totalPages > 0">
        <small class="text-slate-500 font-medium">
          Hiển thị trang <strong class="text-slate-800">{{ page + 1 }}</strong> / <strong>{{ totalPages }}</strong>
          (Tổng cộng {{ totalElements }} đánh giá)
        </small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" :disabled="page === 0" @click="() => { page--; loadReviews() }">
            <i class="bi bi-chevron-left me-1"></i>Trước
          </button>
          <button class="btn btn-outline-secondary" :disabled="page + 1 >= totalPages" @click="() => { page++; loadReviews() }">
            Sau<i class="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div
      v-if="previewImageUrl"
      class="modal fade show d-block"
      style="background: rgba(0, 0, 0, 0.75); z-index: 1055;"
      @click.self="previewImageUrl = null"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-2xl border-0 overflow-hidden bg-black text-center p-2">
          <div class="d-flex justify-content-end p-2">
            <button type="button" class="btn-close btn-close-white" @click="previewImageUrl = null"></button>
          </div>
          <div class="p-2">
            <img :src="previewImageUrl" alt="" class="img-fluid rounded" style="max-height: 75vh;" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-reviews-view {
  max-width: 1440px;
  margin: 0 auto;
}

/* ── Hero Operational Dark Slate Banner ──────────────────── */
.admin-hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  color: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-hero-pill {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.35);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.admin-live-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: #34d399;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.admin-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.admin-hero-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.admin-hero-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-bottom: 0;
  max-width: 650px;
  line-height: 1.45;
}

.admin-hero-btn {
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

.admin-hero-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* ── KPI Cards ───────────────────────────────────────────── */
.admin-kpi-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.25rem 1.4rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.kpi-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.kpi-value {
  font-size: 1.65rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.kpi-subtext {
  font-size: 0.75rem;
  margin-top: 0.3rem;
}

/* ── Surface Card ────────────────────────────────────────── */
.admin-surface-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* ── Filter Chips ────────────────────────────────────────── */
.filter-chip {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.filter-chip.active {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
}

.chip-count {
  font-size: 0.7rem;
  opacity: 0.8;
  font-weight: normal;
  margin-left: 2px;
}

.filter-select {
  border-radius: 10px;
  border-color: #e2e8f0;
  font-size: 0.78rem;
  min-width: 170px;
}

.search-group {
  min-width: 260px;
}

.search-group input {
  font-size: 0.78rem;
  border-radius: 0 10px 10px 0;
}

.search-group .input-group-text {
  border-radius: 10px 0 0 10px;
  border-color: #e2e8f0;
}

.text-2xs {
  font-size: 0.65rem;
}

.cursor-pointer {
  cursor: pointer;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
