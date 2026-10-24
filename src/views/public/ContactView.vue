<template>
  <!-- NO MALL Contact & Help Center View -->
  <div class="contact-page pb-5" style="background: var(--nomall-bg); min-height: 100vh;">

    <!-- Breadcrumb strip -->
    <div style="background: #fff; border-bottom: 1px solid var(--nomall-border); padding: 0.5rem 0;">
      <div class="nomall-container">
        <nav class="nomall-breadcrumb">
          <router-link :to="{ name: 'home' }">Trang chủ</router-link>
          <i class="bi bi-chevron-right" style="font-size: 0.625rem;"></i>
          <span style="color: var(--nomall-red); font-weight: 700;">Liên hệ & Hỗ trợ</span>
        </nav>
      </div>
    </div>

    <!-- Hero Header Banner -->
    <section class="contact-hero py-4 py-md-5 mb-4">
      <div class="nomall-container text-center text-white">
        <span class="badge bg-warning text-dark fw-bold px-3 py-1.5 rounded-pill mb-2 text-xs">
          <i class="bi bi-headset me-1"></i> TẬN TÂM - NHANH CHÓNG - 24/7
        </span>
        <h1 class="contact-hero-title fw-extrabold mb-2">
          Trung Tâm Hỗ Trợ & Chăm Sóc Khách Hàng
        </h1>
        <p class="contact-hero-subtitle mx-auto text-white-50 mb-0" style="max-width: 600px;">
          NO MALL luôn sẵn sàng đồng hành, giải đáp mọi thắc mắc và giải quyết khiếu nại của bạn nhanh nhất có thể.
        </p>
      </div>
    </section>

    <div class="nomall-container">

      <!-- ── 1. Top 4 Direct Contact Cards ───────────────────────── -->
      <div class="row g-3 g-md-4 mb-4">
        <!-- Card 1: Hotline -->
        <div class="col-6 col-lg-3">
          <div class="contact-channel-card h-100">
            <div class="channel-icon-wrap icon-hotline">
              <i class="bi bi-telephone-fill"></i>
            </div>
            <h6 class="channel-name">Tổng Đài Miễn Phí</h6>
            <div class="channel-value text-danger">1900 6868</div>
            <p class="channel-desc">8:00 - 22:00 tất cả các ngày</p>
            <a href="tel:19006868" class="btn-channel-action">
              <span>Gọi ngay</span> <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>

        <!-- Card 2: Email -->
        <div class="col-6 col-lg-3">
          <div class="contact-channel-card h-100">
            <div class="channel-icon-wrap icon-email">
              <i class="bi bi-envelope-open-fill"></i>
            </div>
            <h6 class="channel-name">Email Hỗ Trợ</h6>
            <div class="channel-value">hotro@nomall.vn</div>
            <p class="channel-desc">Phản hồi trong vòng 2 giờ</p>
            <a href="mailto:hotro@nomall.vn" class="btn-channel-action">
              <span>Gửi mail</span> <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>

        <!-- Card 3: Social & Chat -->
        <div class="col-6 col-lg-3">
          <div class="contact-channel-card h-100">
            <div class="channel-icon-wrap icon-chat">
              <i class="bi bi-chat-dots-fill"></i>
            </div>
            <h6 class="channel-name">Hỗ Trợ Trực Tuyến</h6>
            <div class="channel-value">Zalo & Messenger</div>
            <p class="channel-desc">Chat trực tiếp với tư vấn viên</p>
            <button type="button" class="btn-channel-action" @click="openChatDirect">
              <span>Nhắn tin</span> <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- Card 4: Office HQ -->
        <div class="col-6 col-lg-3">
          <div class="contact-channel-card h-100">
            <div class="channel-icon-wrap icon-office">
              <i class="bi bi-geo-alt-fill"></i>
            </div>
            <h6 class="channel-name">Trụ Sở Chính</h6>
            <div class="channel-value" style="font-size: 0.95rem;">Tòa Nhà NO MALL</div>
            <p class="channel-desc">72 Lê Thánh Tôn, Bến Nghé, Q.1, TP.HCM</p>
            <a href="#officeMap" class="btn-channel-action">
              <span>Xem địa chỉ</span> <i class="bi bi-arrow-down"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- ── 2. Support Ticket Form & Info Sidebar ────────────────── -->
      <div class="row g-4 mb-5">

        <!-- Form Column -->
        <div class="col-lg-7 col-xl-8">
          <div class="contact-form-card">
            <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
              <div>
                <h4 class="form-card-title mb-1">
                  <i class="bi bi-send-check text-danger me-2"></i>Gửi Yêu Cầu Hỗ Trợ
                </h4>
                <p class="form-card-subtitle text-muted mb-0">
                  Điền thông tin bên dưới, nhân viên hỗ trợ NO MALL sẽ xử lý và liên hệ lại với bạn.
                </p>
              </div>
            </div>

            <!-- Success alert after submission -->
            <div v-if="submittedTicket" class="alert alert-success d-flex align-items-start gap-3 p-3 rounded-3 mb-4">
              <i class="bi bi-check-circle-fill fs-3 text-success flex-shrink-0"></i>
              <div>
                <h6 class="fw-bold mb-1">Gửi yêu cầu hỗ trợ thành công!</h6>
                <p class="mb-1 small">
                  Mã ticket hỗ trợ của bạn là: <strong>{{ submittedTicket.code }}</strong>.
                </p>
                <p class="mb-0 small text-muted">
                  Chúng tôi đã gửi email xác nhận về <strong>{{ submittedTicket.email }}</strong> và sẽ phản hồi sớm nhất.
                </p>
              </div>
            </div>

            <form @submit.prevent="handleSubmitTicket">
              <div class="row g-3 mb-3">
                <!-- Name -->
                <div class="col-md-6">
                  <label class="form-label fw-bold small text-dark">Họ và tên <span class="text-danger">*</span></label>
                  <input
                    v-model="form.fullName"
                    type="text"
                    class="form-control"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <!-- Phone -->
                <div class="col-md-6">
                  <label class="form-label fw-bold small text-dark">Số điện thoại <span class="text-danger">*</span></label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="form-control"
                    placeholder="0912 345 678"
                    required
                  />
                </div>

                <!-- Email -->
                <div class="col-md-6">
                  <label class="form-label fw-bold small text-dark">Địa chỉ Email <span class="text-danger">*</span></label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    placeholder="youremail@example.com"
                    required
                  />
                </div>

                <!-- Category -->
                <div class="col-md-6">
                  <label class="form-label fw-bold small text-dark">Vấn đề cần hỗ trợ <span class="text-danger">*</span></label>
                  <select v-model="form.category" class="form-select" required>
                    <option value="" disabled selected>-- Chọn chủ đề --</option>
                    <option value="ORDER">📦 Tra cứu đơn hàng & Giao vận</option>
                    <option value="RETURN">🔄 Đổi trả hàng & Hoàn tiền</option>
                    <option value="COMPLAINT">⚠️ Khiếu nại sản phẩm / Người bán</option>
                    <option value="SELLER_PARTNER">🤝 Đăng ký bán hàng & Hợp tác</option>
                    <option value="ACCOUNT">👤 Vấn đề tài khoản & Đăng nhập</option>
                    <option value="OTHER">💡 Góp ý & Vấn đề khác</option>
                  </select>
                </div>

                <!-- Order code (optional) -->
                <div class="col-12">
                  <label class="form-label fw-bold small text-dark">
                    Mã đơn hàng liên quan <span class="text-muted fw-normal">(nếu có)</span>
                  </label>
                  <input
                    v-model="form.orderCode"
                    type="text"
                    class="form-control"
                    placeholder="Ví dụ: ORD-20261024-918"
                  />
                </div>

                <!-- Message -->
                <div class="col-12">
                  <label class="form-label fw-bold small text-dark">Nội dung chi tiết <span class="text-danger">*</span></label>
                  <textarea
                    v-model="form.message"
                    rows="4"
                    class="form-control"
                    placeholder="Mô tả cụ thể vấn đề hoặc câu hỏi của bạn để chúng tôi hỗ trợ tốt nhất..."
                    required
                  ></textarea>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="d-flex align-items-center justify-content-between pt-2">
                <span class="small text-muted d-none d-sm-inline">
                  <i class="bi bi-shield-lock me-1"></i> Thông tin của bạn được bảo mật tuyệt đối.
                </span>
                <button
                  type="submit"
                  class="btn btn-danger px-4 py-2 fw-bold d-inline-flex align-items-center gap-2 rounded-pill"
                  :disabled="submitting"
                  style="background: var(--nomall-red); border: none;"
                >
                  <span v-if="submitting" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-send-fill"></i>
                  <span>{{ submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Hỗ Trợ' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Info & Map Column -->
        <div class="col-lg-5 col-xl-4">
          <div class="d-flex flex-column gap-3">

            <!-- Commitment Card -->
            <div class="contact-side-card">
              <h6 class="side-card-title text-danger mb-2">
                <i class="bi bi-patch-check-fill me-1.5"></i> Cam Kết Hỗ Trợ Khách Hàng
              </h6>
              <ul class="list-unstyled mb-0 d-flex flex-column gap-2.5 small text-muted">
                <li class="d-flex align-items-start gap-2">
                  <i class="bi bi-check2-circle text-success fs-6 flex-shrink-0 mt-0.5"></i>
                  <span><strong>15 phút:</strong> Phản hồi qua đường dây nóng Hotline & Chat trực tuyến.</span>
                </li>
                <li class="d-flex align-items-start gap-2">
                  <i class="bi bi-check2-circle text-success fs-6 flex-shrink-0 mt-0.5"></i>
                  <span><strong>2 giờ:</strong> Tiếp nhận và xử lý email phản ánh khiếu nại.</span>
                </li>
                <li class="d-flex align-items-start gap-2">
                  <i class="bi bi-check2-circle text-success fs-6 flex-shrink-0 mt-0.5"></i>
                  <span><strong>100% bảo vệ quyền lợi:</strong> Hoàn tiền ngay nếu phát hiện hàng giả, hàng nhái.</span>
                </li>
              </ul>
            </div>

            <!-- Seller Onboarding Callout -->
            <div class="seller-callout-card p-3 rounded-3" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #fff;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="badge bg-warning text-dark fw-bold">DÀNH CHO NGƯỜI BÁN</div>
              </div>
              <h6 class="fw-bold text-white mb-1">Muốn bán hàng trên NO MALL?</h6>
              <p class="small text-white-50 mb-3">
                Tiếp cận hàng triệu khách hàng mỗi ngày với chi phí 0đ phí mở gian hàng.
              </p>
              <router-link
                :to="{ name: 'apply-seller' }"
                class="btn btn-warning btn-sm fw-bold w-100 rounded-pill"
              >
                Đăng Ký Trở Thành Người Bán <i class="bi bi-arrow-right"></i>
              </router-link>
            </div>

            <!-- Office Map Visual Box -->
            <div id="officeMap" class="contact-side-card">
              <h6 class="side-card-title mb-2">
                <i class="bi bi-map-fill text-danger me-1.5"></i> Địa Chỉ Văn Phòng
              </h6>
              <div class="map-placeholder-box rounded-3 overflow-hidden position-relative mb-2">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500&auto=format&fit=crop&q=80"
                  alt="Bản đồ NO MALL"
                  class="w-100 h-100 object-fit-cover"
                />
                <div class="map-pin-badge">
                  <i class="bi bi-geo-alt-fill text-danger"></i> NO MALL Tower
                </div>
              </div>
              <p class="small text-muted mb-0">
                <strong>TP. Hồ Chí Minh:</strong> Tầng 12, NO MALL Tower, 72 Lê Thánh Tôn, Bến Nghé, Quận 1.<br/>
                <strong>Hà Nội:</strong> Tầng 8, Tòa nhà Capital, 109 Trần Hưng Đạo, Hoàn Kiếm.
              </p>
            </div>

          </div>
        </div>

      </div>

      <!-- ── 3. Frequently Asked Questions (FAQ Accordion) ────────── -->
      <div class="faq-section mb-4">
        <div class="text-center mb-4">
          <span class="badge bg-danger-subtle text-danger fw-bold rounded-pill px-3 py-1 text-xs mb-2">
            HỎI ĐÁP PHỔ BIẾN
          </span>
          <h3 class="fw-extrabold text-dark">Câu Hỏi Thường Gặp (FAQ)</h3>
          <p class="text-muted small">Những thắc mắc người mua sắm hay gặp nhất khi mua hàng trên NO MALL</p>
        </div>

        <div class="accordion nomall-faq-accordion mx-auto" id="faqAccordion" style="max-width: 860px;">
          <!-- FAQ 1 -->
          <div class="accordion-item mb-2 border rounded-3 overflow-hidden">
            <h2 class="accordion-header" id="headingOne">
              <button
                class="accordion-button fw-bold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseOne"
                aria-expanded="true"
                aria-controls="collapseOne"
              >
                1. Làm thế nào để tôi theo dõi tiến trình giao hàng của đơn đã đặt?
              </button>
            </h2>
            <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
              <div class="accordion-body text-muted small" style="line-height: 1.7;">
                Bạn có thể bấm vào mục <strong>"Đơn hàng"</strong> ở góc phải trên thanh điều hướng hoặc truy cập trang <em>Quản lý đơn hàng</em>. Tại đây, mỗi đơn hàng đều hiển thị chi tiết mã vận đơn, hãng vận chuyển và lộ trình di chuyển của gói hàng theo thời gian thực.
              </div>
            </div>
          </div>

          <!-- FAQ 2 -->
          <div class="accordion-item mb-2 border rounded-3 overflow-hidden">
            <h2 class="accordion-header" id="headingTwo">
              <button
                class="accordion-button collapsed fw-bold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseTwo"
                aria-expanded="false"
                aria-controls="collapseTwo"
              >
                2. Chính sách đổi trả và hoàn tiền của NO MALL được quy định thế nào?
              </button>
            </h2>
            <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
              <div class="accordion-body text-muted small" style="line-height: 1.7;">
                NO MALL hỗ trợ <strong>đổi trả miễn phí trong vòng 7 ngày</strong> kể từ khi bạn nhận hàng thành công nếu sản phẩm bị lỗi do nhà sản xuất, vỡ hỏng trong lúc vận chuyển hoặc giao sai mẫu mã. Tiền sẽ được hoàn trả lại tài khoản hoặc ví thanh toán của bạn trong vòng 24 - 48 giờ làm việc sau khi shop nhận lại hàng.
              </div>
            </div>
          </div>

          <!-- FAQ 3 -->
          <div class="accordion-item mb-2 border rounded-3 overflow-hidden">
            <h2 class="accordion-header" id="headingThree">
              <button
                class="accordion-button collapsed fw-bold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseThree"
                aria-expanded="false"
                aria-controls="collapseThree"
              >
                3. NO MALL hỗ trợ các hình thức thanh toán nào?
              </button>
            </h2>
            <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
              <div class="accordion-body text-muted small" style="line-height: 1.7;">
                Hiện tại bạn có thể thanh toán thuận tiện qua: <strong>Thanh toán khi nhận hàng (COD)</strong>, <strong>Thẻ ngân hàng / VNPAY-QR</strong>, hoặc thanh toán qua cổng điện tử an toàn đã được tích hợp trực tiếp trên sàn.
              </div>
            </div>
          </div>

          <!-- FAQ 4 -->
          <div class="accordion-item mb-2 border rounded-3 overflow-hidden">
            <h2 class="accordion-header" id="headingFour">
              <button
                class="accordion-button collapsed fw-bold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseFour"
                aria-expanded="false"
                aria-controls="collapseFour"
              >
                4. Tôi phát hiện hàng nhận được có dấu hiệu không chính hãng thì phải làm sao?
              </button>
            </h2>
            <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#faqAccordion">
              <div class="accordion-body text-muted small" style="line-height: 1.7;">
                NO MALL cam kết <strong>100% Hàng chính hãng</strong>. Nếu phát hiện hàng giả, hàng nhái, bạn hãy chụp ảnh/quay video bằng chứng và bấm nút "Yêu cầu trả hàng / Hoàn tiền" hoặc gửi form hỗ trợ ở trang này. Đội ngũ kiểm soát chất lượng NO MALL sẽ thẩm định và đền bù 100% giá trị đơn hàng cho bạn.
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifyStore } from '@/stores/notify'

const router = useRouter()
const notify = useNotifyStore()

const submitting = ref(false)
const submittedTicket = ref(null)

const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  category: '',
  orderCode: '',
  message: '',
})

