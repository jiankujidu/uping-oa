/**
 * API 客户端 —— 全站唯一网络出口。
 *
 * 三条链路（优先级从高到低）：
 *  1. 反代（VITE_PROXY_BASE，Cloudflare Worker / Nginx）：注入 Referer + CORS
 *  2. mock 服务：反代未配置或连续失败时自动降级，顶栏出 banner（绝不静默失败）
 *  3. （直连已禁用：OA 的 WAF 对外部 Origin 一律 403，见 PLAN.md §10）
 */

export interface ApiResult {
  code: number
  msg: string
  count?: number
  data?: any
  [k: string]: any
}

/**
 * 反代地址解析优先级：
 *  1. localStorage 'upoa:proxy_base'（运行时可改，部署后切换代理不必重新构建）
 *  2. 构建期 VITE_PROXY_BASE
 *  3. 同源默认：挂自有域名（Workers Assets + /proxy）时走相对路径 /proxy
 *     —— 页面与接口同源，浏览器不做跨域判定，Cookie 即一方 Cookie
 *  4. GitHub Pages（*.github.io）无 /proxy，返回空 → 自动降级 mock
 * 例：浏览器控制台 localStorage.setItem('upoa:proxy_base','https://oa.example.com')
 */
const PROXY_BASE: string = (() => {
  const norm = (s: string) => s.replace(/\/+$/, '')
  const bv = norm((import.meta as any).env?.VITE_PROXY_BASE || '')
  let rt = ''
  try {
    rt = norm(localStorage.getItem('upoa:proxy_base') || '')
  } catch {}
  if (rt) return rt
  if (bv) return bv
  if (typeof location === 'undefined') return ''
  const host = location.hostname || ''
  // GH Pages 静态托管没有反代，交给 mock
  if (host.endsWith('.github.io')) return ''
  // 自有域名 / 本地：默认同源网关
  return '/proxy'
})()
const TIMEOUT = 12000
const RETRY = 1
const CACHE_TTL = 8000

/* ---------------- 反代健康状态（驱动顶栏 banner） ---------------- */
type ProxyState = 'unknown' | 'up' | 'down'
let proxyState: ProxyState = PROXY_BASE ? 'unknown' : 'down'
const listeners = new Set<(s: ProxyState) => void>()

export function getProxyState(): ProxyState { return proxyState }
export function onProxyState(fn: (s: ProxyState) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function setProxyState(s: ProxyState) {
  if (proxyState === s) return
  proxyState = s
  listeners.forEach(f => { try { fn0(f, s) } catch {} })
}
function fn0(f: (s: ProxyState) => void, s: ProxyState) { f(s) }

/* ---------------- 会话失效守卫 ---------------- */
const SESSION_RE = /请先登录|请登录|登录已失效|会话已过期/
const sessionListeners = new Set<() => void>()
export function onSessionExpired(fn: () => void): () => void {
  sessionListeners.add(fn)
  return () => sessionListeners.delete(fn)
}
function fireSessionExpired() {
  sessionListeners.forEach(f => { try { f() } catch {} })
}

/* ---------------- 内存缓存（GET，8s） ---------------- */
const cache = new Map<string, { t: number; v: ApiResult }>()
function cacheGet(k: string): ApiResult | null {
  const hit = cache.get(k)
  return hit && Date.now() - hit.t < CACHE_TTL ? hit.v : null
}
export function cacheClear() { cache.clear() }

/* ---------------- fetch 超时 + 重试 ---------------- */
async function fetchTimeout(url: string, opts: RequestInit, ms = TIMEOUT): Promise<Response> {
  if (typeof AbortController === 'undefined') return fetch(url, opts)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------- 请求核心 ---------------- */
interface ReqOpts {
  method?: 'GET' | 'POST'
  params?: Record<string, any>
  body?: Record<string, any> | string
  plain?: boolean        // 不带 X-Requested-With（OA 部分接口要求，对应 api.js apiPostPlain/apiGetPlain）
  html?: boolean         // 期望返回 HTML 文本
  noCache?: boolean
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return ''
  const parts: string[] = []
  for (const k in params) {
    const v = params[k]
    if (v === undefined || v === null || v === '') continue
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v))
  }
  return parts.length ? '?' + parts.join('&') : ''
}

