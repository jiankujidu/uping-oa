<script setup lang="ts">
/** 消息详情 + 删除/回复 —— 对应原 APK openMsgDetail */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { actionSheet } from '@/shared/actionSheet'
import { toast } from '@/shared/toast'
import { sanitize } from '@/utils/sanitize'
import Skeleton from '@/shared/Skeleton.vue'

const props = defineProps<{ id: string; tab: string }>()
const router = useRouter()
const msg = ref<any>(null)
const loading = ref(true)
const bodyHtml = ref('')

async function load() {
  loading.value = true
  try {
    const r = await API.messageRead(Number(props.id))
    // 原 APK 从 HTML 提取字段；演示模式直接用列表行
    bodyHtml.value = r?.html || ''
    msg.value = { title: '消息 ' + props.id, content: r?.html || '<p>（演示模式：消息正文需连接真实 OA 后展示）</p>' }
  } finally { loading.value = false }
}
load()

async function ops() {
  const act = await actionSheet('消息操作', [
    { label: '回复', value: 'reply' },
    { label: props.tab === 'rubbish' ? '彻底删除' : '删除', value: 'del', danger: true }
  ])
  if (act === 'del') {
    const r = await API.messageCheck(props.id, 2, props.tab === 'rubbish' ? 1 : 0)
    if (r && r.code === 0) { toast('已删除'); router.back() }
    else toast(r?.msg || '操作失败')
  } else if (act === 'reply') {
    router.push('/detail/message-compose/' + props.id)
  }
}
</script>

<template>
  <div class="msg-detail">
    <Skeleton v-if="loading" />
    <template v-if="msg">
      <div class="card">
        <div class="card-title">{{ msg.title }}</div>
        <div class="card-line" v-if="msg.send_name"><b>发件人：</b>{{ msg.send_name }}</div>
        <div class="card-line" v-if="msg.create_time"><b>时间：</b>{{ msg.create_time }}</div>
      </div>
      <!-- 富文本正文必须过 DOMPurify（XSS 防护） -->
      <div class="card rich" v-html="sanitize(msg.content)" />
      <div class="ops-bar"><button class="act-btn block" @click="ops">消息操作</button></div>
    </template>
  </div>
</template>

<style scoped>
.ops-bar { padding: var(--sp-5) var(--sp-4) var(--sp-7); }
.rich { font-size: var(--font-base); line-height: 1.7; color: var(--color-text); overflow-x: auto; }
.rich :deep(img) { max-width: 100%; }
.rich :deep(table) { border-collapse: collapse; }
.rich :deep(td), .rich :deep(th) { border: 1px solid var(--color-border); padding: 4px 8px; }
</style>
