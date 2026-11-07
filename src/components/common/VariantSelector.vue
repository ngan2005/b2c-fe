<template>
  <!-- [VARIANT-FIX] VariantSelector -->
  <div>
    <!-- Has meaningful variant groups (options or attribute groups) -->
    <div v-if="hasGroups">
      <div
        v-for="group in optionGroups"
        :key="group.name"
        class="mb-3"
      >
        <!-- Group label row -->
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="form-label mb-0 fw-bold">{{ group.name }}</span>
          <span v-if="isGroupSelected(group.name)" style="font-size: 0.65rem; color: var(--pastel-coral-dark);">
            <i class="bi bi-check2-circle"></i> {{ internalSelections[group.name]?.label }}
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
              internalSelections[group.name]?.label === value.label ? 'pill-chip-coral' : '',
              isValueDisabled(group.name, value) ? 'pill-chip-disabled' : ''
            ]"
            :disabled="isValueDisabled(group.name, value)"
            :title="isValueDisabled(group.name, value) ? 'Phân loại này hiện đã hết hàng' : ''"
            :style="internalSelections[group.name]?.label !== value.label && !isValueDisabled(group.name, value)
              ? 'background:#fff; color:var(--pastel-ink); border:1.5px solid var(--pastel-border); cursor:pointer;'
              : ''"
            @click="pick(group.name, value)"
          >
            <!-- Option value image thumbnail (e.g. phone color thumbnail) -->
            <img
              v-if="value.imageUrl"
              :src="value.imageUrl"
              :alt="value.label"
              class="pill-chip-img"
            />
            <!-- Color swatch (for hex/named color values) -->
            <span
              v-else-if="isColorValue(value.label)"
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

            <!-- Stock indicator for this value -->
            <span
              v-if="getValueStock(group.name, value) > 0"
              style="font-size: 0.65rem; opacity: 0.8; margin-left: 4px;"
            >
              ({{ getValueStock(group.name, value) }})
            </span>
            <span
              v-else
              style="font-size: 0.65rem; color: #dc2626; margin-left: 4px;"
            >
              (Hết)
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
          <span v-if="fullyMatchedVariant.weightGram" class="ms-2 text-muted">
            ({{ fullyMatchedVariant.weightGram }}g)
          </span>
        </template>
        <template v-else>
          <i class="bi bi-info-circle me-1"></i>
          Vui lòng chọn đầy đủ phân loại
        </template>
      </div>
    </div>

    <!-- No attribute groups: flat variants -->
    <div v-else-if="variants && variants.length > 1">
      <div class="form-label mb-2 fw-bold">Phân loại</div>
      <div class="d-flex flex-wrap gap-2">
        <button
          v-for="v in variants"
          :key="v.id"
          type="button"
          :class="['pill-chip', selectedFlatVariantId === v.id ? 'pill-chip-coral' : '']"
          :style="selectedFlatVariantId !== v.id ? 'background:#fff; color:var(--pastel-ink); border:1.5px solid var(--pastel-border); cursor:pointer;' : ''"
          @click="pickFlat(v)"
        >
          {{ v.variantName || 'Mẫu ' + v.id }} — {{ formatCurrency(v.salePrice || v.price) }} (Kho: {{ v.stockQuantity || 0 }})
        </button>
      </div>
    </div>

    <!-- Single default variant / simple product -->
    <div v-else>
      <div class="form-label mb-2 fw-bold">Phân loại</div>
      <button type="button" class="pill-chip pill-chip-coral" style="cursor: default;">
        <i class="bi bi-check2"></i> Mặc định — {{ formatCurrency(variants[0]?.salePrice || variants[0]?.price || basePrice) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  variants: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  modelValue: { type: Object, default: null },
  basePrice: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'image-selected'])

const internalSelections = ref({})
const selectedFlatVariantId = ref(null)

// Reset internal state when variants change
watch(() => [props.variants, props.options], () => {
  internalSelections.value = {}
  selectedFlatVariantId.value = null
  initSingle()
})

onMounted(() => {
  initSingle()
})

function initSingle() {
  if (props.variants?.length === 1 && optionGroups.value.length === 0) {
    emit('update:modelValue', props.variants[0])
  }
}

function matchesGroupValue(v, groupName, targetLabel) {
  if (!v || !targetLabel) return false
  const target = targetLabel.toLowerCase()
  if (v.attributes && v.attributes[groupName] !== undefined) {
    return (v.attributes[groupName] || '').toLowerCase() === target
  }
  if (v.attributeName && v.attributeName.toLowerCase() === groupName.toLowerCase()) {
    return (v.attributeValue || '').toLowerCase() === target
  }
  if (v.variantName) {
    return v.variantName.toLowerCase().includes(target)
  }
  return false
}

/**
 * Option groups derived from props.options or variants.attributes or variants.attributeName
 */
