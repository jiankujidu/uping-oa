<script setup lang="ts">
/** 公告 / 问答详情（服务端 HTML 富文本，过 DOMPurify） */
import { ref, watch } from 'vue'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { sanitize } from '@/utils/sanitize'
import { fmtDate } from '@/utils/format'
import Skeleton from '@/shared/Skeleton.vue'

const props = defineProps<{ kind: 'note' | 'article'; id: string }>()

const { rows, status } = useListData({
  limit: 1,
  fetcher: async () => {
    const r = props.kind === 'note' ? await API.noteList(1, 100) : await API.articleList(1, 100)
    return { code: 0, data: (r.data || []).filter((x: any) => String(x.id) === props.id) }
  }
})
const row = ref<any>(null)
watch(() => rows.value.length, n => { if (n) row.value = rows.value[0] })
</script>

<template>
  <div class="rich-detail">
    <Skeleton v-if="status.loading" />
    <template v-if="row">
      <div class="card">
        <div class="card-title">{{ row.title }}</div>
        <div class="card-line" v-if="row.cate_name">{{ row.cate_name }} · {{ fmtDate(row.create_time) }}</div>
      </div>
      <div class="card rich" v-html="sanitize(row.content || '')" />
    </template>
  </div>
</template>

<style scoped>
.rich { font-size: var(--font-base); line-height: 1.7; color: var(--color-text); overflow-x: auto; }
.rich :deep(img) { max-width: 100%; }
.rich :deep(table) { border-collapse: collapse; }
.rich :deep(td), .rich :deep(th) { border: 1px solid var(--color-border); padding: 4px 8px; }
</style>
