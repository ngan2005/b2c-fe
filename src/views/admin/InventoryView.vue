<template>
  <div class="space-y-6">
    <div class="d-flex align-items-center justify-content-between">
      <div>
        <h1 class="font-extrabold text-slate-900 text-2xl">Quản Lý Tồn Kho & Load-Test Đồng Thời</h1>
        <p class="text-xs text-slate-500 mb-0">Công cụ kiểm thử tải concurrency locking tồn kho cho Admin</p>
      </div>
      <BaseButton variant="outline-primary" size="sm" :loading="testingRealtime" @click="testRealtime">
        <i class="bi bi-broadcast me-1"></i> Test Realtime Broadcast
      </BaseButton>
    </div>

    <!-- Check Stock Form -->
    <div class="row g-6">
      <div class="col-lg-5">
        <BaseCard title="Tra Cứu Tồn Kho Theo Variant ID">
          <div class="space-y-3">
            <BaseInput v-model.number="variantIdInput" type="number" label="Nhập Variant ID" placeholder="1" required />
            <BaseButton variant="primary" size="sm" class="w-100" :loading="checkingStock" @click="checkStock">
              Kiểm tra tồn kho
            </BaseButton>

            <div v-if="stockResult !== null" class="p-4 bg-blue-50 text-blue-900 rounded-2xl border border-blue-200 text-center mt-3">
              <span class="text-xs text-slate-500 d-block mb-1">Số lượng tồn kho sẵn có</span>
              <strong class="text-3xl font-extrabold text-blue-600">{{ stockResult }}</strong>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Concurrency Test Experiment Form -->
      <div class="col-lg-7">
        <BaseCard title="Chạy Thử Nghiệm Tải Đồng Thời (Concurrency Load Test)">
          <div class="space-y-3">
            <div class="row g-3">
              <div class="col-md-6">
                <BaseSelect
                  v-model="testForm.scenario"
                  label="Kịch bản khóa (Locking Scenario)"
                  :options="[
                    { value: 'PESSIMISTIC_WRITE', label: 'E2 — Pessimistic Write Lock' },
                    { value: 'OPTIMISTIC', label: 'E1 — Optimistic Locking' },
                    { value: 'E3', label: 'E3 — Optimistic + Retry' },
                    { value: 'NONE', label: 'E0 — No Locking (Race Condition)' }
                  ]"
                  required
                />
              </div>
              <div class="col-md-6">
                <BaseInput v-model.number="testForm.variantId" type="number" label="Variant ID thử nghiệm" required />
              </div>
              <div class="col-md-6">
                <BaseInput v-model.number="testForm.concurrency" type="number" label="Số thread đồng thời (Concurrency)" />
              </div>
              <div class="col-md-6">
                <BaseInput v-model.number="testForm.perThread" type="number" label="Số lần trừ / thread" />
              </div>
            </div>

            <BaseButton variant="danger" size="md" class="w-100 mt-2" :loading="runningTest" @click="runExperiment">
              <i class="bi bi-lightning-charge me-1"></i> Chạy Thực Nghiệm Tải
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Test Results History Table -->
    <BaseCard title="Lịch Sử Kết Quả Kiểm Thử Tải (Load Test Results)">
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
          <th>Started</th>
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
              <span v-else class="text-muted">0</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import apiClient from '@/composables/useApi'
import { useNotifyStore } from '@/stores/notify'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const notify = useNotifyStore()

const variantIdInput = ref(1)
const stockResult = ref(null)
const checkingStock = ref(false)

const runningTest = ref(false)
const testForm = reactive({
  scenario: 'PESSIMISTIC_WRITE',
  variantId: 1,
  concurrency: 20,
  perThread: 5,
})

const testingRealtime = ref(false)
const loadingResults = ref(true)
const testResults = ref([])

const checkStock = async () => {
  if (!variantIdInput.value) return
  checkingStock.value = true
  try {
    const stock = await apiClient.get(`/inventory/variants/${variantIdInput.value}/stock`)
    stockResult.value = stock
  } catch (err) {
    notify.push('Không tìm thấy thông tin tồn kho cho variant này.', 'danger')
  } finally {
    checkingStock.value = false
  }
}

const runExperiment = async () => {
  runningTest.value = true
  try {
    const res = await apiClient.post('/inventory/load-test/run', null, {
      params: testForm,
    })
    const data = res?.data ?? res
    if (data?.oversellCount > 0) {
      notify.push(
        `⚠ Oversell detected! ${data.oversellCount} units oversold (scenario=${data.scenario})`,
        'warning',
        8000,
      )
    } else {
      notify.push(
        `Thực nghiệm tải hoàn tất! ${data?.successfulOrders ?? 0}✓ / ${data?.failedOrders ?? 0}✗ (${data?.scenario})`,
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

const testRealtime = async () => {
  testingRealtime.value = true
  try {
    const res = await apiClient.post('/admin/realtime/test-broadcast')
    const data = res?.data ?? res
    notify.push(
      `Đã broadcast ${data?.topics?.length ?? 0} events (nonce=${data?.nonce}). Kiểm tra chuông 🔔 + dropdown!`,
      'info',
      6000,
    )
  } catch (err) {
    notify.push('Không thể broadcast test event — kiểm tra log server.', 'danger')
  } finally {
    testingRealtime.value = false
  }
}

const fetchResults = async () => {
  loadingResults.value = true
  try {
    const data = await apiClient.get('/inventory/load-test/results')
    testResults.value = Array.isArray(data) ? data : []
  } catch (_) {} finally {
    loadingResults.value = false
  }
}

const scenarioBadgeVariant = (s) => {
  switch (s) {
    case 'E0': return 'danger'
    case 'E1': return 'warning'
    case 'E2': return 'success'
    case 'E3': return 'info'
    default: return 'secondary'
  }
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(d))
}

onMounted(fetchResults)
</script>
