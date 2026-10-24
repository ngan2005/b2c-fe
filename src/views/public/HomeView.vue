<template>
  <!-- [PASTEL-REDESIGN] HomeView -->
  <div class="bg-cream min-vh-100 pb-5 pt-3">

    <div class="container">

      <!-- ── 0. ANNOUNCEMENT MARQUEE ──────────────────────── -->
      <section class="card-pastel mb-4 overflow-hidden" style="padding: 0.75rem 1.25rem; border-color: var(--pastel-pink) !important;">
        <div class="d-flex align-items-center gap-3">
          <span class="badge-strip flex-shrink-0" style="background: var(--pastel-butter); color: #7a5f00;">
            <i class="bi bi-megaphone-fill"></i> TIN HOT
          </span>
          <div style="mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); overflow: hidden; flex: 1;">
            <div style="display: inline-flex; gap: 3rem; animation: marquee-scroll 22s linear infinite; white-space: nowrap; will-change: transform;"
              class="d-flex align-items-center gap-8">
              <span style="font-size: 0.8125rem; font-weight: 600;">🔥 Super Sale 10/10: Giảm tới 50% cho toàn bộ thiết bị điện tử!</span>
              <span style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-coral-dark);">⚡ Miễn phí vận chuyển toàn quốc cho đơn từ 300.000đ</span>
              <span style="font-size: 0.8125rem; font-weight: 600; color: #5bb88a;">🎁 Tặng Voucher 200.000đ cho tài khoản mới</span>
              <span style="font-size: 0.8125rem; font-weight: 600; color: #9b74d1;">⭐ Cam kết 100% hàng thật, hoàn tiền 200% nếu phát hiện hàng giả</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 1. HERO SECTION ──────────────────────────────── -->
      <section class="hero-blob mb-4">
        <div class="row g-4">
          <!-- Left: category sidebar -->
          <div class="col-lg-3 col-md-4">
            <div class="card-pastel p-3">
              <router-link
                v-for="(cat, idx) in rootCategories"
                :key="cat.id || idx"
                :to="{ name: 'products', query: { categoryId: cat.id } }"
                class="d-flex align-items-center justify-content-between py-2 px-3 rounded-3 text-decoration-none transition-all"
                style="font-size: 0.8125rem; font-weight: 600; color: var(--pastel-ink);"
                :style="idx === 0 ? 'background: var(--pastel-pink); color: var(--pastel-ink); font-weight: 700;' : 'color: var(--pastel-muted);'"
                :class="'hover-bg-pink'"
              >
                <span>{{ cat.name }}</span>
                <i class="bi bi-chevron-right" style="font-size: 0.75rem;"></i>
              </router-link>
            </div>
          </div>

          <!-- Center: Hero carousel -->
          <div class="col-lg-6 col-md-8">
            <div class="card-pastel h-100 position-relative overflow-hidden d-flex flex-column justify-content-center"
              :style="'min-height: 320px; background: linear-gradient(135deg, ' + heroSlides[currentSlideIndex].bgStart + ' 0%, ' + heroSlides[currentSlideIndex].bgEnd + ' 100%);'">
              <!-- Inline SVG blob decoration -->
              <svg class="position-absolute" style="top: -20%; right: -10%; width: 55%; height: 140%; opacity: 0.15; pointer-events: none; z-index: 0;" viewBox="0 0 500 500">
                <path fill="white" d="M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,354Q39,301,29.5,227Q20,153,70,99Q120,45,193.5,25Q267,5,323.5,60Q380,115,425.5,192.5Q471,270,440.5,320.5Z"/>
              </svg>

              <Transition name="fade-slide" mode="out-in">
                <div :key="currentSlideIndex" class="d-flex flex-column justify-content-center h-100 position-relative p-5" style="z-index: 1;">
                  <span class="badge-strip mb-2 align-self-start" :style="'background: ' + heroSlides[currentSlideIndex].badgeBg + '; color: ' + heroSlides[currentSlideIndex].badgeColor + ';'">
                    {{ heroSlides[currentSlideIndex].subtitle }}
                  </span>
                  <h2 class="fw-extrabold mb-3" style="font-size: 1.75rem; color: var(--pastel-ink); line-height: 1.2;">
                    {{ heroSlides[currentSlideIndex].title }}
                  </h2>
                  <router-link :to="{ name: 'products' }"
                    class="btn-coral align-self-start d-inline-flex align-items-center gap-2"
                    style="font-size: 0.8125rem; padding: 0.5rem 1.25rem; text-decoration: none;">
                    {{ heroSlides[currentSlideIndex].buttonText }} <i class="bi bi-chevron-right" style="font-size: 0.75rem;"></i>
                  </router-link>
                </div>
              </Transition>

              <!-- Carousel dots -->
              <div class="position-absolute bottom-3 start-5 d-flex gap-2" style="z-index: 2;">
                <button
                  v-for="(_, sIdx) in heroSlides"
                  :key="sIdx"
                  @click="currentSlideIndex = sIdx"
                  :style="currentSlideIndex === sIdx
                    ? 'width: 1.5rem; height: 0.5rem; border-radius: 9999px; background: var(--pastel-coral-dark); border: none; cursor: pointer; transition: all 0.3s;'
                    : 'width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgba(255,255,255,0.5); border: none; cursor: pointer; transition: all 0.3s;'"
                ></button>
              </div>
            </div>
          </div>

          <!-- Right: seller promo card -->
          <div class="col-lg-3 d-none d-lg-block">
            <div class="card-pastel h-100 d-flex flex-column justify-content-between p-4 position-relative overflow-hidden"
              style="background: linear-gradient(135deg, var(--pastel-lavender) 0%, var(--pastel-pink) 100%); border-color: var(--pastel-lavender) !important;">
              <div style="z-index: 1;">
                <span class="badge-strip mb-2" style="background: rgba(255,255,255,0.5); color: var(--pastel-ink);">
                  <i class="bi bi-star-fill"></i> SELLER
                </span>
                <h3 class="fw-extrabold mb-2" style="font-size: 1rem; color: var(--pastel-ink); line-height: 1.3;">
                  Nhận ngay Voucher 200.000đ khi đăng ký nhà bán mới
                </h3>
              </div>
              <div style="z-index: 1;">
                <router-link :to="{ name: 'apply-seller' }"
                  class="btn-coral d-inline-flex align-items-center gap-2"
                  style="font-size: 0.8rem; padding: 0.4rem 1rem; text-decoration: none;">
                  Nhận ưu đãi <i class="bi bi-arrow-right" style="font-size: 0.75rem;"></i>
                </router-link>
              </div>
              <!-- Decorative SVG -->
              <svg class="position-absolute" style="bottom: -10%; right: -10%; width: 70%; opacity: 0.15; pointer-events: none;" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="var(--pastel-ink)"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 1.5 SHOPEE QUICK FEATURES ───────────────────── -->
      <section class="card-pastel mb-4">
        <div class="row g-3 text-center">
          <div v-for="(feat, fIdx) in shopeeFeatures" :key="fIdx" class="col-4 col-sm-3 col-md-2 col-lg-1.2">
            <div @click="handleFeatureClick(feat)"
              class="d-flex flex-column align-items-center text-decoration-none cursor-pointer">
              <div class="d-flex align-items-center justify-content-center mb-2 card-hover"
                :style="'width: 3rem; height: 3rem; border-radius: 16px; background: ' + feat.bgColor + '; color: ' + feat.textColor + '; font-size: 1.25rem; transition: all 0.3s;'">
                <i :class="feat.icon"></i>
              </div>
              <span style="font-size: 0.7rem; font-weight: 700; color: var(--pastel-muted); line-height: 1.3; text-align: center;">
                {{ feat.title }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 2. FLASH SALE COUNTDOWN ──────────────────────── -->
      <section class="card-pastel mb-4 overflow-hidden" style="padding: 0;">
        <div class="row g-0 align-items-stretch">
          <!-- Countdown panel -->
          <div class="col-xl-3 col-lg-4 p-4 d-flex flex-column justify-content-between"
            style="border-right: 1.5px solid var(--pastel-border); background: linear-gradient(135deg, var(--pastel-pink) 0%, var(--pastel-cream) 100%);">
            <div>
              <span class="badge-strip mb-2" style="background: var(--pastel-coral-dark); color: #fff;">
                <i class="bi bi-lightning-charge-fill"></i> FLASH SALE
              </span>
              <h3 class="fw-extrabold mb-1" style="font-size: 1.25rem; color: var(--pastel-ink);">Khuyến Mãi Giá Sốc</h3>
              <p style="font-size: 0.75rem; color: var(--pastel-muted); margin-bottom: 1rem;">Sản phẩm công nghệ & đời sống</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="countdown-box">{{ countdown.days }}<span>Ngày</span></div>
              <span class="fw-bold" style="color: var(--pastel-ink);">:</span>
              <div class="countdown-box">{{ countdown.hours }}<span>Giờ</span></div>
              <span class="fw-bold" style="color: var(--pastel-ink);">:</span>
              <div class="countdown-box">{{ countdown.mins }}<span>Phút</span></div>
              <span class="fw-bold" style="color: var(--pastel-ink);">:</span>
              <div class="countdown-box anim-pulse-soft">{{ countdown.secs }}<span>Giây</span></div>
            </div>
          </div>

          <!-- Products grid -->
          <div class="col-xl-9 col-lg-8">
            <LoadingSpinner v-if="loadingDeals" />
            <div v-else class="row g-0">
              <div
                v-for="(item, idx) in dealProducts"
                :key="item.id || idx"
                class="col-6 col-sm-4 col-md-3 col-lg-2.4 p-3 d-flex flex-column align-items-center justify-content-between cursor-pointer card-hover"
                style="border-right: 1px solid var(--pastel-border); border-bottom: 1px solid var(--pastel-border);"
                @click="goToDetail(item.slug)"
              >
                <div class="mb-2 d-flex align-items-center justify-content-center w-100" style="aspect-ratio: 1;">
                  <img :src="item.thumbnailUrl || placeholderImg" :alt="item.name"
                    style="max-height: 90px; max-width: 90%; object-fit: contain; mix-blend-mode: multiply;" />
                </div>
                <div class="w-100">
                  <p class="mb-1 text-truncate" style="font-size: 0.75rem; font-weight: 600; color: var(--pastel-ink); line-height: 1.3;">{{ item.name }}</p>
                  <div class="fw-extrabold mb-1" style="font-size: 0.875rem; color: var(--pastel-coral-dark);">{{ formatVND(item.minPrice) }}</div>
                  <span class="badge-strip mb-1" style="background: var(--pastel-coral-dark); color: #fff; font-size: 0.65rem;">
                    -{{ calculateDiscount(item) }}%
                  </span>
                  <div class="mt-1">
                    <div class="progress" style="height: 4px;">
                      <div class="progress-bar" :style="'width: ' + ((idx + 2) * 18) + '%; background: linear-gradient(90deg, var(--pastel-coral), var(--pastel-peach));'"></div>
                    </div>
                    <p style="font-size: 0.6rem; font-weight: 800; color: var(--pastel-coral-dark); margin: 2px 0 0; text-transform: uppercase;">
                      🔥 ĐÃ BÁN {{ (idx + 2) * 18 }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 3. HOME & OUTDOOR PRODUCTS ──────────────────── -->
      <section class="card-pastel mb-4 overflow-hidden" style="padding: 0;">
        <div class="row g-0">
          <!-- Banner left -->
          <div class="col-lg-3 p-4 d-flex flex-column justify-content-between position-relative"
            style="min-height: 240px; background: linear-gradient(160deg, rgba(184,232,212,0.6) 0%, rgba(255,214,224,0.6) 100%), url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80') center/cover no-repeat;">
            <div style="z-index: 1;">
              <span class="badge-strip mb-2" style="background: var(--pastel-mint); color: #2d6a4f;">MỚI</span>
              <h3 class="fw-extrabold" style="font-size: 1rem; color: var(--pastel-ink); line-height: 1.3;">
                Đồ Dùng Gia Đình & Nội Thất Hiện Đại
              </h3>
            </div>
            <div style="z-index: 1;">
              <router-link :to="{ name: 'products' }"
                class="btn-coral d-inline-flex align-items-center gap-1"
                style="font-size: 0.75rem; padding: 0.4rem 0.875rem; text-decoration: none;">
                Xem tất cả <i class="bi bi-chevron-right" style="font-size: 0.7rem;"></i>
              </router-link>
            </div>
          </div>

          <!-- Product grid -->
          <div class="col-lg-9">
            <LoadingSpinner v-if="loadingHomeProducts" />
            <div v-else class="row g-0">
              <div
                v-for="(p, idx) in homeOutdoorProducts"
                :key="p.id || idx"
                class="col-6 col-md-3 p-3 d-flex align-items-center justify-content-between cursor-pointer card-hover"
                style="border-left: 1px solid var(--pastel-border); border-bottom: 1px solid var(--pastel-border);"
                @click="goToDetail(p.slug)"
              >
                <div class="pe-2">
                  <p class="mb-1" style="font-size: 0.75rem; font-weight: 600; color: var(--pastel-ink); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ p.name }}</p>
                  <p style="font-size: 0.65rem; color: var(--pastel-muted); margin-bottom: 2px;">Chỉ từ</p>
                  <p style="font-size: 0.75rem; font-weight: 800; color: var(--pastel-coral-dark); margin: 0;">{{ formatVND(p.minPrice) }}</p>
                </div>
                <img :src="p.thumbnailUrl || placeholderImg" :alt="p.name"
                  style="width: 3.5rem; height: 3.5rem; object-fit: contain; border-radius: 12px; flex-shrink: 0; mix-blend-mode: multiply;" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 4. LATEST PRODUCTS ──────────────────────────── -->
      <section id="latest-products-section" class="mb-4">
        <!-- Section header -->
        <div class="d-flex align-items-center gap-3 mb-3">
          <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--pastel-ink); letter-spacing: -0.02em; margin: 0;">Gợi Ý Hôm Nay</h2>
          <span class="badge-strip" style="background: var(--pastel-coral); color: #fff;">
            <i class="bi bi-stars"></i> MỚI
          </span>
        </div>

        <!-- Tab bar -->
        <div class="card-pastel mb-3" style="padding: 0.5rem;">
          <div class="d-flex gap-2 flex-wrap">
            <button
              v-for="(tab, tIdx) in shopeeSuggestTabs"
              :key="tIdx"
              @click="activeSuggestTab = tIdx"
              :style="activeSuggestTab === tIdx
                ? 'background: var(--pastel-coral); color: #fff; border: none; border-radius: 9999px; padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255,138,138,0.3);'
                : 'background: var(--pastel-cream); color: var(--pastel-muted); border: 1.5px solid var(--pastel-border); border-radius: 9999px; padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;'"
            >
              <i :class="['bi me-1', tab.icon]"></i> {{ tab.label }}
            </button>
          </div>
        </div>

        <LoadingSpinner v-if="loadingLatest" />
        <div v-else class="row g-3">
          <div v-for="product in latestProducts" :key="product.id" class="col-6 col-sm-4 col-md-3 col-lg-2.4">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
        <BasePagination
          v-if="!loadingLatest && latestTotalPages > 1"
          class="mt-3"
          :current-page="latestPage"
          :total-pages="latestTotalPages"
          :total-elements="latestTotalElements"
          :is-first="latestFirst"
          :is-last="latestLast"
          @change="onLatestPageChange"
        />
      </section>

      <!-- ── 5. TRUST BADGES ─────────────────────────────── -->
      <section class="mb-5">
        <div class="row g-3">
          <div v-for="(badge, bIdx) in trustBadges" :key="bIdx" class="col-6 col-md-3">
            <div class="card-pastel d-flex align-items-center gap-3 p-3 card-hover">
              <div class="d-flex align-items-center justify-content-center flex-shrink-0 card-hover"
                :style="'width: 3rem; height: 3rem; border-radius: 16px; background: ' + badge.bgColor + '; color: ' + badge.textColor + '; font-size: 1.25rem; transition: all 0.3s;'">
                <i :class="badge.icon"></i>
              </div>
              <div>
                <h4 style="font-size: 0.8rem; font-weight: 800; color: var(--pastel-ink); margin-bottom: 2px;">{{ badge.title }}</h4>
                <p style="font-size: 0.7rem; color: var(--pastel-muted); margin: 0; line-height: 1.3;">{{ badge.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 6. SELLER CTA BANNER ────────────────────────── -->
      <section class="mb-4">
        <div class="card-pastel p-4 p-md-5 position-relative overflow-hidden"
          style="background: linear-gradient(135deg, var(--pastel-lavender) 0%, var(--pastel-pink) 50%, var(--pastel-peach) 100%); border-color: var(--pastel-lavender) !important;">
          <!-- Decorative blobs -->
          <svg class="position-absolute" style="top: -30%; right: -15%; width: 50%; height: 160%; opacity: 0.1; pointer-events: none;" viewBox="0 0 500 500">
            <path fill="var(--pastel-ink)" d="M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,354Q39,301,29.5,227Q20,153,70,99Q120,45,193.5,25Q267,5,323.5,60Q380,115,425.5,192.5Q471,270,440.5,320.5Z"/>
          </svg>
          <svg class="position-absolute" style="bottom: -20%; left: -10%; width: 40%; height: 140%; opacity: 0.08; pointer-events: none;" viewBox="0 0 500 500">
            <circle cx="250" cy="250" r="200" fill="var(--pastel-ink)"/>
          </svg>

          <div class="row align-items-center position-relative" style="z-index: 1;">
            <div class="col-lg-8 mb-3 mb-lg-0">
              <span class="badge-strip mb-2" style="background: rgba(255,255,255,0.4); color: var(--pastel-ink);">
                <i class="bi bi-rocket-takeoff-fill me-1"></i> Cơ Hội Kinh Doanh
              </span>
              <h2 class="fw-extrabold mb-2" style="font-size: 1.5rem; color: var(--pastel-ink); line-height: 1.2;">
                Mở Shop Bán Hàng Cùng B2C Market
              </h2>
              <p style="font-size: 0.875rem; color: var(--pastel-ink); opacity: 0.8; margin-bottom: 0; line-height: 1.6;">
                Gia nhập nền tảng B2C hàng đầu để tiếp cận 10.000+ khách hàng tiềm năng mỗi ngày. Phí hoa hồng 0% trong tháng đầu tiên!
              </p>
            </div>
            <div class="col-lg-4 text-lg-end">
              <router-link :to="{ name: 'apply-seller' }"
                class="btn-coral d-inline-flex align-items-center gap-2"
                style="font-size: 0.875rem; padding: 0.6rem 1.5rem; text-decoration: none; box-shadow: 0 6px 24px rgba(255,138,138,0.4);">
                <span>Đăng Ký Gian Hàng</span> <i class="bi bi-arrow-right"></i>
              </router-link>
            </div>
          </div>
        </div>
      </section>

    </div><!-- /container -->

    <!-- ── FLOATING ACTION WIDGETS ──────────────────────────── -->
    <div class="position-fixed bottom-4 end-4 z-40 d-flex flex-column gap-3 align-items-end">
      <button @click="showVoucherModal = true"
        class="fab-coral d-flex align-items-center gap-2"
        style="padding: 0 1rem; width: auto; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; height: 3rem;">
        <i class="bi bi-ticket-perforated-fill"></i>
        <span>Ví Voucher</span>
      </button>
      <button @click="showSpinModal = true"
        class="fab-coral d-flex align-items-center gap-2"
        style="padding: 0 1rem; width: auto; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; height: 3rem;">
        <i class="bi bi-controller"></i>
        <span>Vòng Quay</span>
      </button>
      <button v-if="showBackToTop" @click="scrollToTop"
        class="fab-coral" style="width: 3rem; height: 3rem;">
        <i class="bi bi-arrow-up"></i>
      </button>
    </div>

    <!-- Modals -->
    <VoucherModal :show="showVoucherModal" @close="showVoucherModal = false" />
    <SpinWheelModal :show="showSpinModal" @close="showSpinModal = false" />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { catalogService } from '@/services/catalog.service'
import { useNotifyStore } from '@/stores/notify'
import ProductCard from '@/components/common/ProductCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import VoucherModal from '@/components/common/VoucherModal.vue'
import SpinWheelModal from '@/components/common/SpinWheelModal.vue'

const router = useRouter()
const notify = useNotifyStore()
const placeholderImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80'

const showVoucherModal = ref(false)
const showSpinModal = ref(false)
const showBackToTop = ref(false)

const rootCategories = ref([])
const dealProducts = ref([])
const loadingDeals = ref(true)
const homeOutdoorProducts = ref([])
const loadingHomeProducts = ref(true)
const latestProducts = ref([])
const loadingLatest = ref(true)
const latestPage = ref(0)
const latestPageSize = 20
const latestTotalPages = ref(1)
const latestTotalElements = ref(0)
const latestFirst = ref(true)
const latestLast = ref(true)

const shopeeFeatures = [
  { id: 'sale', title: 'Săn Sale 0Đ', icon: 'bi-lightning-charge-fill', bgColor: 'var(--pastel-butter)', textColor: '#7a5f00' },
  { id: 'mall', title: 'Shopee Mall', icon: 'bi-patch-check-fill', bgColor: 'var(--pastel-pink)', textColor: '#8a3a4a' },
  { id: 'voucher', title: 'Mã Giảm Giá', icon: 'bi-ticket-perforated-fill', bgColor: 'var(--pastel-lavender)', textColor: '#5b3a9e' },
  { id: 'freeship', title: 'Freeship Extra', icon: 'bi-truck-front-fill', bgColor: 'var(--pastel-mint)', textColor: '#2d6a4f' },
  { id: 'coins', title: 'Thưởng Xu', icon: 'bi-coin', bgColor: 'var(--pastel-butter)', textColor: '#7a5f00' },
  { id: 'game', title: 'Spin Game', icon: 'bi-controller', bgColor: 'var(--pastel-lavender)', textColor: '#5b3a9e' },
  { id: 'global', title: 'Hàng Quốc Tế', icon: 'bi-globe2', bgColor: 'var(--pastel-pink)', textColor: '#8a3a4a' },
  { id: 'goldhour', title: 'Khung Giờ Vàng', icon: 'bi-clock-history', bgColor: 'var(--pastel-peach)', textColor: '#8a5a20' },
]

const trustBadges = [
  { icon: 'bi-truck', title: 'Giao Hàng Siêu Tốc', desc: 'Miễn phí đơn từ 300.000đ', bgColor: 'var(--pastel-pink)', textColor: '#8a3a4a' },
  { icon: 'bi-shield-check', title: 'Hàng Chính Hãng 100%', desc: 'Bảo hành & kiểm định uy tín', bgColor: 'var(--pastel-mint)', textColor: '#2d6a4f' },
  { icon: 'bi-arrow-counterclockwise', title: 'Đổi Trả Dễ Dàng', desc: '7 ngày hoàn tiền không lý do', bgColor: 'var(--pastel-lavender)', textColor: '#5b3a9e' },
  { icon: 'bi-credit-card-2-front', title: 'Thanh Toán Đa Dạng', desc: 'VNPay, MoMo, COD, Visa/Master', bgColor: 'var(--pastel-butter)', textColor: '#7a5f00' },
]

const activeSuggestTab = ref(0)
const shopeeSuggestTabs = [
  { label: 'GỢI Ý HÔM NAY', icon: 'bi-stars' },
  { label: 'BÁN CHẠY NHẤT', icon: 'bi-fire' },
  { label: 'SHOPEE LIVE 50%', icon: 'bi-broadcast' },
  { label: 'FREESHIP EXTRA', icon: 'bi-truck-front-fill' },
]

const handleFeatureClick = (feat) => {
  if (feat.id === 'voucher') showVoucherModal.value = true
  else if (feat.id === 'game') showSpinModal.value = true
  else if (feat.id === 'coins') claimDailyCoins()
  else router.push({ name: 'products' })
}

const claimDailyCoins = () => {
  notify.push('💰 Bạn đã nhận +100 Xu cho điểm danh hôm nay!', 'success')
}

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const handleScroll = () => { showBackToTop.value = window.scrollY > 300 }

const formatVND = (val) => {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

const calculateDiscount = (product) => {
  if (product.maxPrice && product.minPrice && product.maxPrice > product.minPrice) {
    return Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
  }
  return 15
}

const goToDetail = (slug) => { if (slug) router.push({ name: 'product-detail', params: { slug } }) }

const countdown = ref({ days: '04', hours: '13', mins: '34', secs: '56' })
let timerInterval = null

const startCountdown = () => {
  let totalSeconds = 4 * 86400 + 13 * 3600 + 34 * 60 + 56
  timerInterval = setInterval(() => {
    if (totalSeconds <= 0) return clearInterval(timerInterval)
    totalSeconds--
    const d = Math.floor(totalSeconds / 86400)
    const h = Math.floor((totalSeconds % 86400) / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    countdown.value = {
      days: String(d).padStart(2, '0'),
      hours: String(h).padStart(2, '0'),
      mins: String(m).padStart(2, '0'),
      secs: String(s).padStart(2, '0'),
    }
  }, 1000)
}

const loadLatestPage = async (page) => {
  loadingLatest.value = true
  latestPage.value = page
  try {
    const data = await catalogService.listProducts({ page, size: latestPageSize, sortBy: 'created', sortDir: 'desc' })
    latestProducts.value = data?.content || []
    latestTotalPages.value = data?.totalPages ?? 1
    latestTotalElements.value = data?.totalElements ?? 0
    latestFirst.value = data?.first ?? true
    latestLast.value = data?.last ?? true
    const el = document.getElementById('latest-products-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (_) {} finally { loadingLatest.value = false }
}

const onLatestPageChange = (newPage) => {
  if (newPage < 0 || newPage >= latestTotalPages.value) return
  loadLatestPage(newPage)
}

watch(activeSuggestTab, () => { loadLatestPage(0) })

const currentSlideIndex = ref(0)
let slideInterval = null

const heroSlides = [
  { subtitle: 'Xu hướng mới nhất', title: 'Thiết Bị Điện Tử & Công Nghệ', buttonText: 'Khám phá ngay', badgeBg: 'var(--pastel-lavender)', badgeColor: '#5b3a9e', bgStart: 'rgba(184,232,212,0.5)', bgEnd: 'rgba(214,197,240,0.5)' },
  { subtitle: 'Siêu giảm giá', title: 'Đồng Hồ & Phụ Kiện Thông Minh', buttonText: 'Mua ngay giảm 30%', badgeBg: 'var(--pastel-peach)', badgeColor: '#8a5a20', bgStart: 'rgba(255,217,179,0.5)', bgEnd: 'rgba(255,214,224,0.5)' },
  { subtitle: 'Hàng chính hãng', title: 'Laptop & Máy Tính Bảng Cao Cấp', buttonText: 'Săn Deal siêu hời', badgeBg: 'var(--pastel-mint)', badgeColor: '#2d6a4f', bgStart: 'rgba(184,232,212,0.5)', bgEnd: 'rgba(255,217,179,0.4)' },
  { subtitle: 'Âm thanh sống động', title: 'Tai Nghe & Loa Bluetooth Thế Hệ Mới', buttonText: 'Xem sản phẩm', badgeBg: 'var(--pastel-coral)', badgeColor: '#fff', bgStart: 'rgba(214,197,240,0.5)', bgEnd: 'rgba(255,214,224,0.5)' },
]

const startSlideTimer = () => {
  slideInterval = setInterval(() => {
    currentSlideIndex.value = (currentSlideIndex.value + 1) % heroSlides.length
  }, 3000)
}

const handleAddToCart = (product) => {
  notify.push(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success')
}

onMounted(() => {
  startCountdown()
  startSlideTimer()
  loadLatestPage(0)
  window.addEventListener('scroll', handleScroll)

  // Load categories & product grids
  catalogService.getRootCategories().then(cats => { rootCategories.value = Array.isArray(cats) ? cats.slice(0, 8) : [] }).catch(() => {})
  catalogService.listProducts({ page: 0, size: 5, sortBy: 'sold', sortDir: 'desc' })
    .then(data => { dealProducts.value = data?.content || [] })
    .catch(() => {}).finally(() => { loadingDeals.value = false })
  catalogService.listProducts({ page: 0, size: 8, sortBy: 'rating', sortDir: 'desc' })
    .then(data => { homeOutdoorProducts.value = data?.content || [] })
    .catch(() => {}).finally(() => { loadingHomeProducts.value = false })
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (slideInterval) clearInterval(slideInterval)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.6s ease-in-out; }
.fade-slide-enter-from { opacity: 0; transform: translateX(30px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-30px); }

@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.hover-bg-pink:hover { background-color: var(--pastel-pink) !important; color: var(--pastel-ink) !important; }

.card-hover {
  transition: all 0.25s ease;
}
</style>
