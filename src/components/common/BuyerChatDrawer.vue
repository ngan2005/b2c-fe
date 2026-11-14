<template>
  <!-- Floating Buyer Chat Widget (Shopee Style) -->
  <div v-if="chatStore.isOpen && auth.isAuthenticated" class="buyer-chat-dock position-fixed bottom-4 end-4 z-50">
    <!-- Minimized Floating Bar -->
    <div
      v-if="chatStore.isMinimized"
      class="bg-indigo-600 text-white px-3.5 py-2.5 rounded-full shadow-2xl d-flex align-items-center gap-2 cursor-pointer hover:bg-indigo-700 transition-all animate-fade-in border border-indigo-500"
      @click="chatStore.toggleMinimize"
    >
      <div class="position-relative">
        <i class="bi bi-chat-dots-fill text-lg"></i>
        <span class="position-absolute top-0 start-100 translate-middle p-1 bg-emerald-400 border border-white rounded-circle"></span>
      </div>
      <span class="font-semibold text-xs line-clamp-1 max-w-[140px]">
        {{ chatStore.activeConversation?.shopName || 'Chat với Shop' }}
      </span>
      <i class="bi bi-arrows-angle-expand text-xs ms-1"></i>
    </div>

    <!-- Full Chat Drawer Window -->
    <div
      v-else
      class="card border-0 shadow-2xl rounded-2xl overflow-hidden bg-white d-flex flex-column animate-fade-in chat-window"
    >
      <!-- Chat Header -->
      <div class="card-header bg-slate-900 text-white p-3 d-flex align-items-center justify-content-between border-0">
        <div class="d-flex align-items-center gap-2.5 overflow-hidden">
          <!-- Back to conversation list button (if viewing list) -->
          <button
            v-if="viewMode === 'messages' && conversations.length > 1"
            type="button"
            class="btn btn-sm btn-link text-white p-0 me-1"
            title="Danh sách đoạn chat"
            @click="viewMode = 'conversations'"
          >
            <i class="bi bi-chevron-left text-base"></i>
          </button>

          <!-- Shop Avatar -->
          <div class="position-relative shrink-0">
            <img
              v-if="chatStore.activeConversation?.shopAvatar"
              :src="chatStore.activeConversation.shopAvatar"
              alt=""
              class="w-9 h-9 rounded-full object-cover border border-white/20"
              @error="onImgError"
            />
            <div
              v-else
              class="w-9 h-9 rounded-full bg-indigo-600 d-flex align-items-center justify-content-center text-white text-xs font-bold"
            >
              {{ (chatStore.activeConversation?.shopName || 'S').charAt(0).toUpperCase() }}
            </div>
            <span class="position-absolute bottom-0 end-0 w-2.5 h-2.5 bg-emerald-500 border border-slate-900 rounded-full"></span>
          </div>

          <!-- Shop Details -->
          <div class="overflow-hidden">
            <h6 class="font-bold text-xs m-0 text-white line-clamp-1">
              {{ chatStore.activeConversation?.shopName || 'Gian Hàng Đối Tác' }}
            </h6>
            <div class="text-[10px] text-slate-400 d-flex align-items-center gap-1.5 mt-0.5">
              <span class="badge bg-emerald-500/20 text-emerald-400 font-normal px-1.5 py-0.5 rounded">Trực tuyến</span>
              <span v-if="realtimeConnected" class="text-emerald-400 text-[10px]" title="WebSocket Realtime Connected">
                <i class="bi bi-broadcast"></i> Live
              </span>
            </div>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="d-flex align-items-center gap-1 shrink-0 text-slate-300">
          <button
            type="button"
            class="btn btn-sm btn-link text-slate-300 hover:text-white p-1"
            title="Đoạn chat khác"
            @click="toggleConversationsList"
          >
            <i class="bi bi-chat-left-text text-sm"></i>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-link text-slate-300 hover:text-white p-1"
            title="Thu nhỏ"
            @click="chatStore.toggleMinimize"
          >
            <i class="bi bi-dash-lg text-sm"></i>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-link text-slate-300 hover:text-white p-1"
            title="Đóng chat"
            @click="chatStore.closeChat"
          >
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>
      </div>

      <!-- VIEW 1: Conversations List (when toggled) -->
      <div v-if="viewMode === 'conversations'" class="flex-grow-1 overflow-y-auto bg-slate-50 p-2 space-y-1">
        <div class="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Hội thoại của bạn
        </div>
        <div
          v-for="c in conversations"
          :key="c.id"
          class="p-2.5 bg-white rounded-xl border border-slate-100 d-flex align-items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
          :class="{ 'border-indigo-400 bg-indigo-50/40': c.id === chatStore.activeConversation?.id }"
          @click="selectConversation(c)"
        >
          <img
            v-if="c.otherPartyAvatar"
            :src="c.otherPartyAvatar"
            alt=""
            class="w-8 h-8 rounded-full object-cover shrink-0"
            @error="onImgError"
          />
          <div v-else class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 d-flex align-items-center justify-content-center text-xs font-bold shrink-0">
            {{ (c.otherPartyName || 'S').charAt(0).toUpperCase() }}
          </div>
          <div class="overflow-hidden flex-grow-1">
            <div class="font-bold text-xs text-slate-800 line-clamp-1">{{ c.otherPartyName }}</div>
            <div class="text-[11px] text-slate-400 line-clamp-1">{{ c.lastMessagePreview || 'Bắt đầu trò chuyện' }}</div>
          </div>
          <span v-if="c.unreadCount > 0" class="badge bg-rose-500 text-white rounded-full text-[10px] px-1.5 py-0.5">
            {{ c.unreadCount }}
          </span>
        </div>
      </div>

      <!-- VIEW 2: Chat Messages Area -->
      <template v-else>
        <!-- Pinned Product Context Banner -->
        <div
          v-if="chatStore.targetProduct"
          class="p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 d-flex align-items-center justify-content-between gap-2"
        >
          <div class="d-flex align-items-center gap-2 overflow-hidden">
            <img
              :src="chatStore.targetProduct.thumbnailUrl || PLACEHOLDER_PRODUCT_IMG"
              alt=""
              class="w-10 h-10 rounded-lg object-cover border border-amber-200 shrink-0"
              @error="onImgError"
            />
            <div class="overflow-hidden text-xs">
              <div class="font-bold text-slate-800 line-clamp-1" :title="chatStore.targetProduct.name">
                {{ chatStore.targetProduct.name }}
              </div>
              <div class="text-rose-600 font-mono font-bold text-[11px]">
                {{ formatVnd(chatStore.targetProduct.minPrice) }}
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-warning btn-xs rounded-lg px-2 py-1 font-semibold text-[11px] shrink-0 d-inline-flex align-items-center gap-1 text-slate-900"
            :disabled="sending"
            @click="sendProductSnippet"
          >
            <i class="bi bi-send-fill text-[10px]"></i>
            <span>Gửi hỏi shop</span>
          </button>
        </div>

        <!-- Messages Container -->
        <div ref="chatContainer" class="card-body p-3 overflow-y-auto flex-grow-1 bg-slate-50/60 space-y-2.5">
          <!-- Loading messages -->
          <div v-if="loadingMessages" class="text-center py-4 text-slate-400 text-xs">
            <span class="spinner-border spinner-border-sm me-1.5"></span> Đang tải tin nhắn...
          </div>

          <!-- Empty state -->
          <div v-else-if="messages.length === 0" class="text-center py-5 text-slate-400">
            <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 d-flex align-items-center justify-content-center text-slate-400">
              <i class="bi bi-chat-heart text-xl"></i>
            </div>
            <div class="font-semibold text-xs text-slate-600">Bắt đầu trò chuyện với Shop</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Đặt câu hỏi về kích thước, màu sắc, tình trạng còn hàng hoặc giao hàng.</div>
          </div>

          <!-- Message Bubbles -->
          <div
            v-for="msg in messages"
            :key="msg.id || msg.createdAt"
            class="d-flex"
            :class="isMyMessage(msg) ? 'justify-content-end' : 'justify-content-start'"
          >
            <div
              class="max-w-[85%] p-2.5 rounded-2xl text-xs shadow-xs break-words"
              :class="isMyMessage(msg)
                ? 'bg-indigo-600 text-white rounded-bottom-right-0'
                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bottom-left-0'"
            >
              <div class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</div>
              <div
                class="text-[9px] mt-1 text-end"
                :class="isMyMessage(msg) ? 'text-indigo-200' : 'text-slate-400'"
              >
                {{ formatTime(msg.createdAt) }}
              </div>
            </div>
          </div>
          <div ref="msgBottom"></div>
        </div>

        <!-- Input Box -->
        <div class="card-footer bg-white p-2.5 border-t border-slate-100">
          <form class="d-flex align-items-center gap-1.5" @submit.prevent="handleSend">
            <input
              ref="inputRef"
              v-model="inputContent"
              type="text"
              class="form-control form-control-sm rounded-xl text-xs py-2 border-slate-200"
              placeholder="Nhập tin nhắn... (Nhấn Enter để gửi)"
              :disabled="sending || loadingMessages"
              @keydown="onKeydown"
            />
            <button
              type="submit"
              class="btn btn-primary btn-sm rounded-xl px-3 py-2 d-inline-flex align-items-center justify-content-center shrink-0"
              :disabled="sending || !inputContent.trim()"
            >
              <i class="bi bi-send-fill text-xs"></i>
            </button>
          </form>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatModalStore } from '@/stores/chatModal'
