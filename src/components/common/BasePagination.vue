<template>
  <div v-if="totalPages > 1" class="d-flex align-items-center justify-content-between pt-4 flex-wrap gap-2">
    <div class="text-sm text-slate-500">
      Page <span class="font-semibold text-slate-700">{{ currentPage + 1 }}</span> of <span class="font-semibold text-slate-700">{{ totalPages }}</span>
      <span v-if="totalElements" class="ms-1">({{ totalElements }} total items)</span>
    </div>
    <ul class="pagination pagination-sm m-0">
      <li :class="['page-item', { disabled: isFirst }]">
        <button class="page-link shadow-none" @click="$emit('change', currentPage - 1)" :disabled="isFirst">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
      <li
        v-for="p in visiblePages"
        :key="p"
        :class="['page-item', { active: p === currentPage }]"
      >
        <button class="page-link shadow-none" @click="$emit('change', p)">
          {{ p + 1 }}
        </button>
      </li>
      <li :class="['page-item', { disabled: isLast }]">
        <button class="page-link shadow-none" @click="$emit('change', currentPage + 1)" :disabled="isLast">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, default: 0 }, // 0-based index
  totalPages: { type: Number, default: 1 },
  totalElements: { type: Number, default: 0 },
  isFirst: { type: Boolean, default: true },
  isLast: { type: Boolean, default: true },
})

defineEmits(['change'])

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(0, props.currentPage - 2)
  let end = Math.min(props.totalPages - 1, start + maxVisible - 1)
  if (end - start < maxVisible - 1) {
    start = Math.max(0, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>
