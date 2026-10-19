<script setup lang="ts">
/**
 * 登录页 —— 对应原 APK index.html .login-view（1:1 还原）。
 * 双端同一页面（居中卡片，移动端/桌面端均可用）。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { API } from '@/api/endpoints'
import { APP_VERSION } from '@/utils/const'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const captcha = ref('')
const remember = ref(false)
const captchaImg = ref('')
let mockAnswer = ''

function refreshCaptcha() {
  if (API.PROXY_BASE) {
    captchaImg.value = API.PROXY_BASE + '/captcha.html?t=' + Date.now()
  } else {
    captchaImg.value = drawMockCaptcha()
  }
}

/** mock 模式：本地 canvas 画算式验证码（绿色，与真机同款风格） */
function drawMockCaptcha(): string {
  const a = Math.floor(Math.random() * 90) + 10
  const b = Math.floor(Math.random() * 9) + 1
  const ans = String(a + b)
  mockAnswer = ans
  const canvas = document.createElement('canvas')
  canvas.width = 250; canvas.height = 62
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f2f6ff'; ctx.fillRect(0, 0, 250, 62)
  // 干扰线
  ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * 250, Math.random() * 62)
    ctx.bezierCurveTo(Math.random() * 250, Math.random() * 62, Math.random() * 250, Math.random() * 62, Math.random() * 250, Math.random() * 62)
    ctx.stroke()
  }
  ctx.fillStyle = '#2e9e3f'
  ctx.font = 'bold 34px "Comic Sans MS", "PingFang SC", sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${a} + ${b} = ?`, 24, 34)
  // 杂点
  ctx.fillStyle = '#8aa8d8'
  for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * 250, Math.random() * 62, 2, 2)
  return canvas.toDataURL('image/png')
}

async function doLogin() {
  if (!username.value.trim()) { auth.error = '请输入账户'; return }
  if (!password.value) { auth.error = '请输入密码'; return }
  if (!captcha.value.trim()) { auth.error = '请填写验证码'; return }
  // mock 模式校验本地算式答案
  if (!API.PROXY_BASE && captcha.value.trim() !== mockAnswer) {
    auth.error = '验证码错误'
    refreshCaptcha()
    captcha.value = ''
    return
  }
  const ok = await auth.login(username.value.trim(), password.value, captcha.value.trim(), remember.value)
  if (ok) {
    const redirect = (router.currentRoute.value.query.redirect as string) || '/home'
    router.replace(redirect)
  } else {
    refreshCaptcha()
    captcha.value = ''
  }
}

onMounted(async () => {
  const saved = await auth.prefill()
  if (saved) {
    username.value = saved.username
    password.value = saved.password
    remember.value = true
  }
  refreshCaptcha()
})
</script>

<template>
  <div class="login-view">
    <div class="login-logo">优品<span>OA</span></div>
    <div class="login-sub">优品生物 移动办公平台</div>
    <div class="login-form">
      <div class="login-field">
        <span class="login-ico">
          <svg viewBox="0 0 20 20" width="17" height="17"><circle cx="10" cy="6.5" r="3.2" fill="none" stroke="#8a8f99" stroke-width="1.5"/><path d="M3.8 16.5c.8-3.4 3.2-5 6.2-5s5.4 1.6 6.2 5" fill="none" stroke="#8a8f99" stroke-width="1.5" stroke-linecap="round"/></svg>
        </span>
        <input id="login-username" v-model="username" type="text" placeholder="账户或手机号码" autocomplete="off" />
      </div>
      <div class="login-field">
        <span class="login-ico">
          <svg viewBox="0 0 20 20" width="17" height="17"><rect x="4.5" y="8.5" width="11" height="8" rx="2" fill="none" stroke="#8a8f99" stroke-width="1.5"/><path d="M7 8.5V6a3 3 0 0 1 6 0v2.5" fill="none" stroke="#8a8f99" stroke-width="1.5"/></svg>
        </span>
        <input id="login-password" v-model="password" type="password" placeholder="登录密码" @keyup.enter="doLogin" />
      </div>
      <div class="login-field">
        <span class="login-ico">
          <svg viewBox="0 0 20 20" width="17" height="17"><path d="M3 15.5 7 10l2.5 3L14 6.5" fill="none" stroke="#8a8f99" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.5 6.5H15V9" fill="none" stroke="#8a8f99" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <input id="login-captcha" v-model="captcha" type="text" placeholder="填算式结果，如 2+6 填 8" autocomplete="off" @keyup.enter="doLogin" />
      </div>
      <div class="login-captcha-row">
        <img v-if="captchaImg" :src="captchaImg" class="login-captcha-img" alt="验证码" title="点击刷新" @click="refreshCaptcha" />
        <span class="login-captcha-hint">算式验证码 · 点击图片刷新</span>
      </div>
      <div class="login-remember">
        <label class="login-remember-label">
          <input v-model="remember" type="checkbox" class="login-remember-check" />
          <span>记住账号密码</span>
        </label>
      </div>
      <button id="login-btn" class="login-btn" :disabled="auth.loggingIn" @click="doLogin">{{ auth.loggingIn ? '登录中…' : '登 录' }}</button>
      <div id="login-tip" class="login-tip">{{ auth.error }}</div>
    </div>
    <div class="login-foot">© 2026 优品生物 · 移动端版 v{{ APP_VERSION }}</div>
  </div>
