<template>
  <aside class="bg-white border-r border-slate-200 h-100 d-flex flex-column" style="width: 260px; min-width: 260px;">
    <div class="p-4 border-b border-slate-100">
      <h6 class="text-xs uppercase font-bold tracking-wider text-slate-400 mb-0">
        <slot name="title">Navigation</slot>
      </h6>
    </div>
    <ul class="nav flex-column p-3 gap-1.5 flex-grow-1">
      <li v-for="item in items" :key="item.name" class="nav-item">
        <router-link
          :to="{ name: item.name }"
          :class="[
            'nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
            item.name === activeName || $route.name === item.name
              ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          ]"
        >
          <i v-if="item.icon" :class="['bi text-base', item.icon, item.name === activeName ? 'text-blue-600' : 'text-slate-400']"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </li>
    </ul>
    <div class="p-4 border-t border-slate-100 text-xs text-slate-500">
      <slot name="footer" />
    </div>
  </aside>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  activeName: { type: String, default: '' },
})
</script>
