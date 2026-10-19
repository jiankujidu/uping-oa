<script setup lang="ts">
/** 附件详情（pdf/docx 预览 + 下载） */
import { computed } from 'vue'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import PdfPreview from '@/shared/PdfPreview.vue'
import DocPreview from '@/shared/DocPreview.vue'
import Skeleton from '@/shared/Skeleton.vue'
import { esc } from '@/utils/format'
import { watch, ref } from 'vue'

const props = defineProps<{ id: string }>()
const { rows, status } = useListData({
  limit: 1,
  fetcher: async () => {
    const r = await API.fileList(1, 100)
    return { code: 0, data: (r.data || []).filter((x: any) => String(x.id) === props.id) }
  }
})
const row = ref<any>(null)
watch(() => rows.value.length, n => { if (n) row.value = rows.value[0] })

const ext = computed(() => String(row.value?.fileext || row.value?.name || '').split('.').pop()?.toLowerCase() || '')
const isPdf = computed(() => ext.value === 'pdf')
const isDocx = computed(() => ['doc', 'docx'].includes(ext.value))
const url = computed(() => row.value?.filepath || '/api/index/get_oss_file.html')
</script>

<template>
  <div class="file-detail">
    <Skeleton v-if="status.loading" />
    <template v-if="row">
      <div class="card">
        <div class="card-title">{{ esc(row.name || '文件') }}</div>
        <div class="card-line"><b>大小：</b>{{ row.filesize ? (Number(row.filesize) / 1024).toFixed(0) + 'KB' : '-' }}</div>
        <div class="card-line"><b>上传：</b>{{ esc(row.create_time || '-') }}</div>
      </div>
      <PdfPreview v-if="isPdf" :url="url" :name="row.name" />
      <DocPreview v-else-if="isDocx" :url="url" :name="row.name" />
      <div v-else class="empty-state"><div class="empty-text">该格式（{{ ext || '未知' }}）不支持网页内预览</div></div>
    </template>
  </div>
</template>
