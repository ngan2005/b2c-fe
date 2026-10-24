<script setup>
import AppNavbar from '@/components/common/AppNavbar.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function goSeller() {
  router.push({ name: 'seller-dashboard' })
}
function goAdmin() {
  router.push({ name: 'admin-dashboard' })
}
</script>

<template>
  <div class="app-shell">
    <AppNavbar />
    <main class="container py-5 flex-grow-1">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <h1 class="display-5 fw-bold text-dark">B2C Marketplace</h1>
          <p class="lead text-muted">
            A reference marketplace backend with seller dashboards, admin tooling, and AI-powered product descriptions.
          </p>
          <div class="d-flex gap-2 mt-4">
            <template v-if="auth.isSeller">
              <button class="btn btn-primary btn-lg" @click="goSeller">
                <i class="bi bi-shop-window me-2"></i>Go to Seller Console
              </button>
            </template>
            <template v-if="auth.isAdmin">
              <button class="btn btn-dark btn-lg" @click="goAdmin">
                <i class="bi bi-shield-lock me-2"></i>Go to Admin Panel
              </button>
            </template>
            <template v-if="!auth.isAuthenticated">
              <router-link :to="{ name: 'login' }" class="btn btn-outline-primary btn-lg">
                Login to continue
              </router-link>
            </template>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <h5 class="card-title fw-semibold">Demo accounts</h5>
              <p class="text-muted small mb-3">Seeded by V2 Flyway migration (password: <code>password123</code>).</p>
              <ul class="list-unstyled mb-0 small">
                <li class="mb-2">
                  <span class="badge bg-primary">BUYER</span>
                  <code>demo.buyer@example.com</code>
                </li>
                <li>
                  <span class="badge bg-success">SELLER</span>
                  <code>demo.seller@example.com</code>
                </li>
              </ul>
              <p class="text-muted small mt-3 mb-0">Admin accounts are created via the bootstrap admin tool or by promoting a user.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
