<template>
  <div class="users-view-container">
    <!-- ── HEADER BANNER ──────────────────────────────────────── -->
    <div class="users-header">
      <div class="header-left">
        <div class="header-badge">
          <span class="live-dot"></span>
          <span>WEBSOCKET REALTIME PRESENCE</span>
        </div>
        <h1 class="header-title">Quản Lý Người Dùng & Phiên Trực Tuyến</h1>
        <p class="header-subtitle">
          Theo dõi danh sách tài khoản, trạng thái kết nối thời gian thực và phân quyền người dùng toàn sàn.
        </p>
      </div>

      <div class="header-stats">
        <div class="stat-pill">
          <span class="stat-pill-label">Tổng người dùng</span>
          <span class="stat-pill-val">{{ totalElements }}</span>
        </div>
        <div class="stat-pill highlight-online">
          <span class="stat-pill-label">
            <span class="presence-pulse-dot me-1"></span> Đang online
          </span>
          <span class="stat-pill-val text-emerald">{{ onlineCount }}</span>
        </div>
      </div>
    </div>

    <!-- ── FILTER TOOLBAR ─────────────────────────────────────── -->
    <div class="filter-card">
      <div class="row g-3 align-items-center">
        <!-- Search Keyword -->
        <div class="col-lg-4 col-md-6">
          <div class="search-input-wrap">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="keyword"
              type="text"
              class="form-control filter-input ps-5"
              placeholder="Tìm theo email, họ tên, số điện thoại..."
              @keyup.enter="handleApplyFilter"
            />
            <button
              v-if="keyword"
              type="button"
              class="btn-clear-keyword"
              @click="clearKeyword"
            >
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>

        <!-- Role Filter -->
        <div class="col-lg-2 col-md-3 col-sm-6">
          <select
            v-model="role"
            class="form-select filter-select"
            @change="handleApplyFilter"
          >
            <option value="">Tất cả vai trò</option>
            <option value="BUYER">Người mua (BUYER)</option>
            <option value="SELLER">Nhà bán (SELLER)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="col-lg-2 col-md-3 col-sm-6">
          <select
            v-model="status"
            class="form-select filter-select"
            @change="handleApplyFilter"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="LOCKED">Đã khóa (LOCKED)</option>
            <option value="BANNED">Bị cấm (BANNED)</option>
          </select>
        </div>

        <!-- Online Filter -->
        <div class="col-lg-2 col-md-6 col-sm-6">
          <select
            v-model="presenceFilter"
            class="form-select filter-select"
            @change="handleApplyFilter"
          >
            <option value="">Tất cả kết nối</option>
            <option value="ONLINE">🟢 Trực tuyến</option>
            <option value="OFFLINE">⚪ Ngoại tuyến</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="col-lg-2 col-md-6 d-flex gap-2">
          <button
            class="btn btn-primary filter-btn-apply w-100"
            :disabled="loading"
            @click="handleApplyFilter"
          >
            <i class="bi bi-funnel-fill me-1"></i> Áp dụng
          </button>
          <button
            class="btn btn-outline-secondary filter-btn-refresh"
            title="Làm mới danh sách"
            :disabled="loading"
            @click="load(true)"
          >
            <i class="bi bi-arrow-repeat" :class="{ 'spin-icon': loading }"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── USERS TABLE CARD ───────────────────────────────────── -->
    <div class="table-card">
      <div class="table-responsive">
        <table class="table custom-table align-middle mb-0">
          <thead>
            <tr>
              <th style="width: 70px">ID</th>
              <th style="min-width: 260px">Người dùng</th>
              <th style="min-width: 140px">Vai trò</th>
              <th style="min-width: 150px">Kết nối (Live)</th>
              <th style="min-width: 140px">Tài khoản</th>
              <th style="min-width: 130px">Ngày tham gia</th>
              <th class="text-end" style="min-width: 120px">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="7" class="text-center py-5">
                <div class="spinner-border text-indigo mb-2" role="status"></div>
                <div class="text-slate-500 font-medium small">Đang tải danh sách người dùng...</div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="!filteredItems.length">
              <td colspan="7" class="text-center py-5">
                <div class="empty-state-wrap">
                  <div class="empty-icon-wrap">
                    <i class="bi bi-people-slash"></i>
                  </div>
                  <h4 class="empty-title">Không tìm thấy người dùng phù hợp</h4>
                  <p class="empty-desc">
                    Không có tài khoản nào khớp với từ khóa "{{ keyword }}" hoặc bộ lọc đã chọn.
                  </p>
                  <button class="btn btn-outline-primary btn-sm rounded-xl px-3" @click="resetFilters">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Xóa tất cả bộ lọc
                  </button>
                </div>
              </td>
            </tr>

            <!-- User Rows -->
            <tr v-for="u in filteredItems" :key="u.id" class="user-row">
              <!-- ID -->
              <td class="text-slate-400 font-mono small font-bold">#{{ u.id }}</td>

              <!-- Identity (Avatar + Name + Email + Phone) -->
              <td>
                <div class="d-flex align-items-center gap-3">
                  <div class="user-avatar-wrap">
                    <img
                      v-if="u.avatarUrl"
                      :src="u.avatarUrl"
                      :alt="u.fullName"
                      class="user-avatar-img"
                    />
                    <div v-else class="user-avatar-initial" :class="getAvatarColorClass(u.id)">
                      {{ getInitial(u.fullName || u.email) }}
                    </div>
                    <!-- Presence Mini Badge on Avatar -->
                    <span
                      class="avatar-presence-dot"
                      :class="u.isOnline ? 'online' : 'offline'"
                      :title="u.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'"
                    ></span>
                  </div>

                  <div class="user-info">
                    <div class="user-name">
                      {{ u.fullName || 'Chưa đặt tên' }}
                    </div>
                    <div class="user-email-wrap">
                      <span class="user-email">{{ u.email }}</span>
                    </div>
                    <div v-if="u.phone" class="user-phone">
                      <i class="bi bi-telephone me-1"></i>{{ u.phone }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Role Badge -->
              <td>
                <span class="role-badge" :class="getRoleClass(u.role)">
                  <i :class="getRoleIcon(u.role)" class="me-1"></i>
                  {{ formatRole(u.role) }}
                </span>
              </td>

              <!-- Realtime Connection Presence (Live via WebSocket) -->
              <td>
                <div class="presence-pill" :class="u.isOnline ? 'online' : 'offline'">
                  <span class="presence-pulse-dot" v-if="u.isOnline"></span>
                  <span class="presence-gray-dot" v-else></span>
                  <span class="presence-text">
                    {{ u.isOnline ? 'Trực tuyến' : 'Ngoại tuyến' }}
                  </span>
                </div>
                <div v-if="u.lastLoginAt" class="text-[11px] text-slate-400 mt-1">
                  Đăng nhập: {{ formatDate(u.lastLoginAt) }}
                </div>
              </td>

              <!-- Account Status Badge -->
              <td>
                <span class="status-badge" :class="getStatusClass(u.status)">
                  <i :class="getStatusIcon(u.status)" class="me-1"></i>
                  {{ formatStatus(u.status) }}
                </span>
              </td>

              <!-- Joined Date -->
              <td class="text-slate-500 small">
                {{ formatDate(u.createdAt) }}
              </td>

              <!-- Actions -->
              <td class="text-end">
                <div class="action-buttons-wrap justify-content-end">
                  <!-- Role edit -->
                  <button
                    class="action-btn"
                    title="Đổi vai trò"
                    @click="openRoleModal(u)"
                  >
                    <i class="bi bi-person-gear"></i>
                  </button>

                  <!-- Lock / Unlock status toggle -->
                  <button
                    class="action-btn"
                    :class="u.status === 'ACTIVE' ? 'lock-btn' : 'unlock-btn'"
                    :title="u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
                    @click="changeStatus(u)"
                  >
                    <i :class="u.status === 'ACTIVE' ? 'bi-lock-fill text-warning' : 'bi-unlock-fill text-success'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="table-footer">
        <div class="text-slate-500 small">
          Hiển thị trang <strong>{{ page + 1 }}</strong> / <strong>{{ totalPages }}</strong>
          ({{ totalElements }} người dùng)
        </div>
        <div class="pagination-btns">
          <button
            class="pagination-btn"
            :disabled="page === 0"
            @click="() => { page--; load() }"
          >
            <i class="bi bi-chevron-left me-1"></i> Trang trước
          </button>
          <button
            class="pagination-btn"
            :disabled="page + 1 >= totalPages"
            @click="() => { page++; load() }"
          >
            Trang sau <i class="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── CHANGE ROLE MODAL ──────────────────────────────────── -->
    <BaseModal
      v-model="showRoleModal"
      title="Phân Quyền Vai Trò Người Dùng"
      size="sm"
      @close="showRoleModal = false"
    >
      <div class="p-2">
        <p class="text-xs text-slate-500 mb-3">
          Chọn quyền hạn mới cho tài khoản:
          <strong class="text-slate-900 block mt-1 font-mono text-sm">{{ roleTarget ? roleTarget.email : '' }}</strong>
        </p>

        <div class="role-select-list">
          <div
            v-for="opt in roleOptions"
            :key="opt.value"
            class="role-opt-item"
            :class="{ active: roleNext === opt.value }"
            @click="roleNext = opt.value"
          >
            <div class="d-flex align-items-center gap-2.5">
              <input
                :id="'role-opt-' + opt.value"
                v-model="roleNext"
                type="radio"
                class="form-check-input mt-0"
                :value="opt.value"
              />
              <label class="form-check-label font-bold text-xs" :for="'role-opt-' + opt.value">
                {{ opt.label }}
              </label>
            </div>
            <p class="text-[11px] text-slate-400 ms-5 mb-0">{{ opt.desc }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-light rounded-xl px-3 text-xs font-bold" @click="showRoleModal = false">
          Hủy
        </button>
        <button class="btn btn-primary rounded-xl px-4 text-xs font-bold" @click="confirmRoleChange">
          <i class="bi bi-check-lg me-1"></i> Lưu thay đổi
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { adminUserService } from '@/services/adminUser.service'
import { useNotifyStore } from '@/stores/notify'
import { useDialogs } from '@/composables/useDialogs'
import { useRealtime } from '@/composables/useRealtime'
import BaseModal from '@/components/common/BaseModal.vue'

const route = useRoute()
const notify = useNotifyStore()
const dialog = useDialogs()

const items = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const status = ref('')
const role = ref('')
const keyword = ref('')
const presenceFilter = ref('')
const loading = ref(false)

// Set of online user IDs tracked in memory
const onlineUserIds = ref(new Set())

// Role modal state
const showRoleModal = ref(false)
const roleTarget = ref(null)
const roleNext = ref('')

const roleOptions = [
  { value: 'BUYER', label: 'Người mua (BUYER)', desc: 'Chỉ có quyền mua sắm, đặt đơn và đánh giá sản phẩm' },
  { value: 'SELLER', label: 'Nhà bán (SELLER)', desc: 'Có quyền quản lý cửa hàng, đăng sản phẩm và vận chuyển' },
  { value: 'ADMIN', label: 'Quản trị viên (ADMIN)', desc: 'Toàn quyền kiểm soát và vận hành hệ thống sàn' },
]

// Online counter
const onlineCount = computed(() => {
  return items.value.filter((u) => u.isOnline).length
})

// Client-side presence filter if applied
const filteredItems = computed(() => {
  if (!presenceFilter.value) return items.value
  if (presenceFilter.value === 'ONLINE') {
    return items.value.filter((u) => u.isOnline)
  }
  if (presenceFilter.value === 'OFFLINE') {
    return items.value.filter((u) => !u.isOnline)
  }
  return items.value
})

function getInitial(str) {
  if (!str) return 'U'
  return str.trim().charAt(0).toUpperCase()
}

function getAvatarColorClass(id) {
  const colors = ['bg-indigo', 'bg-emerald', 'bg-cyan', 'bg-amber', 'bg-rose', 'bg-purple']
  return colors[(id || 0) % colors.length]
}

function formatRole(r) {
  switch (r) {
    case 'ADMIN': return 'Super Admin'
    case 'SELLER': return 'Nhà bán (Seller)'
    case 'BUYER': return 'Người mua (Buyer)'
    default: return r || 'Chưa cấp'
  }
}

function getRoleClass(r) {
  switch (r) {
    case 'ADMIN': return 'role-admin'
    case 'SELLER': return 'role-seller'
    case 'BUYER': return 'role-buyer'
    default: return 'role-default'
  }
}

function getRoleIcon(r) {
  switch (r) {
    case 'ADMIN': return 'bi-shield-shaded'
    case 'SELLER': return 'bi-shop'
    case 'BUYER': return 'bi-bag'
    default: return 'bi-person'
  }
}

function formatStatus(s) {
  switch (s) {
    case 'ACTIVE': return 'Hoạt động'
    case 'LOCKED': return 'Tạm khóa'
    case 'BANNED': return 'Bị cấm'
    default: return s || 'N/A'
  }
}

function getStatusClass(s) {
  switch (s) {
    case 'ACTIVE': return 'status-active'
    case 'LOCKED': return 'status-locked'
    case 'BANNED': return 'status-banned'
    default: return 'status-default'
  }
}

function getStatusIcon(s) {
  switch (s) {
    case 'ACTIVE': return 'bi-check-circle-fill'
    case 'LOCKED': return 'bi-lock-fill'
    case 'BANNED': return 'bi-slash-circle-fill'
    default: return 'bi-info-circle-fill'
  }
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(d))
  } catch {
    return d
  }
}

