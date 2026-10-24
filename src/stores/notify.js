import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 1

export const useNotifyStore = defineStore('notify', () => {
  const toasts = ref([])

  function push(message, variant = 'info', timeout = 4000) {
    const id = nextId++
    toasts.value.push({ id, message, variant, actionLabel: null, onAction: null, actionTimeout: 0, _timer: null })
    if (timeout > 0) {
      const timer = setTimeout(() => dismiss(id), timeout)
      const t = toasts.value.find((x) => x.id === id)
      if (t) t._timer = timer
    }
    return id
  }

  /**
   * Show a toast with an inline action button (typically "Hoàn tác") that
   * auto-dismisses after `actionTimeout` seconds. The action callback runs
   * once and the toast is removed. While the countdown is running the
   * action button shows the remaining seconds and stays clickable.
   *
   * @param {object} opts
   * @param {string} opts.message            text shown in the toast
   * @param {string} [opts.variant='info']   Bootstrap color variant
   * @param {string} [opts.actionLabel='Hoàn tác']  button label
   * @param {Function} opts.onAction         callback when user clicks the button
   * @param {number} [opts.actionTimeout=3]  seconds before the toast auto-dismisses
   */
  function pushUndo({ message, variant = 'info', actionLabel = 'Hoàn tác', onAction, actionTimeout = 3 } = {}) {
    const id = nextId++
    const toast = {
      id,
      message,
      variant,
      actionLabel,
      onAction,
      actionTimeout,
      _timer: null,
    }
    toasts.value.push(toast)
    const tick = setInterval(() => {
      toast.actionTimeout -= 1
      if (toast.actionTimeout <= 0) {
        clearInterval(tick)
        dismiss(id)
      }
    }, 1000)
    toast._timer = tick
    return id
  }

  function dismiss(id) {
    const t = toasts.value.find((x) => x.id === id)
    if (t && t._timer) clearInterval(t._timer)
    toasts.value = toasts.value.filter((x) => x.id !== id)
  }

  return { toasts, push, pushUndo, dismiss }
})
