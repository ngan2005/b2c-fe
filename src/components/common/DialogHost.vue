<template>
  <BaseModal
    :model-value="state.open"
    :title="state.title || defaultTitle"
    size="sm"
    :close-on-overlay="false"
    @update:modelValue="onBackdrop"
  >
    <div class="d-flex align-items-start gap-3">
      <div :class="['dialog-icon', `dialog-icon--${state.variant}`]">
        <i :class="['bi', iconClass]"></i>
      </div>
      <div class="flex-grow-1">
        <p class="mb-0 text-sm text-slate-600" style="white-space: pre-line;">{{ state.message }}</p>
        <div v-if="state.type === 'prompt'" class="mt-3">
          <input
            v-model="state.inputValue"
            type="text"
            class="form-control"
            :placeholder="state.inputPlaceholder"
            @keyup.enter="onConfirm"
            autofocus
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button
        v-if="state.type !== 'alert'"
        class="btn btn-light rounded-xl"
        @click="onCancel"
      >
        {{ state.cancelText || 'Hủy' }}
      </button>
      <button
        :class="['btn rounded-xl d-inline-flex align-items-center gap-2', confirmBtnClass]"
        :disabled="isConfirmDisabled"
        @click="onConfirm"
      >
        <span v-if="state.countdownSeconds > 0" class="countdown-chip">
          {{ state.countdownSeconds }}
        </span>
        <span>{{ state.confirmText || 'Xác nhận' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useDialogs } from '@/composables/useDialogs'

const { state, close } = useDialogs()

const defaultTitle = computed(() => {
  if (state.type === 'alert') return 'Thông báo'
  if (state.type === 'prompt') return 'Nhập thông tin'
  return 'Xác nhận'
})

const iconClass = computed(() => {
  if (state.type === 'alert') return 'bi-info-circle-fill'
  if (state.variant === 'danger') return 'bi-exclamation-octagon-fill'
  if (state.variant === 'warning') return 'bi-exclamation-triangle-fill'
  if (state.variant === 'success') return 'bi-check-circle-fill'
  return 'bi-question-circle-fill'
})

const confirmBtnClass = computed(() => {
  switch (state.variant) {
    case 'danger':  return 'btn-danger'
    case 'warning': return 'btn-warning text-white'
    case 'success': return 'btn-success'
    case 'info':    return 'btn-info text-white'
    default:        return 'btn-primary'
  }
})

const isConfirmDisabled = computed(() => {
  if (state.type === 'prompt' && state.inputRequired && !state.inputValue.trim()) return true
  return state.countdownSeconds > 0
})

function onConfirm() {
  if (state.type === 'prompt' && state.inputRequired && !state.inputValue.trim()) return
  if (state.type === 'prompt') {
    close(state.inputValue)
  } else {
    close(true)
  }
}

function onCancel() {
  close(false)
}

function onBackdrop(val) {
  if (!val) onCancel()
}
</script>

<style scoped>
.dialog-icon {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.dialog-icon--primary  { background: rgba(13,110,253,0.12); color: #0d6efd; }
.dialog-icon--danger   { background: rgba(220,53,69,0.12);  color: #dc3545; }
.dialog-icon--warning  { background: rgba(255,193,7,0.18);  color: #b58800; }
.dialog-icon--success  { background: rgba(25,135,84,0.12);  color: #198754; }
.dialog-icon--info     { background: rgba(13,202,240,0.14); color: #0aa2c0; }

.countdown-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  color: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.btn:disabled .countdown-chip {
  background: rgba(255, 255, 255, 0.22);
}
</style>
