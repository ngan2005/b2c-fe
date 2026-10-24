<template>
  <div class="app-shell bg-nomall">
    <!-- Top Bar -->
    <BuyerTopBar />

    <!-- Main Menu -->
    <BuyerMainMenu />

    <!-- Content -->
    <main class="flex-grow-1">
      <router-view />
    </main>

    <!-- Footer -->
    <BuyerFooter />

    <!-- Toast -->
    <ToastHost />
  </div>
</template>

<script setup>
import BuyerTopBar from '@/components/buyer/TopBar.vue'
import BuyerMainMenu from '@/components/buyer/MainMenu.vue'
import BuyerFooter from '@/components/buyer/Footer.vue'
import ToastHost from '@/components/common/ToastHost.vue'
</script>

<style>
.bg-nomall {
  background-color: var(--nomall-bg) !important;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
