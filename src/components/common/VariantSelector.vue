<template>
  <!-- [VARIANT-FIX] VariantSelector -->
  <div>
    <!-- Has meaningful variant groups (attributeName + attributeValue) -->
    <div v-if="hasGroups">
      <div
        v-for="group in optionGroups"
        :key="group.name"
        class="mb-3"
      >
        <!-- Group label row -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="form-label mb-0">{{ group.name }}</span>
          <span v-if="isGroupSelected(group.name)" style="font-size: 0.65rem; color: var(--pastel-muted);">
            <i class="bi bi-check2"></i>
          </span>
        </div>

        <!-- Chip row -->
        <div class="d-flex flex-wrap gap-2">
          <button
            v-for="value in group.values"
            :key="value.id"
            type="button"
            :class="[
              'pill-chip',
              internalSelections[group.name]?.id === value.id ? 'pill-chip-coral' : ''
            ]"
            :style="internalSelections[group.name]?.id !== value.id
              ? 'background:#fff; color:var(--pastel-ink); border:1.5px solid var(--pastel-border); cursor:pointer;'
              : ''"
            @click="pick(group.name, value)"
          >
            <!-- Color swatch (for hex/named color values) -->
            <span
              v-if="isColorValue(value.label)"
              :style="{
                width: '0.85rem',
                height: '0.85rem',
                borderRadius: '50%',
                backgroundColor: normalizeColor(value.label),
                border: '1.5px solid rgba(58,46,79,0.18)',
                flexShrink: '0',
                display: 'inline-block'
              }"
            ></span>

            {{ value.label }}

            <!-- Stock indicator for this value (aggregated across all variants sharing it) -->
            <span
              v-if="getValueStock(group.name, value.id) > 0"
              style="font-size: 0.6rem; opacity: 0.75;"
            >
              ({{ getValueStock(group.name, value.id) }})
            </span>
          </button>
        </div>
      </div>

      <!-- Stock / instruction line -->
      <div class="mt-2" style="font-size: 0.8125rem; color: var(--pastel-muted);">
        <template v-if="fullyMatchedVariant">
          <i class="bi bi-box-seam me-1"></i>
          Sẵn có:
          <strong :style="fullyMatchedVariant.stockQuantity > 0 ? 'color:var(--pastel-ink);' : 'color:var(--pastel-coral-dark);'">
            {{ fullyMatchedVariant.stockQuantity > 0 ? fullyMatchedVariant.stockQuantity : 'Hết hàng' }}
          </strong>
        </template>
        <template v-else>
          <i class="bi bi-info-circle me-1"></i>
          Vui lòng chọn đầy đủ phân loại
        </template>
      </div>
    </div>

    <!-- No attribute groups: flat variants only — show "Default" chip -->
    <div v-else>
      <div class="form-label">Phân loại</div>
      <button type="button" class="pill-chip pill-chip-coral" style="cursor: default;">
        <i class="bi bi-circle"></i> Default — {{ formatCurrency(basePrice) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  /**
   * Array of variant objects from the product.
   * Shape: { id, variantName, salePrice, price, stockQuantity, attributeName, attributeValue, attributeValueId }
   */
  variants: { type: Array, default: () => [] },
  /** Not used for grouped variants — kept for compatibility; emits full variant on complete selection */
  modelValue: { type: Object, default: null },
  /** Product's base price, shown when there are no variants */
  basePrice: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue'])

// ── State ────────────────────────────────────────────────────────

/** Internal per-group selection map: { groupName: { id, label, raw } } */
const internalSelections = ref({})

// Reset internal state when variants change (product switch)
watch(() => props.variants, () => {
  internalSelections.value = {}
})

// ── Derived data ─────────────────────────────────────────────────

/** True when variants have real attribute groups (attributeName + attributeValue on variants) */
const hasGroups = computed(() =>
  props.variants && props.variants.length > 0 &&
  props.variants.some(v => v.attributeName && v.attributeValue)
)

/**
 * Grouped option values derived from variants.
 * Each group: { name: string, values: [{ id, label, raw }] }
 *   id = attributeValueId, label = display text
 */
const optionGroups = computed(() => {
  if (!hasGroups.value) return []
  const groups = {}
  for (const v of props.variants) {
    if (!v.attributeName || !v.attributeValue) continue
    if (!groups[v.attributeName]) {
      groups[v.attributeName] = { name: v.attributeName, values: [] }
    }
    const existing = groups[v.attributeName].values.find(x => x.id === v.attributeValueId)
    if (!existing) {
      groups[v.attributeName].values.push({
        id: v.attributeValueId,
        label: v.attributeValue,
        raw: v.attributeValue,
      })
    }
  }
  return Object.values(groups)
})

/** True when a group has a selection made */
function isGroupSelected(groupName) {
  return !!internalSelections.value[groupName]
}

/** Total stock across all variants that share a given value id within a group */
function getValueStock(groupName, valueId) {
  const matching = props.variants.filter(
    v => v.attributeName === groupName && v.attributeValueId === valueId
  )
  return matching.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
}

// ── Selection logic ──────────────────────────────────────────────

function pick(groupName, value) {
  // Store the pick
  internalSelections.value = {
    ...internalSelections.value,
    [groupName]: value,
  }

  // Check if all groups are now selected
  const allGroups = optionGroups.value
  if (allGroups.length === 0) {
    emit('update:modelValue', null)
    return
  }

  const selectedGroupNames = Object.keys(internalSelections.value)
  if (selectedGroupNames.length < allGroups.length) {
    // Not complete yet — emit partial info
    emit('update:modelValue', {
      attributeName: groupName,
      attributeValueId: value.id,
      attributeValue: value.label,
      _partial: true,
    })
    return
  }

  // All groups selected — find the matching full variant record
  const variant = props.variants.find(v => {
    return allGroups.every(g => {
      const sel = internalSelections.value[g.name]
      return sel && v.attributeName === g.name && v.attributeValueId === sel.id
    })
  })

  // Emit the complete variant (or the partial if no match)
  emit('update:modelValue', variant || {
    attributeName: groupName,
    attributeValueId: value.id,
    attributeValue: value.label,
    _partial: true,
  })
}

/** The fully matched variant (all groups selected, match found) */
const fullyMatchedVariant = computed(() => {
  const allGroups = optionGroups.value
  if (allGroups.length === 0) return null
  if (Object.keys(internalSelections.value).length < allGroups.length) return null
  return props.variants.find(v => {
    return allGroups.every(g => {
      const sel = internalSelections.value[g.name]
      return sel && v.attributeName === g.name && v.attributeValueId === sel.id
    })
  }) || null
})

// ── Color helpers ────────────────────────────────────────────────

function isColorValue(label) {
  if (!label) return false
  const s = label.trim().toLowerCase()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return true
  if (/^rgba?\(/.test(s)) return true
  const named = [
    'đen','đỏ','xanh','vàng','trắng','hồng','cam','tím','nâu','xanh lá','bạc','xám',
    'be','kem','nude','xanh navy','xanh dương','đen','hồng đào',
    'black','red','green','yellow','white','pink','orange','purple','brown',
    'gray','grey','beige','navy','navy blue','cream','khaki','maroon','burgundy',
    'teal','coral','lavender',
  ]
  return named.includes(s) || named.some(c => s.includes(c))
}

function normalizeColor(label) {
  const s = label.trim().toLowerCase()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s
  const map = {
    'đen':'#1a1a1a','đỏ':'#e53935','xanh':'#1565c0','vàng':'#fdd835','trắng':'#fafafa',
    'hồng':'#ec407a','cam':'#fb8c00','tím':'#8e24aa','nâu':'#6d4c41','xanh lá':'#43a047',
    'bạc':'#9e9e9e','xám':'#757575','be':'#f5f5dc','kem':'#fffdd0','nude':'#ebc8b2',
    'xanh navy':'#001f3f','xanh dương':'#1565c0','hồng đào':'#ffb74d',
    'black':'#1a1a1a','red':'#e53935','green':'#43a047','yellow':'#fdd835',
    'white':'#fafafa','pink':'#ec407a','orange':'#fb8c00','purple':'#8e24aa',
    'brown':'#6d4c41','gray':'#757575','grey':'#757575','beige':'#f5f5dc',
    'navy':'#001f3f','navy blue':'#001f3f','cream':'#fffdd0','khaki':'#c3b091',
    'maroon':'#800000','burgundy':'#800020','teal':'#008080','coral':'#ff7f50',
    'lavender':'#b57edc',
  }
  return map[s] || '#ccc'
}

// ── Utility ──────────────────────────────────────────────────────
function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}
</script>
