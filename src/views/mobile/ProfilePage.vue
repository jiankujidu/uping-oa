<script setup lang="ts">
/** 基本资料 —— 对应原 APK renderProfilePage（表单 + 保存） */
import { ref } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const form = ref({ nickname: '', mobile: '', email: '', qq: '', wechat: '' })
const saving = ref(false)

async function load() {
  const r = await API.homePageHtml().catch(() => null)
  // 页面型接口返回 HTML；演示模式伪造默认值
  if (r && r.code === 0 && r.data) {
    form.value = { nickname: r.data.name || auth.user?.username || '', mobile: r.data.mobile || '', email: r.data.email || '', qq: r.data.qq || '', wechat: r.data.wechat || '' }
  } else if (auth.user?.username) {
    form.value.nickname = auth.user.username
  }
}
load()

async function save() {
  saving.value = true
  try {
    const r = await API.editPersonal(form.value)
    if (r && r.code === 0) toast('保存成功')
    else toast(r?.msg || '保存失败')
  } finally { saving.value = false }
}
</script>

<template>
  <div class="page-form">
    <div class="form-card">
      <div class="field"><label>昵称</label><input v-model="form.nickname" class="form-input" placeholder="请输入昵称" /></div>
      <div class="field"><label>手机</label><input v-model="form.mobile" class="form-input" placeholder="请输入手机号" /></div>
      <div class="field"><label>邮箱</label><input v-model="form.email" class="form-input" placeholder="请输入邮箱" /></div>
      <div class="field"><label>QQ</label><input v-model="form.qq" class="form-input" placeholder="请输入 QQ" /></div>
      <div class="field"><label>微信</label><input v-model="form.wechat" class="form-input" placeholder="请输入微信号" /></div>
    </div>
    <div class="submit-wrap"><button class="act-btn block" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button></div>
  </div>
</template>

<style scoped>
.page-form { padding-bottom: var(--sp-6); }
.form-card { background: var(--color-card); margin: var(--sp-3) var(--sp-4); border-radius: var(--radius-card); padding: var(--sp-4); box-shadow: var(--shadow-card); }
.field { margin-bottom: var(--sp-4); }
.field:last-child { margin-bottom: 0; }
.field label { display: block; font-size: var(--font-base); color: var(--color-text-2); margin-bottom: 6px; }
.submit-wrap { padding: 0 var(--sp-4); }
</style>
