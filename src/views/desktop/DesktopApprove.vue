<script setup lang="ts">
/** 桌面端审批 —— 表格 + seg 筛选 + 行点击进入详情 + 右键（A/R 快捷键） */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import DataTable, { type Column } from '@/shared/DataTable.vue'
import { registry } from '@/shared/CommandRegistry'
import { fmtTime, esc } from '@/utils/format'

const router = useRouter()
const seg = ref(0)

const COLS: Column[] = [
  { key: 'id', label: '编号', sortable: true, width: '90px' },
  { key: 'flow_type', label: '类型', width: '80px' },
  { key: 'content', label: '内容', sortable: false },
  { key: 'admin_name', label: '申请人', width: '100px' },
  { key: 'amount', label: '金额', sortable: true, width: '110px', format: (v) => (Number(v) ? '¥' + Number(v).toLocaleString() : '—') },
  { key: 'check_status', label: '状态', width: '90px', format: (v) => ({ 0: '待审批', 1: '待审批', 2: '已通过', 3: '已拒绝', 4: '已拒绝' } as any)[v] ?? v },
  { key: 'create_time', label: '创建时间', sortable: true, width: '150px', format: fmtTime }
]

const { rows, status, refresh, loadMore } = useListData({
  fetcher: (page, limit) => API.approveList(page, limit, seg.value === 0 ? undefined : seg.value)
})

function onSeg(v: number) { seg.value = v; rows.value = []; refresh() }
function open(r: any) { router.push('/detail/approve/' + r.id) }

// 桌面快捷键 A/R：选中/悬停行上下文
const focusIdx = ref(0)
function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  const row = rows.value[focusIdx.value]
  if (!row) return
  const k = e.key.toLowerCase()
  if (k === 'a') { e.preventDefault(); registry.setContext({ type: 'approve', id: row.id, row }); registry.run('approve.pass') }
  if (k === 'r') { e.preventDefault(); registry.setContext({ type: 'approve', id: row.id, row }); registry.run('approve.reject') }
}
watch(() => rows.value, () => { focusIdx.value = 0 }, { flush: 'post' })
if (typeof window !== 'undefined') window.addEventListener('keydown', onKey)
</script>

<template>
  <div>
    <div class="dfilter-bar">
      <div class="dseg-desktop">
        <span v-for="s in [{v:0,l:'全部'},{v:1,l:'待审批'},{v:2,l:'已通过'},{v:3,l:'已拒绝'}]" :key="s.v"
          :class="['seg-item', seg === s.v ? 'active' : '']" @click="onSeg(s.v)">{{ s.l }}</span>
      </div>
      <span class="spacer" />
      <span class="kbd-hint">选中行后 <kbd>A</kbd> 通过 · <kbd>R</kbd> 驳回 · 右键更多</span>
    </div>

    <DataTable
      :columns="COLS"
      :rows="rows"
      :loading="status.loading"
      :finished="status.finished"
      :total="status.total"
      ctx-type="approve"
      :row-title="(r: any) => '审批 ' + r.id"
      @row-click="open"
      @load-more="loadMore"
      @refresh="refresh"
    />
  </div>
</template>
