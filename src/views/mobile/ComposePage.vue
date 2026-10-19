<script setup lang="ts">
/** 写消息 / 回复消息 —— 对应原 APK openMsgCompose/openMsgComposeReply */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'
import AttachmentUpload from '@/shared/AttachmentUpload.vue'
import UserPicker from '@/shared/UserPicker.vue'

const router = useRouter()
const route = useRoute()
const replyTo = String(route.params.id || '0')
const form = ref({ title: '', content: '' })
const receivers = ref<{ id: number; name: string }[]>([])
const copies = ref<{ id: number; name: string }[]>([])
const files = ref<{ name: string; size: number }[]>([])
const pickerFor = ref<'to' | 'cc' | null>(null)
const sending = ref(false)

async function submit(send = true) {
  if (!receivers.value.length) { toast('请选择收件人'); return }
  if (!form.value.title.trim()) { toast('请填写标题'); return }
  sending.value = true
  try {
    const data: Record<string, any> = {
      title: form.value.title,
      content: form.value.content,
      receive_uids: receivers.value.map(r => r.id).join(','),
      copy_uids: copies.value.map(c => c.id).join(','),
      file_ids: '',
      is_draft: send ? 0 : 1
    }
    const r = send ? await API.messageSend(data) : await API.messageSave(data)
    if (r && r.code === 0) { toast(send ? '已发送' : '已存草稿'); router.back() }
    else toast(r?.msg || '发送失败')
  } finally { sending.value = false }
}

function onPickerConfirm(users: { id: number; name: string }[]) {
  if (pickerFor.value === 'to') receivers.value = users
  if (pickerFor.value === 'cc') copies.value = users
  pickerFor.value = null
}
</script>

<template>
  <div class="compose">
    <div class="form-card">
      <button class="picker-row" @click="pickerFor = 'to'">
        <span class="label">收件人<i class="req">*</i></span>
        <span class="val">{{ receivers.length ? receivers.map(r => r.name).join('、') : '请选择 ›' }}</span>
      </button>
      <button class="picker-row" @click="pickerFor = 'cc'">
        <span class="label">抄送人</span>
        <span class="val">{{ copies.length ? copies.map(c => c.name).join('、') : '请选择（可选）›' }}</span>
      </button>
      <div class="field"><label>标题</label><input v-model="form.title" class="form-input" placeholder="请输入标题" /></div>
      <div class="field"><label>正文</label><textarea v-model="form.content" class="form-textarea" style="min-height:140px" placeholder="请输入正文" /></div>
      <div class="field"><label>附件</label><AttachmentUpload v-model="files" /></div>
    </div>
    <div class="ops">
      <button class="act-btn ghost" :disabled="sending" @click="submit(false)">存草稿</button>
      <button class="act-btn" :disabled="sending" @click="submit(true)">{{ sending ? '发送中…' : '发送' }}</button>
    </div>
    <UserPicker :model-value="pickerFor === 'to' || pickerFor === 'cc'" :title="pickerFor === 'to' ? '选择收件人' : '选择抄送人'" @update:model-value="pickerFor = null" @confirm="onPickerConfirm" />
  </div>
</template>

<style scoped>
.form-card { background: var(--color-card); margin: var(--sp-3) var(--sp-4); border-radius: var(--radius-card); padding: var(--sp-4); box-shadow: var(--shadow-card); }
.field { margin-bottom: var(--sp-4); }
.field label { display: block; font-size: var(--font-base); color: var(--color-text-2); margin-bottom: 6px; }
.picker-row { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; padding: var(--sp-2) 0; border-bottom: 1px solid var(--color-divider); }
.picker-row .label { font-size: var(--font-base); color: var(--color-text-2); }
.picker-row .val { font-size: var(--font-base); color: var(--color-text); max-width: 62%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.req { color: var(--color-danger); font-style: normal; }
.ops { display: flex; gap: var(--sp-3); padding: var(--sp-2) var(--sp-4) var(--sp-7); }
.ops .act-btn { flex: 1; padding: 12px 0; }
</style>
