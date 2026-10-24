<template>
  <!-- NO MALL Main Horizontal Menu -->
  <nav class="nomall-menu">
    <div class="nomall-container">
      <div class="d-flex align-items-center gap-1 overflow-x-auto" style="scrollbar-width: none; -ms-overflow-style: none; white-space: nowrap;">

        <!-- Hamburger: sidebar toggle on mobile/tablet -->
        <button
          class="btn d-lg-none flex-shrink-0 me-1"
          type="button"
          style="color: var(--nomall-red); padding: 0.25rem 0.5rem; font-size: 1.25rem;"
          @click="toggleSidebar"
          title="Danh mục"
        >
          <i class="bi bi-list"></i>
        </button>

        <!-- Menu items -->
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.to"
          class="nav-link-custom flex-shrink-0"
          :class="{ active: isActive(item) }"
        >
          <i v-if="item.icon" :class="item.icon"></i>
          {{ item.name }}
        </router-link>

      </div>
    </div>
  </nav>

  <!-- Offcanvas sidebar (mobile/tablet) -->
  <div class="offcanvas offcanvas-start nomall-sidebar-offcanvas d-lg-none"
       tabindex="-1"
       id="nomallSidebarOffcanvas"
       aria-labelledby="sidebarLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="sidebarLabel">
        <span style="color: var(--nomall-red); font-weight: 900;">NO <span style="color: var(--nomall-yellow);">MALL</span></span>
      </h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body p-0">
      <BuyerCategorySidebar @select="onCategorySelect" @close="closeSidebar" />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import BuyerCategorySidebar from '@/components/buyer/CategorySidebar.vue'

const route = useRoute()

const menuItems = [
  { name: 'Trang chủ', to: { name: 'home' }, icon: 'bi bi-house' },
  { name: 'Sản phẩm', to: { name: 'products' }, icon: 'bi bi-grid-3x3-gap' },
  { name: 'Yêu thích', to: { name: 'account-wishlist' }, icon: 'bi bi-heart' },
  { name: 'Liên hệ', to: { name: 'contact' }, icon: 'bi bi-telephone' },
]

const isActive = (item) => {
  if (!item.to || item.to === '#') return false
  if (route.name === item.to.name) return true
  return false
}

const toggleSidebar = () => {
  const el = document.getElementById('nomallSidebarOffcanvas')
  if (el) {
    const bs = window.bootstrap?.Offcanvas.getOrCreateInstance(el)
    bs?.toggle()
  }
}

const closeSidebar = () => {
  const el = document.getElementById('nomallSidebarOffcanvas')
  if (el) {
    const bs = window.bootstrap?.Offcanvas.getOrCreateInstance(el)
    bs?.hide()
  }
}

const onCategorySelect = () => {
  closeSidebar()
}
</script>

<style scoped>
.nav-link-custom {
  color: var(--nomall-ink);
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.nav-link-custom:hover,
.nav-link-custom.active {
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
  text-decoration: none;
}

.nav-link-custom.active {
  font-weight: 800;
}
</style>