async function load(showToast = false) {
  loading.value = true
  try {
    const params = { page: page.value, size: size.value }
    if (status.value) params.status = status.value
    if (role.value) params.role = role.value
    if (keyword.value.trim()) params.q = keyword.value.trim()

    const [res, onlineRes] = await Promise.all([
      adminUserService.list(params),
      adminUserService.getOnlineUsers().catch(() => []),
    ])

    // Update online set
    const onlineSet = new Set()
    if (Array.isArray(onlineRes)) {
      onlineRes.forEach((id) => onlineSet.add(Number(id)))
    }
    onlineUserIds.value = onlineSet

    const fetched = res.items || res.content || []
    // Overlay online state if backend says isOnline OR onlineUserIds contains this id
    items.value = fetched.map((u) => {
      const isOnline = Boolean(u.isOnline || onlineUserIds.value.has(Number(u.id)))
      if (isOnline) {
        onlineUserIds.value.add(Number(u.id))
      }
      return {
        ...u,
        isOnline,
      }
    })

    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? items.value.length

    if (showToast) {
      notify.push('Đã đồng bộ danh sách người dùng mới nhất', 'success')
    }
  } catch (err) {
    console.error('Failed to load users:', err)
    notify.push('Không thể tải danh sách người dùng. Vui lòng thử lại!', 'danger')
  } finally {
    loading.value = false
  }
}

