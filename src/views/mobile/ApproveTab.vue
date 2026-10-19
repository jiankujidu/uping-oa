<script setup lang="ts">
/**
 * 审批 Tab —— 对应原 APK renderApprove/loadApprove（1:1）。
 * seg 四段（全部/待审批/已通过/已拒绝）+ 审批卡片列表 + 行内通过/拒绝。
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { usePullRefresh } from '@/shared/usePullRefresh'
import { actionSheet } from '@/shared/actionSheet'
import { confirm } from '@/shared/confirm'
import { toast } from '@/shared/toast'
import { fmtTime, esc } from '@/utils/format'
import EmptyState from '@/shared/EmptyState.vue'
import Skeleton from '@/shared/Skeleton.vue'

const router = useRouter()
const SEGS = [
  { v: 0, label: '全部' },
  { v: 1, label: '待审批' },
  { v: 2, label: '已通过' },
  { v: 3, label: '已拒绝' }
]
const seg = ref(0)
const pageEl = ref<HTMLElement | null>(null)

const { rows, status, refresh, loadMore } = useListData({
  fetcher: (page, limit) => API.approveList(page, limit, seg.value === 0 ? undefined : seg.value)
})

const pull = usePullRefresh(async () => { await refresh() })

function onSeg(v: number) {
  if (seg.value === v) return
  seg.value = v
  rows.value = []
  refresh()
}

function stText(r: any): { text: string; cls: string } {
  const s = parseInt(r.check_status != null ? r.check_status : r.status)
  if (isNaN(s)) return { text: '未知状态', cls: 'tag-pending' }
  if (s === 0 || s === 1) return { text: '待审批', cls: 'tag-pending' }
  if (s === 2) return { text: '已通过', cls: 'tag-pass' }
  if (s === 3 || s === 4) return { text: '已拒绝', cls: 'tag-reject' }
  return { text: '状态' + s, cls: 'tag-pending' }
}

function detail(id: number) { router.push('/detail/approve/' + id) }

async function doCheck(id: number, s: number, e: Event) {
  e.stopPropagation()
  // 通过/驳回走底部面板收集备注（与源码 uiConfirm 语义一致，手机端用 ActionSheet）
  const ok = await confirm({ title: s === 2 ? '通过审批' : '拒绝审批', message: s === 2 ? '确认通过该审批？' : '确认拒绝该审批？', okText: s === 2 ? '通过' : '拒绝', danger: s !== 2 })
  if (!ok) return
  const r = await API.approveCheck(id, s)
  if (r && r.code === 0) { toast('操作成功'); refresh() }
  else toast(r?.msg || '操作失败')
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) loadMore()
}
</script>

<template>
  <div
    class="approve-tab"
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

    <Skeleton v-if="status.loading" />
    <EmptyState v-else-if="!status.loading && !rows.length && !status.error" icon="🗂" text="暂无审批数据" />

    <div v-for="r in rows" :key="r.id" class="card" @click="detail(r.id)">
      <div class="card-title">
        {{ esc((r as any).content || '审批') }}
        <span :class="['tag', stText(r).cls]">{{ stText(r).text }}</span>
      </div>
      <div class="card-line"><b>主题：</b>{{ esc((r as any).name || '') }}</div>
      <div class="card-line"><b>申请人：</b>{{ esc((r as any).admin_name || '') }}</div>
      <div class="card-line"><b>时间：</b>{{ fmtTime((r as any).create_time) }}</div>
      <div class="card-line" v-if="(r as any).amount"><b>金额：</b>{{ esc((r as any).amount) }}</div>
      <div class="card-line" v-if="(r as any).remark"><b>说明：</b>{{ esc((r as any).remark) }}</div>
      <div class="card-line" style="margin-top:6px"><span class="link">查看详情 ›</span></div>
      <div v-if="parseInt((r as any).check_status) === 0 || parseInt((r as any).check_status) === 1" class="approve-actions">
        <button class="btn btn-ok" @click="doCheck((r as any).id, 2, $event)">通过</button>
        <button class="btn btn-no" @click="doCheck((r as any).id, 3, $event)">拒绝</button>
      </div>
    </div>

    <div v-if="status.loadingMore" class="list-loading">加载中…</div>
    <div v-else-if="status.finished && rows.length" class="list-end">— 没有更多了 —</div>
    <div v-if="status.error" class="list-loading" @click="refresh">{{ status.error }}，点击重试</div>
  </div>
</template>

<style scoped>
.tag { float: right; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 8px; margin-left: 8px; }
.tag-pending { background: #FFF7E6; color: #BA7517; }
.tag-pass { background: #EAF3DE; color: #3B6D11; }
.tag-reject { background: #FCEBEB; color: #A32D2D; }
.link { color: var(--color-primary); }
.approve-actions { display: flex; gap: 10px; margin-top: 10px; }
.approve-actions .btn { flex: 1; padding: 9px 0; border-radius: var(--radius-btn-sm); font-size: var(--font-base); font-weight: 500; }
.approve-actions .btn-ok { background: var(--color-primary); color: #fff; }
.approve-actions .btn-no { background: #fff; color: var(--color-danger); border: 1px solid var(--color-danger); }
</style>
