// 无头运行线上 bundle 的冒烟测试 v2
const { JSDOM, VirtualConsole } = require('jsdom')
const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, '..', 'dist')
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8')
const mainJs = html.match(/src="\.\/(assets\/index-[\w-]+\.js)"/)[1]

const errors = []
const vw = new VirtualConsole()
vw.on('jsdomError', (e) => errors.push('[jsdomError] ' + ((e.detail && e.detail.stack) || e.message)))
vw.on('error', (...a) => errors.push('[console.error] ' + a.map(String).join(' ')))
vw.on('warn', (...a) => errors.push('[console.warn] ' + a.map(String).join(' ')))
vw.on('log', (...a) => { const m = a.map(String).join(' '); if (m.length < 500) errors.push('[console.log] ' + m) })
vw.on('warn', (...a) => errors.push('[console.warn] ' + a.map(String).join(' ')))
vw.on('log', (...a) => { const m = a.map(String).join(' '); if (m.length < 500) errors.push('[console.log] ' + m) })

const dom = new JSDOM(html, {
  url: 'https://jiankujidu.github.io/uping-oa/#/home',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vw
})
const { window } = dom

window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent() { return false } })
window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = function () {}
window.HTMLCanvasElement.prototype.getContext = function () {
  // jsdom 无 canvas：返回最小 2d context stub（仅让 drawImage/fillText 等调用不炸）
  return { fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 1, globalAlpha: 1,
    fillRect() {}, strokeRect() {}, clearRect() {}, fillText() {}, strokeText() {}, drawImage() {}, beginPath() {},
    closePath() {}, moveTo() {}, lineTo() {}, fill() {}, stroke() {}, arc() {}, rect() {}, save() {}, restore() {},
    translate() {}, scale() {}, rotate() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }),
    putImageData() {}, getImageData: () => ({ data: new Uint8ClampedArray(4) }), bezierCurveTo() {}, quadraticCurveTo() {}, createPattern: () => ({}), setTransform() {}, transform() {}, createRadialGradient: () => ({ addColorStop() {} }), clip() {}, ellipse() {}, isPointInPath: () => false, canvas: {} }
}
window.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,' }
window.URL.createObjectURL = () => 'blob:mock'
if (!window.localStorage) {
  const store = {}
  window.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] }, clear: () => { for (const k in store) delete store[k] } }
}

// 把 jsdom window 注入 node 全局（data-URL import 在 node 全局上下文执行）
const g = globalThis
g.window = window
g.document = window.document
g.self = window
g.top = window
g.parent = window
g.frames = window
try { g.navigator = window.navigator } catch {}
g.location = window.location
g.history = window.history
g.localStorage = window.localStorage
g.sessionStorage = window.sessionStorage
g.matchMedia = window.matchMedia
g.getComputedStyle = window.getComputedStyle.bind(window)
g.requestAnimationFrame = (cb) => window.setTimeout(() => cb(Date.now()), 16)
g.cancelAnimationFrame = window.clearTimeout.bind(window)
g.scrollTo = () => {}
g.alert = () => {}
g.confirm = () => false
g.prompt = () => null
for (const k of ['HTMLElement', 'HTMLCanvasElement', 'SVGElement', 'Element', 'Node', 'DocumentFragment', 'MutationObserver', 'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent', 'DOMParser', 'XMLSerializer', 'Image', 'Text', 'CSS', 'FormData', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'Headers', 'Request', 'Response', 'AbortController', 'IntersectionObserver', 'ResizeObserver']) {
  if (window[k]) { try { g[k] = window[k] } catch {} }
}

;(async () => {
  const vend = html.match(/src="\.\/(vendor\/[\w.-]+\.js)"/g) || []
  for (const m of vend) {
    const f = path.join(DIST, m.match(/"(\.\/.+\.js)"/)[1])
    try { window.eval(fs.readFileSync(f, 'utf-8')) }
    catch (e) { errors.push('[vendor eval fail] ' + m + ' :: ' + e.message) }
  }

  // jsdom 不支持 modulepreload → vite polyfill 会走 node fetch(file:// 不支持)。打桩避免假阳性崩溃。
  const fetchStub = async () => new (globalThis.Response)('', { status: 200, headers: { 'content-type': 'text/javascript' } })
  g.fetch = fetchStub
  try { window.fetch = fetchStub } catch {}
  process.on('unhandledRejection', (e) => { errors.push('[unhandledRejection] ' + ((e && e.stack) || e)) })

  try {
    await import(require('url').pathToFileURL(path.join(DIST, mainJs)).href)
  } catch (e) {
    errors.push('[main import fail] ' + ((e && e.stack) || e))
  }

  await new Promise((r) => setTimeout(r, 3000))

  const app = window.document.getElementById('app')
  const kids = app ? app.children.length : 0
  const text = (app && app.textContent || '').trim()
  console.log('--- 路由调试 ---')
  const dbg = window.__APP__
  console.log('window.location.href:', window.location && window.location.href)
  console.log('g.location.href:', g.location && g.location.href)
  console.log('g.window.location.href:', g.window && g.window.location && g.window.location.href)
  if (dbg) {
    const h = dbg.router.options && dbg.router.options.history
    console.log('history.location:', JSON.stringify(h && h.location))
    console.log('isReady:', dbg.router.isReady ? 'fn-exists' : 'n/a')
    console.log('currentRoute:', JSON.stringify(dbg.router.currentRoute.value, (k, v) => (k === 'matched' ? v.map((m) => m.path) : v), 1))
    console.log('device.kind:', dbg.device.kind, '| width:', dbg.device.width)
    console.log('auth.user:', JSON.stringify(dbg.auth.user))
    console.log('routes:', JSON.stringify(dbg.routes.filter((r) => r.name !== 'undefined').map((r) => r.name + '@' + r.path)))
  } else { console.log('(无 __APP__ 钩子)') }
  console.log('--- 渲染结果 ---')
  console.log('#app 子元素:', kids, '| 文本长度:', text.length)
  console.log('#app HTML 前 500:')
  console.log((app ? app.innerHTML : '(no #app)').slice(0, 500))
  console.log('--- 错误（前 8 条） ---')
  if (!errors.length) console.log('(无错误)')
  errors.slice(0, 8).forEach((e, i) => console.log('[' + (i + 1) + '] ' + String(e).slice(0, 900) + '\n'))
  process.exit(0)
})()
