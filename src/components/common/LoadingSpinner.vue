<template>
  <div :class="['text-center py-10', containerClass]">
    <div class="spinner-border text-primary" :class="sizeClass" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p v-if="text" class="text-slate-500 text-sm mt-3 mb-0">{{ text }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: 'Loading...' },
  size: { type: String, default: 'md' }, // sm, md, lg
  containerClass: { type: String, default: '' },
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'spinner-border-sm'
    case 'lg': return 'w-10 h-10 border-4'
    default: return ''
  }
})
</script>
