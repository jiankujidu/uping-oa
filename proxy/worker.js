/**
 * Cloudflare Worker 反代（方案 A）—— 30 行，解决 OA 的 WAF 防盗链 + CORS。
 *
 * 部署方式（Dashboard，免费套餐）：
 *   Workers & Pages → Create → Start from Hello World → Edit code → 粘贴本文件 → Deploy
 *   触发器地址形如 https://<你的worker名>.<子域>.workers.dev
 * 然后把该地址配到站点：.env.production → VITE_PROXY_BASE=https://<worker地址>
 *
 * 安全说明：
 *  - 只转发你自己的站点 Origin；不开放公共代理（避免被白嫖刷量）
 *  - Cookie 存在用户浏览器本 Worker 域下，不经任何第三方
 *  - 上游 Set-Cookie 改写为 SameSite=None; Secure，否则跨域 credentials:'include' 不生效
 */
const UPSTREAM = 'https://oa.upingbio.cn'
// 白名单来源：GitHub Pages（用户名/repo 未定，主域放行）+ 本地 dev/preview
const ALLOWED_ORIGINS = [
  'https://yejing.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
]

export default {
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/healthz') return new Response('ok')

    // 出厂限制：只允许白名单来源（浏览器会带 Origin 头）
    const origin = req.headers.get('Origin')
    let allow = ALLOWED_ORIGINS[0]
    if (origin) {
      if (!ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + '/'))) {
        return new Response(JSON.stringify({ code: 403, msg: 'Origin 不在白名单' }), {
          status: 403, headers: { 'content-type': 'application/json' }
        })
      }
      allow = origin
    }

    url.protocol = 'https:'
    url.host = UPSTREAM.replace(/^https?:\/\//, '')

    const headers = new Headers(req.headers)
    headers.set('Referer', UPSTREAM + '/')     // 过 WAF 防盗链
    headers.delete('Origin')                   // 剥离外部 Origin（WAF 关键）
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    let upstream
    try {
      upstream = await fetch(new Request(url, { method: req.method, headers, body: req.body, redirect: 'manual' }))
    } catch (e) {
      return new Response(JSON.stringify({ code: 502, msg: '上游连接失败' }), {
        status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': allow }
      })
    }

    const out = new Headers(upstream.headers)
    // 改写 Set-Cookie：加 SameSite=None; Secure（跨域 fetch 携带会话必需）
    const sc = upstream.headers.get('set-cookie')
    if (sc) {
      const fixed = sc.split(/,(?=[^;]*?=)/).map(c => {
        if (/samesite/i.test(c)) c = c.replace(/samesite=[^;]*/i, 'SameSite=None')
        else c += '; SameSite=None'
        if (!/secure/i.test(c)) c += '; Secure'
        return c
      }).join(', ')
      out.set('set-cookie', fixed)
    }
    // Location 重写回代理域（上游 302 跳登录页等）
    const loc = upstream.headers.get('location')
    if (loc) out.set('location', loc.replace(UPSTREAM, url.origin))
    // CORS
    out.set('Access-Control-Allow-Origin', allow)
    out.set('Access-Control-Allow-Credentials', 'true')
    out.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    out.set('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With,Authorization')
    out.set('Access-Control-Expose-Headers', 'Content-Disposition,Set-Cookie')
    out.delete('content-encoding')
    out.delete('content-length')

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: out })
    return new Response(upstream.body, { status: upstream.status, headers: out })
  }
}
