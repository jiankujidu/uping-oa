<script setup lang="ts">
/**
 * 手机端主框架 —— 对应原 APK index.html 的 app-view / topbar / tabbar。
 * 1:1 还原：topbar 48px #1E6FFF + tabbar 56px + 4 Tab + 铃铛角标 + 桌面版按钮。
 * 二级页/详情由路由驱动，本壳自动显示 ‹返回。
 */
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { useMsgBadgeStore } from '@/stores/msgBadge'

const route = useRoute()
const router = useRouter()
const device = useDeviceStore()
const badge = useMsgBadgeStore()

const TABS = [
  { path: '/home', label: '首页', icon: 'home' },
  { path: '/approve', label: '审批', icon: 'approve' },
  { path: '/customer', label: '客户', icon: 'customer' },
  { path: '/mine', label: '我的', icon: 'mine' }
]

const TAB_TITLES: Record<string, string> = { '/home': '首页', '/approve': '审批', '/customer': '客户', '/mine': '我的' }

const title = computed(() => TAB_TITLES[route.path] || '优品OA')
const showBack = computed(() => route.path.startsWith('/p/') || route.path.startsWith('/detail/'))
const activeTab = computed(() => {
  const hit = TABS.find(t => t.path === route.path)
  return hit ? hit.path : ''
})

function back() { router.back() }
function switchTab(path: string) { if (route.path !== path) router.push(path) }
function openInbox() { router.push('/p/message-inbox') }

onMounted(() => badge.start())
watch(() => route.path, p => { if (p === '/home') badge.pull() })

/** Tab 图标：内联 SVG（20px，选中态 #1E6FFF，与源码 tab-icon 尺寸一致） */
function tabIcon(name: string, active: boolean) {
  const c = active ? '#1E6FFF' : '#8a8f99'
  const common = `fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`
  const map: Record<string, string> = {
    home: `<path d="M3 10.5 10 4l7 6.5" ${common}/><path d="M5.5 9.5V16h9V9.5" ${common}/>`,
    approve: `<path d="M4 5.5 8 9.5l6.5-6" ${common}/><path d="M4 13.5l3.5 3.5" ${common}/><path d="M10 13.5l3 3 4.5-5" ${common}/>`,
    customer: `<circle cx="7" cy="7" r="2.6" ${common}/><path d="M2.8 15c.6-2.4 2.2-3.6 4.2-3.6s3.6 1.2 4.2 3.6" ${common}/><circle cx="14.5" cy="6.5" r="2" ${common}/><path d="M13.8 11.6c1.7.2 3 1.4 3.5 3.4" ${common}/>`,
    mine: `<circle cx="10" cy="6.5" r="3.2" ${common}/><path d="M3.8 16.5c.8-3.4 3.2-5 6.2-5s5.4 1.6 6.2 5" ${common}/>`
  }
  return `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">${map[name] || ''}</svg>`
}
</script>

<template>
  <div class="mobile-layout">
    <header class="mobile-topbar">
      <button v-if="showBack" class="topbar-back" @click="back">‹ 返回</button>
      <div class="topbar-title">{{ title }}</div>
      <div class="topbar-right">
        <button class="topbar-btn bell-btn" @click="openInbox" aria-label="消息">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 2.5a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 10.5v-3a5 5 0 0 0-5-5Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 15.5a2 2 0 0 0 4 0" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span v-if="badge.unread > 0" class="bell-badge">{{ badge.unread > 99 ? '99+' : badge.unread }}</span>
        </button>
        <button v-if="device.kind === 'phone' && device.override !== 'desktop'" class="topbar-btn" @click="device.setOverride('desktop')">桌面版</button>
      </div>
    </header>

    <main class="mobile-page">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['HomeTab', 'ApproveTab', 'CustomerTab', 'MineTab']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <nav class="mobile-tabbar">
      <button
        v-for="t in TABS"
        :key="t.path"
        :class="['tab-item', activeTab === t.path ? 'active' : '']"
        @click="switchTab(t.path)"
      >
        <span class="tab-icon" v-html="tabIcon(t.icon, activeTab === t.path)" />
        <span>{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>
