<template>
  <div class="seller-fees-container space-y-6">

    <!-- ── 1. Hero Banner: Commission Policy ───────────────────── -->
    <div class="seller-hero-card">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="seller-hero-pill">CHÍNH SÁCH TÀI CHÍNH NO MALL</span>
            <span class="seller-live-badge">
              <span class="seller-live-dot"></span>
              Áp dụng minh bạch toàn sàn
            </span>
          </div>
          <h1 class="seller-hero-title">Biểu Phí Sàn & Chính Sách Chiết Khấu</h1>
          <p class="seller-hero-desc">
            Tra cứu mức chiết khấu phí sàn theo từng ngành hàng và sử dụng công cụ mô phỏng để tính toán chính xác dòng tiền thực nhận về gian hàng.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="seller-hero-btn" @click="fetchRules" :disabled="loading">
            <i :class="['bi bi-arrow-clockwise me-1.5', { 'spin': loading }]"></i>
            Làm mới biểu phí
          </button>
        </div>
      </div>
    </div>

    <!-- ── 2. Top Summary 3 Bento Cards ──────────────────────── -->
    <div class="row g-3">
      <div class="col-12 col-md-4">
        <div class="seller-stat-box">
          <div class="stat-icon bg-emerald-50 text-emerald-600">
            <i class="bi bi-shield-check"></i>
          </div>
          <div>
            <div class="stat-label">Cam kết minh bạch</div>
            <div class="stat-val text-emerald-600">0% Phí Ẩn</div>
            <div class="stat-sub">Chỉ thu phí khi đơn giao thành công</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="seller-stat-box">
          <div class="stat-icon bg-blue-50 text-blue-600">
            <i class="bi bi-percent"></i>
          </div>
          <div>
            <div class="stat-label">Phí sàn phổ biến</div>
            <div class="stat-val text-blue-600">3% – 5%</div>
            <div class="stat-sub">Tùy theo ngành hàng và chương trình</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="seller-stat-box">
          <div class="stat-icon bg-amber-50 text-amber-600">
            <i class="bi bi-wallet2"></i>
          </div>
          <div>
            <div class="stat-label">Hoàn trả tự động</div>
            <div class="stat-val text-amber-600">100% Hoàn Phí</div>
            <div class="stat-sub">Khi đơn bị hủy hoặc trả hàng hoàn tiền</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 3. Interactive Commission Simulator ─────────────────── -->
    <div class="simulator-card">
      <div class="simulator-header">
        <div class="d-flex align-items-center gap-2">
          <div class="simulator-icon">
            <i class="bi bi-calculator"></i>
          </div>
          <div>
            <h5 class="fw-bold text-slate-900 mb-0">Công Cụ Mô Phỏng Tính Phí Sàn & Tiền Thực Nhận</h5>
            <small class="text-slate-500">Nhập giá bán dự kiến để biết chính xác khoản tiền sàn sẽ trích và số tiền vào Ví Người Bán</small>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="row g-4 align-items-center">
          <!-- Inputs -->
          <div class="col-12 col-lg-5">
            <div class="space-y-3">
              <div>
                <label class="form-label text-xs fw-bold text-slate-700">Ngành hàng sản phẩm</label>
                <select v-model="simCategoryId" class="form-select form-select-custom" @change="runSimulation">
                  <option :value="null">— Áp dụng biểu phí chung (Toàn sàn) —</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="form-label text-xs fw-bold text-slate-700">Giá bán sản phẩm dự kiến (₫)</label>
                <div class="input-group">
                  <input
                    v-model.number="simAmount"
                    type="number"
                    step="10000"
                    min="1000"
                    class="form-control form-control-custom"
                    placeholder="500000"
                    @input="runSimulation"
                  />
                  <span class="input-group-text bg-slate-50 text-slate-600 font-bold">VNĐ</span>
                </div>
              </div>

              <div class="d-flex gap-2 flex-wrap">
                <button
                  v-for="preset in [100000, 250000, 500000, 1000000, 2000000]"
                  :key="preset"
                  class="btn btn-xs btn-outline-secondary rounded-pill"
                  @click="simAmount = preset; runSimulation()"
                >
                  {{ formatCurrency(preset) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Divider for Mobile -->
          <div class="d-lg-none col-12"><hr class="my-1 border-slate-200"></div>

          <!-- Calculation Outcome Breakdown -->
          <div class="col-12 col-lg-7">
            <div class="sim-result-panel">
              <div class="row g-3 text-center text-md-start">
                <div class="col-12 col-md-4">
                  <div class="text-xs text-slate-500">Tỷ lệ phí sàn</div>
                  <div class="fs-4 fw-extrabold text-slate-900 font-mono mt-1">
                    {{ simResult?.percent ?? 5 }}%
                  </div>
                  <small class="text-xs text-muted d-block text-truncate">
                    Rule: {{ simResult?.ruleName || 'Chung' }}
                  </small>
                </div>

                <div class="col-12 col-md-4">
                  <div class="text-xs text-rose-600 font-medium">Phí sàn trích trừ</div>
                  <div class="fs-4 fw-extrabold text-rose-600 font-mono mt-1">
                    - {{ formatCurrency(simResult?.commissionFee ?? 0) }}
                  </div>
                  <small v-if="simResult?.isBelowMinOrder" class="badge bg-amber-100 text-amber-800 text-xxs">
                    Đơn dưới ngưỡng tối thiểu
                  </small>
                  <small v-else class="text-xs text-slate-400">Tự động khấu trừ</small>
                </div>

                <div class="col-12 col-md-4">
                  <div class="text-xs text-emerald-700 font-bold">Doanh thu thực nhận</div>
                  <div class="fs-3 fw-extrabold text-emerald-600 font-mono mt-1">
                    {{ formatCurrency(simResult?.sellerNetReceived ?? simAmount) }}
                  </div>
                  <small class="text-xs text-emerald-600">Cộng trực tiếp vào Ví</small>
                </div>
              </div>

              <!-- Formula explanation text -->
              <div class="mt-3 pt-3 border-top border-slate-200 text-xs text-slate-600 d-flex align-items-center justify-content-between">
                <span>
                  <i class="bi bi-info-circle me-1 text-primary"></i>
                  Công thức: <strong>{{ formatCurrency(simAmount) }}</strong> - <strong>{{ formatCurrency(simResult?.commissionFee ?? 0) }}</strong> = <strong>{{ formatCurrency(simResult?.sellerNetReceived ?? simAmount) }}</strong>
                </span>
                <span class="badge bg-success-subtle text-success">Tính toán chuẩn xác</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 4. Active Rules Table ───────────────────────────────── -->
    <div class="seller-table-card">
      <div class="table-card-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h5 class="fw-bold text-slate-900 mb-0">Biểu Phí Sàn Hiện Hành Đang Áp Dụng</h5>
          <small class="text-slate-500">Danh sách các quy định chiết khấu hoa hồng đang có hiệu lực trên toàn sàn</small>
        </div>

        <div class="search-box">
          <i class="bi bi-search search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-sm ps-5"
            placeholder="Tìm theo tên quy định hoặc ngành hàng..."
          />
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light text-xs text-slate-600">
            <tr>
              <th>TÊN QUY ĐỊNH</th>
              <th>PHẠM VI ÁP DỤNG</th>
              <th class="text-center">TỶ LỆ PHÍ (%)</th>
              <th>ĐƠN TỐI THIỂU</th>
              <th>PHÍ TỐI ĐA (CAP)</th>
              <th>NGÀY ÁP DỤNG</th>
              <th class="text-center">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4 text-muted">
                <span class="spinner-border spinner-border-sm me-2"></span> Đang tải biểu phí sàn...
              </td>
            </tr>

            <tr v-else-if="filteredRules.length === 0">
              <td colspan="7" class="text-center py-4 text-muted">
                Không tìm thấy quy định phí nào phù hợp với tìm kiếm.
              </td>
            </tr>

            <tr v-for="rule in filteredRules" :key="rule.id">
              <td>
                <div class="fw-bold text-slate-800">{{ rule.name }}</div>
                <small class="text-xs text-slate-400 font-mono">Mã: #{{ rule.id }}</small>
              </td>

              <td>
                <span v-if="rule.categoryName" class="badge bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <i class="bi bi-tag-fill me-1"></i>{{ rule.categoryName }}
                </span>
                <span v-else class="badge bg-slate-100 text-slate-700 border border-slate-200">
                  <i class="bi bi-globe me-1"></i>Toàn sàn (Mặc định)
                </span>
              </td>

              <td class="text-center">
                <span class="badge bg-emerald-50 text-emerald-700 border border-emerald-200 fs-6 font-mono px-2.5 py-1">
                  {{ rule.percent }}%
                </span>
              </td>

              <td class="text-xs">
                <span v-if="rule.minOrderValue">{{ formatCurrency(rule.minOrderValue) }}</span>
                <span v-else class="text-muted">Không áp dụng</span>
              </td>

              <td class="text-xs">
                <span v-if="rule.maxCommission">{{ formatCurrency(rule.maxCommission) }}</span>
                <span v-else class="text-muted">Không giới hạn</span>
              </td>

              <td class="text-xs text-slate-600">
                {{ formatDate(rule.effectiveFrom) }}
              </td>

              <td class="text-center">
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  <i class="bi bi-check-circle-fill me-1"></i>Đang hiệu lực
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── 5. Platform Policy FAQs ─────────────────────────────── -->
    <div class="row g-4">
      <div class="col-12 col-lg-6">
        <div class="policy-card h-100">
          <h6 class="fw-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-question-circle-fill text-primary"></i>
            Câu Hỏi Thường Gặp Về Phí Sàn
          </h6>
          <div class="accordion accordion-flush" id="faqAccordion">
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed py-2.5 text-xs fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                  Khi nào sàn bắt đầu thu phí sàn từ đơn hàng?
                </button>
              </h2>
              <div id="faq1" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body text-xs text-slate-600 pt-1">
                  Phí sàn chỉ được trích trừ tự động khi đơn hàng được cập nhật trạng thái <strong>GIAO THÀNH CÔNG (COMPLETED)</strong>. Đơn hàng đang vận chuyển hoặc người mua chưa thanh toán sẽ không phát sinh phí.
                </div>
              </div>
            </div>

            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed py-2.5 text-xs fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                  Đơn hàng bị Hủy hoặc Trả hàng hoàn tiền thì sao?
                </button>
              </h2>
              <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body text-xs text-slate-600 pt-1">
                  Nếu đơn hàng bị hủy bởi người mua hoặc hoàn trả thành công theo chính sách đổi trả, NO MALL sẽ <strong>hoàn trả 100%</strong> phần phí sàn đã tạm thu (nếu có) về lại tài khoản của Người Bán.
                </div>
              </div>
            </div>

            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed py-2.5 text-xs fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                  Nếu sản phẩm có nhiều danh mục thì áp dụng phí nào?
                </button>
              </h2>
              <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body text-xs text-slate-600 pt-1">
                  Hệ thống sẽ ưu tiên áp dụng quy định riêng của Danh mục sản phẩm đó trước. Nếu ngành hàng chưa có quy định riêng, mức phí Toàn sàn (Mặc định 5%) sẽ được áp dụng.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="policy-card h-100 bg-slate-50 border-slate-200">
          <h6 class="fw-bold text-slate-900 mb-2 d-flex align-items-center gap-2">
            <i class="bi bi-headset text-danger"></i>
            Hỗ Trợ Đối Tác Người Bán
          </h6>
          <p class="text-xs text-slate-600 mb-3">
            Nếu bạn có thắc mắc hoặc cần khiếu nại về đối soát doanh thu, mức phí sàn hoặc chính sách ưu đãi cho nhà bán hàng xuất sắc:
          </p>
          <div class="space-y-2 text-xs">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-telephone-fill text-danger"></i>
              <span>Hotline Đối tác: <strong>1900 6868</strong> (Nhánh số 2)</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-envelope-fill text-primary"></i>
              <span>Email Đối soát: <strong>merchant-support@nomall.vn</strong></span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-clock-fill text-slate-500"></i>
              <span>Thời gian hỗ trợ: <strong>8:00 – 21:00 (Thứ 2 đến Thứ 7)</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sellerCommissionService } from '@/services/sellerCommission.service'
import { catalogService } from '@/services/catalog.service'

const loading = ref(true)
const rules = ref([])
const categories = ref([])
const searchQuery = ref('')

// Simulator state
const simCategoryId = ref(null)
const simAmount = ref(500000)
const simResult = ref(null)

const fetchRules = async () => {
  loading.value = true
  try {
    const res = await sellerCommissionService.list({ size: 100 })
    rules.value = res?.data?.content || res?.content || []
  } catch (err) {
    console.error('Failed to fetch commission rules:', err)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const data = await catalogService.getRootCategories()
    categories.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

const runSimulation = async () => {
  if (!simAmount.value || simAmount.value <= 0) {
    simResult.value = null
    return
  }
  try {
    const res = await sellerCommissionService.simulate(simCategoryId.value, simAmount.value)
    simResult.value = res?.data || res
  } catch (err) {
    console.warn('Simulation failed:', err)
  }
}

const filteredRules = computed(() => {
  if (!searchQuery.value.trim()) return rules.value
  const q = searchQuery.value.toLowerCase().trim()
  return rules.value.filter(r =>
    (r.name && r.name.toLowerCase().includes(q)) ||
    (r.categoryName && r.categoryName.toLowerCase().includes(q))
  )
})

const formatCurrency = (val) => {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(val) + ' ₫'
}

const formatDate = (val) => {
  if (!val) return 'Mặc định'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(val))
}

onMounted(async () => {
  await Promise.all([fetchRules(), fetchCategories()])
  runSimulation()
})
</script>

<style scoped>
.seller-fees-container {
  color: #1e293b;
}

/* ── Hero Banner (Slate Theme) ────────────────────────── */
.seller-hero-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.75rem 2rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.25);
}

.seller-hero-pill {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.seller-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #cbd5e1;
}

.seller-live-dot {
  width: 0.45rem;
  height: 0.45rem;
  background: #10b981;
  border-radius: 9999px;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.35);
}

.seller-hero-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.35rem;
}

.seller-hero-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 650px;
  margin-bottom: 0;
}

.seller-hero-btn {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.55rem 1rem;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.seller-hero-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Summary Stat Box ──────────────────────────────────── */
.seller-stat-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.stat-val {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.stat-sub {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

/* ── Simulator Card ────────────────────────────────────── */
.simulator-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.simulator-header {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.simulator-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.form-select-custom,
.form-control-custom {
  border-color: #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.875rem;
}

.sim-result-panel {
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

/* ── Table Card ────────────────────────────────────────── */
.seller-table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.table-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.search-box {
  position: relative;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
}

/* ── Policy FAQ Card ───────────────────────────────────── */
.policy-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
}

.btn-xs {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
}

.text-xxs {
  font-size: 0.65rem;
}
</style>
