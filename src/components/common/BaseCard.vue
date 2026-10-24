<template>
  <div
    :class="[
      'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
      { 'card-hover': hover }
    ]"
  >
    <div v-if="$slots.header || title" class="px-5 py-4 border-b border-slate-100 d-flex align-items-center justify-content-between">
      <slot name="header">
        <h3 class="font-semibold text-slate-800 text-base m-0">{{ title }}</h3>
      </slot>
    </div>
    <div :class="['p-5', bodyClass]">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="px-5 py-3 bg-slate-50 border-t border-slate-100">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  hover: { type: Boolean, default: false },
  bodyClass: { type: String, default: '' },
})
</script>
