/**
 * 富文本净化 —— 消息正文/公告/产品详情等服务端 HTML 渲染前必须过这里。
 * 原 APK 直接 innerHTML（XSS 面），这里用 DOMPurify 白名单。
 */
import DOMPurify from 'dompurify'

const ALLOWED = ['p','br','div','span','a','img','table','thead','tbody','tr','th','td','ul','ol','li',
  'h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s','strike','hr','blockquote','pre','code','font','sub','sup']

const ALLOWED_ATTR = ['href','src','alt','title','style','class','width','height','color','face','size','target','rel','colspan','rowspan','align','valign','border','cellpadding','cellspacing']

export function sanitize(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ALLOWED,
    ALLOWED_ATTR: ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script','style','iframe','form','input','object','embed'],
    FORBID_ATTR: ['onerror','onload','onclick','onmouseover']
  }) as string
}

/** 导入 JSON 的安全解析：拒绝超大/非对象 */
export function safeJsonParse(raw: string, maxBytes = 8 * 1024 * 1024): any {
  if (!raw || raw.length > maxBytes) throw new Error('文件内容异常或过大')
  const v = JSON.parse(raw)
  if (v === null || typeof v !== 'object') throw new Error('JSON 顶层必须是对象')
  return v
}
