/**
 * 接口清单 —— 从原 APK api.js 逐一翻译（80+）。
 * 命名保持与源码一致，便于对照验收。
 */
import { api } from './client'

export const API = {
  BASE: api.PROXY_BASE || 'https://oa.upingbio.cn',

  /* ---- 账号 ---- */
  login: (username: string, password: string, captcha: string) =>
    api.post('/home/login/login_submit', { username, password, captcha }),
  /** 验证码：反代模式下为接口返回（img dataURL）；mock 模式下本地生成 */
  captchaUrl: (): string => (api.PROXY_BASE ? '/captcha.html?t=' + Date.now() : '/captcha.html?t=' + Date.now()),
  indexInfo: () => api.post('/home/index/index', {}),
  editPersonal: (data: Record<string, any>) => api.post('/home/index/edit_personal', data),
  editPassword: (data: Record<string, any>) => api.post('/home/index/edit_password', data),
  homePageHtml: () => api.getPlain('/home/index/index', {}),

  /* ---- 审批 ---- */
  approveList: (page: number, limit: number, status?: number) =>
    api.get('/oa/approve/index', { page, limit, ...(status ? { status } : {}) }),
  approveCheck: (id: number, status: number, remark?: string) =>
    api.post('/oa/approve/check', { id, status, remark: remark || '' }),
  approveSubmit: (data: Record<string, any>) => api.postPlain('/oa/approve/add', data),
  flowUsers: (flowId: number) => api.get('/api/index/get_flow_users', { id: flowId }),
  flowNodes: (actionId: number) => api.get('/api/index/get_flow_nodes', { id: actionId }),

  /* ---- 客户 ---- */
  customerList: (page: number, limit: number, type: 1 | 2 | 3, keyword?: string, filters?: Record<string, any>) => {
    const path = type === 2 ? '/customer/index/sea' : type === 3 ? '/customer/index/trash' : '/customer/index/index'
    const p: Record<string, any> = { page, limit }
    if (keyword) p.keywords = keyword
    // 电脑端参数名 → 本接口参数名（已实测后端生效）
    const map: Record<string, string> = {
      grade: 'grade_id', source: 'source_id', intent: 'type', status: 'status',
      wechat: 'is_add_wechat', createTime: 'create_time', remarkTime: 'remark_time', orderTime: 'order_time'
    }
    filters = filters || {}
    for (const k in map) {
      const v = filters[k]
      if (v === undefined || v === null || v === '') continue
      p[map[k]] = v
    }
    return api.get(path, p)
  },
  customerAdd: (data: Record<string, any>) => api.post('/customer/index/add', data),
  customerAddDefaults: () => api.getHtml('/customer/index/add.html'),
  customerToSea: (id: number) => api.post('/customer/index/to_sea', { id }),
  customerTransfer: (data: Record<string, any>) => api.post('/customer/index/transfer', data),
  customerView: (id: number) => api.get('/customer/index/view', { id }),
  customerContact: (cid: number) => api.get('/customer/api/get_contact', { customer_id: cid }),
  customerTrace: (cid: number) => api.get('/customer/api/get_trace', { customer_id: cid }),
  customerChance: (cid: number) => api.get('/customer/api/get_chance', { customer_id: cid }),

  /* ---- 联系人 / 商机 / 跟进 ---- */
  contactList: (page: number, limit: number, kw?: string) => api.get('/customer/contact/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  contactAdd: (data: Record<string, any>) => api.post('/customer/contact/contact_add', data),
  contactDel: (id: number) => api.post('/customer/contact/contact_del', { id }),
  chanceList: (page: number, limit: number, kw?: string) => api.get('/customer/chance/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  chanceAdd: (data: Record<string, any>) => api.post('/customer/chance/chance_add', data),
  chanceDel: (id: number) => api.post('/customer/chance/chance_del', { id }),
  traceList: (page: number, limit: number, kw?: string) => api.get('/customer/trace/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  traceAdd: (data: Record<string, any>) => api.post('/customer/api/add_trace', data),
  traceDel: (id: number) => api.post('/customer/api/del_trace', { id }),

  /* ---- 订单 ---- */
  orderList: (page: number, limit: number, kw?: string) => api.get('/customer/order/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  orderHandleList: (page: number, limit: number, kw?: string, extra?: Record<string, any>) => api.get('/customer/order/list', { page, limit, ...(kw ? { keywords: kw } : {}), ...(extra || {}) }),
  orderView: (id: number) => api.get('/customer/order/view', { id }),
  orderViewHtml: (id: number) => api.getHtml('/customer/order/view', { id }),
  orderDelete: (id: number) => api.post('/customer/order/delete', { id }),
  customerCompanyInfo: (customerId: number) => api.post('/customer/api/get_customer_company_info', { customer_id: customerId || 0 }),
  regionCitys: (provinceid: number) => api.post('/api/index/region_citys', { provinceid: provinceid || 0 }),
  regionDists: (cityid: number) => api.post('/api/index/region_dists', { cityid: cityid || 0 }),
  orderProductData: (orderId: number, productIds: string, code: string, originProduct: string) =>
    api.post('/customer/api/get_product_data', { product_ids: productIds, order_id: orderId, code, origin_product: originProduct }),
  orderModifyInfo: (orderId: number, field: string, value: any) => api.post('/customer/api/modify_order_info', { order_id: orderId, [field]: value }),
  orderModifyProduct: (orderId: number, productInfo: string, fileIds: string, productIds: string) =>
    api.post('/customer/api/modify_product_data', { product_info: productInfo, order_id: orderId, file_ids: fileIds, product_ids: productIds }),
  getContractList: (params?: { keywords?: string; page?: number; limit?: number }) =>
    api.get('/contract/api/get_contract', { keywords: params?.keywords || '', page: params?.page || 1, limit: params?.limit || 20 }),
  orderFlowCheck: (id: number, check: number, content: string, checkNode?: number, checkAdminIds?: string) =>
    api.post('/api/index/flow_check', { id, type: 5, check_node: checkNode || 0, check_admin_ids: checkAdminIds || '', check, content: content || '' }),
  orderFlowNodes: (id: number) => api.get('/api/index/get_flow_nodes', { id, type: 5 }),

  /* ---- 平台订单 ---- */
  platformOrderList: (page: number, limit: number, kw?: string) => api.get('/customer/platformorder/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  platformOrderView: (id: number) => api.get('/customer/platformorder/view', { id }),
  platformOrderViewHtml: (id: number) => api.getHtml('/customer/platformorder/view', { id }),
  platformOrderMark: (id: number, isMark: number) => api.post('/customer/platformorder/custodian_deal', { id, is_mark: isMark }),

  /* ---- 财务 ---- */
  financeAdvance: (page: number, limit: number) => api.get('/finance/advancedepositlog/index', { page, limit }),
  financeOrderApply: (page: number, limit: number) => api.get('/finance/orderapply/index', { page, limit }),
  financeIncome: (page: number, limit: number) => api.get('/finance/income/index', { page, limit }),
  deductionList: (page: number, limit: number) => api.get('/finance/deductionlog/index', { page, limit }),
  deductionCheckedList: (page: number, limit: number) => api.get('/finance/deductionlog/checkedlist', { page, limit }),
  marginList: (page: number, limit: number) => api.get('/finance/margindepositlog/index', { page, limit }),
  invoiceList: (page: number, limit: number) => api.get('/finance/invoice/index', { page, limit }),
  invoiceHandleList: (page: number, limit: number) => api.get('/finance/invoice/list', { page, limit }),
  orderApplyHandleList: (page: number, limit: number) => api.get('/finance/orderapply/list', { page, limit }),

  /* ---- 产品 ---- */
  productList: (page: number, limit: number, keyword?: string, filters?: Record<string, any>) => {
    const p: Record<string, any> = { page, limit }
    if (keyword) p.keywords = keyword
    for (const k in (filters || {})) {
      const v = (filters as any)[k]
      if (v === undefined || v === null || v === '') continue
      p[k] = v
    }
    return api.get('/product/index/list', p)
  },
  productCateTree: () => api.getHtml('/product/index/list').then((html: string) => {
    // 从桌面端页面提取内嵌 cateJsonData（与源码算法一致）
    try {
      const start = html.indexOf('encodedJsonString')
      if (start < 0) return []
      const seg = html.slice(start, start + 400000)
      const quote = seg.indexOf("'")
      const end = seg.indexOf("';", quote + 1)
      if (quote < 0 || end < 0) return []
      const enc = seg.slice(quote + 1, end)
      const json = enc.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      return JSON.parse(json) || []
    } catch { return [] }
  }),

  /* ---- 附件 ---- */
  fileList: (page: number, limit: number, keyword?: string) => api.get('/home/files/index', { page, limit, ...(keyword ? { name: keyword } : {}) }),

  /* ---- 消息 ---- */
  messageList: (tab: 'inbox' | 'sendbox' | 'draft' | 'rubbish', page: number, limit: number, kw?: string) =>
    api.get('/message/index/' + tab, { page, limit, ...(kw ? { keywords: kw } : {}) }),
  messageRead: (id: number) => api.getHtml('/message/index/read', { id }).then((html: string) => ({ ok: true, html })),
  messageSend: (data: Record<string, any>) => api.post('/message/index/send', data),
  messageSave: (data: Record<string, any>) => api.post('/message/index/save', data),
  messageCheck: (ids: string, type: number, source?: number) => api.post('/message/index/check', { ids, type, source: source || 0 }),

  /* ---- 通讯录 ---- */
  mailList: (page: number, limit: number, kw?: string) => api.get('/home/index/mail_list', { page, limit, ...(kw ? { keywords: kw } : {}) }),

  /* ---- 客户子业务 ---- */
  sampleList: (page: number, limit: number, kw?: string) => api.get('/customer/sample/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  schoolList: (page: number, limit: number, kw?: string) => api.get('/customer/schoolexhibition/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  schoolHandleList: (page: number, limit: number, kw?: string) => api.get('/customer/schoolexhibition/list', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  schoolAdd: (data: Record<string, any>) => api.post('/customer/schoolexhibition/add', data),
  schoolDelete: (id: number) => api.post('/customer/schoolexhibition/delete', { id }),
  afterList: (page: number, limit: number, kw?: string) => api.get('/customer/aftersalesservice/index', { page, limit, ...(kw ? { keywords: kw } : {}) }),
  afterAdd: (data: Record<string, any>) => api.post('/customer/aftersalesservice/add', data),
  afterDelete: (id: number) => api.post('/customer/aftersalesservice/delete', { id }),

  /* ---- 公告 / 问答 ---- */
  noteList: (page: number, limit: number, cateId?: number) => api.get('/note/index/index', { page, limit, ...(cateId ? { cate_id: cateId } : {}) }),
  articleList: (page: number, limit: number, cateId?: number) => api.get('/article/index/index', { page, limit, ...(cateId ? { cate_id: cateId } : {}) }),

  /* ---- 文件直取（下载/预览用，走反代拼接） ---- */
  fileUrl: (p: string) => (api.PROXY_BASE || '') + p,

  /** 反代理地址（空 = 未配置，自动走 mock） */
  PROXY_BASE: api.PROXY_BASE
}

export default API
