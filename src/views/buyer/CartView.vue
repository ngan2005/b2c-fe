<template>
  <!-- NO MALL Cart View -->
  <div style="background: var(--nomall-bg); min-height: 100vh;" class="pb-5">

    <!-- Breadcrumb -->
    <div style="background: #fff; border-bottom: 1px solid var(--nomall-border); padding: 0.5rem 0;">
      <div class="container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
          <span style="color: var(--nomall-red); font-weight: 700;">Giỏ hàng</span>
        </nav>
      </div>
    </div>

    <div class="container mt-3">

      <!-- Title -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="d-flex align-items-center justify-content-center"
          style="width: 3rem; height: 3rem; border-radius: 50%; background: var(--nomall-red); color: #fff; font-size: 1.25rem;">
          <i class="bi bi-cart3"></i>
        </div>
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 900; color: var(--nomall-ink); margin: 0;">Giỏ Hàng Của Bạn</h1>
          <span v-if="cartStore.items.length > 0" style="font-size: 0.8125rem; color: var(--nomall-muted); font-weight: 600;">
            {{ cartStore.totalItemsCount }} sản phẩm
          </span>
        </div>
      </div>

      <LoadingSpinner v-if="cartStore.loading" text="Đang tải giỏ hàng..." />

      <!-- Empty cart -->
      <div v-else-if="cartStore.items.length === 0" class="nomall-empty nomall-card p-5 text-center">
        <i class="bi bi-cart-x" style="font-size: 4rem; color: var(--nomall-border);"></i>
        <h3>Giỏ hàng trống</h3>
        <p>Khám phá hàng ngàn sản phẩm chất lượng trên NO MALL.</p>
        <router-link :to="{ name: 'products' }" class="nomall-btn-primary text-decoration-none" style="font-size: 0.875rem;">
          Tiếp tục mua sắm <i class="bi bi-arrow-right"></i>
        </router-link>
      </div>

      <div v-else class="row g-4">

        <!-- ── Cart Items ─────────────────────────────── -->
        <div class="col-lg-8">
          <div class="nomall-card" style="padding: 0; overflow: hidden;">

            <!-- Header row -->
            <div class="d-none d-md-flex align-items-center p-3"
              style="background: var(--nomall-bg); border-bottom: 1.5px solid var(--nomall-border); font-size: 0.8125rem; font-weight: 700; color: var(--nomall-muted);">
              <div style="width: 2.5rem; text-align: center;">
                <input type="checkbox" class="form-check-input" :checked="allSelected" @change="toggleAll" style="accent-color: var(--nomall-red);" />
              </div>
              <div class="flex-grow-1 ms-3">Sản phẩm</div>
              <div style="width: 8rem; text-align: center;">Đơn giá</div>
              <div style="width: 7rem; text-align: center;">Số lượng</div>
              <div style="width: 7rem; text-align: end;" class="me-3">Thành tiền</div>
              <div style="width: 2rem;"></div>
            </div>

            <!-- Items grouped by Shop -->
            <div>
              <div
                v-for="shop in shopGroups"
                :key="shop.sellerId"
                class="shop-cart-section border-bottom"
              >
                <!-- Shop Header row -->
                <div class="d-flex align-items-center gap-2 p-3" style="background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--nomall-border);">
                  <div style="width: 2.5rem; text-align: center; flex-shrink: 0;">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      :checked="isShopAllSelected(shop)"
                      @change="toggleShop(shop)"
                      style="accent-color: var(--nomall-red);"
                    />
                  </div>
                  <i class="bi bi-shop text-danger fs-6"></i>
                  <span class="fw-bold text-dark" style="font-size: 0.875rem;">{{ shop.shopName }}</span>
                  <span class="badge" style="background: rgba(224, 83, 83, 0.12); color: var(--nomall-red); font-size: 0.6875rem; font-weight: 700; border-radius: 4px;">Mall</span>
                </div>

                <!-- Items inside this shop -->
                <div
                  v-for="item in shop.items"
                  :key="item.id"
                  class="nomall-cart-item flex-column flex-md-row"
                >
                  <!-- Checkbox -->
                  <div style="width: 2.5rem; text-align: center; flex-shrink: 0;">
                    <input type="checkbox" class="form-check-input" :checked="item.isSelected !== false" @change="onToggleSelect(item)" style="accent-color: var(--nomall-red);" />
                  </div>

                  <!-- Image -->
                  <img :src="item.thumbnailUrl || item.imageUrl || placeholderImg" :alt="item.productName"
                    style="width: 5rem; height: 5rem; object-fit: cover; border-radius: 10px; border: 1.5px solid var(--nomall-border); flex-shrink: 0;" />

                  <!-- Info -->
                  <div class="flex-grow-1 mt-2 mt-md-0">
                    <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--nomall-ink); margin-bottom: 0.25rem; line-height: 1.4;">
                      {{ item.productName || 'Sản phẩm' }}
                    </h4>
                    <span v-if="item.variantName" style="font-size: 0.75rem; color: var(--nomall-muted); background: var(--nomall-bg); padding: 0.125rem 0.5rem; border-radius: 4px; display: inline-block;">
                      {{ item.variantName }}
                    </span>
                  </div>

                  <!-- Unit price (desktop) -->
                  <div style="width: 8rem; text-align: center; font-weight: 700; font-size: 0.875rem; color: var(--nomall-ink); flex-shrink: 0;" class="d-none d-md-block">
                    {{ formatCurrency(item.priceSnapshot) }}
                  </div>

                  <!-- Qty stepper -->
                  <div style="width: 7rem; display: flex; justify-content: center; flex-shrink: 0;" class="d-none d-md-block">
                    <div class="nomall-qty">
                      <button @click="onUpdateQty(item, Math.max(1, item.quantity - 1))">−</button>
                      <input type="number" :value="item.quantity" @change="e => onQtyInput(item, e)" />
                      <button @click="onUpdateQty(item, item.quantity + 1)">+</button>
                    </div>
                  </div>

                  <!-- Total -->
                  <div style="width: 7rem; text-align: end; font-weight: 800; font-size: 1rem; color: var(--nomall-red); flex-shrink: 0;" class="d-none d-md-block me-3">
                    {{ formatCurrency(item.priceSnapshot * item.quantity) }}
                  </div>

                  <!-- Remove (desktop) -->
                  <div style="width: 2rem; text-align: center; flex-shrink: 0;" class="d-none d-md-block">
                    <button class="btn btn-sm p-0 border-0" @click="onRemove(item.id)" title="Xóa khỏi giỏ hàng" style="color: var(--nomall-muted); background: none;">
                      <i class="bi bi-trash fs-5 hover-danger"></i>
                    </button>
                  </div>

                  <!-- Remove (mobile) -->
                  <button class="btn d-md-none mt-2" @click="onRemove(item.id)" style="color: var(--nomall-muted); border: none; background: none; align-self: flex-end;">
                    <i class="bi bi-trash"></i>
                  </button>

                  <!-- Mobile: show price + qty inline -->
                  <div class="d-md-none w-100 d-flex align-items-center justify-content-between mt-2">
                    <span style="font-weight: 700; font-size: 0.875rem; color: var(--nomall-ink);">{{ formatCurrency(item.priceSnapshot * item.quantity) }}</span>
                    <div class="nomall-qty" style="height: 1.75rem;">
                      <button @click="onUpdateQty(item, Math.max(1, item.quantity - 1))" style="width: 1.75rem; font-size: 0.875rem;">−</button>
                      <input type="number" :value="item.quantity" @change="e => onQtyInput(item, e)" style="width: 2rem; font-size: 0.8125rem;" />
                      <button @click="onUpdateQty(item, item.quantity + 1)" style="width: 1.75rem; font-size: 0.875rem;">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Summary ───────────────────────────────── -->
        <div class="col-lg-4">
          <div class="nomall-card p-3 position-sticky" style="top: 100px;">
            <h3 class="fw-bold mb-3 pb-3" style="font-size: 1rem; color: var(--nomall-ink); border-bottom: 1.5px solid var(--nomall-border);">
              Tóm Tắt Đơn Hàng
            </h3>

            <div class="d-flex flex-column gap-2 mb-3" style="font-size: 0.875rem;">
              <div class="d-flex justify-content-between">
                <span style="color: var(--nomall-muted);">Tạm tính</span>
                <span class="fw-bold" style="color: var(--nomall-ink);">{{ formatCurrency(cartStore.subtotalPrice) }}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span style="color: var(--nomall-muted);">Giảm giá</span>
                <span class="fw-bold" style="color: var(--nomall-red);">-0đ</span>
              </div>
              <div class="d-flex justify-content-between">
                <span style="color: var(--nomall-muted);">Phí vận chuyển</span>
                <span class="fw-bold" style="color: #5bb88a;">Miễn phí</span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-baseline pt-3 mb-4" style="border-top: 1.5px solid var(--nomall-border);">
              <span class="fw-bold" style="font-size: 0.9375rem; color: var(--nomall-ink);">Tổng tiền</span>
              <span class="fw-extrabold" style="font-size: 1.5rem; color: var(--nomall-red);">{{ formatCurrency(cartStore.subtotalPrice) }}</span>
            </div>

            <button
              class="nomall-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              :disabled="cartStore.subtotalPrice === 0"
              style="font-size: 0.9375rem; padding: 0.75rem;"
              @click="goToCheckout"
            >
              Đặt hàng ngay <i class="bi bi-arrow-right"></i>
            </button>

            <router-link :to="{ name: 'products' }"
              class="d-block text-center mt-3"
              style="font-size: 0.8125rem; color: var(--nomall-muted); font-weight: 600; text-decoration: none;">
              <i class="bi bi-arrow-left me-1"></i> Tiếp tục chọn sản phẩm khác
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const cartStore = useCartStore()
const placeholderImg = 'https://picsum.photos/seed/cart/200/200'

