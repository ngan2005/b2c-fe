<template>
  <!-- NO MALL Footer -->
  <footer class="nomall-footer">
    <div class="nomall-container">
      <div class="row g-4 mb-4">
        <!-- Col 1: Brand -->
        <div class="col-lg-4">
          <div class="nomall-logo mb-3" style="font-size: 1.75rem;">
            NO <span style="color: var(--nomall-red);">MALL</span>
          </div>
          <p style="font-size: 0.8125rem; line-height: 1.7; margin-bottom: 1rem;">
            Nền tảng thương mại điện tử hàng đầu Việt Nam. Hàng chính hãng, giá tốt, giao hàng nhanh chóng.
          </p>
          <div class="d-flex gap-3">
            <a href="#" class="text-white-50" style="font-size: 1.25rem;" title="Facebook">
              <i class="bi bi-facebook"></i>
            </a>
            <a href="#" class="text-white-50" style="font-size: 1.25rem;" title="Instagram">
              <i class="bi bi-instagram"></i>
            </a>
            <a href="#" class="text-white-50" style="font-size: 1.25rem;" title="Youtube">
              <i class="bi bi-youtube"></i>
            </a>
          </div>
        </div>

        <!-- Col 2: About -->
        <div class="col-6 col-lg-2">
          <div class="nomall-footer-title">Về NO MALL</div>
          <ul class="nomall-footer-links">
            <li><a href="#">Giới thiệu</a></li>
            <li><a href="#">Tuyển dụng</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
          </ul>
        </div>

        <!-- Col 3: Customer service -->
        <div class="col-6 col-lg-2">
          <div class="nomall-footer-title">Hỗ trợ khách hàng</div>
          <ul class="nomall-footer-links">
            <li><router-link :to="{ name: 'contact' }">Trung tâm trợ giúp</router-link></li>
            <li><router-link :to="{ name: 'contact' }">Chính sách đổi trả</router-link></li>
            <li><router-link :to="{ name: 'contact' }">Phương thức thanh toán</router-link></li>
            <li><router-link :to="{ name: 'contact' }">Liên hệ hỗ trợ</router-link></li>
          </ul>
        </div>

        <!-- Col 4: Seller -->
        <div class="col-6 col-lg-2">
          <div class="nomall-footer-title">Dành cho người bán</div>
          <ul class="nomall-footer-links">
            <li><a href="#">Đăng ký bán hàng</a></li>
            <li><a href="#">Chính sách người bán</a></li>
            <li><a href="#">Phí hoa hồng</a></li>
            <li><a href="#">Affiliate Program</a></li>
          </ul>
        </div>

        <!-- Col 5: Payment & shipping -->
        <div class="col-6 col-lg-2">
          <div class="nomall-footer-title">Thanh toán & Vận chuyển</div>
          <ul class="nomall-footer-links">
            <li><a href="#">Phương thức thanh toán</a></li>
            <li><a href="#">Chính sách vận chuyển</a></li>
            <li><a href="#">Miễn phí vận chuyển</a></li>
            <li><a href="#">Tra cứu đơn hàng</a></li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="pt-4" style="border-top: 1px solid rgba(255,255,255,0.1);">
        <div class="row align-items-center g-3">
          <div class="col-md-6">
            <p style="font-size: 0.75rem; margin: 0; color: rgba(255,255,255,0.5);">
              © 2026 NO MALL. Tất cả quyền được bảo lưu.
            </p>
          </div>
          <div class="col-md-6 text-md-end">
            <span style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">
              Địa chỉ: 123 Đường ABC, Quận 1, TP. Hồ Chí Minh | Hotline: 1900 1234
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
