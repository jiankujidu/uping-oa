/** 通用工具 —— 与源码 app.js 同名函数保持一致语义 */

export function esc(s: any): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function plain(s: any): string {
  return String(s == null ? '' : s)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .trim()
}

export function fmtTime(t: any): string {
  if (!t) return ''
  let d: Date
  if (typeof t === 'number' || /^\d+$/.test(String(t))) {
    const n = Number(t)
    d = new Date(n < 10000000000 ? n * 1000 : n)
  } else {
    d = new Date(String(t).replace(/-/g, '/'))
  }
  if (isNaN(d.getTime())) return String(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (sameDay) return hm
  const y = new Date(new Date().setDate(now.getDate() - 1))
  return d.toDateString() === y.toDateString()
    ? '昨天 ' + hm
    : d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function fmtDate(t: any): string {
  if (!t) return ''
  const d = new Date(String(t).replace(/-/g, '/'))
  if (isNaN(d.getTime())) return String(t)
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function fmtMoney(v: any): string {
  const n = Number(v || 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 文件大小 */
export function fmtSize(bytes: any): string {
  const n = Number(bytes || 0)
  if (n < 1024) return n + 'B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB'
  return (n / 1024 / 1024).toFixed(1) + 'MB'
}

/** 状态徽标色（与源码状态映射一致：0待办 1通过 2拒绝 等） */
export function statusClass(s: any): string {
  const n = Number(s)
  if (n === 1) return 'st-ok'
  if (n === 2) return 'st-no'
  return 'st-wait'
}