</template>

<style scoped>
/* 样式与源码 style.css 登录页逐值一致 */
.login-view { position: fixed; inset: 0; background: linear-gradient(160deg, #1E6FFF 0%, #4A9BFF 55%, #EAF2FF 100%); display: flex; flex-direction: column; align-items: center; padding-top: 15vh; overflow-y: auto; }
.login-logo { color: #fff; font-size: var(--font-xl); font-weight: 700; letter-spacing: 2px; }
.login-logo span { background: #fff; color: #1E6FFF; border-radius: 8px; padding: 2px 10px; font-size: var(--font-login-logo); margin-left: 6px; }
.login-sub { color: rgba(255,255,255,.85); font-size: 14px; margin-top: 8px; }
.login-form { width: 84%; max-width: 400px; background: #fff; border-radius: 18px; padding: 26px 20px 22px; margin-top: 32px; box-shadow: var(--shadow-login); }
.login-field { display: flex; align-items: center; border: 1px solid #e8ecf2; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; background: #fafcff; }
.login-field:focus-within { border-color: #1E6FFF; background: #fff; box-shadow: 0 0 0 3px rgba(30,111,255,.10); }
.login-ico { width: 26px; text-align: center; margin-right: 8px; display: flex; align-items: center; justify-content: center; }
.login-field input { flex: 1; border: none; outline: none; font-size: 16px; background: transparent; color: #333; min-width: 0; }
.login-captcha-row { display: flex; align-items: center; gap: 10px; margin: -2px 2px 10px; }
.login-captcha-img { height: 34px; width: auto; flex: 0 0 auto; object-fit: contain; background: #f2f6ff; border: 1px solid #dbe7ff; border-radius: 6px; cursor: pointer; }
.login-captcha-hint { font-size: 12px; color: #999; line-height: 1.4; }
.login-remember { margin: 2px 2px 0; display: flex; align-items: center; }
.login-remember-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; cursor: pointer; user-select: none; }
.login-remember-check { width: 16px; height: 16px; accent-color: #1E6FFF; cursor: pointer; }
.login-btn { width: 100%; margin-top: 20px; padding: 13px 0; border: none; border-radius: 12px; background: linear-gradient(90deg, #1E6FFF, #4A9BFF); color: #fff; font-size: 17px; font-weight: 600; letter-spacing: 4px; }
.login-btn:disabled { opacity: .6; }
.login-tip { color: #e64340; font-size: 13px; margin-top: 12px; text-align: center; min-height: 18px; }
.login-foot { color: rgba(255,255,255,.7); font-size: 12px; margin-top: auto; margin-bottom: 24px; padding-top: 24px; }
@media (min-width: 1024px) and (pointer: fine) {
  .login-view { padding-top: 12vh; }
}
</style>
