<script setup lang="ts">
/**
 * 我的 Tab —— 对应原 APK「我的」页（1:1）：分组列表菜单 + 版本号 + 退出。
 */
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDeviceStore } from '@/stores/device'
import { API } from '@/api/endpoints'
import { confirm } from '@/shared/confirm'
import { toast } from '@/shared/toast'
import { APP_VERSION } from '@/utils/const'

const router = useRouter()
const auth = useAuthStore()
const device = useDeviceStore()

const username = computed(() => auth.user?.username || localStorage.getItem('upoa:username') || '未登录')

const GROUPS = [
  {
    title: '账号',
    items: [
      { label: '基本资料', path: '/p/profile' },
      { label: '修改密码', path: '/p/password' }
    ]
  },
  {
    title: '办公',
    items: [
      { label: '我的消息', path: '/p/message-inbox' },
      { label: '通讯录', path: '/p/mail' },
      { label: '附件管理', path: '/p/files' },
      { label: '产品管理', path: '/p/product' },
      { label: '企业公告', path: '/p/note' },
      { label: '问答知识', path: '/p/article' }
    ]
  },
  {
    title: '财务',
    items: [
      { label: '预存款', path: '/p/finance-advance' },
      { label: '到账（订单）', path: '/p/finance-order' },
      { label: '到账（发票）', path: '/p/finance-income' },
      { label: '抵扣券', path: '/p/deduction' },
      { label: '保证金', path: '/p/margin' },
      { label: '发票申请', path: '/p/invoice-my' }
    ]
  }
]

async function logout() {
  const ok = await confirm({ title: '退出登录', message: '确定退出当前账号？', okText: '退出', danger: true })
  if (!ok) return
  auth.logout()
  router.replace('/login')
}

function about() {
  toast('优品OA 网页版 v' + APP_VERSION + ' · 双端自适应')
}
</script>

<template>
  <div class="mine-tab">
    <div class="profile-card">
      <div class="ava">{{ (username || 'U')[0] }}</div>
      <div class="meta">
        <div class="name">{{ username }}</div>
        <div class="sub">优品生物 · 移动办公平台</div>
      </div>
    </div>

    <template v-for="(g, i) in GROUPS" :key="i">
      <div class="group-title">{{ g.title }}</div>
      <div class="menu-list">
        <button v-for="(it, j) in g.items" :key="j" class="menu-item" @click="router.push(it.path)">
          <span class="label">{{ it.label }}</span>
          <span class="arrow">›</span>
        </button>
      </div>
    </template>

    <div class="menu-list">
      <button class="menu-item" @click="about">
        <span class="label">关于</span>
        <span class="arrow">v{{ APP_VERSION }}</span>
      </button>
    </div>

    <div class="logout-wrap">
      <button class="logout-btn" @click="logout">退出登录</button>
    </div>
    <div class="foot">© 2026 优品生物 · 网页版 v{{ APP_VERSION }}</div>
  </div>
</template>

<style scoped>
.profile-card { display: flex; align-items: center; gap: var(--sp-4); margin: var(--sp-3) var(--sp-4); padding: var(--sp-5); background: linear-gradient(135deg, #1E6FFF, #4A9BFF); border-radius: var(--radius-card); color: #fff; box-shadow: var(--shadow-card); }
.ava { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }
.meta .name { font-size: var(--font-lg); font-weight: 600; }
.meta .sub { font-size: var(--font-smd); opacity: .85; margin-top: 2px; }
.group-title { font-size: var(--font-smd); color: var(--color-text-4); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.menu-list { background: var(--color-card); margin: 0 var(--sp-4); border-radius: var(--radius-card); box-shadow: var(--shadow-card); overflow: hidden; }
.menu-item { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 48px; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-divider); font-size: var(--font-base); color: var(--color-text); }
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: var(--color-primary-bg); }
.menu-item .arrow { color: var(--color-text-4); font-size: var(--font-smd); }
.logout-wrap { padding: var(--sp-6) var(--sp-4) 0; }
.logout-btn { width: 100%; padding: 13px 0; border-radius: var(--radius-btn); background: var(--color-card); color: var(--color-danger); font-size: var(--font-md); font-weight: 500; box-shadow: var(--shadow-card); }
.foot { text-align: center; color: var(--color-text-4); font-size: var(--font-smd); padding: var(--sp-6) 0 var(--sp-6); }
</style>
