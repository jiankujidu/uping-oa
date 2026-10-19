<script setup lang="ts">
/** 桌面端客户 —— 表格 + 筛选栏 + 右侧详情面板（选中客户即时预览） */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import DataTable, { type Column } from '@/shared/DataTable.vue'
import { esc, plain, fmtDate, fmtMoney } from '@/utils/format'

const router = useRouter()
const seg = ref(1)
const kw = ref('')
const active = ref<any>(null)

const COLS: Column[] = [
  { key: 'name', label: '客户名称', sortable: true },
  { key: 'grade', label: '等级', width: '70px', sortable: true },
  { key: 'source', label: '来源', width: '90px' },
  { key: 'intent_status_name', label: '意向', width: '80px' },
  { key: 'belong_name', label: '负责人', width: '100px' },
  { key: 'mobile', label: '电话', width: '130px' },
  { key: 'advance_deposit', label: '预存款', width: '110px', sortable: true, format: (v) => '¥' + fmtMoney(v) },
  { key: 'create_time', label: '创建时间', width: '130px', sortable: true, format: fmtDate },
  { key: 'follow_time', label: '最近跟进', width: '130px', sortable: true, format: (v) => (v ? fmtDate(v) : '—') }
]

const { rows, status, refresh, loadMore } = useListData({
  fetcher: (page, limit) => API.customerList(page, limit, seg.value as any, kw.value || undefined)
})

function onSeg(v: number) { seg.value = v; rows.value = []; active.value = null; refresh() }
function onSearch() { rows.value = []; refresh() }

function onRowClick(r: any) {
  active.value = r
}

const subsidiaries = ref<any[]>([])
function parseSubs(s: any) {
  try { subsidiaries.value = JSON.parse(s || '[]') } catch { subsidiaries.value = [] }
}

function openDetail(r: any) { router.push('/detail/customer/' + r.id) }
</script>

<template>
  <div style="display:flex;gap:16px;align-items:flex-start">
    <div style="flex:1;min-width:0">
      <div class="dfilter-bar">
        <div class="dseg-desktop">
          <span v-for="s in [{v:1,l:'我的'},{v:2,l:'公海'},{v:3,l:'废弃'}]" :key="s.v"
            :class="['seg-item', seg === s.v ? 'active' : '']" @click="onSeg(s.v)">{{ s.l }}</span>
        </div>
        <input v-model="kw" class="form-input" style="max-width:220px" placeholder="搜索客户名称" @keyup.enter="onSearch" />
        <button class="dtop-btn" @click="onSearch">查询</button>
        <span class="spacer" />
        <button class="dtop-btn" @click="router.push('/p/customer-add')">＋ 新增客户</button>
      </div>

      <DataTable
        :columns="COLS"
        :rows="rows"
        :loading="status.loading"
        :finished="status.finished"
        :total="status.total"
        ctx-type="customer"
        :row-title="(r: any) => r.name"
        :selected-first="false"
        @row-click="onRowClick"
        @load-more="loadMore"
        @refresh="refresh"
      />

      <div v-if="active" class="panel-hint">已选中「{{ esc(active.name) }}」，右键行可转公海 / 转移 / 删除</div>
    </div>

    <!-- 右侧详情面板 -->
    <aside class="dpanel" v-if="active">
      <div class="dpanel-head">
        <span class="t">客户详情</span>
        <span class="x" @click="active = null">✕</span>
      </div>
      <div class="dpanel-body">
        <div class="pd-title">{{ esc(active.name) }}</div>
        <div class="pd-row"><span>等级/来源</span><b>{{ esc(active.grade || '-') }} / {{ esc(active.source || '-') }}</b></div>
        <div class="pd-row"><span>意向</span><b>{{ esc(active.intent_status_name || '-') }}</b></div>
        <div class="pd-row"><span>负责人</span><b>{{ esc(active.belong_name || '-') }}</b></div>
        <div class="pd-row"><span>电话</span><b>{{ esc(active.mobile || '-') }}</b></div>
        <div class="pd-row"><span>地址</span><b>{{ esc(active.address || '-') }}</b></div>
        <div class="pd-row"><span>预存/抵扣/保证金</span><b>¥{{ fmtMoney(active.advance_deposit) }} / ¥{{ fmtMoney(active.deduction) }} / ¥{{ fmtMoney(active.margin_deposit) }}</b></div>
        <div class="pd-row"><span>创建时间</span><b>{{ fmtDate(active.create_time) }}</b></div>
        <div v-if="active.remark" class="pd-block"><span>备注</span><p>{{ esc(plain(active.remark).slice(0, 300)) }}</p></div>
        <div class="pd-ops">
          <button class="act-btn" @click="openDetail(active)">完整详情</button>
          <button class="act-btn ghost" @click="openDetail(active)">联系人 / 商机</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.panel-hint { margin-top: var(--sp-3); font-size: var(--font-smd); color: var(--color-text-4); }
.pd-title { font-size: var(--font-md); font-weight: 600; margin-bottom: var(--sp-4); line-height: 1.5; }
.pd-row { display: flex; justify-content: space-between; gap: var(--sp-3); padding: 7px 0; border-bottom: 1px solid var(--color-divider); font-size: var(--font-base); }
.pd-row span { color: var(--color-text-3); flex: none; }
.pd-row b { font-weight: 400; text-align: right; word-break: break-all; }
.pd-block { margin-top: var(--sp-3); font-size: var(--font-base); }
.pd-block span { color: var(--color-text-3); display: block; margin-bottom: 4px; }
.pd-block p { line-height: 1.6; white-space: pre-wrap; }
.pd-ops { display: flex; gap: var(--sp-2); margin-top: var(--sp-5); }
.pd-ops .act-btn { flex: 1; padding: 9px 0; }
</style>
