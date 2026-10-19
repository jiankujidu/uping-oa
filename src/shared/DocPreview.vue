/**
 * docx 高保真预览（docx-preview，原 APK 同款库与调用方式）。
 * mammoth 仅作兜底。原 APK 的在线编辑降级为「下载原文件」（D 项降级方案）。
 */
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from './toast'

const props = defineProps<{ url: string; name?: string }>()
const container = ref<HTMLElement | null>(null)
const loading = ref(true)
const failed = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    let buf: ArrayBuffer | null = null
    const full = API.fileUrl(props.url)
    if (API.PROXY_BASE) {
      const r = await fetch(full, { credentials: 'include' })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      buf = await r.arrayBuffer()
    } else {
      // 演示模式：构造一个简单 docx 占位（带提示的 word/document.xml）
      buf = buildPlaceholderDocx()
    }
    await renderDocx(buf)
  } catch (e: any) {
    failed.value = true
    toast(e?.message || '文档加载失败')
  } finally {
    loading.value = false
  }
})

async function renderDocx(buf: ArrayBuffer) {
  const jszipAny = (window as any).JSZip
  const docxAny = (window as any).docx
  if (jszipAny && docxAny && docxAny.renderAsync) {
    await docxAny.renderAsync(buf, container.value, undefined, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true
    })
    return
  }
  // 兜底：mammoth 提取 HTML
  const mammoth = (window as any).mammoth
  const out = await mammoth.convertToHtml({ arrayBuffer: buf })
  if (container.value) container.value.innerHTML = out.value
}

/** 演示模式占位 docx */
function buildPlaceholderDocx(): ArrayBuffer {
  const text = '<w:p><w:r><w:t>演示模式：此处将高保真渲染服务端 docx（需配置反代连接真实 OA）。</w:t></w:r></w:p>'
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${text}</w:body></w:document>`
  return makeZip({
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': documentXml
  })
}

function makeZip(files: Record<string, string>): ArrayBuffer {
  const jszipAny = (window as any).JSZip
  const zip = new jszipAny()
  for (const k in files) zip.file(k, files[k])
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
}

function download() {
  const full = API.fileUrl(props.url)
  const a = document.createElement('a')
  a.href = full
  a.download = props.name || 'contract.docx'
  a.click()
}
</script>

<template>
  <div class="docx-wrap">
    <div v-if="loading" class="docx-loading list-loading">文档加载中…</div>
    <div v-show="!loading && !failed" ref="container" class="docx-body" />
    <div v-if="failed" class="docx-failed empty-state">
      <div class="empty-text">文档加载失败，或当前为演示模式</div>
      <button class="act-btn" @click="download">下载原文件</button>
    </div>
    <div v-if="!loading && !failed" class="docx-bar">
      <button class="act-btn ghost" @click="download">下载原文件</button>
    </div>
  </div>
</template>

<style scoped>
.docx-wrap { background: var(--color-bg); min-height: 100%; }
.docx-body { background: #fff; padding: 12px; }
.docx-bar { padding: 12px; display: flex; gap: 10px; justify-content: center; }
</style>
