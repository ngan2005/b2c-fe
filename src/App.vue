<script setup>
import ToastHost from '@/components/common/ToastHost.vue'
import DialogHost from '@/components/common/DialogHost.vue'
</script>

<template>
  <router-view />
  <ToastHost />
  <DialogHost />
</template>
