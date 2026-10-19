<script setup lang="ts">
/**
 * 桌面端表格内核 —— 列排序 / 列筛选 / 分页 / 行选择 / 右键 / 批量操作栏。
 * 手机端同源数据用卡片列表渲染（shared/useListData 同一取数逻辑）。
 */
import { computed, ref } from 'vue'
import { openContextMenu } from '@/shared/contextMenu'
import { registry } from '@/shared/CommandRegistry'

export interface Column {
  key: string
  label: string
  width?: string
  sortable?: boolean
  filterable?: boolean
  format?: (v: any, row: any) => string
}

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: any[]
  loading?: boolean
  finished?: boolean
  total?: number
  selectable?: boolean
  ctxType?: string        // 右键菜单上下文类型（approve/order/customer...）
  rowTitle?: (r: any) => string
  emptyText?: string
}>(), { selectable: true, emptyText: '暂无数据' })

const emit = defineEmits<{
  (e: 'rowClick', row: any): void
  (e: 'sort', key: string, dir: 'asc' | 'desc'): void
  (e: 'filter', key: string, v: string): void
  (e: 'loadMore'): void
  (e: 'refresh'): void
  (e: 'batch', ids: any[]): void
}>()

const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('desc')
const filters = ref<Record<string, string>>({})
const selected = ref<any[]>([])

const sorted = computed(() => {
  if (!sortKey.value) return props.rows
  const col = props.columns.find(c => c.key === sortKey.value)
  const dir = sortDir.value === 'asc' ? 1 : -1
  return props.rows.slice().sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    const na = Number(va), nb = Number(vb)
    const cmp = (!isNaN(na) && !isNaN(nb) && va !== '' && vb !== '') ? na - nb : String(va ?? '').localeCompare(String(vb ?? ''), 'zh')
    return cmp * dir
  })
})

const allChecked = computed(() => props.rows.length > 0 && selected.value.length === props.rows.length)

function onSort(col: Column) {
  if (!col.sortable) return
  if (sortKey.value === col.key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = col.key; sortDir.value = 'desc' }
  emit('sort', col.key, sortDir.value)
}
function toggleAll() {
  if (allChecked.value) selected.value = []
  else selected.value = props.rows.slice()
}
function toggleRow(r: any) {
  const i = selected.value.findIndex(x => x.id === r.id)
  i >= 0 ? selected.value.splice(i, 1) : selected.value.push(r)
}
function onRowCtx(e: MouseEvent, row: any) {
  if (!props.ctxType) return
  openContextMenu(e, { type: props.ctxType, id: row.id, row }, props.rowTitle ? props.rowTitle(row) : '')
}
function cell(v: any, row: any, col: Column): string {
  return col.format ? col.format(row[col.key], row) : (row[col.key] ?? '—')
}
defineExpose({ selected })
</script>

<template>
  <div class="dtable-wrap" v-loading="loading">
    <table class="dtable">
      <thead>
        <tr>
          <th v-if="selectable" class="col-check">
            <input type="checkbox" :checked="allChecked" @change="toggleAll" />
          </th>
          <th
            v-for="col in columns" :key="col.key"
            :class="{ sortable: col.sortable }"
            :style="col.width ? { width: col.width } : undefined"
            @click="onSort(col)"
          >
            {{ col.label }}
            <span v-if="col.sortable && sortKey === col.key" class="arrow">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
          </th>
          <th class="col-ops">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in sorted" :key="r.id"
          :class="{ selected: selected.some(s => s.id === r.id) }"
          @click="emit('rowClick', r)"
          @contextmenu="onRowCtx($event, r)"
        >
          <td v-if="selectable" class="col-check" @click.stop>
            <input type="checkbox" :checked="selected.some(s => s.id === r.id)" @change="toggleRow(r)" />
          </td>
          <td v-for="col in columns" :key="col.key">
            <span class="cell-main">{{ cell(r[col.key], r, col) }}</span>
          </td>
          <td class="col-ops" @click.stop>
            <button class="mini" @click="emit('rowClick', r)">查看</button>
            <button v-if="ctxType" class="mini danger" @click="onRowCtx($event, r)">更多</button>
          </td>
        </tr>
        <tr v-if="!loading && !rows.length">
          <td :colspan="columns.length + (selectable ? 2 : 1)" class="table-empty">{{ emptyText }}</td>
        </tr>
      </tbody>
    </table>

    <div class="table-pager">
      <span>共 {{ total ?? rows.length }} 条</span>
      <button :disabled="loading" @click="emit('refresh')">刷新</button>
      <button v-if="!finished && rows.length" :disabled="loading" @click="emit('loadMore')">加载更多</button>
      <span v-if="finished && rows.length">已全部加载</span>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selected.length > 0" class="batch-bar">
      <span class="cnt">已选 <b>{{ selected.length }}</b> 项</span>
      <template v-if="ctxType === 'order'">
        <button @click="registry.run('order.export', { type: 'order', selected })">导出 CSV</button>
      </template>
      <button class="danger" @click="selected = []">取消选择</button>
    </div>
  </div>
</template>

<style scoped>
.mini { font-size: var(--font-smd); color: var(--color-primary); padding: 3px 8px; border-radius: 5px; margin-right: 4px; }
.mini:hover { background: var(--color-primary-bg-2); }
.mini.danger { color: var(--color-danger); }
</style>
