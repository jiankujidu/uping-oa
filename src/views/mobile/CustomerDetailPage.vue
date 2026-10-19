<script setup lang="ts">
/** 客户详情 —— 对应原 APK openCustomer（5 子 Tab：基础/联系人/商机/跟进/订单） */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { actionSheet } from '@/shared/actionSheet'
import { confirm } from '@/shared/confirm'
import { toast } from '@/shared/toast'
import { esc, plain, fmtTime, fmtDate, fmtMoney } from '@/utils/format'
import Skeleton from '@/shared/Skeleton.vue'
import EmptyState from '@/shared/EmptyState.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const tab = ref('base')
const row = ref<any>(null)

const TABS = [
  { v: 'base', label: '基础' },
  { v: 'contact', label: '联系人' },
  { v: 'chance', label: '商机' },
  { v: 'trace', label: '跟进' },
  { v: 'order', label: '订单' }
]

const contacts = useListData({
  fetcher: () => API.customerContact(Number(props.id)), immediate: false
})
const chances = useListData({
  fetcher: () => API.customerChance(Number(props.id)), immediate: false
})
const traces = useListData({
  fetcher: (p, l) => API.traceList(p, l), immediate: false
})

async function loadBase() {
  const r = await API.customerView(Number(props.id)).catch(() => null)
  row.value = r?.data || null
}
loadBase()

function onTab(v: string) {
  tab.value = v
  if (v === 'contact') contacts.refresh()
  if (v === 'chance') chances.refresh()
  if (v === 'trace') traces.refresh()
}

async function ops() {
  const act = await actionSheet('客户操作', [
    { label: '编辑', value: 'edit' },
    { label: '转入公海', value: 'sea', danger: true },
    { label: '转移给他人', value: 'transfer' }
  ])
  if (act === 'sea') {
    const ok = await confirm({ title: '转入公海', message: '确认将该客户转入公海？', okText: '转入', danger: true })
    if (!ok) return
    const r = await API.customerToSea(Number(props.id))
    if (r && r.code === 0) { toast('已转入公海'); router.back() }
    else toast(r?.msg || '操作失败')
  } else if (act === 'transfer') {
    toast('请在桌面端选择接收人后转移')
  } else if (act === 'edit') {
    router.push('/p/customer-add')
  }
}

const subsidiaries = computed(() => {
  try { return JSON.parse(row.value?.subsidiary_records || '[]') } catch { return [] }
})
</script>

<template>
  <div class="cust-detail">
    <Skeleton v-if="!row" />
    <template v-if="row">
      <div class="seg">
        <button v-for="t in TABS" :key="t.v" :class="['seg-item', tab === t.v ? 'active' : '']" @click="onTab(t.v)">{{ t.label }}</button>
      </div>

      <!-- 基础 -->
      <template v-if="tab === 'base'">
        <div class="card">
          <div class="card-title">{{ esc(row.name) }}</div>
          <div class="card-line"><b>等级：</b>{{ esc(row.grade || '-') }}　<b>来源：</b>{{ esc(row.source || '-') }}</div>
          <div class="card-line"><b>行业：</b>{{ esc(row.industry || '-') }}　<b>意向：</b>{{ esc(row.intent_status_name || '-') }}</div>
          <div class="card-line"><b>负责人：</b>{{ esc(row.belong_name || '-') }}（{{ esc(row.belong_department || '-') }}）</div>
          <div class="card-line"><b>电话：</b>{{ esc(row.mobile || '-') }}</div>
          <div class="card-line"><b>地址：</b>{{ esc(row.address || '-') }}</div>
          <div class="card-line"><b>预存/抵扣/保证金：</b>¥{{ fmtMoney(row.advance_deposit) }} / ¥{{ fmtMoney(row.deduction) }} / ¥{{ fmtMoney(row.margin_deposit) }}</div>
          <div v-if="row.remark" class="card-line"><b>备注：</b>{{ esc(plain(row.remark).slice(0, 300)) }}</div>
        </div>
        <div v-if="subsidiaries.length" class="section-title">子公司</div>
        <div v-for="(s, i) in subsidiaries" :key="i" class="card">
          <div class="card-title">{{ esc(s.name) }}</div>
          <div class="card-line"><b>联系人：</b>{{ esc(s.contact_name || '-') }} {{ esc(s.contact_mobile || '') }}</div>
        </div>
      </template>

      <!-- 联系人 -->
      <template v-else-if="tab === 'contact'">
        <Skeleton v-if="contacts.status.loading" />
        <EmptyState v-else-if="!contacts.rows.value.length" icon="👤" text="暂无联系人" />
        <div v-for="(c, i) in contacts.rows.value" :key="i" class="card">
          <div class="card-title">{{ esc(c.name || c.link_name || '联系人') }}</div>
          <div class="card-line"><b>手机：</b>{{ esc(c.mobile || '-') }}</div>
          <div class="card-line"><b>职务：</b>{{ esc(c.position || '-') }}</div>
        </div>
      </template>

      <!-- 商机 -->
      <template v-else-if="tab === 'chance'">
        <Skeleton v-if="chances.status.loading" />
        <EmptyState v-else-if="!chances.rows.value.length" icon="🎯" text="暂无商机" />
        <div v-for="(c, i) in chances.rows.value" :key="i" class="card">
          <div class="card-title">{{ esc(c.title || '商机') }}</div>
          <div class="card-line"><b>金额：</b>¥{{ fmtMoney(c.amount) }}</div>
          <div class="card-line"><b>状态：</b>{{ esc(c.status_name || '-') }}</div>
        </div>
      </template>

      <!-- 跟进 -->
      <template v-else-if="tab === 'trace'">
        <Skeleton v-if="traces.status.loading" />
        <EmptyState v-else-if="!traces.rows.value.length" icon="📝" text="暂无跟进" />
        <div v-for="(t, i) in traces.rows.value" :key="i" class="card">
          <div class="card-line">{{ esc(plain(t.content || '').slice(0, 200)) }}</div>
          <div class="card-line" style="margin-top:6px"><b>{{ esc(t.admin_name || '') }}</b> · {{ fmtTime(t.create_time) }}</div>
        </div>
      </template>

      <!-- 订单 -->
      <template v-else>
        <div class="card" @click="router.push('/p/order-my')">
          <div class="card-line">查看该客户全部订单 ›</div>
        </div>
      </template>

      <div class="ops-bar">
        <button class="act-btn block" @click="ops">客户操作</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-base); font-weight: 600; color: var(--color-text-2); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.ops-bar { padding: var(--sp-6) var(--sp-4) var(--sp-7); }
</style>
