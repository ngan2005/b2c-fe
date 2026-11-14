<template>
  <div class="app-shell bg-cream min-h-screen d-flex flex-column">
    <AppNavbar />
    <main class="flex-grow-1">
      <router-view />
    </main>
    <AppFooter />
    <ToastHost />
  </div>
</template>

<script setup>
import AppNavbar from '@/components/common/AppNavbar.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import ToastHost from '@/components/common/ToastHost.vue'
</script>