function buildBody(data: ReqOpts['body']): { str: string; form: URLSearchParams | null } {
  if (typeof data === 'string') return { str: data, form: null }
  const form = new URLSearchParams()
  if (data) {
    for (const k in data) {
      const v = (data as any)[k]
      if (v === undefined || v === null || v === '') continue
      if (Array.isArray(v)) {
        v.forEach(x => { if (x !== undefined && x !== null && x !== '') form.append(k, String(x)) })
      } else form.append(k, String(v))
    }
  }
  return { str: form.toString(), form }
}

async function proxyRequest(path: string, opts: ReqOpts): Promise<Response> {
  const { method = 'GET', params, body, plain } = opts
  const { str, form } = buildBody(body)
  const headers: Record<string, string> = {}
  if (method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded'
  if (!plain) headers['X-Requested-With'] = 'XMLHttpRequest'
  const url = PROXY_BASE + path + buildQuery(params)
  return fetchTimeout(url, {
    method,
    headers,
    credentials: 'include',
    body: method === 'POST' ? str : undefined
  })
}

export async function request(path: string, opts: ReqOpts = {}): Promise<any> {
  const { method = 'GET', noCache = false, html = false } = opts
  const ck = method + ' ' + path + ' ' + JSON.stringify(opts.params || {}) + ' ' + JSON.stringify(opts.body || {})
  if (method === 'GET' && !noCache) {
    const hit = cacheGet(ck)
    if (hit) return hit
  }

  let result: any = null
  let lastErr: any = null

  if (PROXY_BASE && proxyState !== 'down') {
    for (let attempt = 0; attempt <= RETRY; attempt++) {
      try {
        const r = await proxyRequest(path, opts)
        if (!r.ok && r.status !== 0) throw new Error('HTTP ' + r.status)
        result = html ? await r.text() : await r.json()
        setProxyState('up')
        break
      } catch (e) {
        lastErr = e
        // 原样重试一次后降级
      }
    }
    if (result === null) {
      // 反代连续失败 → 降级 mock
      setProxyState('down')
    }
  }

  if (result === null) {
    const { mockRequest } = await import('../mock/server')
    const m = mockRequest(path, method)
    if (m) {
      if (html) { result = '' } else { result = m }
      setProxyState('down')
    }
  }

  if (result === null) throw lastErr || new Error('请求失败')

  // 会话失效守卫（登录过期自动回登录页）
  if (result && typeof result === 'object' && result.code === 404 && SESSION_RE.test(String(result.msg || ''))) {
    fireSessionExpired()
  }
  if (typeof result === 'string' && SESSION_RE.test(result)) {
    fireSessionExpired()
    return { code: 404, msg: result, data: null }
  }

  if (method === 'GET' && result && typeof result === 'object') cache.set(ck, { t: Date.now(), v: result })
  if (method === 'POST') cacheClear()
  return result
}

/* ---------------- 便捷方法 ---------------- */
export const api = {
  get: (path: string, params?: Record<string, any>) => request(path, { method: 'GET', params }),
  post: (path: string, body?: Record<string, any> | string) => request(path, { method: 'POST', body }),
  getPlain: (path: string, params?: Record<string, any>) => request(path, { method: 'GET', params, plain: true, html: true }),
  postPlain: (path: string, body?: Record<string, any> | string) => request(path, { method: 'POST', body, plain: true }),
  getHtml: (path: string, params?: Record<string, any>) => request(path, { method: 'GET', params, plain: true, html: true }),
  /** 手动把反代标记为不可用（设置页「测试连接」用） */
  markProxyDown: () => setProxyState('down'),
  markProxyUp: () => setProxyState('up'),
  PROXY_BASE
}