const optionGroups = computed(() => {
  if (props.options && props.options.length > 0) {
    return props.options.map(opt => ({
      name: opt.name,
      values: (opt.values || []).map(val => {
        const valLabel = val.value || val.label
        let img = val.imageUrl || null
        if (!img && props.variants?.length) {
          const matchingV = props.variants.find(v => matchesGroupValue(v, opt.name, (valLabel || '').toLowerCase()))
          if (matchingV?.imageUrl) {
            img = matchingV.imageUrl
          }
        }
        return {
          id: val.id || valLabel,
          label: valLabel,
          raw: valLabel,
          imageUrl: img,
        }
      })
    }))
  }

  const groups = {}
  for (const v of props.variants || []) {
    if (v.attributes && typeof v.attributes === 'object' && Object.keys(v.attributes).length > 0) {
      for (const [attrName, attrVal] of Object.entries(v.attributes)) {
        if (!groups[attrName]) groups[attrName] = { name: attrName, values: [] }
        if (!groups[attrName].values.some(x => x.label === attrVal)) {
          groups[attrName].values.push({
            id: attrVal,
            label: attrVal,
            raw: attrVal,
            imageUrl: v.imageUrl || null,
          })
        }
      }
    } else if (v.attributeName && v.attributeValue) {
      if (!groups[v.attributeName]) groups[v.attributeName] = { name: v.attributeName, values: [] }
      if (!groups[v.attributeName].values.some(x => x.id === v.attributeValueId)) {
        groups[v.attributeName].values.push({
          id: v.attributeValueId || v.attributeValue,
          label: v.attributeValue,
          raw: v.attributeValue,
          imageUrl: v.imageUrl || null,
        })
      }
    }
  }
  return Object.values(groups)
})

const hasGroups = computed(() => optionGroups.value.length > 0)

function isGroupSelected(groupName) {
  return !!internalSelections.value[groupName]
}

function isValueDisabled(groupName, value) {
  const targetLabel = (value.label || value).toLowerCase()
  const otherSelected = Object.entries(internalSelections.value).filter(([g]) => g !== groupName)

  const matchingVariants = (props.variants || []).filter(v => {
    if (!matchesGroupValue(v, groupName, targetLabel)) return false
    for (const [otherG, otherVal] of otherSelected) {
      const otherLabel = (otherVal.label || otherVal).toLowerCase()
      if (!matchesGroupValue(v, otherG, otherLabel)) return false
    }
    return true
  })

  if (matchingVariants.length === 0) return true
  const totalStock = matchingVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
  return totalStock <= 0
}

function getValueStock(groupName, value) {
  const targetLabel = (value.label || value).toLowerCase()
  const matching = (props.variants || []).filter(v => {
    return matchesGroupValue(v, groupName, targetLabel)
  })
  return matching.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
}

function pick(groupName, value) {
  // If clicking an already selected chip -> toggle off
  if (internalSelections.value[groupName]?.label === value.label) {
    const next = { ...internalSelections.value }
    delete next[groupName]
    internalSelections.value = next
    emit('update:modelValue', null)
    return
  }

  internalSelections.value = {
    ...internalSelections.value,
    [groupName]: value,
  }

  // If this value has an image, emit image-selected immediately
  if (value.imageUrl) {
    emit('image-selected', value.imageUrl)
  }

  const allGroups = optionGroups.value
  if (allGroups.length === 0) {
    emit('update:modelValue', null)
    return
  }

  const selectedCount = Object.keys(internalSelections.value).length
  if (selectedCount < allGroups.length) {
    emit('update:modelValue', {
      attributeName: groupName,
      attributeValue: value.label,
      imageUrl: value.imageUrl,
      _partial: true,
    })
    return
  }

  const matched = findMatchingVariant()
  if (matched?.imageUrl) {
    emit('image-selected', matched.imageUrl)
  }
  emit('update:modelValue', matched || {
    attributeName: groupName,
    attributeValue: value.label,
    imageUrl: value.imageUrl,
    _partial: true,
  })
}

function pickFlat(v) {
  if (selectedFlatVariantId.value === v.id) {
    selectedFlatVariantId.value = null
    emit('update:modelValue', null)
    return
  }
  selectedFlatVariantId.value = v.id
  if (v.imageUrl) {
    emit('image-selected', v.imageUrl)
  }
  emit('update:modelValue', v)
}

function findMatchingVariant() {
  const allGroups = optionGroups.value
  if (allGroups.length === 0) return null

  return (props.variants || []).find(v => {
    return allGroups.every(g => {
      const sel = internalSelections.value[g.name]
      if (!sel) return false
      const selLabel = (sel.label || '').toLowerCase()

      if (v.attributes && v.attributes[g.name] !== undefined) {
        return v.attributes[g.name].toLowerCase() === selLabel
      }
      if (v.optionValueIds && typeof sel.id === 'number') {
        return v.optionValueIds.includes(sel.id)
      }
      if (v.attributeName === g.name) {
        return (v.attributeValue || '').toLowerCase() === selLabel
      }
      if (v.variantName) {
        return v.variantName.toLowerCase().includes(selLabel)
      }
      return false
    })
  }) || null
}

const fullyMatchedVariant = computed(() => {
  if (!hasGroups.value) return null
  if (Object.keys(internalSelections.value).length < optionGroups.value.length) return null
  return findMatchingVariant()
})

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

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}
</script>

<style scoped>
.pill-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.18s ease;
  user-select: none;
}
.pill-chip:hover:not(:disabled) {
  border-color: var(--pastel-coral, #ff6b6b) !important;
  color: var(--pastel-coral-dark, #e05353) !important;
}
.pill-chip-coral {
  background: rgba(255, 107, 107, 0.12) !important;
  color: var(--pastel-coral-dark, #e05353) !important;
  border: 1.5px solid var(--pastel-coral, #ff6b6b) !important;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.15);
}
.pill-chip-disabled {
  opacity: 0.45 !important;
  cursor: not-allowed !important;
  text-decoration: line-through !important;
  background: #f1f5f9 !important;
  border: 1.5px dashed #cbd5e1 !important;
  color: #94a3b8 !important;
  box-shadow: none !important;
}
.pill-chip-img {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.1);
}
</style>
