<script setup lang="ts">
/**
 * 消息中心 —— 对应原 APK renderMessagePage/openMsgTab：
 * 4 列表（收件箱/发件箱/草稿箱/回收站）+ 写消息按钮 + 列表行（含未读加粗）。
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { usePullRefresh } from '@/shared/usePullRefresh'
import { esc, fmtTime } from '@/utils/format'
import EmptyState from '@/shared/EmptyState.vue'
import Skeleton from '@/shared/Skeleton.vue'

const props = defineProps<{ tab: 'inbox' | 'sendbox' | 'draft' | 'rubbish' }>()
const router = useRouter()
const pageEl = ref<HTMLElement | null>(null)

const TABS = [
  { v: 'inbox', label: '收件箱' },
  { v: 'sendbox', label: '发件箱' },
  { v: 'draft', label: '草稿箱' },
  { v: 'rubbish', label: '回收站' }
]

const list = useListData({
  fetcher: (page, limit) => API.messageList(props.tab, page, limit)
})
const pull = usePullRefresh(async () => { await list.refresh() })

function onTab(v: string) { router.replace('/p/message-' + v) }
function openRow(r: any) { router.push('/detail/message-' + props.tab + '/' + r.id) }
function compose() { router.push('/detail/message-compose/0') }

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) list.loadMore()
}
</script>

<template>
  <div
    class="msg-page"
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
      <button v-for="t in TABS" :key="t.v" :class="['seg-item', tab === t.v ? 'active' : '']" @click="onTab(t.v)">{{ t.label }}</button>
    </div>

    <Skeleton v-if="list.status.loading" />
    <EmptyState v-else-if="!list.rows.value.length && !list.status.error" icon="✉️" text="暂无消息" />

    <div v-for="(r, i) in list.rows.value" :key="r.id || i" class="card msg-card" @click="openRow(r)">
      <div class="card-title"><span :class="['unread', r.is_read == 0 ? 'on' : '']">{{ esc(r.title || '（无标题）') }}</span></div>
      <div class="card-line"><b>{{ tab === 'sendbox' ? '收件人' : '发件人' }}：</b>{{ esc(r.send_name || r.receive_name || '-') }}</div>
      <div class="card-line"><b>时间：</b>{{ fmtTime(r.create_time) }}</div>
    </div>

    <div v-if="list.status.loadingMore" class="list-loading">加载中…</div>
    <div v-else-if="list.status.finished && list.rows.value.length" class="list-end">— 没有更多了 —</div>
    <div v-if="list.status.error" class="list-loading" @click="list.refresh()">{{ list.status.error }}，点击重试</div>

    <button v-if="tab !== 'rubbish'" class="fab" @click="compose">✎</button>
  </div>
</template>

<style scoped>
.unread.on { font-weight: 600; }
.unread.on::before { content: '●'; color: var(--color-danger); font-size: 10px; margin-right: 4px; vertical-align: middle; }
.fab {
  position: fixed; right: 18px; bottom: calc(76px + env(safe-area-inset-bottom));
  width: 50px; height: 50px; border-radius: 50%; background: var(--color-primary); color: #fff;
  font-size: 22px; box-shadow: 0 4px 14px rgba(30, 111, 255, .4); z-index: 50;
}
</style>
