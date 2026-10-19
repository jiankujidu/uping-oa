<script setup lang="ts">
/**
 * 客户 Tab —— 对应原 APK renderCustomer（1:1）：
 * seg 三段（我的/公海/废弃）+ 搜索 + 筛选入口 + 客户卡片列表（上拉分页 + 下拉刷新）。
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { usePullRefresh } from '@/shared/usePullRefresh'
import { onActivated } from 'vue'
import { fmtDate, esc } from '@/utils/format'
import EmptyState from '@/shared/EmptyState.vue'
import Skeleton from '@/shared/Skeleton.vue'

const router = useRouter()
const SEGS = [
  { v: 1, label: '我的' },
  { v: 2, label: '公海' },
  { v: 3, label: '废弃' }
]
const seg = ref(1)
const kw = ref('')
const pageEl = ref<HTMLElement | null>(null)
const filters = ref<Record<string, any>>({})

const { rows, status, refresh, loadMore } = useListData({
  fetcher: (page, limit) => API.customerList(page, limit, seg.value as any, kw.value || undefined, filters.value)
})

const pull = usePullRefresh(async () => { await refresh() })

function onSeg(v: number) {
  if (seg.value === v) return
  seg.value = v
  rows.value = []
  refresh()
}
function onSearch() { rows.value = []; refresh() }
function openFilter() { router.push('/p/customer-filter') }
function openCustomer(id: number) { router.push('/detail/customer/' + id) }

onActivated(() => { /* 从筛选页返回时带新条件刷新 */
  const f = sessionStorage.getItem('upoa:cust-filter')
  if (f) { filters.value = JSON.parse(f); sessionStorage.removeItem('upoa:cust-filter'); rows.value = []; refresh() }
})

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) loadMore()
}
</script>

<template>
  <div
    class="customer-tab"
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

    <div class="seg">
      <button v-for="s in SEGS" :key="s.v" :class="['seg-item', seg === s.v ? 'active' : '']" @click="onSeg(s.v)">{{ s.label }}</button>
    </div>

    <div class="search-row">
      <div class="search-field">
        <input v-model="kw" class="form-input" placeholder="搜索客户名称" @keyup.enter="onSearch" />
      </div>
      <button class="act-btn search-btn" @click="onSearch">搜索</button>
      <button class="act-btn ghost filter-btn" @click="openFilter">筛选</button>
    </div>

    <Skeleton v-if="status.loading" />
    <EmptyState v-else-if="!status.loading && !rows.length && !status.error" icon="👥" text="暂无客户" action-text="新增客户" @action="router.push('/p/customer-add')" />

    <div v-for="r in rows" :key="r.id" class="card" @click="openCustomer(r.id)">
      <div class="card-title">{{ esc(r.name) }}</div>
      <div class="card-line"><b>等级：</b>{{ esc(r.grade || '-') }}　<b>来源：</b>{{ esc(r.source || '-') }}</div>
      <div class="card-line"><b>意向：</b>{{ esc(r.intent_status_name || '-') }}　<b>负责人：</b>{{ esc(r.belong_name || '-') }}</div>
      <div class="card-line"><b>电话：</b>{{ esc(r.mobile || '-') }}</div>
      <div class="card-line"><b>创建：</b>{{ fmtDate(r.create_time) }}<template v-if="r.follow_time">　<b>跟进：</b>{{ fmtDate(r.follow_time) }}</template></div>
    </div>

    <div v-if="status.loadingMore" class="list-loading">加载中…</div>
    <div v-else-if="status.finished && rows.length" class="list-end">— 没有更多了 —</div>
    <div v-if="status.error" class="list-loading" @click="refresh">{{ status.error }}，点击重试</div>
  </div>
</template>

<style scoped>
.search-row { display: flex; gap: var(--sp-2); padding: 0 var(--sp-4) var(--sp-2); }
.search-field { flex: 1; min-width: 0; }
.search-btn { flex: none; }
.filter-btn { flex: none; }
</style>
