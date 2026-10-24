<template>
  <!-- NO MALL Hero Carousel — Idea 1: Product Spotlight Showcase -->
  <div
    class="nomall-carousel"
    @mouseenter="pauseInterval"
    @mouseleave="resumeInterval"
  >
    <div class="nomall-carousel-inner">
      <div
        v-for="(slide, idx) in currentSlides"
        :key="slide.id || idx"
        class="nomall-carousel-slide"
        :class="{ active: currentIndex === idx }"
      >
        <!-- Background Layer with Gradient & Subtle Art Texture -->
        <div class="spotlight-bg" :style="{ background: slide.bgGradient }">
          <div class="spotlight-bg-pattern"></div>
        </div>

        <!-- Slide Content: 2-Column Split Layout -->
        <div class="spotlight-content container-fluid px-3 px-md-4 h-100">
          <div class="row align-items-center h-100 g-3">

            <!-- ── LEFT: Campaign Headline & CTA ─────────── -->
            <div class="col-7 col-md-7 d-flex flex-column justify-content-center">
              <!-- Campaign Tag -->
              <div class="d-flex align-items-center gap-1.5 mb-1.5">
                <span class="spotlight-tag-badge">
                  <i class="bi bi-fire text-warning me-1"></i>
                  {{ slide.badge }}
                </span>
                <span class="spotlight-urgency d-none d-sm-inline-block">
                  <i class="bi bi-clock me-1"></i> Có hạn
                </span>
              </div>

              <!-- Main Headline -->
              <h2 class="spotlight-title text-white fw-extrabold mb-1.5">
                {{ slide.title }}
              </h2>

              <!-- Subtitle / Benefit -->
              <p class="spotlight-sub text-white-50 mb-2.5 d-none d-sm-block">
                {{ slide.subtitle }}
              </p>

              <!-- CTA Button -->
              <div class="d-flex align-items-center gap-2">
                <button
                  type="button"
                  class="btn-spotlight-cta"
                  @click="goToTarget(slide)"
                >
                  <span>{{ slide.buttonText }}</span>
                  <i class="bi bi-arrow-right-short fs-5"></i>
                </button>
                <span class="spotlight-hint d-none d-md-inline-block text-white-50">
                  Chính hãng 100%
                </span>
              </div>
            </div>

            <!-- ── RIGHT: Featured Product Spotlight Card ── -->
            <div class="col-5 col-md-5 d-flex justify-content-end">
              <div
                class="spotlight-card"
                @click.stop="goToProduct(slide.product)"
                :title="'Xem chi tiết: ' + slide.product.name"
              >
                <!-- Discount Pill -->
                <div class="spotlight-discount-pill">
                  -{{ slide.product.discountPct }}%
                </div>

                <!-- Product Thumbnail -->
                <div class="spotlight-thumb-wrap">
                  <img
                    :src="slide.product.image || placeholderImg"
                    :alt="slide.product.name"
                    @error="(e) => e.target.src = placeholderImg"
                  />
                </div>

                <!-- Product Quick Details -->
                <div class="spotlight-card-body min-w-0 flex-grow-1">
                  <span class="spotlight-hot-label">HOT DEAL HÔM NAY</span>
                  <div class="spotlight-product-name line-clamp-1">
                    {{ slide.product.name }}
                  </div>
                  <div class="spotlight-prices d-flex align-items-baseline gap-1.5 mt-0.5">
                    <span class="spotlight-sale-price">
                      {{ formatCurrency(slide.product.salePrice) }}
                    </span>
                    <span
                      v-if="slide.product.origPrice > slide.product.salePrice"
                      class="spotlight-orig-price d-none d-sm-inline"
                    >
                      {{ formatCurrency(slide.product.origPrice) }}
                    </span>
                  </div>

                  <!-- Mini Progress / Sold Count -->
                  <div class="spotlight-progress-wrap mt-1">
                    <div class="spotlight-progress-track">
                      <div
                        class="spotlight-progress-fill"
                        :style="{ width: Math.min(slide.product.soldPercent || 75, 100) + '%' }"
                      ></div>
                    </div>
                    <span class="spotlight-sold-label">
                      Đã bán {{ slide.product.soldCount }}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Carousel Dots / Indicators -->
    <div class="nomall-carousel-dots">
      <button
        v-for="(_, idx) in currentSlides"
        :key="idx"
        class="nomall-carousel-dot"
        :class="{ active: currentIndex === idx }"
        @click="goTo(idx)"
        :title="'Chuyển đến banner ' + (idx + 1)"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'

