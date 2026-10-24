<template>
  <button
    :type="type"
    :class="[
      'btn d-inline-flex align-items-center justify-content-center gap-2 transition-all font-medium rounded-lg',
      variantClass,
      sizeClass,
      { 'disabled opacity-75 cursor-not-allowed': disabled || loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
    <i v-if="icon && !loading" :class="icon"></i>
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' }, // primary, secondary, outline-primary, outline-secondary, danger, success, ghost
  size: { type: String, default: 'md' }, // sm, md, lg
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: '' },
})

defineEmits(['click'])

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary': return 'btn-primary text-white shadow-sm'
    case 'secondary': return 'btn-secondary text-white shadow-sm'
    case 'outline-primary': return 'btn-outline-primary'
    case 'outline-secondary': return 'btn-outline-secondary'
    case 'success': return 'btn-success text-white shadow-sm'
    case 'danger': return 'btn-danger text-white shadow-sm'
    case 'ghost': return 'btn-light border-0 text-slate-700 bg-slate-100 hover:bg-slate-200'
    default: return 'btn-primary'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'btn-sm py-1.5 px-3 text-xs'
    case 'lg': return 'btn-lg py-2.5 px-5 text-base'
    default: return 'py-2 px-4 text-sm'
  }
})
</script>
