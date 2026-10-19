<script setup lang="ts">
/** 桌面端我的 —— 账号设置（资料/密码表单，桌面双列） */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'

const auth = useAuthStore()
const profile = ref({ nickname: '', mobile: '', email: '', qq: '', wechat: '' })
const pwd = ref({ old: '', new1: '', new2: '' })

async function saveProfile() {
  const r = await API.editPersonal(profile.value)
  if (r && r.code === 0) toast('资料已保存')
  else toast(r?.msg || '保存失败')
}
async function savePwd() {
  if (pwd.value.new1 !== pwd.value.new2) { toast('两次新密码不一致'); return }
  if (pwd.value.new1.length < 6) { toast('新密码至少 6 位'); return }
  const r = await API.editPassword({ old_password: pwd.value.old, password: pwd.value.new1, repassword: pwd.value.new2 })
  if (r && r.code === 0) { toast('密码已修改'); pwd.value = { old: '', new1: '', new2: '' } }
  else toast(r?.msg || '修改失败')
}
</script>

<template>
  <div class="mine-wrap">
    <h2 class="page-title">账号设置</h2>
    <div class="two-col">
      <section class="blk">
        <h3 class="blk-title">基本资料</h3>
        <div class="form-grid">
          <div class="field"><label>用户名</label><input class="form-input" :value="auth.user?.username" disabled /></div>
          <div class="field"><label>昵称</label><input v-model="profile.nickname" class="form-input" /></div>
          <div class="field"><label>手机</label><input v-model="profile.mobile" class="form-input" /></div>
          <div class="field"><label>邮箱</label><input v-model="profile.email" class="form-input" /></div>
          <div class="field"><label>QQ</label><input v-model="profile.qq" class="form-input" /></div>
          <div class="field"><label>微信</label><input v-model="profile.wechat" class="form-input" /></div>
        </div>
        <div class="blk-foot"><button class="act-btn" @click="saveProfile">保存资料</button></div>
      </section>

      <section class="blk">
        <h3 class="blk-title">修改密码</h3>
        <div class="form-grid">
          <div class="field"><label>原密码</label><input v-model="pwd.old" type="password" class="form-input" /></div>
          <div class="field"><label>新密码（至少 6 位）</label><input v-model="pwd.new1" type="password" class="form-input" /></div>
          <div class="field"><label>确认新密码</label><input v-model="pwd.new2" type="password" class="form-input" /></div>
        </div>
        <div class="blk-foot"><button class="act-btn" @click="savePwd">修改密码</button></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-size: 18px; font-weight: 500; margin-bottom: var(--sp-5); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-5); align-items: start; }
.blk { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-card); padding: var(--sp-5); box-shadow: var(--shadow-desktop); }
.blk-title { font-size: var(--font-md); font-weight: 500; margin-bottom: var(--sp-4); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
.field label { display: block; font-size: var(--font-base); color: var(--color-text-2); margin-bottom: 6px; }
.blk-foot { margin-top: var(--sp-5); }
</style>
