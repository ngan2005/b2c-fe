<template>
  <div class="position-fixed bottom-4 end-4 z-50">
    <!-- Floating Toggle Button -->
    <button
      class="btn btn-primary rounded-full shadow-lg p-3 d-flex align-items-center justify-content-center w-14 h-14 hover:scale-105 transition-all"
      @click="isOpen = !isOpen"
      title="AI Shopping Assistant"
    >
      <i v-if="!isOpen" class="bi bi-robot text-2xl"></i>
      <i v-else class="bi bi-x-lg text-xl"></i>
    </button>

    <!-- Chat Modal Window -->
    <div
      v-if="isOpen"
      class="card border-0 shadow-2xl rounded-2xl overflow-hidden position-absolute bottom-16 end-0 w-[360px] sm:w-[400px] h-[520px] bg-white d-flex flex-column animate-fade-in"
    >
      <!-- Header -->
      <div class="card-header bg-slate-900 text-white p-3.5 d-flex align-items-center justify-content-between border-0">
        <div class="d-flex align-items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-blue-600 d-flex align-items-center justify-content-center text-white text-sm">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <h6 class="font-semibold text-sm m-0 text-white">AI Shopping Assistant</h6>
            <span class="text-[11px] text-emerald-400 d-flex align-items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
            </span>
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white text-xs" @click="isOpen = false"></button>
      </div>

      <!-- Messages Body -->
      <div ref="chatContainer" class="card-body p-3.5 overflow-y-auto flex-grow-1 bg-slate-50 space-y-3">
        <div v-for="(msg, index) in messages" :key="index" :class="['d-flex', msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start']">
          <div
            :class="[
              'max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm',
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            ]"
          >
            {{ msg.text }}
          </div>
        </div>

        <div v-if="loading" class="d-flex justify-content-start">
          <div class="bg-white p-3 rounded-2xl border border-slate-200 text-slate-500 text-xs d-flex align-items-center gap-2 shadow-sm">
            <div class="spinner-border spinner-border-sm text-blue-600" role="status"></div>
            AI đang suy nghĩ...
          </div>
        </div>
      </div>

      <!-- Footer Input -->
      <div class="card-footer bg-white border-t border-slate-100 p-2.5">
        <form @submit.prevent="sendMessage" class="d-flex gap-2">
          <input
            v-model="inputMsg"
            type="text"
            class="form-control form-control-sm border-slate-200 rounded-xl text-xs py-2"
            placeholder="Hỏi AI về gợi ý sản phẩm..."
            :disabled="loading"
          />
          <button type="submit" class="btn btn-sm btn-primary rounded-xl px-3" :disabled="loading || !inputMsg.trim()">
            <i class="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { aiService } from '@/services/ai.service'

const isOpen = ref(false)
const inputMsg = ref('')
const loading = ref(false)
const conversationId = ref(null)
const chatContainer = ref(null)

const messages = ref([
  { sender: 'ai', text: 'Xin chào! Tôi là trợ lý AI mua sắm. Bạn cần tôi gợi ý hoặc tư vấn sản phẩm nào hôm nay?' },
])

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const text = inputMsg.value.trim()
  if (!text || loading.value) return

  messages.value.push({ sender: 'user', text })
  inputMsg.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const res = await aiService.chat(text, conversationId.value)
    if (res?.reply) {
      messages.value.push({ sender: 'ai', text: res.reply })
      if (res.conversationId) conversationId.value = res.conversationId
    } else {
      messages.value.push({ sender: 'ai', text: 'Xin lỗi, tôi gặp sự cố khi phản hồi. Vui lòng thử lại.' })
    }
  } catch (_) {
    messages.value.push({ sender: 'ai', text: 'Không thể kết nối tới máy chủ AI.' })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}
</script>
