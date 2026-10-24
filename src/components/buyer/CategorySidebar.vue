<template>
  <div class="nomall-sidebar">
    <!-- Title -->
    <div class="nomall-sidebar-title d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-1.5 text-truncate">
        <i class="bi bi-list"></i>
        <span>Danh mục</span>
      </div>
      <button
        v-if="collapsible"
        class="btn-collapse-sidebar"
        type="button"
        @click.stop="$emit('collapse')"
        title="Thu hẹp danh mục"
      >
        <i class="bi bi-chevron-bar-left"></i>
      </button>
    </div>

    <!-- Category list -->
    <div class="nomall-sidebar-list">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="nomall-cat-item"
        :class="{ active: activeCategoryId === cat.id }"
        @click="selectCategory(cat)"
      >
        <span>{{ cat.name }}</span>
        <i class="bi bi-chevron-right"></i>
      </div>

      <!-- "See more" item -->
      <div class="nomall-cat-item" @click="$emit('select-all')" style="color: var(--nomall-red); font-weight: 800;">
        <span>Xem tất cả sản phẩm...</span>
        <i class="bi bi-chevron-right"></i>
      </div>
    </div>

    <!-- Search trends -->
    <div class="nomall-trends mt-3">
      <div class="nomall-trends-title">
        <i class="bi bi-fire"></i>
        Xu hướng tìm kiếm
      </div>
      <div class="d-flex flex-wrap">
        <a
          v-for="tag in searchTrends"
          :key="tag"
          :href="'#'"
          class="nomall-trend-tag"
          @click.prevent="$emit('search', tag)"
        >
          {{ tag }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'

defineProps({
  collapsible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select', 'select-all', 'search', 'collapse'])
const router = useRouter()
const categories = ref([])
const activeCategoryId = ref(null)

const searchTrends = [
  'Khóe dep', 'Nhà cửa', 'Sách', 'Bách hóa',
  'Hải sản', 'Điện thoại', 'Laptop', 'Mỹ phẩm',
  'Thời trang', 'Giày dép', 'Đồ gia dụng', 'Smartwatch',
]

onMounted(async () => {
  try {
    const data = await catalogService.getRootCategories()
    categories.value = Array.isArray(data) ? data.slice(0, 12) : []
  } catch (_) {}
})

const selectCategory = (cat) => {
  activeCategoryId.value = cat.id
  emit('select', cat)
  router.push({ name: 'products', query: { category: cat.slug || cat.id } })
}
</script>
