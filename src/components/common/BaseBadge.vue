<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      variantClasses
    ]"
  >
    <span v-if="dot" class="w-1.5 h-1.5 me-1.5 rounded-full" :class="dotClasses"></span>
    <slot></slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary, success, warning, danger, info, neutral
  dot: { type: Boolean, default: false },
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'danger': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'info': return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'neutral': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-blue-50 text-blue-700 border-blue-200'
  }
})

const dotClasses = computed(() => {
  switch (props.variant) {
    case 'success': return 'bg-emerald-500'
    case 'warning': return 'bg-amber-500'
    case 'danger': return 'bg-rose-500'
    case 'info': return 'bg-sky-500'
    case 'neutral': return 'bg-slate-400'
    default: return 'bg-blue-500'
  }
})
</script>
