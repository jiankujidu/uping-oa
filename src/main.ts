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

// 调试：initial navigation 状态探针
router.isReady().then(() => {
  console.log('[dbg] router ready, path =', JSON.stringify(router.currentRoute.value.path), 'matched =', router.currentRoute.value.matched.length)
}).catch((e) => console.warn('[dbg] router NOT ready:', e))

// 兜底：若 install 的 initial navigation 因判据失败未启动（currentRoute 停在 START），手动补推
setTimeout(() => {
  const r = router.currentRoute.value
  if (r && r.matched.length === 0 && r.path === '/') {
    console.log('[dbg] initial navigation 未启动，手动补推到', router.options.history.location)
    router.push(router.options.history.location).catch((e) => console.warn('[dbg] manual push fail:', e))
  }
}, 400)

// 登录态持久化标记（供路由守卫）
const auth = useAuthStore()
if (localStorage.getItem('upoa:logged')) {
  auth.user = { uid: 0, username: localStorage.getItem('upoa:username') || '', name: localStorage.getItem('upoa:username') || '' }
}

app.mount('#app')

// 调试钩子：排查线上渲染问题时读取路由/设备状态（体积可忽略）
;(window as any).__APP__ = {
  router,
  device,
  auth,
  routes: router.getRoutes().map((r) => ({ path: r.path, name: String(r.name), hasComp: !!r.components })),
  app
}

// 注册 Service Worker（PWA，GitHub Pages HTTPS 下可用）
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