onMounted(() => { cartStore.fetchCart() })

const allSelected = computed(() => cartStore.items.length > 0 && cartStore.items.every(i => i.isSelected !== false))

const shopGroups = computed(() => {
  const groups = {}
  for (const item of cartStore.items) {
    const sId = item.sellerId || 0
    if (!groups[sId]) {
      groups[sId] = {
        sellerId: sId,
        shopName: item.shopName || 'Gian hàng đối tác',
        items: [],
      }
    }
    groups[sId].items.push(item)
  }
  return Object.values(groups)
})

const isShopAllSelected = (shop) => {
  return shop.items.length > 0 && shop.items.every(i => i.isSelected !== false)
}

const toggleShop = (shop) => {
  const target = !isShopAllSelected(shop)
  shop.items.forEach(i => cartStore.updateQuantity(i.id, i.quantity, target))
}

const toggleAll = () => {
  const target = !allSelected.value
  cartStore.items.forEach(i => cartStore.updateQuantity(i.id, i.quantity, target))
}

const onToggleSelect = (item) => {
  cartStore.updateQuantity(item.id, item.quantity, !item.isSelected)
}

const onUpdateQty = (item, newQty) => {
  if (newQty < 1) return
  cartStore.updateQuantity(item.id, newQty, item.isSelected !== false)
}

const onQtyInput = (item, e) => {
  const val = parseInt(e.target.value) || 1
  cartStore.updateQuantity(item.id, Math.max(1, val), item.isSelected !== false)
}

const onRemove = (id) => cartStore.removeItem(id)

const goToCheckout = () => router.push({ name: 'checkout' })

const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)
</script>
