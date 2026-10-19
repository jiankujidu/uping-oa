import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useDeviceStore } from './stores/device'
import { useAuthStore } from './stores/auth'
import { registerBuiltinCommands } from './shared/commands'

import './styles/tokens.css'
import './styles/mobile.css'
import './styles/desktop.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// device 必须先于首渲染
const device = useDeviceStore()
device.bind()

// 命令注册表：业务命令只注册一次，手机端绑定长按/ActionSheet，桌面端绑定右键/快捷键
registerBuiltinCommands()

// 登录态持久化标记（供路由守卫）
const auth = useAuthStore()
if (localStorage.getItem('upoa:logged')) {
  auth.user = { uid: 0, username: localStorage.getItem('upoa:username') || '', name: localStorage.getItem('upoa:username') || '' }
}

app.mount('#app')

// 注册 Service Worker（PWA，GitHub Pages HTTPS 下可用）
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
