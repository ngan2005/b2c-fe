/**
 * relativeTime.js — Formats an ISO-8601 timestamp as a human-readable
 * Vietnamese relative time string (mirrors the helper in AppNavbar.vue).
 */

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR   = 60 * MINUTE
const DAY    = 24 * HOUR

/**
 * @param {string|undefined|null} isoStr  ISO-8601 timestamp
 * @returns {string}  e.g. "Vừa xong", "5 phút trước", "Hôm qua"
 */
export function relativeTime(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  if (diff < MINUTE) return 'Vừa xong'
  if (diff < HOUR)   return `${Math.floor(diff / MINUTE)} phút trước`
  if (diff < DAY)    return `${Math.floor(diff / HOUR)} giờ trước`
  if (diff < 2 * DAY) return 'Hôm qua'
  return new Date(isoStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit',
  })
}
