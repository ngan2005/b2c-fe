<template>
  <div class="text-center py-12 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm my-4">
    <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full d-inline-flex align-items-center justify-content-center text-3xl mb-4">
      <i :class="icon"></i>
    </div>
    <h4 class="text-lg font-semibold text-slate-800 mb-1">{{ title }}</h4>
    <p class="text-slate-500 text-sm max-w-md mx-auto mb-4">{{ description }}</p>
    <div v-if="$slots.action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'bi bi-inbox' },
  title: { type: String, default: 'No items found' },
  description: { type: String, default: 'There is no data to display right now.' },
})
</script>
