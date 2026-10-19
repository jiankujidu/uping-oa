<script setup lang="ts">
/**
 * 首页 Tab —— 对应原 APK renderHome（1:1）：
 * 快捷审批 8 宫格 → 办公入口 29 宫格 → 我的待办 2 卡。
 * emoji 图标与源码完全一致（系统字体渲染，无 CDN 依赖）。
 */
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'

const router = useRouter()

// 快捷审批（APPROVE_TYPES，与源码逐值一致）
const QUICK = [
  { type: 1, name: '请假', icon: '🏖' },
  { type: 2, name: '出差', icon: '✈' },
  { type: 3, name: '外出', icon: '🏃' },
  { type: 4, name: '加班', icon: '⏰' },
  { type: 15, name: '采购', icon: '🛒' },
  { type: 7, name: '维修', icon: '🔧' },
  { type: 9, name: '用章', icon: '🔏' },
  { type: 10, name: '用车', icon: '🚗' }
]

// 办公入口（entries，与源码逐值一致）
interface Entry { mobile?: string; tab?: string; approveType?: boolean; workbench?: boolean; ai?: boolean; icon: string; name: string }
const ENTRIES: Entry[] = [
  { mobile: 'note', icon: '📢', name: '企业公告' },
  { mobile: 'article', icon: '💬', name: '问答知识' },
  { ai: true, icon: '🤖', name: 'AI问答' },
  { mobile: 'product', icon: '🧪', name: '产品管理' },
  { mobile: 'files', icon: '📁', name: '附件管理' },
  { mobile: 'message-inbox', icon: '✉️', name: '消息中心' },
  { mobile: 'mail', icon: '📇', name: '通讯录' },
  { approveType: true, icon: '📝', name: '发起审批' },
  { tab: 'customer', icon: '👥', name: '客户列表' },
  { workbench: true, icon: '🏠', name: '工作台' },
  { mobile: 'finance-advance', icon: '💰', name: '预存款' },
  { mobile: 'deduction', icon: '🎫', name: '抵扣券' },
  { mobile: 'margin', icon: '🛡️', name: '保证金' },
  { mobile: 'invoice-my', icon: '🧾', name: '发票申请' },
  { mobile: 'invoice-handle', icon: '🗂️', name: '发票处理' },
  { mobile: 'finance-income', icon: '📊', name: '到账（发票）' },
  { mobile: 'finance-order', icon: '📈', name: '到账（订单）' },
  { mobile: 'orderapply-handle', icon: '⚙️', name: '订单到账处理' },
  { mobile: 'contact-list', icon: '👤', name: '客户联系人' },
  { mobile: 'chance-list', icon: '🎯', name: '销售机会' },
  { mobile: 'trace-list', icon: '📝', name: '跟进记录' },
  { mobile: 'order-my', icon: '📦', name: '我的订单' },
  { mobile: 'order-handle', icon: '🔧', name: '订单处理' },
  { mobile: 'platform-order', icon: '🛒', name: '平台订单' },
  { mobile: 'sample', icon: '🧫', name: '样本管理' },
  { mobile: 'school', icon: '🏫', name: '校展管理' },
  { mobile: 'after', icon: '🔨', name: '售后管理' },
  { mobile: 'customer-add', icon: '➕', name: '新增客户' },
  { approveType: true, icon: '🗂', name: '抵扣券管理' }
]

function go(e: Entry) {
  if (e.mobile) router.push('/p/' + e.mobile)
  else if (e.tab) router.push('/' + e.tab)
  else if (e.approveType) router.push('/p/approve-types')
  else if (e.workbench) router.push('/p/workbench')
  else if (e.ai) window.open('https://oichat.upingbio.cn', '_blank', 'noopener')
}
function launchApprove(type: number) {
  router.push('/detail/approve-form/' + type)
}
</script>

<template>
  <div class="home-tab">
    <div class="section-title">快捷审批</div>
    <div class="grid">
      <button v-for="q in QUICK" :key="q.type" class="grid-item" @click="launchApprove(q.type)">
        <span class="gi-icon">{{ q.icon }}</span><span class="gi-text">{{ q.name }}</span>
      </button>
    </div>

    <div class="section-title">办公入口</div>
    <div class="grid">
      <button v-for="(e, i) in ENTRIES" :key="i" class="grid-item" @click="go(e)">
        <span class="gi-icon">{{ e.icon }}</span><span class="gi-text">{{ e.name }}</span>
      </button>
    </div>

    <div class="section-title">我的待办</div>
    <div class="card" @click="router.push('/approve')">
      <div class="card-title">待审审批</div>
      <div class="card-line">点击查看我发起的与待我处理的审批</div>
    </div>
    <div class="card" @click="router.push('/customer')">
      <div class="card-title">客户跟进</div>
      <div class="card-line">客户列表 · 公海 · 联系人 · 订单 · 样本</div>
    </div>
  </div>
</template>

<style scoped>
/* 与源码 .grid/.grid-item/.section-title 对齐（源码 grid 为 4 列 4px 间距） */
.section-title { font-size: var(--font-base); font-weight: 600; color: var(--color-text-2); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-1); padding: var(--sp-1) var(--sp-4) var(--sp-3); }
.grid-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: var(--color-card); border-radius: var(--radius-card); padding: var(--sp-3) var(--sp-1);
  min-height: 76px; box-shadow: var(--shadow-card);
}
.grid-item:active { background: var(--color-primary-bg); }
.gi-icon { font-size: 24px; line-height: 1.1; }
.gi-text { font-size: var(--font-smd); color: var(--color-text); text-align: center; line-height: 1.3; }
</style>
