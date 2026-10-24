<template>
  <div class="table-responsive rounded-xl border border-slate-200 bg-white">
    <table class="table table-hover align-middle mb-0 text-sm">
      <thead class="table-light text-slate-600 font-semibold border-bottom">
        <tr>
          <slot name="header"></slot>
        </tr>
      </thead>
      <tbody>
        <slot name="body"></slot>
      </tbody>
    </table>
    <div v-if="loading" class="p-5 text-center text-slate-500">
      <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
      Loading data...
    </div>
    <div v-else-if="empty" class="p-8 text-center text-slate-500">
      <i class="bi bi-inbox text-3xl mb-2 d-block text-slate-300"></i>
      <span>{{ emptyMessage }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  empty: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'No data available' },
})
</script>
