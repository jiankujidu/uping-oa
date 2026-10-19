/**
 * Service Worker —— GitHub Pages PWA 缓存策略：
 *  - HTML / navigations：network-first（保证发版即时可见）
 *  - 静态资源（assets/ vendor/）：cache-first + 版本化缓存键
 *  - 不缓存反代 API 请求（走网络，失败由应用层降级 mock）
 * 不依赖后台常驻，无推送（GitHub Pages 无服务端）。
 */
const VERSION = 'upoa-v1.0.0'
const STATIC_CACHE = VERSION + '-static'
const RUNTIME_CACHE = VERSION + '-runtime'

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest'
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // 跨域（反代 API）一律走网络，应用层处理降级
  if (url.origin !== location.origin) return

  // navigations：network-first，离线回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone()
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy))
        return r
      }).catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    )
    return
  }

  // 静态资源：cache-first
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit
      return fetch(req).then(r => {
        if (r.ok && (url.pathname.startsWith('/assets') || url.pathname.startsWith('/vendor'))) {
          const copy = r.clone()
          caches.open(STATIC_CACHE).then(c => c.put(req, copy))
        }
        return r
      })
    })
  )
})
