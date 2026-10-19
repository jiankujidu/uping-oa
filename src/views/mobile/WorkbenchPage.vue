<script setup lang="ts">
/** 工作台 —— 对应原 APK openWorkbench（快捷入口九宫格） */
import { useRouter } from 'vue-router'

const router = useRouter()
const ENTRIES = [
  { path: '/p/contact-list', icon: '👤', name: '联系人' },
  { path: '/p/chance-list', icon: '🎯', name: '销售机会' },
  { path: '/p/trace-list', icon: '📝', name: '跟进记录' },
  { path: '/p/order-my', icon: '📦', name: '我的订单' },
  { path: '/p/order-handle', icon: '⚙️', name: '订单处理' },
  { path: '/p/platform-order', icon: '🛒', name: '平台订单' },
  { path: '/p/sample', icon: '🧫', name: '样本管理' },
  { path: '/p/school', icon: '🏫', name: '校展管理' },
  { path: '/p/after', icon: '🔧', name: '售后管理' }
]
function go(p: string) { router.push(p) }
</script>

<template>
  <div class="workbench">
    <div class="grid">
      <button v-for="e in ENTRIES" :key="e.path" class="grid-item" @click="go(e.path)">
        <span class="gi-icon">{{ e.icon }}</span><span class="gi-text">{{ e.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-1); padding: var(--sp-3) var(--sp-4); }
.grid-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: var(--color-card); border-radius: var(--radius-card); padding: var(--sp-3) var(--sp-1);
  min-height: 76px; box-shadow: var(--shadow-card);
}
.grid-item:active { background: var(--color-primary-bg); }
.gi-icon { font-size: 24px; line-height: 1.1; }
.gi-text { font-size: var(--font-smd); color: var(--color-text); text-align: center; }
</style>
