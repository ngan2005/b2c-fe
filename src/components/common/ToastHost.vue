<template>
  <div
    class="toast-container position-fixed top-0 end-0 p-3"
    style="z-index: 1100;"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="t in notify.toasts"
      :key="t.id"
      class="toast show align-items-center border-0 text-white mb-2"
      :class="`bg-${t.variant}`"
      role="alert"
    >
      <div class="d-flex flex-grow-1 align-items-center">
        <div class="toast-body flex-grow-1">{{ t.message }}</div>
        <div v-if="t.actionLabel" class="d-flex align-items-center gap-2 me-2">
          <button
            type="button"
            class="btn btn-sm btn-light text-dark fw-semibold rounded-pill px-3 d-inline-flex align-items-center gap-2"
            @click="triggerUndo(t)"
          >
            <span>{{ t.actionLabel }}</span>
            <span
              v-if="t.actionTimeout > 0"
              class="badge text-bg-dark rounded-circle"
              style="min-width:1.4rem; font-size:0.7rem;"
            >{{ t.actionTimeout }}</span>
          </button>
        </div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          @click="notify.dismiss(t.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotifyStore } from '@/stores/notify'

const notify = useNotifyStore()

function triggerUndo(t) {
  const fn = t.onAction
  notify.dismiss(t.id)
  if (typeof fn === 'function') {
    try { fn() } catch { /* caller is responsible for surfacing its own errors */ }
  }
}
</script>
