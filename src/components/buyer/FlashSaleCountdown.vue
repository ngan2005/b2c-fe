<template>
  <!-- NO MALL Flash Sale Section with Countdown -->
  <div class="nomall-flashsale">
    <!-- Header -->
    <div class="nomall-flashsale-header">
      <div class="nomall-flashsale-title">
        <i class="bi bi-lightning-charge-fill me-1"></i>
        GIÁ TỐT MỖI NGÀY
      </div>

      <!-- Countdown timer -->
      <div class="nomall-countdown ms-auto">
        <div class="nomall-countdown-unit">
          <span class="nomall-countdown-num">{{ pad(countdown.days) }}</span>
          <span class="nomall-countdown-label">Ngày</span>
        </div>
        <span class="nomall-countdown-sep">:</span>
        <div class="nomall-countdown-unit">
          <span class="nomall-countdown-num">{{ pad(countdown.hours) }}</span>
          <span class="nomall-countdown-label">Giờ</span>
        </div>
        <span class="nomall-countdown-sep">:</span>
        <div class="nomall-countdown-unit">
          <span class="nomall-countdown-num">{{ pad(countdown.mins) }}</span>
          <span class="nomall-countdown-label">Phút</span>
        </div>
        <span class="nomall-countdown-sep">:</span>
        <div class="nomall-countdown-unit" :style="countdown.secs % 2 === 0 ? 'background:rgba(255,201,71,0.3)' : ''">
          <span class="nomall-countdown-num">{{ pad(countdown.secs) }}</span>
          <span class="nomall-countdown-label">Giây</span>
        </div>
      </div>

      <router-link
        :to="{ name: 'products' }"
        class="btn btn-sm ms-3 d-none d-sm-inline-flex align-items-center gap-1"
        style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); border-radius:20px; font-size:0.75rem; font-weight:700;"
      >
        Xem thêm <i class="bi bi-chevron-right"></i>
      </router-link>
    </div>

    <!-- Products Grid -->
    <div class="row g-2 p-2">
      <div
        v-for="(product, idx) in products"
        :key="product.id || idx"
        class="col-6 col-sm-4 col-md-4 col-xl-3 col-xxl-2 p-1"
      >
        <NomallProductCard
          :product="product"
          :sold-percent="getSoldPercent(product, idx)"
          compact
          @add-to-cart="$emit('add-to-cart', product)"
          @click="$emit('view-detail', product)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import NomallProductCard from '@/components/buyer/ProductCard.vue'

defineProps({
  products: { type: Array, default: () => [] },
})

defineEmits(['add-to-cart', 'view-detail'])

const countdown = ref({ days: '04', hours: '13', mins: '34', secs: '56' })
let timer = null

const pad = (n) => String(n).padStart(2, '0')

const startCountdown = () => {
  // Default: 4 days 13h 34m 56s from now
  let total = 4 * 86400 + 13 * 3600 + 34 * 60 + 56
  timer = setInterval(() => {
    if (total <= 0) { clearInterval(timer); return }
    total--
    const d = Math.floor(total / 86400)
    const h = Math.floor((total % 86400) / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    countdown.value = {
      days: pad(d),
      hours: pad(h),
      mins: pad(m),
      secs: pad(s),
    }
  }, 1000)
}

const getSoldPercent = (product, idx) => {
  if (product.soldPercent) return product.soldPercent
  // Fake progressive sold %
  return Math.min(5 + idx * 18, 95)
}

onMounted(() => { startCountdown() })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
