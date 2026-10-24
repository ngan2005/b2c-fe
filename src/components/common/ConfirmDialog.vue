<template>
  <BaseModal :model-value="modelValue" :title="title" size="sm" @close="handleClose">
    <div class="text-center py-2">
      <div class="w-12 h-12 text-white rounded-full d-inline-flex align-items-center justify-content-center text-2xl mb-3" :class="iconBgClass">
        <i :class="icon"></i>
      </div>
      <p class="text-slate-600 text-sm mb-0">{{ message }}</p>
      <p v-if="error" class="text-coral text-sm mt-2 mb-0">{{ error }}</p>
    </div>
    <template #footer>
      <div class="d-flex gap-2 w-100 justify-content-end">
        <BaseButton variant="outline-secondary" size="sm" :disabled="loading" @click="handleClose">
          {{ cancelText }}
        </BaseButton>
        <BaseButton :variant="confirmVariant" size="sm" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Xác nhận' },
  message: { type: String, default: 'Bạn có chắc chắn muốn thực hiện?' },
  confirmText: { type: String, default: 'Xác nhận' },
  cancelText: { type: String, default: 'Hủy' },
  confirmVariant: { type: String, default: 'danger' },
  icon: { type: String, default: 'bi bi-exclamation-triangle-fill' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const iconBgClass = computed(() => {
  if (props.confirmVariant === 'danger') return 'bg-coral-dark'
  if (props.confirmVariant === 'warning') return 'bg-amber-400'
  return 'bg-mint'
})

function handleClose() {
  if (!props.loading) emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm')
}
</script>
