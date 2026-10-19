<script setup lang="ts">
/** 订单详情 + 审单 —— 对应原 APK openOrderDetail/saveOrderAudit */
import { ref } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'
import { confirm } from '@/shared/confirm'
import { esc, plain, fmtMoney, fmtDate } from '@/utils/format'
import Skeleton from '@/shared/Skeleton.vue'
import EmptyState from '@/shared/EmptyState.vue'
import UserPicker from '@/shared/UserPicker.vue'

const props = defineProps<{ id: string; mode: string }>()
const row = ref<any>(null)
const loading = ref(true)
const checkerPicker = ref(false)
const checkers = ref<{ id: number; name: string }[]>([])
const remark = ref('')

async function load() {
  loading.value = true
  try {
    const r = await API.orderView(Number(props.id))
    row.value = r?.data || null
  } catch { row.value = null } finally { loading.value = false }
}
load()

async function doCheck(check: number) {
  const label = check === 1 ? '通过' : check === 2 ? '驳回' : '撤回'
  const ok = await confirm({ title: label + '订单', message: '确认' + label + '该订单？', okText: label, danger: check !== 1 })
  if (!ok) return
  const r = await API.orderFlowCheck(Number(props.id), check, remark.value, 0, checkers.value.map(c => c.id).join(','))
  if (r && r.code === 0) { toast(label + '成功'); load() }
  else toast(r?.msg || '操作失败')
}

function genAgreement() {
  location.hash = '#/detail/sales-agreement/' + props.id
}

function onPickerConfirm(users: { id: number; name: string }[]) {
  checkers.value = users
  checkerPicker.value = false
}
</script>

<template>
  <div class="order-detail">
    <Skeleton v-if="loading" />
    <EmptyState v-else-if="!row" icon="📦" text="订单不存在或已删除" />

    <template v-if="row">
      <div class="card">
        <div class="card-title">{{ esc(row.code || ('订单 ' + id)) }}</div>
        <div class="card-line"><b>客户：</b>{{ esc(row.customer_name || '-') }}</div>
        <div class="card-line"><b>金额：</b>¥{{ fmtMoney(row.amount || 0) }}</div>
        <div class="card-line"><b>状态：</b>{{ esc(row.status_name || '-') }}</div>
        <div class="card-line"><b>创建：</b>{{ fmtDate(row.create_time) }}</div>
        <div class="card-line" v-if="row.remark"><b>备注：</b>{{ esc(plain(row.remark).slice(0, 200)) }}</div>
      </div>

      <div class="section-title">产品明细</div>
      <div class="card">
        <div v-if="!row.product_info" class="card-line">暂无产品明细</div>
        <div v-for="(p, i) in (typeof row.product_info === 'string' ? JSON.parse(row.product_info || '[]') : row.product_info || [])" :key="i" class="p-row">
          <span class="p-name">{{ esc(p.title || p.product_name || p.name || '产品') }}</span>
          <span class="p-qty">×{{ esc(p.num || p.quantity || 1) }}</span>
        </div>
      </div>

      <div class="section-title">操作</div>
      <div class="ops">
        <button class="act-btn" @click="doCheck(1)">通过</button>
        <button class="act-btn ghost" @click="doCheck(2)">驳回</button>
        <button class="act-btn ghost" @click="genAgreement">销售协议</button>
      </div>
      <div class="form-card">
        <div class="field"><label>审核意见</label><textarea v-model="remark" class="form-textarea" placeholder="选填" /></div>
        <button class="picker-row" @click="checkerPicker = true">
          <span class="label">加签/协作审核人</span>
          <span class="val">{{ checkers.length ? checkers.map(c => c.name).join('、') : '请选择 ›' }}</span>
        </button>
      </div>
    </template>

    <UserPicker v-model="checkerPicker" title="选择审核人" @confirm="onPickerConfirm" />
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-base); font-weight: 600; color: var(--color-text-2); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.ops { display: flex; gap: var(--sp-2); padding: var(--sp-2) var(--sp-4); }
.ops .act-btn { flex: 1; padding: 11px 0; }
.form-card { background: var(--color-card); margin: var(--sp-2) var(--sp-4) var(--sp-6); border-radius: var(--radius-card); padding: var(--sp-4); box-shadow: var(--shadow-card); }
.field { margin-bottom: var(--sp-4); }
.field label { display: block; font-size: var(--font-base); color: var(--color-text-2); margin-bottom: 6px; }
.picker-row { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; }
.picker-row .label { font-size: var(--font-base); color: var(--color-text-2); }
.picker-row .val { font-size: var(--font-base); color: var(--color-text); }
.p-row { display: flex; justify-content: space-between; padding: var(--sp-2) 0; border-bottom: 1px solid var(--color-divider); font-size: var(--font-base); }
.p-row:last-child { border-bottom: none; }
.p-qty { color: var(--color-text-3); }
</style>
