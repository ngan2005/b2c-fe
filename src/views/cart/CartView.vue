<template>
  <!-- [PASTEL-REDESIGN] CartView -->
  <div class="bg-cream min-vh-100 py-4">
    <div class="container">

      <!-- Title -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="d-flex align-items-center justify-content-center"
          style="width: 3rem; height: 3rem; border-radius: 16px; background: var(--pastel-coral); color: #fff; font-size: 1.25rem;">
          <i class="bi bi-cart3"></i>
        </div>
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; color: var(--pastel-ink); margin: 0; letter-spacing: -0.02em;">Giỏ Hàng Của Bạn</h1>
          <span v-if="cartStore.items.length > 0" style="font-size: 0.8125rem; color: var(--pastel-muted); font-weight: 600;">{{ cartStore.totalItemsCount }} sản phẩm</span>
        </div>
      </div>

      <LoadingSpinner v-if="cartStore.loading" text="Đang tải giỏ hàng..." />

      <EmptyState
        v-else-if="cartStore.items.length === 0"
        icon="bi bi-cart-x"
        title="Giỏ hàng trống"
        description="Khám phá hàng ngàn sản phẩm chất lượng trên B2C Market."
      >
        <template #action>
          <router-link :to="{ name: 'products' }" class="btn-coral text-decoration-none" style="padding: 0.6rem 1.5rem; font-size: 0.875rem;">
            Tiếp tục mua sắm <i class="bi bi-arrow-right ms-1"></i>
          </router-link>
        </template>
      </EmptyState>

      <div v-else class="row g-4">
        <!-- ── Cart Items ─────────────────────────────────── -->
        <div class="col-lg-8">
          <div class="card-pastel" style="padding: 0; overflow: hidden;">
            <!-- Header row -->
            <div class="d-none d-md-flex align-items-center p-3"
              style="background: var(--pastel-cream); border-bottom: 1.5px solid var(--pastel-border); font-size: 0.8125rem; font-weight: 700; color: var(--pastel-muted); text-transform: uppercase; letter-spacing: 0.05em;">
              <div style="width: 2.5rem; text-align: center;"><input type="checkbox" class="form-check-input" :checked="allSelected" @change="toggleAll" /></div>
              <div class="flex-grow-1 ms-3">Sản phẩm</div>
              <div style="width: 8rem; text-align: center;">Đơn giá</div>
              <div style="width: 8rem; text-align: center;">Số lượng</div>
              <div style="width: 8rem; text-align: end;" class="me-3">Thành tiền</div>
              <div style="width: 2rem;"></div>
            </div>

            <!-- Items -->
            <div>
              <div
                v-for="item in cartStore.items"
                :key="item.id"
                class="p-3 d-flex flex-column flex-md-row align-items-center gap-3"
                style="border-bottom: 1px solid var(--pastel-border);"
              >
                <div style="width: 2.5rem; text-align: center;">
                  <input type="checkbox" class="form-check-input" :checked="item.isSelected" @change="onToggleItemSelect(item)" />
                </div>

                <img :src="item.imageUrl || placeholderImg" :alt="item.productName"
                  style="width: 5rem; height: 5rem; object-fit: cover; border-radius: 16px; border: 1.5px solid var(--pastel-border); flex-shrink: 0;" />

                <div class="flex-grow-1">
                  <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--pastel-ink); margin-bottom: 0.25rem; line-height: 1.4;">
                    {{ item.productName || 'Sản phẩm' }}
                  </h4>
                  <span v-if="item.variantName" class="pill-chip pill-chip-lavender" style="font-size: 0.65rem;">{{ item.variantName }}</span>
                </div>

                <div style="width: 8rem; text-align: center; font-weight: 700; font-size: 0.875rem; color: var(--pastel-ink);">
                  {{ formatCurrency(item.priceSnapshot) }}
                </div>

                <div style="width: 8rem; display: flex; justify-content: center;">
                  <div class="qty-stepper">
                    <button @click="onUpdateQty(item, item.quantity - 1)" :disabled="item.quantity <= 1">−</button>
                    <input type="number" :value="item.quantity" @change="onQtyInputChange(item, $event)" />
                    <button @click="onUpdateQty(item, item.quantity + 1)">+</button>
                  </div>
                </div>

                <div style="width: 8rem; text-align: end; font-weight: 800; font-size: 1rem; color: var(--pastel-coral-dark);" class="me-3">
                  {{ formatCurrency(item.priceSnapshot * item.quantity) }}
                </div>

                <button class="btn" @click="onRemoveItem(item.id)"
                  style="color: var(--pastel-muted); border: none; background: none; font-size: 1rem; padding: 0; cursor: pointer; transition: color 0.2s;"
                  title="Xóa sản phẩm"
                  @mouseover="$event.target.style.color='var(--pastel-coral-dark)'"
                  @mouseout="$event.target.style.color='var(--pastel-muted)'">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Summary Card ─────────────────────────────────── -->
        <div class="col-lg-4">
          <div class="card-pastel sticky-top" style="top: 5rem; z-index: 10;">
            <h3 class="fw-bold mb-3 pb-3" style="font-size: 1rem; color: var(--pastel-ink); border-bottom: 1.5px solid var(--pastel-border);">
              Tóm Tắt Đơn Hàng
            </h3>

            <div class="d-flex flex-column gap-2 mb-3" style="font-size: 0.875rem;">
              <div class="d-flex justify-content-between">
                <span style="color: var(--pastel-muted);">Tạm tính</span>
                <span class="fw-bold" style="color: var(--pastel-ink);">{{ formatCurrency(cartStore.subtotalPrice) }}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span style="color: var(--pastel-muted);">Phí vận chuyển</span>
                <span class="fw-bold" style="color: #5bb88a;">Miễn phí</span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-baseline pt-3 mb-4" style="border-top: 1.5px solid var(--pastel-border);">
              <span class="fw-bold" style="font-size: 0.9375rem; color: var(--pastel-ink);">Tổng tiền</span>
              <span class="fw-extrabold" style="font-size: 1.5rem; color: var(--pastel-coral-dark);">{{ formatCurrency(cartStore.subtotalPrice) }}</span>
            </div>

            <button class="btn-coral w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
              :disabled="cartStore.subtotalPrice === 0"
              style="font-size: 0.9375rem; padding: 0.75rem;"
              @click="goToCheckout">
              Đặt hàng ngay <i class="bi bi-arrow-right"></i>
            </button>

            <router-link :to="{ name: 'products' }"
              class="d-block text-center"
              style="font-size: 0.8125rem; color: var(--pastel-muted); font-weight: 600; text-decoration: none;">
              <i class="bi bi-arrow-left me-1"></i> Tiếp tục chọn sản phẩm khác
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const cartStore = useCartStore()
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

onMounted(() => { cartStore.fetchCart() })

const allSelected = computed(() => cartStore.items.length > 0 && cartStore.items.every(i => i.isSelected))
const toggleAll = () => {
  const target = !allSelected.value
  cartStore.items.forEach(i => cartStore.updateQuantity(i.id, i.quantity, target))
}

const onToggleItemSelect = (item) => cartStore.updateQuantity(item.id, item.quantity, !item.isSelected)
const onUpdateQty = (item, newQty) => { if (newQty < 1) return; cartStore.updateQuantity(item.id, newQty, item.isSelected) }
const onQtyInputChange = (item, e) => { const val = parseInt(e.target.value) || 1; onUpdateQty(item, Math.max(1, val)) }
const onRemoveItem = (id) => cartStore.removeItem(id)
const goToCheckout = () => router.push({ name: 'checkout' })
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
</script>
