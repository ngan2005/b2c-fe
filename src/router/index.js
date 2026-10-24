import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Static import — prevents a Vite HMR bug where the async component resolution
// returns `null` on navigation, leaving the AdminLayout entirely blank.
import AdminLayout from '@/components/layout/AdminLayout.vue'

// --- Area helpers ---
/**
 * Resolve the current user's "area" based on their primary role.
 * Each user has EXACTLY ONE role, so they can only access that role's area.
 *  - ADMIN  → 'admin'
 *  - SELLER → 'seller'
 *  - BUYER  → 'buyer'
 *  - no session → 'guest'
 */
function currentArea() {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return 'guest'
  if (auth.isAdmin) return 'admin'
  if (auth.isSeller) return 'seller'
  if (auth.isBuyer) return 'buyer'
  return 'guest'
}

function dashboardForArea(area) {
  if (area === 'admin') return { name: 'admin-dashboard' }
  if (area === 'seller') return { name: 'seller-dashboard' }
  // buyer or guest fallback
  return { name: 'home' }
}

// --- Forbidden view (lazy) ---
const ForbiddenView = () => import('@/views/public/ForbiddenView.vue')

/**
 * Every route MUST declare `meta.area`:
 *   - 'public'  : anyone (guest, buyer, seller, admin) can view
 *   - 'auth'    : only guests (logged-in users are redirected to their dashboard)
 *   - 'buyer'   : only BUYER (logged in)
 *   - 'seller'  : only SELLER
 *   - 'admin'   : only ADMIN
 * Optional `meta.requiresAuth: true` for pages that need a session.
 */