import { useAuthStore } from '@/stores/auth'
import { chatService } from '@/services/chat.service'
import { useRealtime } from '@/composables/useRealtime'
import { PLACEHOLDER_PRODUCT_IMG, onProductImgError } from '@/utils/imageFallback'

const chatStore = useChatModalStore()
const auth = useAuthStore()

const viewMode = ref('messages') // 'messages' | 'conversations'
const conversations = ref([])
const messages = ref([])
const loadingMessages = ref(false)
const sending = ref(false)
const inputContent = ref('')

const chatContainer = ref(null)
const msgBottom = ref(null)
const inputRef = ref(null)

const onImgError = onProductImgError

// WebSocket connection with dynamic subscription
const { isConnected: realtimeConnected, subscribe } = useRealtime()

let unsubscribeConv = null
let unsubscribeUser = null

const activeConvId = computed(() => chatStore.activeConversation?.id)

function isMyMessage(msg) {
  // If senderType is BUYER, it's from current buyer
  if (msg.senderType === 'BUYER' || msg.sender === 'BUYER') return true
  if (msg.senderId && auth.user?.id && Number(msg.senderId) === Number(auth.user.id)) return true
  return false
}

async function loadMessages() {
  if (!activeConvId.value) return
  loadingMessages.value = true
  try {
    const res = await chatService.getMessages(activeConvId.value)
    messages.value = res.items || res.content || res || []
    await nextTick()
    scrollToBottom()
    // Mark as read
    chatService.markAsRead(activeConvId.value).catch(() => {})
  } catch (err) {
    console.error('Failed to load chat messages:', err)
  } finally {
    loadingMessages.value = false
  }
}

