/**
 * 附件上传 —— 手机端 input[capture] 唤起相机/相册；桌面端点击选择 + 拖拽。
 * 原 APK 走原生桥 base64 → multipart；网页端走反代直传 multipart/form-data。
 * 10MB 上限与源码一致；反代不可用时进入演示模式（本地产占位）。
 */
<script setup lang="ts">
import { ref } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from './toast'
import { fmtSize } from '@/utils/format'

export interface UploadedFile { id?: number; name: string; size: number; local?: boolean }

const props = withDefaults(defineProps<{
  modelValue: UploadedFile[]
  max?: number
  accept?: string
}>(), { max: 10, accept: '' })

const emit = defineEmits<{ (e: 'update:modelValue', v: UploadedFile[]): void }>()
const uploading = ref(false)
const dragover = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

async function upload(file: File) {
  if (file.size > 10 * 1024 * 1024) { toast('文件超过 10MB 上限'); return }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    // 反代模式下直传；mock 模式本地占位
    if (API.PROXY_BASE) {
      const r = await fetch(API.PROXY_BASE + '/api/index/upload', {
        method: 'POST', credentials: 'include', body: fd
      })
      const j = await r.json().catch(() => null)
      if (j && j.code === 0 && j.data) {
        emit('update:modelValue', props.modelValue.concat([{ id: j.data.id, name: j.data.name || file.name, size: file.size }]))
        toast('上传成功')
        return
      }
      toast(j?.msg || '上传失败')
      return
    }
    await new Promise(r => setTimeout(r, 400))
    emit('update:modelValue', props.modelValue.concat([{ name: file.name, size: file.size, local: true }]))
    toast('演示模式：已选择文件（未上传）')
  } catch (e: any) {
    toast(e?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

function onPick(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  files.forEach(upload)
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent) {
  dragover.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  files.forEach(upload)
}

function remove(i: number) {
  const v = props.modelValue.slice()
  v.splice(i, 1)
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="uploader">
    <div
      :class="['drop', dragover ? 'over' : '']"
      @click="inputRef?.click()"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop.prevent="onDrop"
    >
      <div class="drop-ico">＋</div>
      <div class="drop-tip">点击选择文件<template v-if="!$attrs.mobile"> / 拖拽到此处</template><br />单个不超过 10MB</div>
      <input ref="inputRef" type="file" class="hidden-input" :accept="accept" multiple @change="onPick" />
    </div>
    <div v-if="uploading" class="uploading">上传中…</div>
    <div v-for="(f, i) in modelValue" :key="i" class="file-item">
      <span class="f-name">{{ f.name }}</span>
      <span class="f-size">{{ fmtSize(f.size) }}</span>
      <button class="f-del" @click="remove(i)">×</button>
    </div>
  </div>
</template>

<style scoped>
.uploader { width: 100%; }
.drop {
  border: 1px dashed var(--color-border); border-radius: var(--radius-input);
  background: var(--color-input-bg); padding: var(--sp-5); text-align: center; cursor: pointer;
  transition: border-color var(--dur-fast);
}
.drop:hover, .drop.over { border-color: var(--color-primary); background: var(--color-primary-bg); }
.drop-ico { font-size: 22px; color: var(--color-text-4); line-height: 1.2; }
.drop-tip { font-size: var(--font-smd); color: var(--color-text-4); line-height: 1.5; margin-top: var(--sp-1); }
.hidden-input { display: none; }
.uploading { font-size: var(--font-smd); color: var(--color-primary); margin-top: var(--sp-2); }
.file-item { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); background: var(--color-bg); border-radius: var(--radius-btn-sm); margin-top: var(--sp-2); font-size: var(--font-base); }
.f-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.f-size { color: var(--color-text-4); font-size: var(--font-smd); }
.f-del { color: var(--color-danger); font-size: 16px; padding: 4px 8px; }
</style>