function handleApplyFilter() {
  page.value = 0
  load()
}

function clearKeyword() {
  keyword.value = ''
  handleApplyFilter()
}

function resetFilters() {
  keyword.value = ''
  role.value = ''
  status.value = ''
  presenceFilter.value = ''
  page.value = 0
  load()
}

async function changeStatus(user) {
  const next = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
  const actionText = next === 'LOCKED' ? 'khóa' : 'mở khóa'
  const ok = await dialog.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${user.email}"?`, {
    title: `${next === 'LOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản người dùng`,
    variant: next === 'LOCKED' ? 'danger' : 'success',
    confirmText: 'Xác nhận',
  })
  if (!ok) return

  try {
    await adminUserService.updateStatus(user.id, next)
    user.status = next
    notify.push(`Đã ${actionText} tài khoản ${user.email} thành công!`, 'success')
  } catch (e) {
    notify.push('Không thể thay đổi trạng thái tài khoản.', 'danger')
  }
}

function openRoleModal(user) {
  roleTarget.value = user
  roleNext.value = user.role
  showRoleModal.value = true
}

async function confirmRoleChange() {
  if (!roleNext.value || roleNext.value === roleTarget.value?.role) {
    showRoleModal.value = false
    return
  }
  try {
    await adminUserService.updateRole(roleTarget.value.id, roleNext.value)
    roleTarget.value.role = roleNext.value
    notify.push(`Đã cập nhật vai trò ${formatRole(roleNext.value)} cho ${roleTarget.value.email}`, 'success')
    showRoleModal.value = false
  } catch (e) {
    notify.push('Không thể cập nhật vai trò người dùng.', 'danger')
  }
}

