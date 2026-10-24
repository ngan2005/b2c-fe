<template>
  <!-- NO MALL Brand Trust Badges Strip (Option 2) -->
  <div class="nomall-trust-strip">
    <div
      v-for="item in badges"
      :key="item.id"
      class="nomall-trust-item"
    >
      <div class="trust-icon-box">
        <i :class="item.icon"></i>
      </div>
      <div class="trust-text-box">
        <div class="trust-title">{{ item.title }}</div>
        <div class="trust-sub">{{ item.sub }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const badges = [
  {
    id: 'authentic',
    icon: 'bi bi-shield-check',
    title: '100% Chính Hãng',
    sub: 'Đảm bảo nguồn gốc',
  },
  {
    id: 'freeship',
    icon: 'bi bi-truck',
    title: 'Freeship Từ 0đ',
    sub: 'Miễn phí vận chuyển',
  },
  {
    id: 'return',
    icon: 'bi bi-arrow-repeat',
    title: '7 Ngày Đổi Trả',
    sub: 'Thủ tục nhanh chóng',
  },
  {
    id: 'speed',
    icon: 'bi bi-lightning-charge-fill',
    title: 'Giao Nhanh 2H',
    sub: 'Nhận hàng an tâm',
  },
]
</script>
