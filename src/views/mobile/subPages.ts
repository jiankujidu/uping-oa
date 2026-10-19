/**
 * 35 个子页配置表 —— 对应原 APK MOBILE_TITLES + showSubPage(type) 的全部分支。
 * 每项：标题 / 取数 / 列（按原列表项字段还原）/ 搜索 / 点击去向。
 */
import { API } from '@/api/endpoints'
import { api } from '@/api/client'
import { fmtTime, fmtDate, fmtMoney, plain, esc } from '@/utils/format'

export interface SubPageCfg {
  title: string
  api: (page: number, limit: number, kw?: string) => Promise<any>
  titleField?: string
  statusField?: string
  cols: { label: string; key: string; fmt?: (v: any, row: any) => string }[]
  kw?: boolean
  /** 点击卡片去向 */
  detail?: (row: any) => string
  /** 特殊渲染（客户子业务等） */
  raw?: (row: any) => string
}

const C = (f?: (v: any, row: any) => string) => f

export const SUB_PAGES: Record<string, SubPageCfg> = {
  /* ---- 信息 ---- */
  note: {
    title: '企业公告',
    api: (p, l, kw) => api.get('/note/index/index', { page: p, limit: l, ...(kw ? { keywords: kw } : {}) }),
    titleField: 'title', cols: [
      { label: '分类', key: 'cate_name' }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/note/' + r.id
  },
  article: {
    title: '问答知识',
    api: (p, l, kw) => API.articleList(p, l, undefined),
    titleField: 'title', cols: [
      { label: '分类', key: 'cate_name' }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    detail: (r) => '/detail/article/' + r.id
  },

  /* ---- 产品 / 附件 ---- */
  product: {
    title: '产品管理',
    api: (p, l, kw) => API.productList(p, l, kw),
    titleField: 'title', cols: [
      { label: '货号', key: 'goods_no', fmt: (v) => plain(v).slice(0, 40) },
      { label: '简介', key: 'price_desc', fmt: (v) => plain(v).slice(0, 50) }
    ],
    kw: true, detail: (r) => '/detail/product/' + r.id
  },
  files: {
    title: '附件管理',
    api: (p, l, kw) => API.fileList(p, l, kw),
    titleField: 'name', cols: [
      { label: '大小', key: 'filesize', fmt: (v) => (v ? (Number(v) / 1024).toFixed(0) + 'KB' : '-') },
      { label: '上传', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/file/' + r.id
  },

  /* ---- 财务（我申请的） ---- */
  'finance-order': {
    title: '到账（订单）',
    api: (p, l) => API.financeOrderApply(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  'finance-advance': {
    title: '预存款',
    api: (p, l) => API.financeAdvance(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '类型', key: 'type_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  'finance-income': {
    title: '到账（发票）',
    api: (p, l) => API.financeIncome(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  deduction: {
    title: '抵扣券（我申请的）',
    api: (p, l) => API.deductionList(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  'deduction-checked': {
    title: '抵扣券（管理专用）',
    api: (p, l) => API.deductionCheckedList(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  margin: {
    title: '保证金',
    api: (p, l) => API.marginList(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  'invoice-my': {
    title: '发票（我申请的）',
    api: (p, l) => API.invoiceList(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  'invoice-handle': {
    title: '发票（我处理的）',
    api: (p, l) => API.invoiceHandleList(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },
  'orderapply-handle': {
    title: '到账（订单·我处理的）',
    api: (p, l) => API.orderApplyHandleList(p, l),
    titleField: 'code', cols: [
      { label: '金额', key: 'amount', fmt: fmtMoney }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ]
  },

  /* ---- 消息（4 列表共用本表，路由带 tab） ---- */
  'message-inbox': {
    title: '收件箱',
    api: (p, l, kw) => API.messageList('inbox', p, l, kw),
    titleField: 'title', cols: [
      { label: '发件人', key: 'send_name' }, { label: '时间', key: 'create_time', fmt: fmtTime }
    ],
    kw: true, detail: (r) => '/detail/message-inbox/' + r.id
  },
  'message-sendbox': {
    title: '发件箱',
    api: (p, l, kw) => API.messageList('sendbox', p, l, kw),
    titleField: 'title', cols: [
      { label: '收件人', key: 'receive_name' }, { label: '时间', key: 'create_time', fmt: fmtTime }
    ],
    detail: (r) => '/detail/message-sendbox/' + r.id
  },
  'message-draft': {
    title: '草稿箱',
    api: (p, l, kw) => API.messageList('draft', p, l, kw),
    titleField: 'title', cols: [{ label: '时间', key: 'create_time', fmt: fmtTime }],
    detail: (r) => '/detail/message-draft/' + r.id
  },
  'message-rubbish': {
    title: '回收站',
    api: (p, l, kw) => API.messageList('rubbish', p, l, kw),
    titleField: 'title', cols: [{ label: '时间', key: 'create_time', fmt: fmtTime }],
    detail: (r) => '/detail/message-rubbish/' + r.id
  },

  /* ---- 通讯录 ---- */
  mail: {
    title: '通讯录',
    api: (p, l, kw) => API.mailList(p, l, kw),
    titleField: 'name', cols: [
      { label: '账号', key: 'username' }, { label: '手机', key: 'mobile' }
    ],
    kw: true
  },

  /* ---- 客户子业务 ---- */
  'contact-list': {
    title: '客户联系人',
    api: (p, l, kw) => API.contactList(p, l, kw),
    titleField: 'name', cols: [
      { label: '客户', key: 'customer_name' }, { label: '手机', key: 'mobile' },
      { label: '职务', key: 'position' }
    ],
    kw: true
  },
  'chance-list': {
    title: '销售机会',
    api: (p, l, kw) => API.chanceList(p, l, kw),
    titleField: 'title', cols: [
      { label: '客户', key: 'customer_name' }, { label: '金额', key: 'amount', fmt: fmtMoney },
      { label: '状态', key: 'status_name' }
    ],
    kw: true
  },
  'trace-list': {
    title: '跟进记录',
    api: (p, l, kw) => API.traceList(p, l, kw),
    titleField: 'content', cols: [
      { label: '客户', key: 'customer_name' }, { label: '跟进人', key: 'admin_name' },
      { label: '时间', key: 'create_time', fmt: fmtTime }
    ],
    kw: true
  },

  /* ---- 订单 ---- */
  'order-my': {
    title: '订单（我申请的）',
    api: (p, l, kw) => API.orderList(p, l, kw),
    titleField: 'code', cols: [
      { label: '客户', key: 'customer_name' }, { label: '金额', key: 'amount', fmt: fmtMoney },
      { label: '状态', key: 'status_name' }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/order-my/' + r.id
  },
  'order-handle': {
    title: '订单（我处理的）',
    api: (p, l, kw) => API.orderHandleList(p, l, kw),
    titleField: 'code', cols: [
      { label: '客户', key: 'customer_name' }, { label: '金额', key: 'amount', fmt: fmtMoney },
      { label: '状态', key: 'status_name' }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/order-handle/' + r.id
  },
  'platform-order': {
    title: '平台订单',
    api: (p, l, kw) => API.platformOrderList(p, l, kw),
    titleField: 'code', cols: [
      { label: '客户', key: 'customer_name' }, { label: '金额', key: 'amount', fmt: fmtMoney },
      { label: '状态', key: 'status_name' }
    ],
    kw: true, detail: (r) => '/detail/platform-order/' + r.id
  },

  /* ---- 客户子业务 ---- */
  sample: {
    title: '样本管理',
    api: (p, l, kw) => API.sampleList(p, l, kw),
    titleField: 'code', cols: [
      { label: '客户', key: 'customer_name' }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/sample/' + r.id
  },
  school: {
    title: '校展管理',
    api: (p, l, kw) => API.schoolList(p, l, kw),
    titleField: 'title', cols: [
      { label: '状态', key: 'status_name' }, { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/school/' + r.id
  },
  after: {
    title: '售后管理',
    api: (p, l, kw) => API.afterList(p, l, kw),
    titleField: 'code', cols: [
      { label: '客户', key: 'customer_name' }, { label: '状态', key: 'status_name' },
      { label: '时间', key: 'create_time', fmt: fmtDate }
    ],
    kw: true, detail: (r) => '/detail/after/' + r.id
  }
}

export function getSubPageCfg(type: string): SubPageCfg | null {
  return SUB_PAGES[type] || null
}
