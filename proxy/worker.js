/**
 * 优品 OA —— 同源网关 Worker（静态站点 + API 反代，单域名）
 *
 * 部署形态：
 *   自定义域名 myoa.jk93.qzz.io
 *     ├─ /                → 静态资源（dist/，Workers Assets 绑定 ASSETS）
 *     ├─ /assets/*        → 静态资源
 *     ├─ /proxy/*         → 反代到 https://oa.upingbio.cn/*（去掉 /proxy 前缀）
 *     └─ /healthz         → 健康检查
 *
 * 为什么这样做：
 *   1) workers.dev 在大陆被 DNS 污染 + SNI 阻断，必须挂自有域名；
 *   2) 页面与接口同源后，浏览器不再做跨域判定，CORS 与 SameSite 全部消失；
 *   3) 上游 Set-Cookie 带 Domain=oa.upingbio.cn，浏览器在 myoa 域下会拒收，
 *      所以必须剥掉 Domain，改写为 host-only 的一方 Cookie。
 *
 * 安全：
 *   - Origin 白名单（同域 + GitHub Pages 预览 + 本地 dev），不做公开代理
 *   - 上游 Referer 强制改写（绕 WAF 防盗链），外部 Origin 一律剥离
 */
const UPSTREAM = 'https://oa.upingbio.cn'
const PREFIX = '/proxy'
const ALLOWED_ORIGINS = [
  'https://myoa.jk93.qzz.io',
  'https://jiankujidu.github.io',
  'https://yejing.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra }
  })
}

/** 把上游 Set-Cookie 改写成当前域可用的一方 Cookie */
function rewriteCookie(c) {
  let s = String(c)
  // 剥掉 Domain（否则浏览器直接丢弃）
  s = s.replace(/;\s*domain=[^;]*/gi, '')
  // 同源场景 Lax 即可，None 反而在部分浏览器要求 Secure 且更严格
  if (/;\s*samesite/i.test(s)) s = s.replace(/;\s*samesite=[^;]*/gi, '; SameSite=Lax')
  else s += '; SameSite=Lax'
  if (!/;\s*secure/i.test(s)) s += '; Secure'
  if (!/;\s*path=/i.test(s)) s += '; Path=/'
  return s
}

async function handleProxy(request, url, env) {
  const origin = request.headers.get('Origin')
  let allow = ''
  if (origin) {
    if (!ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o + '/'))) {
      return json({ code: 403, msg: 'Origin 不在白名单' }, 403)
    }
    allow = origin
  }

  // /proxy/oa/approve/index → https://oa.upingbio.cn/oa/approve/index
  const rest = url.pathname.slice(PREFIX.length) || '/'
  const target = UPSTREAM + rest + url.search

  const headers = new Headers()
  for (const [k, v] of request.headers) {
    const lk = k.toLowerCase()
    if (['host', 'origin', 'referer', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-proto', 'x-real-ip', 'accept-encoding', 'connection'].includes(lk)) continue
    headers.set(k, v)
  }
  headers.set('Referer', UPSTREAM + '/')   // 过 WAF 防盗链
  headers.set('User-Agent', UA)
  headers.set('Accept-Encoding', 'identity')

  const init = { method: request.method, headers, redirect: 'manual' }
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer()

  let upstream
  try {
    upstream = await fetch(target, init)
  } catch (e) {
    return json({ code: 502, msg: '上游连接失败', detail: String(e && e.message || e) }, 502,
      allow ? { 'access-control-allow-origin': allow, 'access-control-allow-credentials': 'true' } : {})
  }

  const out = new Headers()
  for (const [k, v] of upstream.headers) {
    const lk = k.toLowerCase()
    if (['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie', 'content-security-policy', 'content-security-policy-report-only'].includes(lk)) continue
    out.set(k, v)
  }

  // Set-Cookie 逐条改写（优先用 getSetCookie，避免 Expires 里的逗号被切坏）
  let cookies = []
  if (typeof upstream.headers.getSetCookie === 'function') cookies = upstream.headers.getSetCookie()
  else if (upstream.headers.get('set-cookie')) cookies = [upstream.headers.get('set-cookie')]
  const fixed = cookies.map(rewriteCookie)

  // 上游 302 → 保持在本域 /proxy 命名空间内
  const loc = upstream.headers.get('location')
  if (loc) {
    if (loc.startsWith(UPSTREAM)) out.set('location', url.origin + PREFIX + loc.slice(UPSTREAM.length))
    else out.set('location', loc)
  }

  if (allow) {
    out.set('access-control-allow-origin', allow)
    out.set('access-control-allow-credentials', 'true')
    out.set('access-control-allow-methods', 'GET,POST,OPTIONS')
    out.set('access-control-allow-headers', 'Content-Type,X-Requested-With,Authorization')
    out.set('access-control-expose-headers', 'Content-Disposition')
  }

  if (request.method === 'OPTIONS') {
    const pre = new Headers(out)
    pre.delete('content-type')
    return new Response(null, { status: 204, headers: pre })
  }

  const res = new Response(upstream.body, { status: upstream.status, headers: out })
  for (const c of fixed) res.headers.append('set-cookie', c)
  return res
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/healthz') {
      return json({ ok: true, upstream: UPSTREAM, prefix: PREFIX, edge: request.cf?.colo || null, ts: Date.now() })
    }

    if (url.pathname === PREFIX || url.pathname.startsWith(PREFIX + '/')) {
      return handleProxy(request, url, env)
    }

    // 静态资源（Workers Assets）
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return json({ ok: false, msg: '未绑定静态资源（ASSETS）', path: url.pathname }, 404)
  }
}
