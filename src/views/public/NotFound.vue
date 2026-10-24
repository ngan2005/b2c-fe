<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="d-flex align-items-center justify-content-center flex-grow-1 p-5">
    <div class="text-center">
      <h1 class="display-1 fw-bold text-muted">404</h1>
      <p class="lead">This page does not exist.</p>
      <button class="btn btn-primary" @click="router.push({ name: 'home' })">Go home</button>
    </div>
  </div>
</template>