const router = useRouter()
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'

// Default fallback curated spotlight slides
const defaultSlides = [
  {
    id: 1,
    badge: 'ĐẠI TIỆC CÔNG NGHỆ',
    title: 'Tuần Lễ Công Nghệ Giảm Đến 35%',
    subtitle: 'Smartphone & Thiết bị số chính hãng • Bảo hành 12 tháng',
    buttonText: 'Săn Deal Ngay',
    bgGradient: 'linear-gradient(115deg, #b91c1c 0%, #dc2626 40%, #ea580c 75%, #f59e0b 120%)',
    product: {
      name: 'Vivo Smartphone Model 010',
      slug: 'vivo-smartphone-model-010',
      salePrice: 26050000,
      origPrice: 32000000,
      discountPct: 19,
      soldCount: '5.0k',
      soldPercent: 88,
      image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 2,
    badge: 'THỜI TRANG HÀNG HIỆU',
    title: 'Giảm Giá Sốc Cuối Tuần - Đón Mùa Mới',
    subtitle: 'Áo thun, phụ kiện & thời trang cao cấp chỉ từ 99K',
    buttonText: 'Khám Phá Ngay',
    bgGradient: 'linear-gradient(115deg, #1e1b4b 0%, #312e81 40%, #c026d3 80%, #f43f5e 120%)',
    product: {
      name: "Calvin Klein Men's Apparel 071",
      slug: 'calvin-klein-mens-apparel-model-071',
      salePrice: 750000,
      origPrice: 1200000,
      discountPct: 38,
      soldCount: '4.7k',
      soldPercent: 82,
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 3,
    badge: 'GIA DỤNG & NỘI THẤT',
    title: 'Đại Tiệc Freeship Toàn Quốc 0Đ',
    subtitle: 'Nội thất hiện đại & gia dụng thông minh cho ngôi nhà bạn',
    buttonText: 'Mua Ngay',
    bgGradient: 'linear-gradient(115deg, #065f46 0%, #047857 40%, #059669 75%, #10b981 120%)',
    product: {
      name: 'Fursys Furniture Model 084',
      slug: 'fursys-furniture-model-084',
      salePrice: 18400000,
      origPrice: 24000000,
      discountPct: 23,
      soldCount: '4.6k',
      soldPercent: 79,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
    },
  },
]

const currentSlides = ref(defaultSlides)
const currentIndex = ref(0)
let timer = null

function formatCurrency(val) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
}

function goTo(idx) {
  currentIndex.value = idx
  resetInterval()
}

function goToProduct(product) {
  if (product?.slug) {
    router.push({ name: 'product-detail', params: { slug: product.slug } })
  } else {
    router.push({ name: 'products' })
  }
}

function goToTarget(slide) {
  if (slide?.product?.slug) {
    router.push({ name: 'product-detail', params: { slug: slide.product.slug } })
  } else {
    router.push({ name: 'products' })
  }
}

function pauseInterval() {
  if (timer) clearInterval(timer)
}

function resumeInterval() {
  resetInterval()
}

function resetInterval() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % currentSlides.value.length
  }, 4800)
}