// ── REALTIME PRESENCE LISTENER ──────────────────────────────
// Listens to STOMP topic `/topic/admin/presence`
useRealtime({
  topics: [
    {
      destination: '/topic/admin/presence',
      callback: (msg) => {
        if (!msg || msg.userId == null) return
        const userId = Number(msg.userId)
        const isOnline = Boolean(msg.isOnline)

        if (isOnline) {
          onlineUserIds.value.add(userId)
        } else {
          onlineUserIds.value.delete(userId)
        }

        // Live update in local items list
        const target = items.value.find((u) => Number(u.id) === userId)
        if (target) {
          target.isOnline = isOnline
        }
      },
    },
  ],
})

onMounted(() => {
  // Read ?q= query param if navigated from top search bar
  if (typeof route.query.q === 'string' && route.query.q.trim()) {
    keyword.value = route.query.q.trim()
  }
  load()
})
</script>

<style scoped>
.users-view-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── HEADER BANNER ────────────────────────────────────────── */
.users-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1e293b 100%);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 18px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
  color: #ffffff;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.header-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.header-subtitle {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin-bottom: 0;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.55rem 1rem;
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.stat-pill.highlight-online {
  border-color: rgba(16, 185, 129, 0.35);
  background: rgba(16, 185, 129, 0.08);
}

