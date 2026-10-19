<script setup lang="ts">
/** 产品详情 + 说明书 PDF 预览 —— 对应原 APK openProductDetail */
import { ref, watch } from 'vue'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import { esc, plain } from '@/utils/format'
import { sanitize } from '@/utils/sanitize'
import { toast } from '@/shared/toast'
import PdfPreview from '@/shared/PdfPreview.vue'
import Skeleton from '@/shared/Skeleton.vue'

const props = defineProps<{ id: string }>()
const { rows, status } = useListData({
  limit: 1,
  fetcher: async () => {
    const r = await API.productList(1, 100)
    return { code: 0, data: (r.data || []).filter((x: any) => String(x.id) === props.id) }
  }
})
const row = ref<any>(null)
const showPdf = ref(false)
const pdfUrl = ref('/api/index/get_oss_file.html')
watch(() => rows.value.length, n => { if (n) row.value = rows.value[0] })
</script>

<template>
  <div class="prod-detail">
    <Skeleton v-if="status.loading" />
    <template v-if="row">
      <div class="card">
        <div class="card-title">{{ esc(row.title) }}</div>
        <div class="card-line"><b>货号：</b>{{ esc(plain(row.goods_no).slice(0, 80)) }}</div>
        <div class="card-line"><b>分类：</b>{{ esc(row.cate_name || '-') }}</div>
        <div class="card-line" v-if="row.price_desc"><b>规格价格：</b></div>
        <pre v-if="row.price_desc" class="price">{{ esc(plain(row.price_desc).slice(0, 600)) }}</pre>
      </div>
      <div class="card rich" v-if="row.desc && plain(row.desc)" v-html="sanitize(row.desc)" />
      <div class="ops">
        <button class="act-btn" @click="showPdf = !showPdf">{{ showPdf ? '收起说明书' : '查看说明书' }}</button>
        <button class="act-btn ghost" @click="toast('已加入收藏夹')">收藏</button>
      </div>
      <PdfPreview v-if="showPdf" :url="pdfUrl" />
    </template>
  </div>
</template>

<style scoped>
.ops { display: flex; gap: var(--sp-2); padding: var(--sp-2) var(--sp-4); }
.ops .act-btn { flex: 1; padding: 11px 0; }
.price { font-size: var(--font-base); color: var(--color-text-2); white-space: pre-wrap; line-height: 1.7; font-family: inherit; }
.rich { font-size: var(--font-base); line-height: 1.7; overflow-x: auto; }
.rich :deep(img) { max-width: 100%; }
</style>
