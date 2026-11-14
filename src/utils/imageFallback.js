/**
 * Reusable image error handler & fallback constants
 * Guarantees zero broken images (prevents infinite error loops and invalid URIs)
 */
export const PLACEHOLDER_PRODUCT_IMG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48cGF0aCBkPSJNMjUgNzAgTDQ1IDQ1IEw2MCA2MCBMNzAgNTAgTDgwIDcwIFoiIGZpbGw9IiNjYmQ1ZTEiLz48Y2lyY2xlIGN4PSIzOCIgY3k9IjM1IiByPSI3IiBmaWxsPSIjOTRhM2I4Ii8+PC9zdmc+'

export function onProductImgError(event, fallbackUrl = PLACEHOLDER_PRODUCT_IMG) {
  if (!event || !event.target) return
  event.target.onerror = null
  event.target.src = fallbackUrl
}

