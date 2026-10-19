/* 最小复现：加载线上真实 bundle，从 #/home 进，等 3s 看路由/渲染真实状态。
 * 用 file:// 加载本地 dist（与线上同版本），不 mock 任何路由行为。
 */
const path = require('path')
const fs = require('fs')
const os = require('os')
const { pathToFileURL } = require('url')
const { JSDOM, VirtualConsole } = require('jsdom')

const dist = path.resolve(__dirname, '../dist')
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

// 把 index.html 里 ./xxx 相对路径换成 file:// 绝对路径
const abs = (p) => pathToFileURL(path.join(dist, p.replace(/^\.\//, ''))).href
const htmlPatched = html
  .replace(/\.\/vendor\//g, abs('') && 'file://' + dist.replace(/\\/g, '/') + '/vendor/')
  .replace(/\.\/assets\//g, 'file://' + dist.replace(/\\/g, '/') + '/assets/')
  .replace('href="./manifest.webmanifest"', '')

const vc = new VirtualConsole()
const logs = []
vc.on('log', (...a) => logs.push('LOG ' + a.map(String).join(' ')))
vc.on('warn', (...a) => logs.push('WARN ' + a.map(String).join(' ')))
vc.on('error', (...a) => logs.push('ERR ' + a.map(String).join(' ')))

const dom = new JSDOM(htmlPatched, {
  url: 'file://' + dist + '/index.html#/home', // 关键：入口带 #/home
  runScripts: 'outside-only',
  virtualConsole: vc,
  pretendToBeVisual: true
})
const w = dom.window
// canvas / fetch stubs
w.HTMLCanvasElement.prototype.getContext = () => ({
  fillRect(){}, clearRect(){}, getImageData:(x,y,sd)=>({data:new Uint8ClampedArray(sd*sd*4)}),
  putImageData(){}, createImageData:(a,b)=>({data:new Uint8ClampedArray(a*b*4)}),
  beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, fill(){}, stroke(){},
  arc(){}, rect(){}, fillText(){}, measureText:()=>({width:0}),
  save(){}, restore(){}, scale(){}, translate(){}, rotate(){}, drawImage(){}, setTransform(){}, bezierCurveTo(){}, quadraticCurveTo(){}, toDataURL:()=>'data:image/png;base64,'
})
w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,'
w.fetch = () => Promise.resolve(new w.Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))
w.requestAnimationFrame = (cb) => setTimeout(cb, 16)
if (!w.Response) w.Response = Response

setTimeout(() => {
  const app = w.document.getElementById('app')
  const dbg = w.__APP__
  console.log('=== 3s 后真实状态（#/home 入口）===')
  console.log('#app 有内容?', !!(app && app.innerHTML.trim()), '长度', app ? app.innerHTML.length : 0)
  console.log('#app 前 300:', app ? app.innerHTML.slice(0, 300).replace(/\n/g, '') : '(null)')
  if (dbg && dbg.router) {
    const cr = dbg.router.currentRoute.value
    console.log('currentRoute.path =', JSON.stringify(cr.path), 'matched =', JSON.stringify(cr.matched.map(m => m.path)))
    console.log('history.location =', JSON.stringify(dbg.router.options.history.location))
    console.log('has SW?', 'serviceWorker' in w.navigator)
  } else {
    console.log('__APP__ 未挂出 → bundle 没跑到 mount 后')
  }
  // 打印含 [dbg] 的日志
  console.log('=== [dbg] 日志 ===')
  logs.filter(l => l.includes('[dbg]') || l.includes('router')).slice(0, 20).forEach(l => console.log(l))
}, 3000)
