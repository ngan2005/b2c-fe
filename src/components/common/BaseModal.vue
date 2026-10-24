<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal fade show d-block bg-slate-900/50 backdrop-blur-sm transition-all z-50"
      tabindex="-1"
      @click.self="closeOnOverlay && close()"
    >
      <div :class="['modal-dialog modal-dialog-centered', sizeClass]">
        <div class="modal-content border-0 shadow-2xl rounded-2xl overflow-hidden">
          <div v-if="title || $slots.header" class="modal-header border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <slot name="header">
              <h5 class="modal-title font-semibold text-slate-800 text-lg m-0">{{ title }}</h5>
            </slot>
            <button type="button" class="btn-close" @click="close()"></button>
          </div>
          <div class="modal-body p-6">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="modal-footer border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm, md, lg, xl
  closeOnOverlay: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'modal-sm'
    case 'lg': return 'modal-lg'
    case 'xl': return 'modal-xl'
    default: return ''
  }
})
</script>
