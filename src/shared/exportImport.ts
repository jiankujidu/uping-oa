/** JSON/CSV 导入导出（双端共用，任务书 §8 数据质量要求） */
import { toast } from './toast'
import { safeJsonParse } from '@/utils/sanitize'
import { confirm } from './confirm'

export function exportJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename.endsWith('.json') ? filename : filename + '.json')
  toast('已导出 JSON')
}

export function exportCsv(rows: any[], filename: string, columns?: { key: string; label: string }[]) {
  const cols = columns || inferColumns(rows)
  const head = cols.map(c => csvCell(c.label)).join(',')
  const body = rows.map(r => cols.map(c => csvCell(r[c.key])).join(',')).join('\r\n')
  const blob = new Blob(['\ufeff' + head + '\r\n' + body], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, filename.endsWith('.csv') ? filename : filename + '.csv')
  toast('已导出 CSV（' + rows.length + ' 条）')
}

export async function importJson<T = any>(file: File): Promise<T | null> {
  try {
    const raw = await file.text()
    const data = safeJsonParse(raw)
    const n = Array.isArray(data) ? data.length : Object.keys(data).length
    toast('导入成功：' + n + ' 项')
    return data as T
  } catch (e: any) {
    toast('导入失败：' + (e?.message || '格式错误'))
    return null
  }
}

export async function importCsv(file: File): Promise<any[] | null> {
  try {
    const raw = (await file.text()).replace(/^\ufeff/, '')
    const lines = raw.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) { toast('CSV 无数据行'); return null }
    const header = parseCsvLine(lines[0])
    const rows = lines.slice(1).map(l => {
      const cells = parseCsvLine(l)
      const o: any = {}
      header.forEach((h, i) => { o[h] = cells[i] ?? '' })
      return o
    })
    toast('导入成功：' + rows.length + ' 行')
    return rows
  } catch (e: any) {
    toast('导入失败：' + (e?.message || '格式错误'))
    return null
  }
}

export async function confirmOverwrite(name: string): Promise<boolean> {
  return confirm({ title: '导入确认', message: '导入「' + name + '」将覆盖当前本地数据，确定继续？', okText: '覆盖导入', danger: true })
}

/* ---------------- 内部 ---------------- */
function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
}

function csvCell(v: any): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQ = false
      else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

function inferColumns(rows: any[]): { key: string; label: string }[] {
  if (!rows.length) return []
  const keys = Object.keys(rows[0])
  return keys.map(k => ({ key: k, label: k }))
}
