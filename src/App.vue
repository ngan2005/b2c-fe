<script setup>
import ToastHost from '@/components/common/ToastHost.vue'
import DialogHost from '@/components/common/DialogHost.vue'
import { useRealtime } from '@/composables/useRealtime'

// Global WebSocket connection for realtime notifications and user presence
useRealtime()
</script>

<template>
  <router-view />
  <ToastHost />
  <DialogHost />
</template>
