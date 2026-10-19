/**
 * 列表数据内核 —— 双端共用的分页/加载/错误/重试逻辑。
 * 手机端：卡片列表 + 上拉加载 + 下拉刷新
 * 桌面端：表格 + 分页器 + 刷新按钮
 * 两端调用同一个 composable，只换渲染层。
 */
import { ref, reactive } from 'vue'
import { API } from '@/api/endpoints'

export interface ListOptions<T = any> {
  fetcher: (page: number, limit: number) => Promise<any>
  limit?: number
  map?: (r: any) => T
  immediate?: boolean
}

export function useListData<T = any>(opts: ListOptions<T>) {
  const limit = opts.limit || 15
  const rows = ref<T[]>([])
  const status = reactive({
    loading: false,
    refreshing: false,
    loadingMore: false,
    finished: false,
    error: '',
    page: 1,
    total: 0
  })

  async function loadPage(page: number) {
    const r = await opts.fetcher(page, limit)
    if (!r || r.code !== 0) throw new Error((r && r.msg) || '加载失败')
    const list = Array.isArray(r.data) ? r.data : []
    const mapped = opts.map ? list.map(opts.map) : list
    status.total = Number(r.count || 0)
    status.finished = mapped.length < limit || (page * limit) >= status.total
    return mapped
  }

  async function refresh() {
    status.refreshing = true
    status.error = ''
    try {
      status.page = 1
      rows.value = await loadPage(1)
    } catch (e: any) {
      status.error = e?.message || '加载失败'
      rows.value = []
    } finally {
      status.refreshing = false
    }
  }

  async function loadMore() {
    if (status.loadingMore || status.finished) return
    status.loadingMore = true
    try {
      const next = await loadPage(status.page + 1)
      rows.value = rows.value.concat(next)
      status.page += 1
    } catch (e: any) {
      status.error = e?.message || '加载失败'
    } finally {
      status.loadingMore = false
    }
  }

  async function init() {
    status.loading = true
    try { await refresh() } finally { status.loading = false }
  }

  if (opts.immediate !== false) init()

  return { rows, status, refresh, loadMore, init }
}

/** 桌面端表格分页（一次性拉大页或前后翻页） */
export function useTableData<T = any>(opts: Omit<ListOptions<T>, 'limit'> & { limit?: number }) {
  const base = useListData<T>({ ...opts, limit: opts.limit || 20 })
  return base
}
