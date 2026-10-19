<script setup lang="ts">
/** 桌面端首页 —— 待办统计卡 + 快捷入口网格（桌面密度） */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useMsgBadgeStore } from '@/stores/msgBadge'

const router = useRouter()
const badge = useMsgBadgeStore()
const stats = ref({ approve: 0, order: 0, unread: 0 })

onMounted(async () => {
  await badge.pull()
  stats.value.unread = badge.unread
  try {
    const r = await API.approveList(1, 1, 1)
    if (r?.code === 0) stats.value.approve = Number(r.count ?? (r.data || []).length)
  } catch { /* mock */ }
})

const ENTRIES = [
  { path: '/p/approve-types', icon: '📝', name: '发起审批' },
  { path: '/p/order-handle', icon: '⚙️', name: '订单处理' },
  { path: '/p/customer-add', icon: '➕', name: '新增客户' },
  { path: '/p/product', icon: '🧪', name: '产品管理' },
  { path: '/p/files', icon: '📁', name: '附件管理' },
  { path: '/detail/message-compose/0', icon: '✉️', name: '写消息' },
  { path: '/p/mail', icon: '📇', name: '通讯录' },
  { path: '/p/workbench', icon: '🏠', name: '工作台' },
  { path: '/p/finance-advance', icon: '💰', name: '预存款' },
  { path: '/p/note', icon: '📢', name: '企业公告' },
  { path: '/p/sample', icon: '🧫', name: '样本管理' },
  { path: '/p/after', icon: '🔧', name: '售后管理' }
]
</script>

<template>
  <div>
    <h2 class="page-title">工作台</h2>
    <div class="dcards">
      <div class="dcard" @click="router.push('/approve')">
        <div class="k">待审审批</div>
        <div class="v blue">{{ stats.approve }}</div>
      </div>
      <div class="dcard" @click="router.push('/p/message-inbox')">
        <div class="k">未读消息</div>
        <div class="v" :class="stats.unread ? 'red' : ''">{{ stats.unread }}</div>
      </div>
      <div class="dcard" @click="router.push('/p/order-handle')">
        <div class="k">待处理订单</div>
        <div class="v">{{ stats.order }}</div>
      </div>
      <div class="dcard">
        <div class="k">数据连接</div>
        <div class="v" style="font-size:15px">API 代理模式</div>
      </div>
    </div>

    <h3 class="block-title">快捷入口</h3>
    <div class="dgrid">
      <button v-for="e in ENTRIES" :key="e.path" class="grid-item" @click="router.push(e.path)">
        <span class="gi-icon">{{ e.icon }}</span><span class="gi-text">{{ e.name }}</span>
      </button>
    </div>

    <p class="foot-note">
      桌面端快捷键：<span class="kbd-hint"><kbd>Ctrl</kbd>+<kbd>K</kbd> 全局搜索</span> ·
      <span class="kbd-hint"><kbd>A</kbd> 通过 / <kbd>R</kbd> 驳回（选中审批行）</span> ·
      右键行查看更多操作 · 表格行点击查看详情
    </p>
  </div>
</template>

<style scoped>
.page-title { font-size: 18px; font-weight: 500; margin-bottom: var(--sp-5); }
.dcard { cursor: pointer; }
.dcard:hover { border-color: var(--color-primary); }
.block-title { font-size: var(--font-md); font-weight: 500; margin-bottom: var(--sp-3); }
.foot-note { margin-top: var(--sp-6); font-size: var(--font-smd); color: var(--color-text-4); line-height: 2; }
</style>
