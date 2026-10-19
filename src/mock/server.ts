/**
 * Mock 服务 —— 反代未配置 / 不可达时自动启用。
 * 数据来源：对 oa.upingbio.cn 真机只读采集响应，脱敏（姓名/手机号/银行账号打码，
 * pwd/salt 等敏感字段剔除）后生成。绝不静默失败：降级时 UI 显示 banner。
 */
const modules = import.meta.glob('./raw/*.json', { eager: true })

export interface MockResponse {
  code: number
  msg: string
  count?: number
  data: any
}

interface RawRecord {
  path: string
  json: any
}

// 文件名 → 接口路径映射（_ 还原为 /，page/limit 参数忽略）
const RECORDS: RawRecord[] = []
for (const key in modules) {
  const name = key.replace('./raw/', '').replace('.json', '')
  const parts = name.split('_')
  // 去掉尾部的 page/N 与 limit/N 段
  const clean: string[] = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'page' || parts[i] === 'limit') { i++; continue }
    clean.push(parts[i])
  }
  RECORDS.push({ path: '/' + clean.join('/'), json: (modules[key] as any).default || modules[key] })
}

// 精确路径匹配；找不到时用前缀匹配（列表接口）
// 兼容接口名含下划线（如 /home/index/mail_list）——文件名中的 _ 既是分隔符也是名字一部分
function findRecord(path: string): any {
  const base = path.split('?')[0].replace(/\.html$/, '')
  let hit = RECORDS.find(r => r.path === base)
  if (hit) return hit.json
  // 下划线 → 斜杠 的等价路径（/home/index/mail_list == /home/index/mail/list）
  const under2slash = base.replace(/_/g, '/')
  hit = RECORDS.find(r => r.path === under2slash)
  if (hit) return hit.json
  // 前缀匹配：如 /customer/index/sea → /customer/index/index
  hit = RECORDS.find(r => base.startsWith(r.path + '/') || r.path.startsWith(base))
  return hit ? hit.json : null
}

/** 翻页控制：mock 只存了首页样本，page>1 直接返回空（让前端正确 finished，不重复灌同份数据） */
function withPaging(path: string, json: any): any {
  const m = path.match(/[?&]page=(\d+)/)
  if (m && Number(m[1]) > 1 && json && typeof json === 'object') {
    return { ...json, data: [], count: 0, total: 0 }
  }
  return json
}

/** 本地构造的假数据（无真机样本的接口） */
const FABRICATED: Record<string, MockResponse> = {
  '/home/login/login_submit': { code: 0, msg: '登录成功（演示模式）', data: { uid: 34 } },
  '/home/index/edit_personal': { code: 0, msg: '保存成功（演示模式）', data: null },
  '/home/index/edit_password': { code: 0, msg: '修改成功（演示模式）', data: null },
  '/customer/index/to_sea': { code: 0, msg: '已转入公海（演示模式）', data: null },
  '/customer/index/transfer': { code: 0, msg: '转移成功（演示模式）', data: null },
  '/customer/index/add': { code: 0, msg: '新增成功（演示模式）', data: { id: 99001 } },
  '/customer/contact/contact_add': { code: 0, msg: '新增成功（演示模式）', data: null },
  '/customer/contact/contact_del': { code: 0, msg: '删除成功（演示模式）', data: null },
  '/customer/chance/chance_add': { code: 0, msg: '新增成功（演示模式）', data: null },
  '/customer/chance/chance_del': { code: 0, msg: '删除成功（演示模式）', data: null },
  '/customer/api/add_trace': { code: 0, msg: '跟进成功（演示模式）', data: null },
  '/customer/api/del_trace': { code: 0, msg: '删除成功（演示模式）', data: null },
  '/oa/approve/check': { code: 0, msg: '操作成功（演示模式）', data: null },
  '/oa/approve/add': { code: 0, msg: '提交成功（演示模式）', data: { id: 99002 } },
  '/api/index/get_flow_users': { code: 0, msg: 'ok', data: [] },
  '/api/index/get_flow_nodes': { code: 0, msg: 'ok', data: [] },
  '/customer/schoolexhibition/add': { code: 0, msg: '新增成功（演示模式）', data: null },
  '/customer/schoolexhibition/delete': { code: 0, msg: '删除成功（演示模式）', data: null },
  '/customer/aftersalesservice/add': { code: 0, msg: '新增成功（演示模式）', data: null },
  '/customer/aftersalesservice/delete': { code: 0, msg: '删除成功（演示模式）', data: null },
  '/customer/order/delete': { code: 0, msg: '删除成功（演示模式）', data: null },
  '/message/index/send': { code: 0, msg: '发送成功（演示模式）', data: null },
  '/message/index/save': { code: 0, msg: '已保存草稿（演示模式）', data: null },
  '/message/index/check': { code: 0, msg: '操作成功（演示模式）', data: null },
  '/customer/platformorder/custodian_deal': { code: 0, msg: '操作成功（演示模式）', data: null },
  '/api/index/region_citys': { code: 0, msg: 'ok', data: [] },
  '/api/index/region_dists': { code: 0, msg: 'ok', data: [] }
}

export function mockRequest(path: string, method: string): MockResponse | null {
  // 验证码：返回一张本地生成的 PNG（算式 5+3，与真机同款绿色算式风格）
  if (/\/captcha\.html/.test(path)) {
    return { code: 0, msg: 'ok', data: 'captcha' } as any
  }
  const base = path.split('?')[0].replace(/\.html$/, '')
  if (method === 'POST') {
    const f = FABRICATED[base]
    if (f) return f
    return { code: 0, msg: '演示模式：操作已模拟', data: null }
  }
  const rec = findRecord(path)
  if (rec) return withPaging(path, rec)
  const f = FABRICATED[base]
  if (f) return f
  // 未知接口：返回空列表而不是报错（保证页面可浏览）
  return { code: 0, msg: 'ok', count: 0, data: [] }
}

export const mockPaths = RECORDS.map(r => r.path)
