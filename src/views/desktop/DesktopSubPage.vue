<script setup lang="ts">
/** 桌面端子页 —— 通用表格视图（复用手机端 subPages.ts 配置，取数逻辑同一份） */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { API } from '@/api/endpoints'
import { useListData } from '@/shared/useListData'
import DataTable, { type Column } from '@/shared/DataTable.vue'
import { getSubPageCfg } from '../mobile/subPages'
import { fmtTime, fmtDate, fmtMoney, plain } from '@/utils/format'
import { registry } from '@/shared/CommandRegistry'
import { actionSheet } from '@/shared/actionSheet'

const route = useRoute()
const type = computed(() => String(route.params.type || ''))
const cfg = computed(() => getSubPageCfg(type.value) as NonNullable<ReturnType<typeof getSubPageCfg>>)
const kw = ref('')

const { rows, status, refresh, loadMore, init } = useListData({
  fetcher: (page, limit) => cfg.value ? cfg.value.api(page, limit, kw.value || undefined) : Promise.resolve({ code: 0, data: [] }),
  immediate: false
})
if (cfg.value) init()

/** 按配置生成表格列（titleField 作首列，cols 依次） */
const COLS = computed<Column[]>(() => {
  if (!cfg.value) return []
  const cols: Column[] = [{ key: cfg.value.titleField || 'id', label: cfg.value.title, sortable: true }]
  for (const c of cfg.value.cols) cols.push({ key: c.key, label: c.label, sortable: true, format: c.fmt })
  return cols
})

function onRowClick(r: any) {
  if (cfg.value?.detail) location.hash = '#/' + cfg.value.detail(r).replace(/^\//, '')
}

/* 注册本页的删除命令（演示：列表页右键） */
if (cfg.value) {
  registry.register({
    id: 'page.export',
    label: '导出本页 CSV',
    run: (ctx) => {
      import('@/shared/exportImport').then(m => {
        m.exportCsv(ctx.rows || rows, (cfg.value?.title || 'export') + '-export',
          COLS.value.map(c => ({ key: c.key, label: c.label })))
      })
    },
    when: () => true
  })
}
</script>

<template>
  <div v-if="cfg">
    <div class="dfilter-bar">
      <input v-if="cfg.kw" v-model="kw" class="form-input" style="max-width:260px" placeholder="搜索{{ cfg.title }}" @keyup.enter="refresh()" />
      <button v-if="cfg.kw" class="dtop-btn" @click="refresh()">查询</button>
      <span class="spacer" />
      <span class="kbd-hint">右键行可导出本页 · 点击行进详情</span>
    </div>

    <DataTable
      :columns="COLS"
      :rows="rows"
      :loading="status.loading"
      :finished="status.finished"
      :total="status.total"
      ctx-type="page"
      :row-title="(r: any) => cfg.title + ' #' + r.id"
      @row-click="onRowClick"
      @load-more="loadMore"
      @refresh="refresh"
    />

    <!-- 数据导出（任务书 §8） -->
    <div class="export-bar">
      <button class="dtop-btn" @click="import('@/shared/exportImport').then(m => m.exportJson(rows, cfg.title + '.json'))">导出 JSON</button>
      <button class="dtop-btn" @click="import('@/shared/exportImport').then(m => m.exportCsv(rows, cfg.title + '.csv', COLS.map(c => ({ key: c.key, label: c.label }))))">导出 CSV</button>
    </div>
  </div>
  <div v-else class="table-empty">该功能尚未配置桌面视图：{{ type }}</div>
</template>

<style scoped>
.export-bar { display: flex; gap: var(--sp-2); margin-top: var(--sp-3); }
</style>