async function handleSubmitTicket() {
  submitting.value = true
  try {
    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 800))
    const code = 'TK-' + Math.floor(100000 + Math.random() * 900000)
    submittedTicket.value = {
      code,
      email: form.email,
    }
    notify.push(`Đã gửi yêu cầu hỗ trợ mã #${code}! Chúng tôi sẽ liên hệ lại sớm.`, 'success')
    // Reset form fields
    form.fullName = ''
    form.phone = ''
    form.email = ''
    form.category = ''
    form.orderCode = ''
    form.message = ''
  } catch (err) {
    notify.push('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau!', 'error')
  } finally {
    submitting.value = false
  }
}

function openChatDirect() {
  notify.push('Đang kết nối tới tổng đài viên NO MALL qua Live Chat...', 'info')
}
</script>

<style scoped>
.contact-hero {
  background: linear-gradient(135deg, #b91c1c 0%, #e84a4a 50%, #f97316 100%);
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 20px rgba(232, 74, 74, 0.2);
}

.contact-hero-title {
  font-size: 1.85rem;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.contact-hero-subtitle {
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Channel Card */
.contact-channel-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid var(--nomall-border);
  padding: 1.25rem 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.contact-channel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(232, 74, 74, 0.1);
  border-color: #fca5a5;
}

.channel-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  margin-bottom: 0.75rem;
}

.icon-hotline {
  background: rgba(232, 74, 74, 0.1);
  color: #e84a4a;
}

.icon-email {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.icon-chat {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.icon-office {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.channel-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.channel-value {
  font-size: 1.05rem;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.channel-desc {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
  flex-grow: 1;
}

.btn-channel-action {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--nomall-red);
  background: var(--nomall-red-bg);
  border: 1px solid rgba(232, 74, 74, 0.2);
  border-radius: 20px;
  padding: 0.25rem 0.85rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.15s ease;
}

.btn-channel-action:hover {
  background: var(--nomall-red);
  color: #ffffff;
}

/* Form Card */
.contact-form-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid var(--nomall-border);
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.form-card-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--nomall-ink);
}

.form-card-subtitle {
  font-size: 0.8125rem;
}

.contact-side-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid var(--nomall-border);
  padding: 1.15rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.side-card-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--nomall-ink);
}

.map-placeholder-box {
  height: 130px;
  background: #f1f5f9;
}

.map-pin-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

/* Accordion */
.nomall-faq-accordion .accordion-button {
  background: #ffffff;
  color: var(--nomall-ink);
  font-size: 0.875rem;
  padding: 0.875rem 1rem;
  box-shadow: none;
}

.nomall-faq-accordion .accordion-button:not(.collapsed) {
  background: var(--nomall-red-bg);
  color: var(--nomall-red);
}

.nomall-faq-accordion .accordion-button:after {
  filter: grayscale(1);
}

.nomall-faq-accordion .accordion-button:not(.collapsed):after {
  filter: none;
}
</style>
