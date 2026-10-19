<script setup lang="ts">
/**
 * 桌面端主布局 —— 左侧导航 + 顶栏（Ctrl+K / 刷新 / 通知 / 用户）+ 内容区。
 * 与手机端共用路由与业务组件；布局分离。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { useMsgBadgeStore } from '@/stores/msgBadge'
import { useAuthStore } from '@/stores/auth'
import { openContextMenu, runMenu } from '@/shared/contextMenu'
import { contextMenuState } from '@/shared/contextMenu'

const route = useRoute()
const router = useRouter()
const device = useDeviceStore()
const badge = useMsgBadgeStore()
const auth = useAuthStore()

const NAV = [
  { group: '工作台', items: [
    { path: '/home', label: '首页', icon: '⌂' },
    { path: '/approve', label: '审批', icon: '✓' },
    { path: '/customer', label: '客户', icon: '☰' }
  ]},
  { group: '业务', items: [
    { path: '/p/order-handle', label: '订单处理', icon: '📦' },
    { path: '/p/finance-order', label: '财务到账', icon: '📈' },
    { path: '/p/product', label: '产品管理', icon: '🧪' },
    { path: '/p/files', label: '附件管理', icon: '📁' }
  ]},
  { group: '消息', items: [
    { path: '/p/message-inbox', label: '消息中心', icon: '✉️', badge: true },
    { path: '/p/mail', label: '通讯录', icon: '📇' }
  ]},
  { group: '系统', items: [
    { path: '/p/note', label: '企业公告', icon: '📢' },
    { path: '/p/profile', label: '个人设置', icon: '⚙' }
  ]}
]

const title = computed(() => {
  for (const g of NAV) for (const it of g.items) if (route.path === it.path || route.path.startsWith(it.path + '/')) return it.label
  if (route.path === '/mine') return '我的'
  if (route.path.startsWith('/detail')) return '详情'
  return '优品OA'
})

/* ---- Ctrl+K 全局搜索 ---- */
const spot = ref(false)
const spotKw = ref('')
const spotIdx = ref(0)
const spotHits = ref<{ label: string; sub: string; go: string }[]>([])

const SEARCH_TARGETS = [
  { label: '审批', sub: '待我处理的审批', go: '/approve' },
  { label: '客户列表', sub: '我的客户 / 公海', go: '/customer' },
  { label: '新增客户', sub: '录入新客户', go: '/p/customer-add' },
  { label: '订单处理', sub: '我处理的订单', go: '/p/order-handle' },
  { label: '我的订单', sub: '我申请的订单', go: '/p/order-my' },
  { label: '平台订单', sub: '平台管家订单', go: '/p/platform-order' },
  { label: '销售协议', sub: '订单合同生成', go: '/p/order-my' },
  { label: '消息中心', sub: '收件箱', go: '/p/message-inbox' },
  { label: '写消息', sub: '新建消息', go: '/detail/message-compose/0' },
  { label: '通讯录', sub: '员工搜索', go: '/p/mail' },
  { label: '产品管理', sub: '产品 / 说明书', go: '/p/product' },
  { label: '附件管理', sub: '我的文件', go: '/p/files' },
  { label: '预存款', sub: '财务', go: '/p/finance-advance' },
  { label: '到账（订单）', sub: '财务', go: '/p/finance-order' },
  { label: '抵扣券', sub: '财务', go: '/p/deduction' },
  { label: '保证金', sub: '财务', go: '/p/margin' },
  { label: '发票申请', sub: '财务', go: '/p/invoice-my' },
  { label: '样本管理', sub: '客户子业务', go: '/p/sample' },
  { label: '校展管理', sub: '客户子业务', go: '/p/school' },
  { label: '售后管理', sub: '客户子业务', go: '/p/after' },
  { label: '企业公告', sub: '信息', go: '/p/note' },
  { label: '问答知识', sub: '信息', go: '/p/article' },
  { label: '发起审批', sub: '全部审批类型', go: '/p/approve-types' },
  { label: '工作台', sub: '快捷入口', go: '/p/workbench' }
]

