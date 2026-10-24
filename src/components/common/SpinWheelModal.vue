<template>
  <div v-if="show" class="modal fade show d-block bg-slate-900/70 backdrop-blur-md z-50" tabindex="-1" @click.self="close">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-3xl border-0 overflow-hidden shadow-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
        <!-- Header -->
        <div class="p-4 text-center border-b border-white/10 position-relative">
          <span class="badge bg-amber-400 text-slate-900 font-extrabold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-1">
            <i class="bi bi-controller me-1"></i> Shopee Game
          </span>
          <h3 class="font-black text-2xl text-amber-300 mb-0">VÒNG QUAY MAY MẮN</h3>
          <p class="text-xs text-slate-300 mb-0">Quay 100% trúng Voucher & Xu tích điểm</p>
          <button type="button" class="btn-close btn-close-white position-absolute top-4 end-4" @click="close"></button>
        </div>

        <!-- Wheel Body -->
        <div class="modal-body p-6 text-center d-flex flex-column align-items-center justify-content-center position-relative">
          <!-- Pointer -->
          <div class="position-absolute top-2 z-20 text-amber-400 text-3xl filter drop-shadow-md">
            <i class="bi bi-caret-down-fill"></i>
          </div>

          <!-- Spin Wheel Visual -->
          <div class="w-64 h-64 rounded-full border-4 border-amber-400 shadow-2xl position-relative overflow-hidden my-4 transition-transform duration-[4000ms] ease-out" :style="{ transform: `rotate(${currentRotation}deg)` }">
            <div class="w-full h-full rounded-full bg-conic-gradient position-relative"></div>
          </div>

          <!-- Center Button -->
          <button
            @click="spin"
            :disabled="spinning"
            class="btn bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm px-8 py-3 rounded-full shadow-lg border-2 border-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <i class="bi bi-arrow-repeat me-1.5 animate-spin" v-if="spinning"></i>
            {{ spinning ? 'ĐANG QUAY...' : 'QUAY NGAY (100 Xu)' }}
          </button>
        </div>

        <!-- Prize Result Toast/Banner -->
        <div v-if="prizeResult" class="p-4 bg-amber-400 text-slate-950 font-bold text-center text-sm border-t border-amber-300 animate-bounce">
          🎉 chúc mừng bạn đã trúng: {{ prizeResult }}!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import confetti from 'canvas-confetti'
import { useNotifyStore } from '@/stores/notify'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])
const notify = useNotifyStore()

const spinning = ref(false)
const currentRotation = ref(0)
const prizeResult = ref(null)

const prizes = [
  'Voucher 50.000đ',
  'Miễn phí Vận Chuyển',
  '500 Shopee Xu',
  'Voucher 20k Đơn 0Đ',
  'Mã Giảm 20% Tech Mall',
  '1.000 Shopee Xu'
]

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}

const spin = () => {
  if (spinning.value) return
  spinning.value = true
  prizeResult.value = null

  const randomPrizeIndex = Math.floor(Math.random() * prizes.length)
  const extraDegrees = 360 * 5 + (randomPrizeIndex * (360 / prizes.length)) + 30
  currentRotation.value += extraDegrees

  setTimeout(() => {
    spinning.value = false
    prizeResult.value = prizes[randomPrizeIndex]
    triggerConfetti()
    notify.push(`🎉 Chúc mừng! Bạn đã quay trúng ${prizes[randomPrizeIndex]}`, 'success')
  }, 4100)
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.bg-conic-gradient {
  background: conic-gradient(
    #ef4444 0deg 60deg,
    #f59e0b 60deg 120deg,
    #10b981 120deg 180deg,
    #3b82f6 180deg 240deg,
    #8b5cf6 240deg 300deg,
    #ec4899 300deg 360deg
  );
}
</style>
