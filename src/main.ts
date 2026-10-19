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

// 调试：initial navigation 状态探针（白屏时 F12 看这几行即可定位）
router.isReady().then(() => {
  console.log('[dbg] router ready, path =', JSON.stringify(router.currentRoute.value.path), 'matched =', router.currentRoute.value.matched.length)
}).catch((e) => console.warn('[dbg] router NOT ready:', e))

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

// 不注册 Service Worker：OA 工具要接实时接口，SW 缓存 HTML 会导致发版后
// 刷新仍拿到旧白屏版（已实测卡死白屏）。直接移除 PWA 缓存，保证每次刷新即最新。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((rs) => {
    rs.forEach((r) => r.unregister())
  })
  // 清掉旧版本缓存桶（upoa-v*），避免残留继续拦截请求
  if ('caches' in window) {
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => k.startsWith('upoa-v')).map((k) => caches.delete(k)))
    )
  }
}
