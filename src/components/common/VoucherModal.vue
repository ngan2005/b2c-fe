<template>
  <div v-if="show" class="modal fade show d-block bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity" tabindex="-1" @click.self="close">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content rounded-3xl border-0 overflow-hidden shadow-2xl">
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-500 via-rose-500 to-red-600 text-white p-5 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md d-flex align-items-center justify-content-center text-2xl">
              <i class="bi bi-ticket-perforated-fill text-amber-300"></i>
            </div>
            <div>
              <h3 class="font-extrabold text-xl mb-0">Kho Voucher Săn Deal Shopee</h3>
              <p class="text-xs text-orange-100 mb-0">Lưu mã giảm giá & Miễn phí vận chuyển toàn quốc</p>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" @click="close"></button>
        </div>

        <!-- Voucher List Body -->
        <div class="modal-body p-6 bg-slate-50 max-h-[70vh] overflow-y-auto space-y-4">
          <div v-for="(v, index) in vouchers" :key="index" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-4 transition-all hover:border-orange-300">
            <div class="d-flex align-items-center gap-3.5">
              <div :class="['w-16 h-16 rounded-2xl d-flex flex-column align-items-center justify-content-center text-white shrink-0 shadow-md', v.color]">
                <i :class="['bi text-2xl mb-0.5', v.icon]"></i>
                <span class="text-[9px] font-bold uppercase tracking-wider">{{ v.typeTag }}</span>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="badge bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]">HSD: {{ v.expiry }}</span>
                  <span v-if="v.hot" class="badge bg-rose-500 text-white font-bold px-2 py-0.5 rounded text-[10px]">HOT</span>
                </div>
                <h4 class="font-bold text-slate-900 text-sm mb-0.5">{{ v.title }}</h4>
                <p class="text-xs text-slate-500 mb-0">{{ v.minSpend }}</p>
              </div>
            </div>

            <button
              @click="claimVoucher(v)"
              :disabled="v.claimed"
              :class="[
                'btn font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm border-0 transition-all shrink-0 self-start self-sm-center',
                v.claimed
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white card-hover'
              ]"
            >
              <i :class="['bi me-1', v.claimed ? 'bi-check-circle-fill' : 'bi-download']"></i>
              {{ v.claimed ? 'Đã Lưu' : 'Lưu Mã' }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-white p-4 border-t border-slate-200 d-flex align-items-center justify-content-between">
          <span class="text-xs text-slate-500">Mã đã lưu sẽ tự động áp dụng khi thanh toán</span>
          <button type="button" class="btn btn-slate-900 bg-slate-900 text-white text-xs font-bold px-5 py-2 rounded-xl" @click="close">
            Hoàn Tất
          </button>
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

const vouchers = ref([
  { id: 1, title: 'Giảm 50.000đ đơn từ 250.000đ', minSpend: 'Áp dụng toàn bộ sản phẩm Mall', expiry: 'Hôm nay', typeTag: 'Shopee Mall', color: 'bg-rose-600', icon: 'bi-bag-check-fill', hot: true, claimed: false },
  { id: 2, title: 'Miễn phí vận chuyển 30k', minSpend: 'Đơn hàng từ 99.000đ', expiry: 'Còn 3 ngày', typeTag: 'Freeship Xtra', color: 'bg-emerald-600', icon: 'bi-truck', hot: true, claimed: false },
  { id: 3, title: 'Giảm 15% tối đa 100k', minSpend: 'Đồ điện tử & Công nghệ', expiry: 'Còn 5 ngày', typeTag: 'Voucher Xtra', color: 'bg-blue-600', icon: 'bi-cpu-fill', hot: false, claimed: false },
  { id: 4, title: 'Giảm 30.000đ đơn từ 150k', minSpend: 'Thanh toán qua Ví ShopeePay', expiry: 'Cuối tuần', typeTag: 'ShopeePay', color: 'bg-amber-600', icon: 'bi-wallet2', hot: false, claimed: false },
])

const claimVoucher = (v) => {
  v.claimed = true
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 }
  })
  notify.push(`Đã lưu "${v.title}" vào Ví Voucher của bạn!`, 'success')
}

const close = () => {
  emit('close')
}
</script>
