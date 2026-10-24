<template>
  <!-- [PASTEL-REDESIGN] Footer -->
  <footer class="footer-pastel pt-5 pb-4 mt-auto">
    <div class="container px-4">
      <div class="row g-4 mb-4">
        <!-- Brand + about -->
        <div class="col-lg-4 col-md-6">
          <div class="footer-brand">
            <div class="d-flex align-items-center justify-content-center text-white"
              style="width:2.5rem;height:2.5rem;border-radius:14px;background:var(--pastel-coral);flex-shrink:0;">
              <i class="bi bi-bag-check-fill fs-5"></i>
            </div>
            <span>B2C Market</span>
          </div>
          <p style="font-size: 0.8125rem; line-height: 1.7; margin-bottom: 1.25rem;">
            Nền tảng thương mại điện tử B2C hiện đại, kết nối nhà bán hàng uy tín với hàng triệu người mua trên toàn quốc. Mua sắm nhanh chóng, an toàn và thông minh.
          </p>
          <div class="d-flex gap-2">
            <a href="#" class="footer-icon-round" title="Facebook"><i class="bi bi-facebook"></i></a>
            <a href="#" class="footer-icon-round" title="Instagram"><i class="bi bi-instagram"></i></a>
            <a href="#" class="footer-icon-round" title="YouTube"><i class="bi bi-youtube"></i></a>
            <a href="#" class="footer-icon-round" title="TikTok"><i class="bi bi-tiktok"></i></a>
          </div>
        </div>

        <!-- Shopping links -->
        <div class="col-lg-2 col-md-6">
          <h5>Mua Sắm</h5>
          <router-link :to="{ name: 'products' }">Tất cả sản phẩm</router-link>
          <router-link :to="{ name: 'products', query: { featured: 'true' } }">Sản phẩm nổi bật</router-link>
          <router-link :to="{ name: 'products' }">Danh mục hàng hóa</router-link>
          <router-link :to="{ name: 'cart' }">Giỏ hàng</router-link>
          <router-link :to="{ name: 'products' }">Shopee Mall</router-link>
        </div>

        <!-- Customer service -->
        <div class="col-lg-3 col-md-6">
          <h5>Hỗ Trợ</h5>
          <a href="#">Trung tâm trợ giúp</a>
          <a href="#">Hướng dẫn mua hàng</a>
          <a href="#">Chính sách vận chuyển</a>
          <a href="#">Chính sách đổi trả</a>
          <router-link :to="{ name: 'apply-seller' }">Đăng ký nhà bán</router-link>
        </div>

        <!-- Newsletter -->
        <div class="col-lg-3 col-md-6">
          <h5>Đăng Ký Nhận Tin</h5>
          <p style="font-size: 0.8125rem; margin-bottom: 0.75rem;">
            Nhận thông tin ưu đãi & khuyến mãi mới nhất từ B2C Market.
          </p>
          <div class="input-group mb-3" style="border-radius: 12px; overflow: hidden;">
            <input type="email" class="form-control" placeholder="Email của bạn..."
              style="border-radius: 12px 0 0 12px; border: 1.5px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: #fff; font-size: 0.8125rem; padding: 0.5rem 0.875rem;" />
            <button class="btn" type="button"
              style="border-radius: 0 12px 12px 0; background: var(--pastel-coral); color: #fff; font-weight: 700; font-size: 0.8125rem; padding: 0 1rem; border: none;">
              <i class="bi bi-send"></i>
            </button>
          </div>
          <div style="font-size: 0.75rem; color: rgba(255,249,240,0.5);">
            <p class="mb-1"><i class="bi bi-geo-alt me-1" style="color: var(--pastel-coral);"></i> Hà Nội, Việt Nam</p>
            <p class="mb-1"><i class="bi bi-telephone me-1" style="color: var(--pastel-coral);"></i> Hotline: 1900 1234</p>
            <p class="mb-0"><i class="bi bi-envelope me-1" style="color: var(--pastel-coral);"></i> support@b2cmarket.vn</p>
          </div>
        </div>
      </div>

      <div class="footer-bottom d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
        <div>© 2026 B2C E-Commerce Platform. All rights reserved.</div>
        <div class="d-flex gap-3">
          <a href="#">Bảo mật</a>
          <a href="#">Điều khoản</a>
          <a href="#">Sơ đồ trang</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>
