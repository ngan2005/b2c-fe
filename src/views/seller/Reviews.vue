<script setup>
import { ref, onMounted, computed } from 'vue'
import { reviewService } from '@/services/review.service'
import { useNotifyStore } from '@/stores/notify'

const notify = useNotifyStore()

const items = ref([])
const totalPages = ref(0)
const page = ref(0)
const size = ref(20)
const loading = ref(false)

// Filters
const ratingFilter = ref('')
const replyFilter = ref('')

// Reply modal
const showReplyModal = ref(false)
const replyingTo = ref(null)
const replyContent = ref('')
const submitting = ref(false)

function vnd(value) {
  if (value == null) return '0'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

function ratingBadge(r) {
  if (r >= 4) return 'bg-success'
  if (r >= 3) return 'bg-warning text-dark'
  if (r >= 2) return 'bg-amber-500'
  return 'bg-danger'
}

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (ratingFilter.value) params.rating = ratingFilter.value
    if (replyFilter.value) params.hasReply = replyFilter.value === 'replied'
    const res = await reviewService.listForSeller(params)
    items.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
  } finally {
    loading.value = false
  }
}

function openReply(item) {
  replyingTo.value = item
  replyContent.value = item.sellerReply || ''
  showReplyModal.value = true
}

async function submitReply() {
  const text = replyContent.value.trim()
  if (!text) {
    notify.push('Vui lòng nhập nội dung trả lời.', 'warning')
    return
  }
  if (text.length > 1000) {
    notify.push('Nội dung trả lời không được vượt quá 1000 ký tự.', 'warning')
    return
  }
  submitting.value = true
  try {
    await reviewService.replyToReview(replyingTo.value.id, { reply: text })
    notify.push('Đã gửi trả lời thành công!', 'success')
    showReplyModal.value = false
    replyContent.value = ''
    replyingTo.value = null
    load()
  } catch {
    // Global interceptor shows error
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="seller-reviews-container space-y-6">
    <!-- ── Hero Banner: Customer Feedback (Unified Dark Slate Theme) ── -->
    <div class="seller-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="seller-hero-pill">CUSTOMER SATISFACTION</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span>
              Phản hồi &amp; Đánh giá từ người mua
            </span>
          </div>
          <h1 class="seller-hero-title">Quản Lý Đánh Giá Gian Hàng</h1>
          <p class="seller-hero-desc">
            Lắng nghe ý kiến đóng góp, phản hồi trải nghiệm mua sắm và duy trì uy tín gian hàng 5 sao
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap">
          <button class="seller-hero-btn" @click="() => { page = 0; load() }" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <!-- ── Reviews Table ──────────────────────────────────── -->
    <div class="seller-surface-card p-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle text-sm mb-0">
          <thead class="bg-slate-50 text-slate-500 font-semibold text-xs border-bottom border-slate-100">
            <tr>
              <th class="py-3 px-3.5 border-0">SẢN PHẨM</th>
              <th class="py-3 px-3.5 border-0">NGƯỜI ĐÁNH GIÁ</th>
              <th class="py-3 px-3.5 border-0">ĐÁNH GIÁ</th>
              <th class="py-3 px-3.5 border-0">NHẬN XÉT &amp; PHẢN HỒI</th>
              <th class="py-3 px-3.5 border-0">THỜI GIAN</th>
              <th class="py-3 px-3.5 text-center border-0">TRẠNG THÁI</th>
              <th class="py-3 px-3.5 text-end border-0" style="width: 140px;">THAO TÁC</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center text-slate-400 py-8">
                <div class="spinner-border spinner-border-sm text-indigo-600 me-2"></div>Đang tải danh sách đánh giá...
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="7" class="text-center text-slate-400 py-8">Chưa có đánh giá nào từ khách hàng.</td>
            </tr>
            <tr v-for="r in items" :key="r.id" class="hover:bg-slate-50/70 transition-colors">
              <!-- Product -->
              <td class="px-3.5 py-3">
                <div class="d-flex align-items-center gap-2">
                  <img
                    v-if="r.productThumbnail"
                    :src="r.productThumbnail"
                    alt=""
                    class="rounded-xl border border-slate-200"
                    style="width:40px;height:40px;object-fit:cover;"
                  />
                  <div v-else class="bg-indigo-50 text-indigo-600 rounded-xl d-flex align-items-center justify-content-center" style="width:40px;height:40px;">
                    <i class="bi bi-box-seam"></i>
                  </div>
                  <div>
                    <router-link
                      v-if="r.productSlug"
                      :to="`/products/${r.productSlug}`"
                      target="_blank"
                      class="small fw-bold text-slate-800 text-decoration-none hover:text-indigo-600 d-block text-truncate"
                      style="max-width:160px;"
                      :title="r.productName || `Sản phẩm #${r.productId}`"
                    >
                      {{ r.productName || `Sản phẩm #${r.productId}` }}
                    </router-link>
                    <div v-else class="small fw-bold text-slate-800" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                      {{ r.productName || `Sản phẩm #${r.productId}` }}
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
                    class="rounded-circle border border-slate-200"
                    style="width:32px;height:32px;object-fit:cover;"
                  />
                  <div v-else class="bg-indigo-600 rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                       style="width:32px;height:32px;font-size:12px;">
                    {{ (r.reviewerName || '?')[0].toUpperCase() }}
                  </div>
                  <span class="small fw-bold text-slate-800">{{ r.reviewerName || 'Khách hàng' }}</span>
                </div>
              </td>
              <!-- Rating -->
              <td class="px-3.5 py-3">
                <div class="d-flex align-items-center gap-1 text-amber-500 font-bold">
                  <span>{{ r.rating }}</span>
                  <i class="bi bi-star-fill text-xs"></i>
                </div>
              </td>
              <!-- Comment -->
              <td class="px-3.5 py-3" style="max-width: 260px;">
                <div class="small text-slate-700">{{ r.comment }}</div>
                <!-- Seller Reply -->
                <div v-if="r.sellerReply" class="mt-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 small">
                  <div class="fw-bold text-indigo-700 mb-0.5 text-xs">
                    <i class="bi bi-reply-fill me-1"></i> Phản hồi từ Shop:
                  </div>
                  <div class="text-slate-600 text-xs">{{ r.sellerReply }}</div>
                </div>
              </td>
              <!-- Date -->
              <td class="px-3.5 py-3 text-slate-400 text-xs font-mono">
                {{ r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—' }}
              </td>
              <!-- Status -->
              <td class="px-3.5 py-3 text-center">
                <span v-if="r.sellerReply" class="badge bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-pill px-2.5 py-1 font-bold">
                  Đã trả lời
                </span>
                <span v-else class="badge bg-amber-50 text-amber-700 border border-amber-200 rounded-pill px-2.5 py-1 font-bold">
                  Chờ phản hồi
                </span>
              </td>
              <!-- Action -->
              <td class="px-3.5 py-3 text-end">
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="openReply(r)"
                >
                  <i class="bi bi-chat-left-text me-1"></i>
                  {{ r.sellerReply ? 'Sửa' : 'Trả lời' }}
                </button>
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

    <!-- Reply Modal -->
    <div class="modal fade" id="replyModal" tabindex="-1" :class="{ show: showReplyModal }"
         :style="showReplyModal ? 'display:block; background: rgba(0,0,0,0.5);' : ''" @click.self="showReplyModal = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-2xl border-0 shadow-2xl overflow-hidden">
          <div class="modal-header border-bottom border-slate-100 bg-slate-50 py-3">
            <h5 class="modal-title fw-bold text-slate-800 fs-6">
              {{ replyingTo?.sellerReply ? 'Chỉnh sửa phản hồi' : 'Trả lời đánh giá khách hàng' }}
            </h5>
            <button type="button" class="btn-close" @click="showReplyModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div v-if="replyingTo" class="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="small fw-semibold text-slate-500 mb-1">Đánh giá gốc:</div>
              <div class="small mb-1">
                <span class="badge me-1" :class="ratingBadge(replyingTo.rating)">{{ stars(replyingTo.rating) }}</span>
                <strong class="text-slate-800">{{ replyingTo.reviewerName || 'Ẩn danh' }}</strong>
                <span class="text-slate-400 ms-2 font-mono">{{ new Date(replyingTo.createdAt).toLocaleDateString('vi-VN') }}</span>
              </div>
              <div class="small text-slate-700">{{ replyingTo.comment }}</div>
            </div>
            <label class="form-label fw-bold text-slate-700 text-xs">
              Nội dung trả lời <span class="text-danger">*</span>
              <span class="fw-normal text-muted ms-1">(tối đa 1000 ký tự)</span>
            </label>
            <textarea
              v-model="replyContent"
              class="form-control text-sm"
              rows="4"
              placeholder="Nhập nội dung trả lời của bạn..."
              maxlength="1000"
            ></textarea>
            <div class="form-text text-end text-xs text-slate-400 mt-1">{{ replyContent.length }} / 1000</div>
          </div>
          <div class="modal-footer border-top border-slate-100 py-3">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="showReplyModal = false">Hủy</button>
            <button type="button" class="seller-btn-primary btn-sm" @click="submitReply" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Gửi trả lời
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showReplyModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.seller-reviews-container {
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