async function loadConversationsList() {
  try {
    const res = await chatService.getConversations({ page: 0, size: 20 })
    conversations.value = res.items || res.content || res || []
  } catch (err) {
    console.error('Failed to load conversations:', err)
  }
}

function selectConversation(conv) {
  chatStore.activeConversation = conv
  chatStore.targetProduct = null
  viewMode.value = 'messages'
  loadMessages()
  setupWebSocket()
}

function toggleConversationsList() {
  if (viewMode.value === 'conversations') {
    viewMode.value = 'messages'
  } else {
    loadConversationsList()
    viewMode.value = 'conversations'
  }
}

function setupWebSocket() {
  // Clean up previous subscription
  if (unsubscribeConv) {
    unsubscribeConv()
    unsubscribeConv = null
  }
  if (unsubscribeUser) {
    unsubscribeUser()
    unsubscribeUser = null
  }

  if (!activeConvId.value) return

  // 1. Subscribe to conversation channel
  unsubscribeConv = subscribe(`/topic/chat/conversation/${activeConvId.value}`, (envelope) => {
    handleIncomingSocketMessage(envelope)
  })

  // 2. Subscribe to user personal channel (for notifications & incoming chats)
  if (auth.user?.id) {
    unsubscribeUser = subscribe(`/topic/chat/user/${auth.user.id}`, (envelope) => {
      handleIncomingSocketMessage(envelope)
    })
  }
}

function handleIncomingSocketMessage(envelope) {
  if (!envelope) return
  if (envelope.type === 'NEW_MESSAGE') {
    const msgDto = envelope.message
    if (!msgDto) return

    // If message is for this active conversation
    if (Number(envelope.conversationId) === Number(activeConvId.value)) {
      // Avoid duplicate append
      const exists = messages.value.some((m) => m.id === msgDto.id)
      if (!exists) {
        messages.value.push(msgDto)
        nextTick(() => scrollToBottom())
        chatService.markAsRead(activeConvId.value).catch(() => {})
      }
    }
  }
}

async function handleSend() {
  const text = inputContent.value.trim()
  if (!text || sending.value || !activeConvId.value) return

  sending.value = true
  const tempText = text
  inputContent.value = ''

  try {
    const res = await chatService.sendMessage(activeConvId.value, { content: tempText })
    const savedMsg = res.data || res

    // Optimistically add message if not already added by socket
    const exists = messages.value.some((m) => m.id === savedMsg.id)
    if (!exists) {
      messages.value.push(savedMsg)
      await nextTick()
      scrollToBottom()
    }
  } catch (err) {
    console.error('Failed to send message:', err)
    inputContent.value = tempText
  } finally {
    sending.value = false
    nextTick(() => inputRef.value?.focus())
  }
}

async function sendProductSnippet() {
  if (!chatStore.targetProduct || !activeConvId.value) return
  const p = chatStore.targetProduct
  const snippet = `[Sản phẩm đang xem: ${p.name} - Giá: ${formatVnd(p.minPrice)}] - Shop tư vấn giúp em nhé!`
  chatStore.clearTargetProduct()

  sending.value = true
  try {
    const res = await chatService.sendMessage(activeConvId.value, { content: snippet })
    const saved = res.data || res
    messages.value.push(saved)
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Failed to send product snippet:', err)
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  if (msgBottom.value) {
    msgBottom.value.scrollIntoView({ behavior: 'smooth' })
  }
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function formatVnd(val) {
  if (val == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN').format(val) + ' ₫'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// Watch active conversation change
watch(
  () => chatStore.activeConversation,
  (newConv) => {
    if (newConv?.id) {
      viewMode.value = 'messages'
      loadMessages()
      setupWebSocket()
      nextTick(() => inputRef.value?.focus())
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.chat-window {
  width: 380px;
  max-width: calc(100vw - 32px);
  height: 520px;
  max-height: calc(100vh - 100px);
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>

