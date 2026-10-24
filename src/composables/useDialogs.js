// Singleton dialog state. Components call `useDialogs()` to get
// `confirm`, `prompt`, and `alert` helpers that all return Promises.
// The actual modal UI is rendered by <DialogHost /> at the app root.
import { reactive } from 'vue'

const state = reactive({
  open: false,
  type: 'confirm', // 'confirm' | 'prompt' | 'alert'
  title: '',
  message: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  variant: 'primary', // 'primary' | 'danger' | 'warning' | 'success' | 'info'
  inputValue: '',
  inputPlaceholder: '',
  inputRequired: false,
  countdownSeconds: 0, // 0 = disabled. While > 0, confirm button is disabled.
  countdownTimer: null,
  resolve: null,
})

function open(type, opts) {
  // Stop any previous countdown so it doesn't leak between dialogs.
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer)
    state.countdownTimer = null
  }
  // Default behaviour: any "danger" confirm that contains "xóa" gets a
  // short safety countdown. Callers can override via opts.countdownSeconds
  // (0 disables, any positive number sets the duration).
  let countdown = opts.countdownSeconds ?? 0
  if (
    countdown === 0 &&
    opts.variant === 'danger' &&
    type === 'confirm' &&
    /xóa/i.test(opts.message || '')
  ) {
    countdown = 3
  }
  Object.assign(state, {
    open: true,
    type,
    title: opts.title || '',
    message: opts.message || '',
    confirmText: opts.confirmText || 'Xác nhận',
    cancelText: opts.cancelText || 'Hủy',
    variant: opts.variant || 'primary',
    inputValue: opts.inputValue || '',
    inputPlaceholder: opts.inputPlaceholder || '',
    inputRequired: !!opts.inputRequired,
    countdownSeconds: countdown,
  })
  if (countdown > 0) {
    state.countdownTimer = setInterval(() => {
      state.countdownSeconds -= 1
      if (state.countdownSeconds <= 0) {
        clearInterval(state.countdownTimer)
        state.countdownTimer = null
      }
    }, 1000)
  }
  return new Promise((resolve) => {
    state.resolve = resolve
  })
}

function close(result) {
  state.open = false
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer)
    state.countdownTimer = null
  }
  if (state.resolve) {
    state.resolve(result)
    state.resolve = null
  }
}

export function useDialogs() {
  return {
    state,
    confirm: (message, opts = {}) => open('confirm', { message, ...opts }),
    alert: (message, opts = {}) =>
      open('alert', { message, cancelText: '', confirmText: opts.confirmText || 'OK', ...opts }),
    prompt: (message, opts = {}) =>
      open('prompt', { message, inputRequired: true, ...opts }),
    close,
  }
}
