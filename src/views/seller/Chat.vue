<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { chatService } from '@/services/chat.service'
import { useNotifyStore } from '@/stores/notify'
import { useAuthStore } from '@/stores/auth'
import { useRealtime } from '@/composables/useRealtime'

const notify = useNotifyStore()
const auth = useAuthStore()
const { isConnected, subscribe } = useRealtime()

let unsubConv = null
let unsubUser = null

const conversations = ref([])
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const size = ref(20)
const loadingConvs = ref(false)

// Active conversation
const activeConv = ref(null)
const messages = ref([])
const loadingMsgs = ref(false)
const sending = ref(false)

// New message input
const newMessage = ref('')
const msgBottom = ref(null)

function vnd(value) {
  if (value == null) return '0'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

async function loadConversations() {
  loadingConvs.value = true
  try {
    const res = await chatService.listConversations({ page: page.value, size: size.value })
    conversations.value = res.items || res.content || []
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? conversations.value.length
  } catch {
    // interceptor
  } finally {
    loadingConvs.value = false
  }
}

function setupSocket() {
  if (unsubConv) { unsubConv(); unsubConv = null; }
  if (unsubUser) { unsubUser(); unsubUser = null; }

  if (auth.user?.id) {
    unsubUser = subscribe(`/topic/chat/user/${auth.user.id}`, (envelope) => {
      handleSocketEnvelope(envelope)
    })
  }

  if (activeConv.value?.id) {
    unsubConv = subscribe(`/topic/chat/conversation/${activeConv.value.id}`, (envelope) => {
      handleSocketEnvelope(envelope)
    })
  }
}

function handleSocketEnvelope(envelope) {
  if (!envelope || envelope.type !== 'NEW_MESSAGE') return
  const msgDto = envelope.message
  if (!msgDto) return

  if (activeConv.value?.id && Number(envelope.conversationId) === Number(activeConv.value.id)) {
    const exists = messages.value.some((m) => m.id === msgDto.id)
    if (!exists) {
      messages.value.push(msgDto)
      nextTick(() => scrollToBottom())
      chatService.markAsRead(activeConv.value.id).catch(() => {})
    }
  }
  loadConversations()
}

async function selectConversation(conv) {
  activeConv.value = conv
  messages.value = []
  setupSocket()
  await loadMessages()
}

async function loadMessages() {
  if (!activeConv.value) return
  loadingMsgs.value = true
  try {
    const res = await chatService.getMessages(activeConv.value.id)
    messages.value = res.items || res.content || res || []
    await nextTick()
    scrollToBottom()
  } catch {
    // interceptor
  } finally {
    loadingMsgs.value = false
  }
}

async function sendMessage() {
  const text = newMessage.value.trim()
  if (!text || sending.value || !activeConv.value) return
  sending.value = true
  try {
    const msg = await chatService.sendMessage(activeConv.value.id, { content: text })
    // Append the returned message or a local optimistic one
    messages.value.push({
      id: msg?.id || Date.now(),
      content: text,
      sender: 'SELLER',
      createdAt: new Date().toISOString(),
    })
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
  } catch {
    // interceptor
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
    sendMessage()
  }
}

onMounted(() => {
  loadConversations()
  setupSocket()
})

onUnmounted(() => {
  if (unsubConv) unsubConv()
  if (unsubUser) unsubUser()
})
</script>

<template>
  <div>
    <div class="mb-4">
      <h2 class="fw-bold mb-1">Hội Thoại</h2>
      <p class="text-muted mb-0 small">Tin nhắn giữa bạn và người mua.</p>
    </div>

    <div class="card border-0 shadow-sm overflow-hidden" style="height: calc(100vh - 180px); min-height: 500px;">
      <div class="d-flex h-100">

        <!-- Left: Conversation List -->
        <div
          class="border-end d-flex flex-column"
          style="width: 320px; min-width: 280px;"
        >
          <div class="p-3 border-bottom bg-light">
            <div class="small text-muted fw-semibold">Hội thoại ({{ totalElements }})</div>
          </div>
          <div class="flex-fill overflow-auto">
            <div v-if="loadingConvs" class="text-center text-muted py-5">
              <div class="spinner-border spinner-border-sm me-2"></div>Đang tải...
            </div>
            <div v-else-if="!conversations.length" class="text-center text-muted py-5 small">
              Chưa có hội thoại nào.
            </div>
            <div
              v-for="conv in conversations"
              :key="conv.id"
              class="d-flex align-items-center gap-3 px-3 py-3 border-bottom cursor-pointer transition-colors"
              :class="activeConv?.id === conv.id ? 'bg-indigo-50 border-start border-3 border-indigo-500' : 'hover:bg-slate-50'"
              style="border-start-width: 3px !important;"
              @click="selectConversation(conv)"
            >
              <!-- Avatar -->
              <div class="position-relative shrink-0">
                <img
                  v-if="conv.otherPartyAvatar"
                  :src="conv.otherPartyAvatar"
                  alt=""
                  class="rounded-circle"
                  style="width: 44px; height: 44px; object-fit: cover;"
                />
                <div
                  v-else
                  class="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style="width: 44px; height: 44px;"
                >
                  {{ (conv.otherPartyName || '?')[0].toUpperCase() }}
                </div>
                <!-- Unread badge -->
                <span
                  v-if="conv.unreadCount > 0"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style="font-size: 10px;"
                >
                  {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                </span>
              </div>
              <!-- Content -->
              <div class="flex-fill overflow-hidden">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="fw-semibold small text-truncate" style="max-width: 140px;">
                    {{ conv.otherPartyName || 'Người mua' }}
                  </div>
                  <div class="small text-muted shrink-0 ms-1">
                    {{ conv.lastMessageAt ? formatDate(conv.lastMessageAt) : '' }}
                  </div>
                </div>
                <div
                  class="small text-muted text-truncate"
                  :class="conv.unreadCount > 0 ? 'fw-semibold text-dark' : ''"
                >
                  {{ conv.lastMessage || 'Chưa có tin nhắn' }}
                </div>
                <!-- (No orderCode field on ConversationDto) -->
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Message Thread -->
        <div class="flex-fill d-flex flex-column">

          <!-- No conversation selected -->
          <div v-if="!activeConv" class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
            <i class="bi bi-chat-dots text-secondary" style="font-size: 48px;"></i>
            <div class="mt-3 small">Chọn hội thoại để bắt đầu</div>
          </div>

          <!-- Conversation header -->
          <div v-else class="px-4 py-3 border-bottom bg-white d-flex align-items-center gap-2">
            <img
              v-if="activeConv.otherPartyAvatar"
              :src="activeConv.otherPartyAvatar"
              alt=""
              class="rounded-circle"
              style="width: 36px; height: 36px; object-fit: cover;"
            />
            <div
              v-else
              class="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style="width: 36px; height: 36px; font-size: 14px;"
            >
              {{ (activeConv.otherPartyName || '?')[0].toUpperCase() }}
            </div>
            <div>
              <div class="fw-semibold">{{ activeConv.otherPartyName || 'Người mua' }}</div>
            </div>
          </div>

          <!-- Messages -->
          <div v-if="activeConv" class="flex-fill overflow-auto px-4 py-3 d-flex flex-column gap-2">
            <div v-if="loadingMsgs" class="text-center text-muted py-4">
              <div class="spinner-border spinner-border-sm me-2"></div>Đang tải tin nhắn...
            </div>
            <div v-else-if="!messages.length" class="text-center text-muted small py-4">
              Chưa có tin nhắn nào. Hãy gửi lời chào!
            </div>

            <div
              v-for="msg in messages"
              :key="msg.id"
              class="d-flex"
              :class="msg.sender === 'SELLER' || msg.senderType === 'SELLER' ? 'justify-content-end' : 'justify-content-start'"
            >
              <div
                class="px-3 py-2 rounded-3"
                style="max-width: 70%;"
                :class="msg.sender === 'SELLER' || msg.senderType === 'SELLER'
                  ? 'bg-indigo-600 text-white rounded-br-1'
                  : 'bg-light text-dark rounded-bl-1 border'"
              >
                <div class="small">{{ msg.content }}</div>
                <div
                  class="text-end small mt-0.5"
                  :class="msg.sender === 'SELLER' || msg.senderType === 'SELLER' ? 'text-indigo-200' : 'text-muted'"
                  style="font-size: 10px;"
                >
                  {{ formatTime(msg.createdAt) }}
                </div>
              </div>
            </div>

            <div ref="msgBottom"></div>
          </div>

          <!-- Message input -->
          <div v-if="activeConv" class="px-4 py-3 border-top bg-white">
            <div class="d-flex gap-2 align-items-end">
              <textarea
                v-model="newMessage"
                class="form-control"
                rows="2"
                placeholder="Nhập tin nhắn..."
                style="resize: none;"
                :disabled="sending"
                @keydown="onKeydown"
              ></textarea>
              <button
                class="btn btn-primary d-flex align-items-center gap-1 px-3"
                :disabled="!newMessage.trim() || sending"
                @click="sendMessage"
              >
                <span v-if="sending" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-send"></i>
                <span>Gửi</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