onMounted(async () => {
  resetInterval()

  // Enrich with live product data from database if available
  try {
    const res = await catalogService.listProducts({
      sortBy: 'sold',
      sortDir: 'desc',
      size: 3,
    })
    const items = res?.content || (Array.isArray(res) ? res : res?.data || [])
    if (items && items.length >= 3) {
      const enriched = defaultSlides.map((slide, i) => {
        const p = items[i]
        if (!p) return slide
        const sale = p.minPrice || p.price || slide.product.salePrice
        const orig = Math.round(sale * 1.3)
        return {
          ...slide,
          product: {
            name: p.name || slide.product.name,
            slug: p.slug || slide.product.slug,
            salePrice: sale,
            origPrice: orig,
            discountPct: Math.round(((orig - sale) / orig) * 100) || 25,
            soldCount: p.soldCount ? `${(p.soldCount / 1000).toFixed(1)}k` : slide.product.soldCount,
            soldPercent: Math.min(80 + i * 5, 95),
            image: p.thumbnailUrl || slide.product.image,
          },
        }
      })
      currentSlides.value = enriched
    }
  } catch (_) {
    // Keep high-conversion default slides
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.nomall-carousel {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  height: 230px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.nomall-carousel-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.nomall-carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  pointer-events: none;
}

.nomall-carousel-slide.active {
  opacity: 1;
  pointer-events: auto;
}

/* Background gradient + subtle pattern */
.spotlight-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: background 0.5s ease;
}

.spotlight-bg-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px);
  background-size: 18px 18px;
  opacity: 0.6;
}

/* Slide Content */
.spotlight-content {
  position: relative;
  z-index: 2;
}

.spotlight-tag-badge {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: inline-flex;
  align-items: center;
}

.spotlight-urgency {
  font-size: 0.65rem;
  font-weight: 700;
  color: #ffc947;
  background: rgba(255, 201, 71, 0.18);
  padding: 0.15rem 0.45rem;
  border-radius: 12px;
}

.spotlight-title {
  font-size: 1.25rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.spotlight-sub {
  font-size: 0.72rem;
  line-height: 1.35;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.btn-spotlight-cta {
  background: #ffffff;
  color: #e84a4a;
  border: none;
  border-radius: 24px;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.38rem 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-spotlight-cta:hover {
  background: #fff5f5;
  color: #c73838;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
}

.spotlight-hint {
  font-size: 0.68rem;
  font-weight: 600;
}

/* ── Spotlight Product Card (Floating on Right) ──────────── */
.spotlight-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  padding: 0.55rem 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  max-width: 290px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.spotlight-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
}

.spotlight-discount-pill {
  position: absolute;
  top: -6px;
  right: 12px;
  background: #e84a4a;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(232, 74, 74, 0.4);
  z-index: 3;
}

.spotlight-thumb-wrap {
  width: 68px;
  height: 68px;
  min-width: 68px;
  border-radius: 10px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.spotlight-thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.spotlight-card:hover .spotlight-thumb-wrap img {
  transform: scale(1.08);
}

.spotlight-hot-label {
  font-size: 0.58rem;
  font-weight: 800;
  color: #ea580c;
  letter-spacing: 0.04em;
  display: block;
}

.spotlight-product-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
}

.spotlight-sale-price {
  font-size: 0.85rem;
  font-weight: 900;
  color: #e84a4a;
  letter-spacing: -0.01em;
}

.spotlight-orig-price {
  font-size: 0.65rem;
  color: #94a3b8;
  text-decoration: line-through;
}

.spotlight-progress-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.spotlight-progress-track {
  flex: 1;
  height: 5px;
  background: #fee2e2;
  border-radius: 10px;
  overflow: hidden;
}

.spotlight-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #e84a4a 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.spotlight-sold-label {
  font-size: 0.6rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Dots */
.nomall-carousel-dots {
  position: absolute;
  bottom: 0.6rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.35rem;
  z-index: 5;
}

.nomall-carousel-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 0;
}

.nomall-carousel-dot.active {
  width: 1.35rem;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

@media (max-width: 767px) {
  .nomall-carousel {
    height: 190px;
  }
  .spotlight-title {
    font-size: 1rem;
  }
  .spotlight-thumb-wrap {
    width: 52px;
    height: 52px;
    min-width: 52px;
  }
  .spotlight-card {
    max-width: 200px;
    padding: 0.4rem;
  }
}
</style>
