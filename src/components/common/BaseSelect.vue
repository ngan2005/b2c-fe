<template>
  <div class="mb-3">
    <label v-if="label" :for="id" class="form-label font-medium text-slate-700 text-sm mb-1 d-block">
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'form-select rounded-lg text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
        error ? 'is-invalid border-rose-500' : 'border-slate-200'
      ]"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value !== undefined ? opt.value : opt"
        :value="opt.value !== undefined ? opt.value : opt"
      >
        {{ opt.label !== undefined ? opt.label : opt }}
      </option>
    </select>
    <div v-if="error" class="invalid-feedback d-block text-xs mt-1 text-rose-500">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: { type: String, default: () => `select-${Math.random().toString(36).substr(2, 9)}` },
  modelValue: { type: [String, Number, Boolean], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // Array of { value, label } or simple array
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>