.stat-pill-label {
  font-size: 0.6875rem;
  color: #94a3b8;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.stat-pill-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
}

.text-emerald {
  color: #10b981 !important;
}

/* ── FILTER TOOLBAR ─────────────────────────────────────── */
.filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.04);
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 0.875rem;
  pointer-events: none;
}

.btn-clear-keyword {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.2rem;
  font-size: 0.875rem;
}

.btn-clear-keyword:hover {
  color: #64748b;
}

.filter-input {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 0.8125rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.filter-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.filter-select {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 0.8125rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  cursor: pointer;
}

.filter-btn-apply {
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  background: #4f46e5;
  border: none;
}

.filter-btn-apply:hover {
  background: #4338ca;
}

.filter-btn-refresh {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.75rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── TABLE CARD ─────────────────────────────────────────── */
.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.custom-table {
  margin-bottom: 0;
}

.custom-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.custom-table th {
  font-size: 0.6875rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.custom-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.user-row:hover {
  background: #f8fafc;
}

/* Identity Column */
.user-avatar-wrap {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
}

.user-avatar-initial {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.9375rem;
}

.bg-indigo { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.bg-emerald { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.bg-cyan { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.bg-amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.bg-rose { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); }
.bg-purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }

.avatar-presence-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.avatar-presence-dot.online {
  background: #10b981;
}

.avatar-presence-dot.offline {
  background: #cbd5e1;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.user-email-wrap {
  font-size: 0.75rem;
  color: #475569;
}

.user-email {
  font-family: monospace;
}

.user-phone {
  font-size: 0.6875rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

/* Role Badges */
.role-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
}

.role-admin {
  background: #ede9fe;
  color: #6d28d9;
  border: 1px solid rgba(109, 40, 217, 0.2);
}

.role-seller {
  background: #cffafe;
  color: #0e7490;
  border: 1px solid rgba(14, 116, 144, 0.2);
}

.role-buyer {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.role-default {
  background: #f8fafc;
  color: #64748b;
}

/* Presence Live Pill */
.presence-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
}

.presence-pill.online {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.presence-pill.offline {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.presence-pulse-dot {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 6px #10b981;
  animation: pulse-dot 1.8s infinite;
}

.presence-gray-dot {
  width: 7px;
  height: 7px;
  background: #cbd5e1;
  border-radius: 50%;
}

/* Account Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-locked {
  background: #fef3c7;
  color: #92400e;
}

.status-banned {
  background: #ffe4e6;
  color: #9f1239;
}

/* Action buttons */
.action-buttons-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}

.action-btn.lock-btn:hover {
  background: #fffbeb;
  border-color: #fde68a;
}

.action-btn.unlock-btn:hover {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

/* Empty State */
.empty-state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #94a3b8;
  margin-bottom: 0.875rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.empty-desc {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 1rem;
  max-width: 360px;
}

/* Table Footer / Pagination */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.pagination-btns {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Role Modal Options */
.role-select-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.role-opt-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-opt-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.role-opt-item.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}
</style>
