<script setup lang="ts">
/** 审批详情 —— 对应原 APK openApproveDetail（表单字段 + 流转记录时间线 + 附件） */
import { ref } from 'vue'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { esc, plain, fmtTime } from '@/utils/format'
import Skeleton from '@/shared/Skeleton.vue'
import EmptyState from '@/shared/EmptyState.vue'

const props = defineProps<{ id: string }>()

const { rows: list, status, refresh } = useListData({
  limit: 1,
  fetcher: async () => {
    // 原 APK 从详情 HTML 提取；演示模式用列表接口数据
    const r = await API.approveList(1, 100)
    return { code: 0, data: (r.data || []).filter((x: any) => String(x.id) === props.id) }
  }
})
const item = ref<any>(null)
refresh()

const nodes = ref<any[]>([])
async function loadNodes(actionId: number) {
  const r = await API.flowNodes(actionId)
  nodes.value = Array.isArray(r?.data) ? r.data : []
}

const APPROVE_FIELD_LABELS: Record<string, string> = {
  detail_type: '请假类型', start_time: '开始时间', end_time: '结束时间', duration: '时长(小时)',
  address: '地点', reason: '事由', remark: '备注', amount: '金额', num: '数量',
  content: '内容', product: '物品', subject: '科目', bank: '开户行'
}
function fieldsOf(r: any): [string, any][] {
  const out: [string, any][] = []
  for (const k in APPROVE_FIELD_LABELS) {
    if (r[k] !== undefined && r[k] !== null && r[k] !== '' && String(r[k]) !== '0.00') out.push([APPROVE_FIELD_LABELS[k], r[k]])
  }
  return out
}
</script>

<template>
  <div class="approve-detail">
    <Skeleton v-if="status.loading && !list.length" />
    <EmptyState v-else-if="!list.length && !status.loading" icon="🗂" text="审批不存在或已删除" />

    <template v-for="r in list" :key="r.id">
      <div class="card">
        <div class="card-title">{{ esc(r.content || '审批') }}<span class="tag" :class="r.check_status == 2 ? 'tag-pass' : (r.check_status == 3 || r.check_status == 4) ? 'tag-reject' : 'tag-pending'">{{ ['待审批', '待审批', '已通过', '已拒绝', '已拒绝'][r.check_status] || '状态' + r.check_status }}</span></div>
        <div class="card-line"><b>编号：</b>{{ r.id }}</div>
        <div class="card-line"><b>类型：</b>{{ esc(r.flow_type || '-') }}</div>
        <div class="card-line"><b>申请人：</b>{{ esc(r.admin_name || '-') }}（{{ esc(r.department_name || '-') }}）</div>
        <div class="card-line"><b>时间：</b>{{ fmtTime(r.create_time) }}</div>
        <div v-for="[label, v] in fieldsOf(r)" :key="label" class="card-line"><b>{{ label }}：</b>{{ typeof v === 'string' ? esc(plain(v).slice(0, 200)) : v }}</div>
      </div>

      <div class="section-title">流转记录</div>
      <div class="card">
        <div v-if="!nodes.length" class="card-line">暂无流转记录</div>
        <div v-for="(n, i) in nodes" :key="i" class="flow-node">
          <span class="dot" :class="i === nodes.length - 1 ? 'cur' : ''" />
          <div class="flow-meta">
            <div class="flow-name">{{ esc(n.admin_name || n.name || '节点') }}</div>
            <div class="flow-sub">{{ esc(n.content || n.status_name || '') }} <template v-if="n.create_time">{{ fmtTime(n.create_time) }}</template></div>
          </div>
        </div>
      </div>

      <div class="section-title">附件</div>
      <div class="card" v-if="!r.file_ids" ><div class="card-line">无附件</div></div>
      <div class="card" v-else><div class="card-line">附件 ID：{{ esc(r.file_ids) }}</div></div>
    </template>
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-base); font-weight: 600; color: var(--color-text-2); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.tag { float: right; font-size: 11px; padding: 2px 8px; border-radius: 8px; margin-left: 8px; }
.tag-pending { background: #FFF7E6; color: #BA7517; }
.tag-pass { background: #EAF3DE; color: #3B6D11; }
.tag-reject { background: #FCEBEB; color: #A32D2D; }
.flow-node { display: flex; gap: var(--sp-3); padding: var(--sp-2) 0; }
.flow-node .dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--color-text-4); margin-top: 6px; }
.flow-node .dot.cur { background: var(--color-primary); }
.flow-name { font-size: var(--font-base); color: var(--color-text); }
.flow-sub { font-size: var(--font-smd); color: var(--color-text-4); margin-top: 2px; }
</style>
