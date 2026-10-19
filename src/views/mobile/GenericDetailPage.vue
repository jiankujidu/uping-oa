<script setup lang="ts">
/** 通用详情（校展/售后/样本/平台订单）—— 对应各 openXxxDetail */
import { ref, watch } from 'vue'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { esc, plain, fmtDate, fmtMoney } from '@/utils/format'
import { sanitize } from '@/utils/sanitize'
import Skeleton from '@/shared/Skeleton.vue'

const props = defineProps<{ kind: string; id: string }>()

const API_MAP: Record<string, (p: number, l: number) => Promise<any>> = {
  school: (p, l) => API.schoolList(p, l),
  after: (p, l) => API.afterList(p, l),
  sample: (p, l) => API.sampleList(p, l),
  'platform-order': (p, l) => API.platformOrderList(p, l)
}
const TITLE: Record<string, string> = { school: '校展详情', after: '售后详情', sample: '样本详情', 'platform-order': '平台订单详情' }

const { rows, status } = useListData({
  limit: 1,
  fetcher: async () => {
    const r = await API_MAP[props.kind](1, 100)
    return { code: 0, data: (r.data || []).filter((x: any) => String(x.id) === props.id) }
  }
})
const row = ref<any>(null)
watch(() => rows.value.length, n => { if (n) row.value = rows.value[0] })

const SKIP = new Set(['id', 'create_time', 'update_time', 'delete_time', 'content', 'detail', 'description'])
</script>

<template>
  <div class="generic-detail">
    <Skeleton v-if="status.loading" />
    <template v-if="row">
      <div class="card">
        <div class="card-title">{{ esc(row.title || row.code || TITLE[kind] || '详情') }}</div>
        <template v-for="(v, k) in row" :key="k">
          <div v-if="!SKIP.has(String(k)) && v !== null && v !== '' && v !== 0 && typeof v !== 'object'" class="card-line">
            <b>{{ k }}：</b>{{ esc(String(v).slice(0, 200)) }}
          </div>
        </template>
        <div class="card-line"><b>创建时间：</b>{{ fmtDate(row.create_time) }}</div>
      </div>
      <div v-if="row.content || row.description" class="card rich" v-html="sanitize(row.content || row.description || '')" />
    </template>
  </div>
</template>

<style scoped>
.rich { font-size: var(--font-base); line-height: 1.7; overflow-x: auto; }
.rich :deep(img) { max-width: 100%; }
</style>
