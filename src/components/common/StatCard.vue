<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: 'bi-bar-chart' },
  variant: { type: String, default: 'primary' }, // primary / success / warning / danger
  delta: { type: String, default: '' },
})
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-body d-flex align-items-center">
      <div
        class="rounded d-flex align-items-center justify-content-center me-3 text-white"
        :class="`bg-${variant}`"
        style="width: 56px; height: 56px;"
      >
        <i :class="['bi', icon, 'fs-4']"></i>
      </div>
      <div class="flex-grow-1">
        <div class="text-muted small text-uppercase fw-semibold">{{ label }}</div>
        <div class="fs-3 fw-bold text-dark">{{ value }}</div>
        <small v-if="delta" class="text-muted">{{ delta }}</small>
      </div>
    </div>
  </div>
</template>
