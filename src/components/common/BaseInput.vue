<template>
  <div class="mb-3">
    <label v-if="label" :for="id" class="form-label font-medium text-slate-700 text-sm mb-1 d-block">
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </label>
    <div class="input-group">
      <span v-if="prependIcon" class="input-group-text bg-slate-50 border-slate-200 text-slate-500">
        <i :class="prependIcon"></i>
      </span>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :class="[
          'form-control rounded-lg text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          error ? 'is-invalid border-rose-500' : 'border-slate-200',
          { 'rounded-start-0': prependIcon }
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @keyup.enter="$emit('enter', $event)"
      />
    </div>
    <div v-if="error" class="invalid-feedback d-block text-xs mt-1 text-rose-500">
      {{ error }}
    </div>
    <small v-else-if="helpText" class="form-text text-slate-400 text-xs mt-1 d-block">
      {{ helpText }}
    </small>
  </div>
</template>

<script setup>
defineProps({
  id: { type: String, default: () => `input-${Math.random().toString(36).substr(2, 9)}` },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  helpText: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  prependIcon: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
})

defineEmits(['update:modelValue', 'blur', 'enter'])
</script>
