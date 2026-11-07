<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-full text-xs">
            LAB CONCURRENCY SIMULATOR
          </span>
          <span class="text-xs text-slate-400">Hệ Thống Thực Nghiệm Tải Đồng Thời & Chống Bán Lố</span>
        </div>
        <h1 class="font-extrabold text-slate-900 text-2xl mb-0">Phòng Thực Nghiệm Tồn Kho & Khóa Đồng Thời</h1>
      </div>
      <div class="d-flex align-items-center gap-2">
        <BaseButton variant="outline-primary" size="sm" :loading="testingRealtime" @click="testRealtime">
          <i class="bi bi-broadcast me-1"></i> Test Realtime Broadcast
        </BaseButton>
      </div>
    </div>

    <!-- ── Main Control Panel: Product Selector & Experiment Setup ── -->
    <div class="row g-4">
      <!-- Left: Real Product Selector & Live Stock Card -->
      <div class="col-lg-5">
        <BaseCard title="1. Chọn Sản Phẩm Thật Của Sàn Để Thử Nghiệm">
          <div class="space-y-3">
            <!-- Dropdown: Select real product variant -->
            <div>
              <label class="form-label text-xs font-bold text-slate-700 mb-1.5 d-flex justify-content-between">
                <span>Chọn sản phẩm trong kho</span>
                <span class="text-indigo-600 cursor-pointer" @click="loadRealProducts" title="Làm mới danh sách">
                  <i class="bi bi-arrow-clockwise"></i> Làm mới
                </span>
              </label>
              <select
                v-model="selectedVariantId"
                class="form-select form-select-sm text-sm"
                @change="onSelectProduct"
                :disabled="loadingProducts"
              >
                <option :value="null">-- Chọn sản phẩm thật --</option>
                <option v-for="p in realProducts" :key="p.variantId" :value="p.variantId">
                  {{ p.productName }} ({{ p.variantName || 'Mặc định' }}) [{{ p.sku }}] — Kho: {{ p.availableStock }} sp
                </option>
              </select>
            </div>

            <!-- Selected Product Visual Showcase Card -->
            <div v-if="selectedProduct" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div class="d-flex align-items-center gap-3">
                <img
                  v-if="selectedProduct.imageUrl"
                  :src="selectedProduct.imageUrl"
                  alt=""
                  class="rounded-xl border border-slate-200"
                  style="width: 56px; height: 56px; object-fit: cover;"
                  @error="onImgError"
                />
                <div v-else class="bg-slate-200 rounded-xl d-flex align-items-center justify-content-center text-slate-400" style="width: 56px; height: 56px;">
                  <i class="bi bi-image text-xl"></i>
                </div>
                <div class="overflow-hidden">
                  <div class="font-bold text-slate-800 text-sm line-clamp-1" :title="selectedProduct.productName">
                    {{ selectedProduct.productName }}
                  </div>
                  <div class="text-xs text-slate-500 d-flex align-items-center gap-2 mt-0.5">
                    <span class="badge bg-slate-200 text-slate-700 font-mono">{{ selectedProduct.sku }}</span>
                    <span>{{ selectedProduct.shopName }}</span>
                  </div>
                  <div class="text-xs font-bold text-indigo-600 mt-1 font-mono">
                    {{ formatVnd(selectedProduct.price) }}
                  </div>
                </div>
              </div>

              <!-- 3 Live Numbers: On-hand, Reserved, Available -->
              <div class="grid grid-cols-3 gap-2 text-center pt-2 border-top border-slate-200/80">
                <div class="p-2 bg-white rounded-xl border border-slate-100">
                  <span class="text-2xs font-bold text-slate-400 uppercase d-block">Tồn thực tế</span>
                  <strong class="text-base font-black text-slate-800 font-mono">{{ selectedProduct.stockQuantity }}</strong>
                </div>
                <div class="p-2 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span class="text-2xs font-bold text-amber-700 uppercase d-block">Đang giữ chỗ</span>
                  <strong class="text-base font-black text-amber-600 font-mono">{{ selectedProduct.reservedQuantity }}</strong>
                </div>
                <div class="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span class="text-2xs font-bold text-indigo-700 uppercase d-block">Khả dụng bán</span>
                  <strong class="text-base font-black text-indigo-600 font-mono">{{ selectedProduct.availableStock }}</strong>
                </div>
              </div>
            </div>

            <!-- Manual ID Fallback Input -->
            <div class="pt-2 border-top border-slate-100 d-flex align-items-center gap-2">
              <span class="text-xs text-slate-400">Hoặc nhập ID thủ công:</span>
              <input
                v-model.number="testForm.variantId"
                type="number"
                class="form-control form-control-sm text-center font-mono w-24"
                @change="onManualVariantChange"
              />
              <BaseButton variant="outline-secondary" size="sm" :loading="checkingStock" @click="checkStock">
                Tra cứu
              </BaseButton>
            </div>

            <!-- Quick Preset: Reset Stock to 5 -->
            <div class="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-2 mt-2">
              <div class="d-flex align-items-center justify-content-between">
                <span class="text-xs font-bold text-amber-900 d-flex align-items-center gap-1.5">
                  <i class="bi bi-magic text-amber-600"></i> Cài Đặt Nhanh Kho = 5 Cho Thử Nghiệm
                </span>
                <span class="badge bg-amber-200 text-amber-900 text-2xs">Recommended</span>
              </div>
              <p class="text-xs text-amber-800 mb-2 leading-relaxed">
                Đặt số lượng khả dụng ban đầu chính xác là <strong>5 sản phẩm</strong> và giải phóng toàn bộ giữ chỗ cũ.
              </p>
              <BaseButton
                variant="warning"
                size="sm"
                class="w-100 font-bold"
                :loading="resettingStock"
                @click="resetStockTo(5)"
              >
                <i class="bi bi-lightning-fill me-1"></i> Thiết lập kho = 5 (Sẵn sàng test 100 requests)
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Right: Experiment Configuration & Execution -->
      <div class="col-lg-7">
        <BaseCard title="2. Cấu Hình Kịch Bản Khóa & Bắn 100 Requests Đồng Thời">
          <div class="space-y-4">
            <!-- Scenario Selector -->
            <div>
              <label class="form-label text-xs font-bold text-slate-700 mb-1.5">
                Kịch bản chiến lược khóa (Locking Scenario)
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <!-- E2: Pessimistic -->
                <div
                  class="scenario-card"
                  :class="{ active: testForm.scenario === 'PESSIMISTIC_WRITE' }"
                  @click="testForm.scenario = 'PESSIMISTIC_WRITE'"
                >
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge bg-emerald-100 text-emerald-800 font-bold">E2 • PESSIMISTIC</span>
                    <i v-if="testForm.scenario === 'PESSIMISTIC_WRITE'" class="bi bi-check-circle-fill text-emerald-600"></i>
                  </div>
                  <div class="font-bold text-xs text-slate-900">Pessimistic Write Lock (SELECT FOR UPDATE)</div>
                  <div class="text-2xs text-slate-500 mt-1">Khóa cấp dòng trực tiếp trong Database. Đảm bảo Oversell = 0 tuyệt đối.</div>
                </div>

                <!-- E1: Optimistic -->
                <div
                  class="scenario-card"
                  :class="{ active: testForm.scenario === 'OPTIMISTIC' }"
                  @click="testForm.scenario = 'OPTIMISTIC'"
                >
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge bg-amber-100 text-amber-800 font-bold">E1 • OPTIMISTIC</span>
                    <i v-if="testForm.scenario === 'OPTIMISTIC'" class="bi bi-check-circle-fill text-amber-600"></i>
                  </div>
                  <div class="font-bold text-xs text-slate-900">Optimistic Locking (@Version)</div>
                  <div class="text-2xs text-slate-500 mt-1">Sử dụng cột version. Các request tranh chấp sẽ văng ngoại lệ xung đột.</div>
                </div>

                <!-- E3: Optimistic + Retry -->
                <div
                  class="scenario-card"
                  :class="{ active: testForm.scenario === 'E3' }"
                  @click="testForm.scenario = 'E3'"
                >
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge bg-sky-100 text-sky-800 font-bold">E3 • RETRY</span>
                    <i v-if="testForm.scenario === 'E3'" class="bi bi-check-circle-fill text-sky-600"></i>
                  </div>
                  <div class="font-bold text-xs text-slate-900">Optimistic Locking + Auto Retry</div>
                  <div class="text-2xs text-slate-500 mt-1">Thử lại tối đa 3 lần với backoff khi gặp xung đột version.</div>
                </div>

                <!-- E0: No Lock -->
                <div
                  class="scenario-card"
                  :class="{ active: testForm.scenario === 'NONE' }"
                  @click="testForm.scenario = 'NONE'"
                >
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge bg-rose-100 text-rose-800 font-bold">E0 • NO LOCK</span>
                    <i v-if="testForm.scenario === 'NONE'" class="bi bi-check-circle-fill text-rose-600"></i>
                  </div>
                  <div class="font-bold text-xs text-slate-900">No Lock (Gây Lỗi Bán Lố)</div>
                  <div class="text-2xs text-slate-500 mt-1">Không dùng khóa. Dễ xuất hiện hiện tượng Race Condition bán âm kho.</div>
                </div>
              </div>
            </div>

            <!-- Parameters Grid -->
            <div class="row g-3">
              <div class="col-6">
                <BaseInput
                  v-model.number="testForm.concurrency"
                  type="number"
                  label="Số Worker Concurrency"
                  hint="Giới hạn tối đa 10 workers an toàn"
                />
              </div>
              <div class="col-6">
                <BaseInput
                  v-model.number="testForm.perThread"
                  type="number"
                  label="Lượt thử / Worker"
                  hint="Tổng = Concurrency × Lượt"
                />
              </div>
            </div>

            <!-- Total Requests Badge -->
            <div class="p-3 bg-slate-900 text-white rounded-2xl d-flex align-items-center justify-content-between">
              <div>
                <span class="text-2xs uppercase tracking-wider text-slate-400 font-bold d-block">Quy mô thử nghiệm</span>
                <span class="text-base font-extrabold text-amber-400">
                  {{ testForm.concurrency * testForm.perThread }} Requests bắn đồng thời
                </span>
                <span class="text-xs text-slate-400 ms-2">vào SKU #{{ testForm.variantId }}</span>
              </div>
              <div class="text-end">
                <span class="text-2xs uppercase tracking-wider text-slate-400 font-bold d-block">Mục tiêu</span>
                <span class="text-xs font-semibold text-emerald-400">Chỉ 5 req thành công, Oversell = 0</span>
              </div>
            </div>

            <!-- Big Run Button -->
            <BaseButton
              variant="danger"
              size="lg"
              class="w-100 font-black py-3 shadow-lg hover:shadow-xl transition-all"
              :loading="runningTest"
              @click="runExperiment"
            >
              <i class="bi bi-rocket-takeoff-fill me-2"></i>
              BẮN {{ testForm.concurrency * testForm.perThread }} REQUESTS & XEM MA TRẬN KẾT QUẢ
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- ── Test Results History Table ───────────────────────────── -->
    <BaseCard title="3. Lịch Sử Các Phiên Thực Nghiệm Tải (Load Test Audit)">
      <BaseTable :loading="loadingResults" :empty="testResults.length === 0" empty-message="Chưa có thử nghiệm nào được ghi nhận">
        <template #header>
          <th>#</th>
          <th>Kịch bản</th>
          <th>Variant</th>
          <th>Tồn đầu → cuối</th>
          <th>Attempts</th>
          <th>✓ Success</th>
          <th>✗ Fail</th>
          <th>Oversell</th>
          <th>Conflict</th>
          <th>p50 / p95 / p99 (ms)</th>
          <th>Throughput</th>
          <th>Thời gian</th>
        </template>
        <template #body>
          <tr v-for="res in testResults" :key="res.id">
            <td class="font-bold">#{{ res.id }}</td>
            <td>
              <BaseBadge :variant="scenarioBadgeVariant(res.scenario)">{{ res.scenario }}</BaseBadge>
            </td>
            <td>{{ res.variantId }}</td>
            <td>
              <span class="text-muted">{{ res.initialStock }}</span>
              <i class="bi bi-arrow-right mx-1 text-slate-400"></i>
              <span class="font-bold" :class="res.finalStock < 0 || res.oversellCount > 0 ? 'text-rose-600' : 'text-blue-600'">
                {{ res.finalStock }}
              </span>
            </td>
            <td>{{ res.totalAttempts }}</td>
            <td class="text-emerald-600 font-semibold">{{ res.successfulOrders }}</td>
            <td class="text-rose-600 font-semibold">{{ res.failedOrders }}</td>
            <td>
              <span v-if="res.oversellCount > 0" class="badge bg-rose-600 text-white">⚠ {{ res.oversellCount }}</span>
              <span v-else class="badge bg-emerald-100 text-emerald-800">0</span>
            </td>
            <td>{{ res.conflictCount }}</td>
            <td class="text-xs">
              {{ res.p50LatencyMs }} / <strong>{{ res.p95LatencyMs }}</strong> / {{ res.p99LatencyMs }}
            </td>
            <td><strong>{{ res.throughputRps }}</strong> rps</td>
            <td class="text-xs text-muted">{{ formatDate(res.startedAt) }}</td>
          </tr>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <!-- ── POPUP MODAL: MA TRẬN TRỰC QUAN & LOGIC CHI TIẾT KẾT QUẢ THỰC NGHIỆM ── -->
    <!-- ═════════════════════════════════════════════════════════════════════ -->
    <div v-if="showResultModal" class="modal-backdrop-custom" @click.self="showResultModal = false">
      <div class="modal-dialog-custom max-w-4xl">
        <div class="modal-content-custom">
          <!-- Modal Header -->
          <div class="d-flex align-items-center justify-content-between p-4 border-bottom border-slate-100 bg-slate-900 text-white rounded-t-2xl">
            <div class="d-flex align-items-center gap-3">
              <div class="modal-icon-wrap bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <i class="bi bi-clipboard2-pulse-fill text-2xl"></i>
              </div>
              <div>
                <span class="text-2xs font-bold text-emerald-400 uppercase tracking-widest d-block">
                  KẾT QUẢ THỰC NGHIỆM ĐỒNG THỜI
                </span>
                <h3 class="text-xl font-extrabold mb-0 text-white">
                  Kịch Bản: {{ latestExecution?.result?.scenario }} — {{ latestExecution?.result?.totalAttempts }} Requests
                </h3>
              </div>
            </div>
            <button class="btn btn-sm text-slate-400 hover:text-white" @click="showResultModal = false">
              <i class="bi bi-x-lg text-lg"></i>
            </button>
          </div>

          <div class="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <!-- ── Top Trophy Card: Winners ────────────────────────── -->
            <div class="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 rounded-2xl border border-emerald-200">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <span class="font-extrabold text-emerald-900 text-sm d-flex align-items-center gap-2">
                  <i class="bi bi-trophy-fill text-amber-500 text-lg"></i>
                  Danh Sách {{ latestExecution?.successfulRequestIds?.length || 0 }} Requests May Mắn Giành Mua Thành Công:
                </span>
                <span class="badge bg-emerald-600 text-white font-mono px-2.5 py-1">
                  Đúng bằng tồn kho ban đầu = {{ latestExecution?.result?.initialStock }}
                </span>
              </div>
              <!-- Winner Request Badges -->
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span
                  v-for="reqId in latestExecution?.successfulRequestIds"
                  :key="reqId"
                  class="winner-badge"
                >
                  🎉 Request #{{ reqId }}
                </span>
              </div>
            </div>

            <!-- ── 4 KPI Stat Counters ─────────────────────────────── -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-2xs font-bold text-slate-400 uppercase d-block">Kho ban đầu → Cuối</span>
                <span class="text-lg font-black text-slate-800 font-mono">
                  {{ latestExecution?.result?.initialStock }} → {{ latestExecution?.result?.finalStock }}
                </span>
              </div>
              <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span class="text-2xs font-bold text-emerald-700 uppercase d-block">Thành công (✓)</span>
                <span class="text-lg font-black text-emerald-600 font-mono">
                  {{ latestExecution?.result?.successfulOrders }} đơn
                </span>
              </div>
              <div class="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span class="text-2xs font-bold text-rose-700 uppercase d-block">Bị từ chối (✗)</span>
                <span class="text-lg font-black text-rose-600 font-mono">
                  {{ latestExecution?.result?.failedOrders }} đơn
                </span>
              </div>
              <div class="p-3 rounded-xl border" :class="latestExecution?.result?.oversellCount > 0 ? 'bg-rose-100 border-rose-300' : 'bg-emerald-100 border-emerald-300'">
                <span class="text-2xs font-bold uppercase d-block" :class="latestExecution?.result?.oversellCount > 0 ? 'text-rose-800' : 'text-emerald-800'">
                  Bán lố (Oversell)
                </span>
                <span class="text-lg font-black font-mono" :class="latestExecution?.result?.oversellCount > 0 ? 'text-rose-700' : 'text-emerald-700'">
                  {{ latestExecution?.result?.oversellCount || 0 }} (An toàn 100%)
                </span>
              </div>
            </div>

            <!-- ── Visual Matrix Grid: 100 Squares ────────────────── -->
            <div class="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
              <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <h4 class="text-sm font-extrabold text-white mb-0 d-flex align-items-center gap-2">
                    <i class="bi bi-grid-3x3-gap-fill text-indigo-400"></i>
                    Bản Đồ Ma Trận 100 Requests Tranh Chấp Đồng Thời
                  </h4>
                  <span class="text-2xs text-slate-400">Rê chuột hoặc bấm vào ô bất kỳ để soi chi tiết Request</span>
                </div>
                <!-- Legend -->
                <div class="d-flex align-items-center gap-3 text-xs">
                  <span class="d-flex align-items-center gap-1.5">
                    <span class="legend-dot bg-emerald-500"></span> Thành công
                  </span>
                  <span class="d-flex align-items-center gap-1.5">
                    <span class="legend-dot bg-rose-500"></span> Hết hàng (0 SP)
                  </span>
                  <span class="d-flex align-items-center gap-1.5">
                    <span class="legend-dot bg-amber-500"></span> Xung đột Lock
                  </span>
                </div>
              </div>

              <!-- 10x10 Grid -->
              <div class="matrix-grid">
                <div
                  v-for="att in latestExecution?.attempts"
                  :key="att.attemptIndex"
                  class="matrix-cell"
                  :class="{
                    'cell-success': att.isSuccess,
                    'cell-out-of-stock': att.status === 'OUT_OF_STOCK',
                    'cell-conflict': att.status === 'CONFLICT',
                    'cell-active': hoveredAttempt?.attemptIndex === att.attemptIndex
                  }"
                  @mouseenter="hoveredAttempt = att"
                  @click="hoveredAttempt = att"
                  :title="`Request #${att.attemptIndex}: ${att.status} (${att.latencyMs}ms)`"
                >
                  <span class="cell-num">{{ att.attemptIndex }}</span>
                </div>
              </div>

              <!-- Active Inspector Box for hovered attempt -->
              <div class="mt-3 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 d-flex align-items-center justify-content-between text-xs">
                <div v-if="hoveredAttempt" class="d-flex align-items-center gap-3">
                  <span class="font-bold text-amber-400 font-mono">
                    <i class="bi bi-cursor-fill me-1"></i> Request #{{ hoveredAttempt.attemptIndex }}
                  </span>
                  <span class="badge" :class="hoveredAttempt.isSuccess ? 'bg-emerald-500' : 'bg-rose-500'">
                    {{ hoveredAttempt.status }}
                  </span>
                  <span class="text-slate-300">{{ hoveredAttempt.message }}</span>
                </div>
                <div v-else class="text-slate-400 italic">
                  <i class="bi bi-info-circle me-1"></i> Rê chuột lên một ô trong ma trận trên để xem chi tiết
                </div>
                <div v-if="hoveredAttempt" class="text-slate-400 font-mono">
                  Độ trễ: <strong class="text-white">{{ hoveredAttempt.latencyMs }} ms</strong>
                </div>
              </div>
            </div>

            <!-- ── Audit Log Table with Filters ────────────────────── -->
            <div class="space-y-2">
              <div class="d-flex align-items-center justify-content-between">
                <span class="text-xs font-bold text-slate-700 uppercase">
                  Chi Tiết Từng Request (Audit Trail):
                </span>
                <!-- Filter Tabs -->
                <div class="d-flex gap-1">
                  <button
                    class="btn btn-xs px-2.5 py-1 rounded-full font-semibold"
                    :class="activeFilterTab === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="activeFilterTab = 'ALL'"
                  >
                    Tất cả ({{ latestExecution?.attempts?.length || 0 }})
                  </button>
                  <button
                    class="btn btn-xs px-2.5 py-1 rounded-full font-semibold"
                    :class="activeFilterTab === 'SUCCESS' ? 'btn-success' : 'btn-outline-secondary'"
                    @click="activeFilterTab = 'SUCCESS'"
                  >
                    Chỉ trúng đơn ({{ latestExecution?.successfulRequestIds?.length || 0 }})
                  </button>
                  <button
                    class="btn btn-xs px-2.5 py-1 rounded-full font-semibold"
                    :class="activeFilterTab === 'FAILED' ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="activeFilterTab = 'FAILED'"
                  >
                    Bị từ chối ({{ (latestExecution?.attempts?.length || 0) - (latestExecution?.successfulRequestIds?.length || 0) }})
                  </button>
                </div>
              </div>

              <div class="table-responsive border border-slate-200 rounded-xl overflow-hidden max-h-56">
                <table class="table table-sm align-middle text-xs mb-0">
                  <thead class="bg-slate-50 text-slate-500 font-semibold sticky-top">
                    <tr>
                      <th class="py-2 px-3" style="width: 100px;">REQUEST #</th>
                      <th class="py-2 px-3" style="width: 120px;">TRẠNG THÁI</th>
                      <th class="py-2 px-3 text-end" style="width: 100px;">ĐỘ TRỄ</th>
                      <th class="py-2 px-3">KẾT QUẢ XỬ LÝ DATABASE</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="att in filteredAttempts"
                      :key="att.attemptIndex"
                      :class="{ 'bg-emerald-50/50': att.isSuccess }"
                    >
                      <td class="py-2 px-3 font-mono font-bold" :class="att.isSuccess ? 'text-emerald-700' : 'text-slate-700'">
                        Request #{{ att.attemptIndex }}
                      </td>
                      <td class="py-2 px-3">
                        <span
                          class="badge px-2 py-0.5 rounded-full"
                          :class="att.isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                        >
                          {{ att.status }}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-end font-mono">
                        {{ att.latencyMs }} ms
                      </td>
                      <td class="py-2 px-3 text-slate-700">
                        {{ att.message }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-3 border-top border-slate-100 bg-slate-50 rounded-b-2xl d-flex justify-content-end gap-2">
            <BaseButton variant="primary" size="sm" @click="showResultModal = false">
              Đóng & Xem Lịch Sử
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/composables/useApi'
import { useNotifyStore } from '@/stores/notify'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const notify = useNotifyStore()

// Real products selection
const realProducts = ref([])
const loadingProducts = ref(false)
const selectedVariantId = ref(null)
const selectedProduct = ref(null)

const checkingStock = ref(false)
const resettingStock = ref(false)
const runningTest = ref(false)
const testingRealtime = ref(false)
const loadingResults = ref(true)
const testResults = ref([])

// Interactive Result Modal state
const showResultModal = ref(false)
const latestExecution = ref(null)
const hoveredAttempt = ref(null)
const activeFilterTab = ref('ALL') // 'ALL' | 'SUCCESS' | 'FAILED'

const testForm = reactive({
  scenario: 'PESSIMISTIC_WRITE',
  variantId: 1,
  concurrency: 20,
  perThread: 5,
})

const filteredAttempts = computed(() => {
  if (!latestExecution.value?.attempts) return []
  if (activeFilterTab.value === 'SUCCESS') {
    return latestExecution.value.attempts.filter(a => a.isSuccess)
  }
  if (activeFilterTab.value === 'FAILED') {
    return latestExecution.value.attempts.filter(a => !a.isSuccess)
  }
  return latestExecution.value.attempts
})

async function loadRealProducts() {
  loadingProducts.value = true
  try {
    const res = await apiClient.get('/inventory/real-products')
    const list = res.data || res || []
    realProducts.value = Array.isArray(list) ? list : []
    if (realProducts.value.length > 0 && !selectedVariantId.value) {
      // Pick first real product by default
      selectedVariantId.value = realProducts.value[0].variantId
      onSelectProduct()
    }
  } catch (err) {
    console.error('Failed to load real products:', err)
  } finally {
    loadingProducts.value = false
  }
}

function onSelectProduct() {
  const p = realProducts.value.find(item => item.variantId === selectedVariantId.value)
  if (p) {
    selectedProduct.value = p
    testForm.variantId = p.variantId
  }
}

function onManualVariantChange() {
  selectedVariantId.value = null
  selectedProduct.value = null
  checkStock()
}

async function checkStock() {
  if (!testForm.variantId) return
  checkingStock.value = true
  try {
    const stock = await apiClient.get(`/inventory/variants/${testForm.variantId}/stock`)
    if (selectedProduct.value) {
      selectedProduct.value.availableStock = stock.data ?? stock
    }
    notify.push(`Tồn kho khả dụng Variant #${testForm.variantId} hiện là: ${stock.data ?? stock} sp`, 'info')
  } catch (err) {
    notify.push('Không tìm thấy thông tin tồn kho cho variant này.', 'danger')
  } finally {
    checkingStock.value = false
  }
}

async function resetStockTo(qty = 5) {
  if (!testForm.variantId) {
    notify.push('Vui lòng chọn sản phẩm cần thử nghiệm trước!', 'warning')
    return
  }
  resettingStock.value = true
  try {
    await apiClient.put(`/inventory/variants/${testForm.variantId}/reset-stock`, null, {
      params: { stockQuantity: qty },
    })
    if (selectedProduct.value) {
      selectedProduct.value.stockQuantity = qty
      selectedProduct.value.reservedQuantity = 0
      selectedProduct.value.availableStock = qty
    }
    notify.push(`Đã cài đặt tồn kho Variant #${testForm.variantId} = ${qty} thành công! (Sẵn sàng test)`, 'success')
  } catch (err) {
    notify.push('Không thể cài lại tồn kho. Vui lòng thử lại.', 'danger')
  } finally {
    resettingStock.value = false
  }
}

async function runExperiment() {
  if (!testForm.variantId) {
    notify.push('Vui lòng chọn sản phẩm thử nghiệm!', 'warning')
    return
  }
  runningTest.value = true
  try {
    const res = await apiClient.post('/inventory/load-test/run', null, {
      params: testForm,
    })
    const payload = res?.data ?? res
    latestExecution.value = payload

    // Set first attempt as initial inspector
    if (payload.attempts && payload.attempts.length > 0) {
      hoveredAttempt.value = payload.attempts[0]
    }

    // Refresh selected product numbers
    if (selectedProduct.value) {
      selectedProduct.value.stockQuantity = payload.result?.finalStock ?? 0
      selectedProduct.value.availableStock = payload.result?.finalStock ?? 0
      selectedProduct.value.reservedQuantity = payload.result?.successfulOrders ?? 0
    }

    // Open Visual Result Modal
    showResultModal.value = true

    if (payload.result?.oversellCount > 0) {
      notify.push(
        `⚠ Phát hiện Bán Lố (Oversell)! Đã bán vượt ${payload.result.oversellCount} sản phẩm!`,
        'warning',
        8000,
      )
    } else {
      notify.push(
        `Thực nghiệm hoàn tất! Đúng ${payload.result?.successfulOrders ?? 0} request thành công, 0 oversell.`,
        'success',
      )
    }
    await fetchResults()
  } catch (err) {
    notify.push('Lỗi trong quá trình chạy thực nghiệm tải.', 'danger')
  } finally {
    runningTest.value = false
  }
}

async function fetchResults() {
  loadingResults.value = true
  try {
    const res = await apiClient.get('/inventory/load-test/results')
    const data = res.data ?? res
    testResults.value = Array.isArray(data) ? data.slice().reverse() : []
  } catch (_) {} finally {
    loadingResults.value = false
  }
}

async function testRealtime() {
  testingRealtime.value = true
  try {
    const res = await apiClient.post('/admin/realtime/test-broadcast')
    const data = res?.data ?? res
    notify.push(
      `Đã broadcast ${data?.topics?.length ?? 0} events. Kiểm tra chuông 🔔!`,
      'info',
      5000,
    )
  } catch (err) {
    notify.push('Không thể broadcast test event — kiểm tra log server.', 'danger')
  } finally {
    testingRealtime.value = false
  }
}

function formatVnd(val) {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(val) + ' ₫'
}

function scenarioBadgeVariant(s) {
  switch (s) {
    case 'E0': return 'danger'
    case 'E1': return 'warning'
    case 'E2': return 'success'
    case 'E3': return 'info'
    default: return 'secondary'
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(d))
}

const placeholderSvg =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48cGF0aCBkPSJNMjUgNzAgTDQ1IDQ1IEw2MCA2MCBMNzAgNTAgTDgwIDcwIFoiIGZpbGw9IiNjYmQ1ZTEiLz48Y2lyY2xlIGN4PSIzOCIgY3k9IjM1IiByPSI3IiBmaWxsPSIjOTRhM2I4Ii8+PC9zdmc+'

function onImgError(e) {
  if (!e || !e.target) return
  e.target.onerror = null
  e.target.src = placeholderSvg
}

onMounted(() => {
  loadRealProducts()
  fetchResults()
})
</script>

<style scoped>
.scenario-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scenario-card:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.scenario-card.active {
  border-color: #4f46e5;
  background: #f5f3ff;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

/* Modal styles */
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-dialog-custom {
  width: 100%;
}

.modal-content-custom {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.modal-icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.winner-badge {
  background: #059669;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
  font-family: monospace;
}

/* Visual Matrix 10x10 Grid */
.matrix-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 6px;
  padding: 4px 0;
}

.matrix-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #334155;
  color: #94a3b8;
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 700;
}

.matrix-cell:hover {
  transform: scale(1.15);
  z-index: 10;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
}

.cell-success {
  background: #10b981 !important;
  color: #ffffff !important;
  border-color: #34d399 !important;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.cell-out-of-stock {
  background: #f43f5e !important;
  color: #ffffff !important;
  border-color: #fb7185 !important;
  opacity: 0.85;
}

.cell-conflict {
  background: #f59e0b !important;
  color: #ffffff !important;
  border-color: #fbbf24 !important;
}

.cell-active {
  ring: 3px solid #ffffff;
  outline: 2px solid #ffffff;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.btn-xs {
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
}
</style>
