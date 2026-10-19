/**
 * PDF 内嵌预览（pdf.js 3.11，原 APK 同款）。含下载 / 本地生成分享。
 */
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from './toast'

const props = withDefaults(defineProps<{ url: string; name?: string }>(), {})
const wrap = ref<HTMLElement | null>(null)
const loading = ref(true)
const failed = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    if (!API.PROXY_BASE) {
      // 演示模式：本地画一页"演示 PDF"提示页
      drawPlaceholder()
      return
    }
    const pdfjs = (window as any).pdfjsLib
    pdfjs.GlobalWorkerOptions.workerSrc = API.BASE ? '/vendor/pdf.worker.min.js' : '/vendor/pdf.worker.min.js'
    const full = API.fileUrl(props.url)
    const r = await fetch(full, { credentials: 'include' })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const buf = await r.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: buf }).promise
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const viewport = page.getViewport({ scale: 1.4 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.className = 'pdf-page'
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport }).promise
      wrap.value?.appendChild(canvas)
    }
  } catch (e: any) {
    failed.value = true
    toast(e?.message || 'PDF 加载失败')
  } finally {
    loading.value = false
  }
})

function drawPlaceholder() {
  const canvas = document.createElement('canvas')
  canvas.width = 600; canvas.height = 840; canvas.className = 'pdf-page'
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 600, 840)
  ctx.fillStyle = '#1E6FFF'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('优品OA · 说明书预览', 300, 200)
  ctx.fillStyle = '#8a8f99'; ctx.font = '14px sans-serif'
  ctx.fillText('演示模式：配置反代后将真实渲染服务端 PDF', 300, 240)
  ctx.fillText(props.url, 300, 270)
  wrap.value?.appendChild(canvas)
  loading.value = false
}

function download() {
  const full = API.fileUrl(props.url)
  const a = document.createElement('a')
  a.href = full
  a.download = props.name || 'file.pdf'
  a.click()
}
</script>

<template>
  <div class="pdf-wrap">
    <div v-if="loading" class="list-loading">PDF 加载中…</div>
    <div ref="wrap" class="pdf-body" v-show="!loading" />
    <div v-if="failed" class="empty-state">
      <div class="empty-text">PDF 加载失败，或当前为演示模式</div>
      <button class="act-btn" @click="download">下载原文件</button>
    </div>
  </div>
</template>

<style scoped>
.pdf-wrap { background: #525659; min-height: 100%; padding: 10px 0; }
.pdf-body { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.pdf-page { max-width: 100%; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
</style>