function onSearch() {
  const k = spotKw.value.trim()
  spotHits.value = k ? SEARCH_TARGETS.filter(t => t.label.includes(k) || t.sub.includes(k)) : SEARCH_TARGETS.slice(0, 8)
  spotIdx.value = 0
}
function go(h: { go: string }) { spot.value = false; router.push(h.go) }

function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    spot.value = !spot.value
    if (spot.value) { onSearch(); setTimeout(() => (document.querySelector('.spotlight input') as HTMLInputElement)?.focus(), 30) }
    return
  }
  if (e.key === 'Escape') { spot.value = false; return }
  if (spot.value) {
    if (e.key === 'ArrowDown') { e.preventDefault(); spotIdx.value = Math.min(spotIdx.value + 1, spotHits.value.length - 1) }
    if (e.key === 'ArrowUp') { e.preventDefault(); spotIdx.value = Math.max(spotIdx.value - 1, 0) }
    if (e.key === 'Enter' && spotHits.value[spotIdx.value]) go(spotHits.value[spotIdx.value])
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
  badge.start()
})
onUnmounted(() => document.removeEventListener('keydown', onKey))

function refreshAll() { location.reload() }
</script>

<template>
  <div class="desktop-layout">
    <aside class="dside">
      <div class="dside-brand">
        <span class="logo">OA</span>
        <span class="name">优品OA</span>
      </div>
      <nav class="dside-nav">
        <template v-for="g in NAV" :key="g.group">
          <div class="dnav-group">{{ g.group }}</div>
          <button
            v-for="it in g.items" :key="it.path"
            :class="['dnav-item', (route.path === it.path || route.path.startsWith(it.path + '/')) ? 'active' : '']"
            @click="router.push(it.path)"
          >
            <span class="ico">{{ it.icon }}</span>
            <span>{{ it.label }}</span>
            <span v-if="it.badge && badge.unread > 0" class="badge">{{ badge.unread > 99 ? '99+' : badge.unread }}</span>
          </button>
        </template>
      </nav>
      <div class="dside-foot">
        桌面版 v1.0<br />
        <a href="javascript:void(0)" @click="device.setOverride('phone')">返回手机版</a>
      </div>
    </aside>

    <div class="dmain">
      <header class="dtopbar">
        <span class="crumb">优品OA / <b>{{ title }}</b></span>
        <span class="spacer" />
        <button class="dtop-btn" @click="spot = true; onSearch()">🔍 全局搜索 <kbd>Ctrl K</kbd></button>
        <button class="dtop-btn" @click="refreshAll">⟳ 刷新</button>
        <button class="dtop-btn" @click="router.push('/p/message-inbox')">
          <span v-if="badge.unread > 0" class="bell-dot" /> 通知{{ badge.unread > 0 ? ' ' + badge.unread : '' }}
        </button>
        <button class="dtop-btn" @click="router.push('/mine')">{{ auth.user?.username || '我的' }}</button>
      </header>

      <div class="dpage">
        <router-view />
      </div>
    </div>

    <!-- Ctrl+K 聚光搜索 -->
    <teleport to="body">
      <div v-if="spot" class="spotlight-mask" @click.self="spot = false">
        <div class="spotlight">
          <input v-model="spotKw" placeholder="搜索功能 / 页面（Ctrl+K）" @input="onSearch" @keydown.esc="spot = false" />
          <div class="results">
            <div v-for="(h, i) in spotHits" :key="h.go" :class="['row', i === spotIdx ? 'on' : '']" @click="go(h)">
              <span>{{ h.label }}</span>
              <span class="tag">{{ h.sub }}</span>
            </div>
            <div v-if="!spotHits.length" class="empty">无匹配结果</div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
