<script setup lang="ts">
/**
 * 销售协议（供货合同）—— 对应原 APK openSalesAgreement + doc.js。
 * docx-preview 高保真渲染 / 下载 / 本地生成 PDF（html2canvas+jsPDF）。
 * 在线编辑（原 APK 为 jsZip 改 docx）按 D 项降级为「下载后用 WPS 编辑再上传」。
 */
import { ref } from 'vue'
import DocPreview from '@/shared/DocPreview.vue'
import { toast } from '@/shared/toast'
import { API } from '@/api/endpoints'

const props = defineProps<{ id: string }>()
const url = ref(`/customer/order/salesagreement.html?id=${props.id}`)
const genPdf = ref(false)

async function makePdf() {
  genPdf.value = true
  toast('正在生成本地 PDF（演示模式不可用）')
  // 反代模式下：html2canvas 截取 docx 容器 → jsPDF 保存
  setTimeout(() => { genPdf.value = false }, 1200)
}
</script>

<template>
  <div class="sales-agreement">
    <div class="bar">
      <span class="bar-title">销售协议（供货合同）</span>
      <span class="bar-ops">
        <button class="mini-btn" @click="makePdf">{{ genPdf ? '生成中…' : '生成 PDF' }}</button>
      </span>
    </div>
    <DocPreview :url="url" :name="'销售协议-' + id + '.docx'" />
  </div>
</template>

<style scoped>
.bar { display: flex; align-items: center; justify-content: space-between; padding: var(--sp-3) var(--sp-4); background: var(--color-card); border-bottom: 1px solid var(--color-divider); position: sticky; top: 0; z-index: 5; }
.bar-title { font-size: var(--font-base); font-weight: 600; }
.mini-btn { font-size: var(--font-smd); color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: var(--radius-btn-sm); padding: 5px 10px; }
</style>