const routes = [
  // ── BUYER (NO MALL) Layout ────────────────────────────────
  {
    path: '/',
    component: () => import('@/components/layout/BuyerLayout.vue'),
    children: [
      // Public (anyone)
      { path: '', name: 'home', component: () => import('@/views/buyer/HomeView.vue'), meta: { area: 'public' } },
      { path: 'products', name: 'products', component: () => import('@/views/buyer/ProductsView.vue'), meta: { area: 'public' } },
      { path: 'products/:slug', name: 'product-detail', component: () => import('@/views/buyer/ProductDetailView.vue'), props: true, meta: { area: 'public' } },
      { path: 'shop/:slug', name: 'shop-detail', component: () => import('@/views/public/ShopDetailView.vue'), meta: { area: 'public' } },
      { path: 'payment/return', name: 'payment-return', component: () => import('@/views/payment/PaymentReturnView.vue'), meta: { area: 'public' } },
      { path: 'oauth/callback', name: 'oauth-callback', component: () => import('@/views/auth/OAuthCallbackView.vue'), meta: { area: 'public' } },
      { path: 'contact', name: 'contact', component: () => import('@/views/public/ContactView.vue'), meta: { area: 'public' } },

      // Auth pages (only guests)
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { area: 'auth' } },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { area: 'auth' } },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { area: 'auth' } },
      { path: 'reset-password', name: 'reset-password', component: () => import('@/views/auth/ResetPasswordView.vue'), meta: { area: 'auth' } },

      // Buyer-only (require login)
      { path: 'cart', name: 'cart', component: () => import('@/views/buyer/CartView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'checkout', name: 'checkout', component: () => import('@/views/buyer/CheckoutView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/profile', name: 'account-profile', component: () => import('@/views/account/ProfileView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/addresses', name: 'account-addresses', component: () => import('@/views/account/AddressesView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/orders', name: 'account-orders', component: () => import('@/views/account/OrdersView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/orders/:id', name: 'account-order-detail', component: () => import('@/views/account/OrderDetailView.vue'), props: true, meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/orders/:id/confirmation', name: 'account-order-confirmation', component: () => import('@/views/account/OrderConfirmationView.vue'), props: true, meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/wishlist', name: 'account-wishlist', component: () => import('@/views/account/WishlistView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/vouchers', name: 'account-vouchers', component: () => import('@/views/account/VouchersView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'account/change-password', name: 'account-change-password', component: () => import('@/views/account/ChangePasswordView.vue'), meta: { area: 'buyer', requiresAuth: true } },
      { path: 'apply-seller', name: 'apply-seller', component: () => import('@/views/account/SellerApplicationView.vue'), meta: { area: 'buyer', requiresAuth: true } },
    ],
  },

  // ── OLD Public Layout (admin-only fallback) ──────────────
  {
    path: '/public',
    component: () => import('@/components/layout/PublicLayout.vue'),
    children: [
      { path: '', redirect: '/' },
      { path: 'home-placeholder', name: 'home-placeholder', component: () => import('@/views/public/HomePlaceholder.vue'), meta: { area: 'public' } },
      { path: 'not-found', name: 'not-found', component: () => import('@/views/public/NotFound.vue'), meta: { area: 'public' } },
      { path: 'forbidden', name: 'forbidden', component: () => import('@/views/public/ForbiddenView.vue'), meta: { area: 'public' } },
    ],
  },

  // Seller Dashboard Layout — ONLY sellers
  {
    path: '/seller',
    component: () => import('@/components/layout/SellerLayout.vue'),
    meta: { area: 'seller', requiresAuth: true },
    children: [
      { path: '', name: 'seller-dashboard', component: () => import('@/views/seller/Dashboard.vue') },
      { path: 'products', name: 'seller-products', component: () => import('@/views/seller/Products.vue') },
      { path: 'products/new', name: 'seller-product-new', component: () => import('@/views/seller/ProductEdit.vue') },
      { path: 'products/:id', name: 'seller-product-edit', component: () => import('@/views/seller/ProductEdit.vue'), props: true },
      { path: 'orders', name: 'seller-orders', component: () => import('@/views/seller/Orders.vue') },
      { path: 'orders/:id', name: 'seller-order-detail', component: () => import('@/views/seller/OrderDetail.vue'), props: true },
      { path: 'promotions', name: 'seller-promotions', component: () => import('@/views/seller/Promotions.vue') },
      { path: 'reviews', name: 'seller-reviews', component: () => import('@/views/seller/Reviews.vue') },
      { path: 'chat', name: 'seller-chat', component: () => import('@/views/seller/Chat.vue') },
      { path: 'stats', name: 'seller-stats', component: () => import('@/views/seller/Stats.vue') },
      { path: 'fees', name: 'seller-fees', component: () => import('@/views/seller/SellerFeesView.vue') },
      { path: 'profile', name: 'seller-profile', component: () => import('@/views/seller/Profile.vue') },
    ],
  },

  // Admin Dashboard Layout — ONLY admins
  {
    path: '/admin',
    component: AdminLayout,
    meta: { area: 'admin', requiresAuth: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'seller-applications', name: 'admin-seller-applications', component: () => import('@/views/admin/SellerApplications.vue') },
      { path: 'seller-applications/:id', name: 'admin-seller-app-detail', component: () => import('@/views/admin/SellerApplicationDetail.vue'), props: true },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/Users.vue') },
      { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/CategoryView.vue') },
      { path: 'inventory', name: 'admin-inventory', component: () => import('@/views/admin/InventoryView.vue') },
      { path: 'promotions', name: 'admin-promotions', component: () => import('@/views/admin/PromotionView.vue') },
      { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/Orders.vue') },
      { path: 'orders/:id', name: 'admin-order-detail', component: () => import('@/views/admin/OrderDetail.vue'), props: true },
      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/ProductsView.vue') },
      { path: 'sellers', name: 'admin-sellers', component: () => import('@/views/admin/SellersView.vue') },
      { path: 'finance', name: 'admin-finance', component: () => import('@/views/admin/FinanceView.vue') },
      { path: 'commission-rules', name: 'admin-commission-rules', component: () => import('@/views/admin/CommissionRulesView.vue') },
      { path: 'disputes', name: 'admin-disputes', component: () => import('@/views/admin/DisputesView.vue') },
    ],
  },

  // 403 Forbidden
  { path: '/forbidden', name: 'forbidden', component: ForbiddenView, meta: { area: 'public' } },

  // 404 Catch All
  { path: '/:pathMatch(.*)*', name: 'not-found-catch', component: () => import('@/views/public/NotFound.vue'), meta: { area: 'public' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

/**
 * Single-source-of-truth guard.
 *
 * Rules (each user has exactly one role → one area):
 *  1. If route.area === 'public'  → allow everyone.
 *  2. If route.area === 'auth'    → only guests. Logged-in users are sent
 *                                    to their dashboard.
 *  3. If route.area is one of 'buyer' | 'seller' | 'admin':
 *       a. Requires login (redirect to /login if guest).
 *       b. Current area must EQUAL route.area.
 *          Mismatch → bounce user to their own dashboard.
 */
router.beforeEach((to) => {
  const auth = useAuthStore()
  const routeArea = to.meta?.area || 'public'
  const here = currentArea()

  // 1. Public pages — anyone, BUT a logged-in non-buyer is sent to their
  //    own dashboard so they don't accidentally browse the buyer storefront.
  if (routeArea === 'public') {
    if (here === 'guest' || here === 'buyer') return true
    return dashboardForArea(here)
  }

  // 2. Auth pages — only guests.
  if (routeArea === 'auth') {
    if (here === 'guest') return true
    return dashboardForArea(here)
  }

  // 3. Protected area pages
  if (['buyer', 'seller', 'admin'].includes(routeArea)) {
    if (here === 'guest') {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (here !== routeArea) {
      // Cross-area access is forbidden — send to the user's own dashboard.
      return dashboardForArea(here)
    }
    return true
  }

  return true
})

export default router
