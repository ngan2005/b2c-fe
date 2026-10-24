<template>
  <!-- Filter Sidebar (reused on both desktop and mobile offcanvas) -->
  <div>
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between mb-3 pb-3" style="border-bottom: 1.5px solid var(--nomall-border);">
      <h3 class="nomall-section-title mb-0" style="font-size: 1rem;">
        <i class="bi bi-funnel me-1" style="color: var(--nomall-red);"></i>Bộ Lọc
      </h3>
      <button v-if="hasActiveFilters" class="btn" style="font-size: 0.75rem; color: var(--nomall-red); border: none; font-weight: 700; text-decoration: underline; padding: 0;" @click="$emit('clear')">
        Xóa bộ lọc
      </button>
    </div>

    <!-- Search keyword -->
    <div class="nomall-filter-section">
      <div class="nomall-filter-title">
        <i class="bi bi-search" style="color: var(--nomall-red);"></i> Từ khóa
      </div>
      <div class="input-group">
        <input
          v-model="localFilters.q"
          type="text"
          class="nomall-form-control"
          placeholder="Tên sản phẩm..."
          @keyup.enter="apply"
          style="border-radius: 8px 0 0 8px;"
        />
        <button class="nomall-btn-primary" @click="apply" style="border-radius: 0 8px 8px 0; padding: 0.5rem 0.75rem; font-size: 0.8125rem;">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>

    <!-- Category -->
    <div class="nomall-filter-section">
      <div class="nomall-filter-title">
        <i class="bi bi-grid-3x3-gap" style="color: var(--nomall-red);"></i> Danh mục
      </div>
      <div class="d-flex flex-column gap-1">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="d-flex align-items-center gap-2"
          style="cursor: pointer;"
        >
          <input
            type="radio"
            :id="'cat-' + cat.id"
            name="category"
            :value="cat.slug || cat.id"
            v-model="localFilters.category"
            class="form-check-input"
            style="accent-color: var(--nomall-red);"
          />
          <label :for="'cat-' + cat.id" style="font-size: 0.8125rem; font-weight: 600; color: var(--nomall-ink); cursor: pointer; flex-grow: 1;">
            {{ cat.name }}
          </label>
        </div>
      </div>
    </div>

    <!-- Price range -->
    <div class="nomall-filter-section">
      <div class="nomall-filter-title">
        <i class="bi bi-tag" style="color: var(--nomall-red);"></i> Khoảng giá
      </div>
      <div class="row g-2">
        <div class="col-6">
          <input
            v-model.number="localFilters.minPrice"
            type="number"
            class="nomall-form-control"
            placeholder="Từ (VND)"
            style="font-size: 0.8125rem;"
          />
        </div>
        <div class="col-6">
          <input
            v-model.number="localFilters.maxPrice"
            type="number"
            class="nomall-form-control"
            placeholder="Đến (VND)"
            style="font-size: 0.8125rem;"
          />
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2 mt-2">
        <button
          v-for="preset in pricePresets"
          :key="preset.label"
          class="btn"
          style="font-size: 0.75rem; font-weight: 700; border: 1.5px solid var(--nomall-border); border-radius: 20px; padding: 0.2rem 0.75rem; color: var(--nomall-muted); background: #fff;"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Rating filter -->
    <div class="nomall-filter-section">
      <div class="nomall-filter-title">
        <i class="bi bi-star" style="color: var(--nomall-red);"></i> Đánh giá
      </div>
      <div class="d-flex flex-column gap-2">
        <div
          v-for="r in [4, 3, 2, 1]"
          :key="r"
          class="d-flex align-items-center gap-2"
          style="cursor: pointer;"
        >
          <input type="radio" name="rating" class="form-check-input" style="accent-color: var(--nomall-red);" />
          <label class="d-flex align-items-center gap-1" style="font-size: 0.8125rem; font-weight: 600; color: var(--nomall-ink); cursor: pointer;">
            <span style="color: #FFC947;">
              <i v-for="n in r" :key="n" class="bi bi-star-fill"></i>
              <i v-for="n in (5 - r)" :key="'e' + n" class="bi bi-star" style="color: var(--nomall-border);"></i>
            </span>
            <span style="color: var(--nomall-muted); font-size: 0.75rem;">trở lên</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Apply button -->
    <button class="nomall-btn-primary w-100 mt-2" @click="apply">
      Áp dụng bộ lọc
    </button>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  filters: { type: Object, required: true },
})

const emit = defineEmits(['apply', 'clear'])

const localFilters = reactive({
  q: props.filters.q || '',
  category: props.filters.category || props.filters.categoryId || '',
  minPrice: props.filters.minPrice || '',
  maxPrice: props.filters.maxPrice || '',
})

const hasActiveFilters = computed(() =>
  localFilters.q || localFilters.category || localFilters.minPrice || localFilters.maxPrice
)

const pricePresets = [
  { label: 'Dưới 100K', minPrice: '', maxPrice: '100000' },
  { label: '100K - 300K', minPrice: '100000', maxPrice: '300000' },
  { label: '300K - 500K', minPrice: '300000', maxPrice: '500000' },
  { label: '500K - 1M', minPrice: '500000', maxPrice: '1000000' },
  { label: 'Trên 1M', minPrice: '1000000', maxPrice: '' },
]

const applyPreset = (preset) => {
  localFilters.minPrice = preset.minPrice
  localFilters.maxPrice = preset.maxPrice
  emit('apply')
}

const apply = () => {
  // Sync local to parent filters
  Object.assign(props.filters, {
    q: localFilters.q,
    category: localFilters.category,
    categoryId: '',
    minPrice: localFilters.minPrice,
    maxPrice: localFilters.maxPrice,
  })
  emit('apply')
}
</script>
