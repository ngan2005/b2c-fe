<template>
  <div class="text-center py-10 px-4 bg-rose-50/50 rounded-2xl border border-rose-100 my-4">
    <div class="w-14 h-14 bg-rose-100 text-rose-600 rounded-full d-inline-flex align-items-center justify-content-center text-2xl mb-3">
      <i class="bi bi-exclamation-triangle"></i>
    </div>
    <h5 class="text-base font-semibold text-rose-900 mb-1">{{ title }}</h5>
    <p class="text-rose-700 text-xs max-w-md mx-auto mb-4">{{ message }}</p>
    <button v-if="showRetry" class="btn btn-sm btn-outline-danger" @click="$emit('retry')">
      <i class="bi bi-arrow-clockwise me-1"></i> Try Again
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Failed to load content' },
  message: { type: String, default: 'An unexpected error occurred while communicating with the server.' },
  showRetry: { type: Boolean, default: true },
})

defineEmits(['retry'])
</script>
