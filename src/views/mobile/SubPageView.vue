<script setup lang="ts">
/**
 * 子页容器 —— 对应原 APK showSubPage(type) 的 35 个分支。
 * 通用列表子页（公告/问答/产品/附件/财务/消息/客户子业务/订单/平台/样本/校展/售后）
 * 走本组件 + subPages.ts 配置；特殊页（资料/密码/新增客户/筛选/工作台/审批类型）
 * 各自独立组件。
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useListData } from '@/shared/useListData'
import { usePullRefresh } from '@/shared/usePullRefresh'
import { esc, plain, fmtTime } from '@/utils/format'
import { getSubPageCfg } from './subPages'
import EmptyState from '@/shared/EmptyState.vue'
import Skeleton from '@/shared/Skeleton.vue'

import ProfilePage from './ProfilePage.vue'
import PasswordPage from './PasswordPage.vue'
import CustomerAddPage from './CustomerAddPage.vue'
import CustomerFilterPage from './CustomerFilterPage.vue'
import WorkbenchPage from './WorkbenchPage.vue'
import ApproveTypesPage from './ApproveTypesPage.vue'
import MessagePage from './MessagePage.vue'

const route = useRoute()
const type = computed(() => String(route.params.type || ''))
const kw = ref('')
const pageEl = ref<HTMLElement | null>(null)

const cfg = computed(() => getSubPageCfg(type.value))

const list = useListData({
  fetcher: (page, limit) => cfg.value ? cfg.value.api(page, limit, kw.value || undefined) : Promise.resolve({ code: 0, data: [] }),
  immediate: false
})
// 配置就绪后再加载
if (cfg.value) list.init()

const pull = usePullRefresh(async () => { await list.refresh() })

function cell(v: any, row: any, c: { key: string; fmt?: (v: any, row: any) => string }): string {
  const raw = c.fmt ? c.fmt(row[c.key], row) : row[c.key]
  return esc(raw === undefined || raw === null || raw === '' ? '-' : raw)
}

function open(row: any) {
  if (cfg.value?.detail) location.hash = '#/' + cfg.value.detail(row).replace(/^\//, '')
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) list.loadMore()
}
</script>

<template>
  <!-- 特殊页 -->
  <ProfilePage v-if="type === 'profile'" />
  <PasswordPage v-else-if="type === 'password'" />
  <CustomerAddPage v-else-if="type === 'customer-add'" />
  <CustomerFilterPage v-else-if="type === 'customer-filter'" />
  <WorkbenchPage v-else-if="type === 'workbench'" />
  <ApproveTypesPage v-else-if="type === 'approve-types'" />
  <MessagePage v-else-if="type.startsWith('message-')" :tab="type.replace('message-', '') as any" />

  <!-- 通用列表子页 -->
  <div
    v-else-if="cfg"
    class="sub-page"
    ref="pageEl"
    @scroll.passive="onScroll"
    @touchstart="pull.onStart($event, pageEl!)"
    @touchmove="pull.onMove($event)"
    @touchend="pull.onEnd()"
  >
    <div class="pull-refresh-indicator" :class="{ show: pull.distance.value > 0 }">
      <span v-if="pull.refreshing.value" class="spin">↻</span>
      <span v-else>{{ pull.distance.value >= 30 ? '松开刷新' : '下拉刷新' }}</span>
    </div>

    <div v-if="cfg.kw" class="search-row">
      <div class="search-field"><input v-model="kw" class="form-input" placeholder="搜索" @keyup.enter="list.refresh()" /></div>
      <button class="act-btn" @click="list.refresh()">搜索</button>
    </div>

    <Skeleton v-if="list.status.loading" />
    <EmptyState v-else-if="!list.rows.value.length && !list.status.error" icon="🗂" text="暂无数据" />

    <div v-for="(r, i) in list.rows.value" :key="r.id || i" class="card" @click="open(r)">
      <div class="card-title">{{ esc(cfg.titleField ? r[cfg.titleField] : '') || '明细' }}</div>
      <div v-for="c in cfg.cols" :key="c.key" class="card-line">
        <b>{{ c.label }}：</b>{{ cell(r[c.key], r, c) }}
      </div>
      <div v-if="cfg.detail" class="card-line" style="margin-top:6px"><span class="link">查看详情 ›</span></div>
    </div>

    <div v-if="list.status.loadingMore" class="list-loading">加载中…</div>
    <div v-else-if="list.status.finished && list.rows.value.length" class="list-end">— 没有更多了 —</div>
    <div v-if="list.status.error" class="list-loading" @click="list.refresh()">{{ list.status.error }}，点击重试</div>
  </div>

  <!-- 未知类型 -->
  <EmptyState v-else icon="🚧" text="该功能开发中" />
</template>

<style scoped>
.search-row { display: flex; gap: var(--sp-2); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.search-field { flex: 1; min-width: 0; }
.link { color: var(--color-primary); }
</style>
