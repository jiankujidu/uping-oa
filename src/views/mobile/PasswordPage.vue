<script setup lang="ts">
/** 修改密码 —— 对应原 APK renderPasswordPage */
import { ref } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'

const form = ref({ old: '', new1: '', new2: '' })
const saving = ref(false)

async function save() {
  if (!form.value.old || !form.value.new1) { toast('请填写完整'); return }
  if (form.value.new1 !== form.value.new2) { toast('两次新密码不一致'); return }
  if (form.value.new1.length < 6) { toast('新密码至少 6 位'); return }
  saving.value = true
  try {
    const r = await API.editPassword({ old_password: form.value.old, password: form.value.new1, repassword: form.value.new2 })
    if (r && r.code === 0) { toast('修改成功'); form.value = { old: '', new1: '', new2: '' } }
    else toast(r?.msg || '修改失败')
  } finally { saving.value = false }
}
</script>

<template>
  <div class="page-form">
    <div class="form-card">
      <div class="field"><label>原密码</label><input v-model="form.old" type="password" class="form-input" placeholder="请输入原密码" /></div>
      <div class="field"><label>新密码</label><input v-model="form.new1" type="password" class="form-input" placeholder="至少 6 位" /></div>
      <div class="field"><label>确认新密码</label><input v-model="form.new2" type="password" class="form-input" placeholder="再输一次新密码" /></div>
    </div>
    <div class="submit-wrap"><button class="act-btn block" :disabled="saving" @click="save">{{ saving ? '提交中…' : '确认修改' }}</button></div>
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
