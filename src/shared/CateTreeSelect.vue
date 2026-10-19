/**
 * 产品分类树多选 —— 手机端底部 ActionSheet（对应源码 .cate-panel）。
 * 树数据来自桌面端页面内嵌的 cateJsonData；反代不可达时用内置分类。
 */
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { API } from '@/api/endpoints'

export interface CateNode { id: number; name: string; children?: CateNode[] }

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', ids: number[], nodes: CateNode[]): void
}>()

const FALLBACK: CateNode[] = [
  { id: 1, name: '抗体', children: [
    { id: 11, name: '一抗' }, { id: 12, name: '二抗' }, { id: 13, name: '流式抗体' }
  ]},
  { id: 2, name: '试剂盒', children: [
    { id: 21, name: 'ELISA 试剂盒' }, { id: 22, name: 'PCR 试剂盒' }
  ]},
  { id: 3, name: '蛋白与多肽' },
  { id: 4, name: '细胞与培养' },
  { id: 5, name: '耗材与仪器' }
]

const tree = ref<CateNode[]>([])
const kw = ref('')
const openIds = ref<number[]>([])
const picked = ref<CateNode[]>([])

onMounted(async () => {
  try {
    const r = await API.productCateTree()
    tree.value = Array.isArray(r) && r.length ? r : FALLBACK
  } catch { tree.value = FALLBACK }
})

function iconOf(n: CateNode) { return n.children && n.children.length ? (openIds.value.includes(n.id) ? '−' : '+') : '' }
function isOpen(n: CateNode) { return openIds.value.includes(n.id) }
function toggleOpen(n: CateNode) {
  if (!n.children || !n.children.length) return
  const i = openIds.value.indexOf(n.id)
  i >= 0 ? openIds.value.splice(i, 1) : openIds.value.push(n.id)
}
function isPicked(n: CateNode) { return picked.value.some(p => p.id === n.id) }
function togglePick(n: CateNode) {
  const i = picked.value.findIndex(p => p.id === n.id)
  i >= 0 ? picked.value.splice(i, 1) : picked.value.push(n)
}
function match(n: CateNode): boolean {
  if (!kw.value) return true
  if (n.name.includes(kw.value)) return true
  return !!(n.children && n.children.some(match))
}
function onConfirm() {
  emit('confirm', picked.value.map(p => p.id), picked.value)
  emit('update:modelValue', false)
}
function onReset() { picked.value = [] }
function onClose() { emit('update:modelValue', false) }
</script>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="cate-mask" @click.self="onClose" />
    <div v-if="modelValue" class="cate-panel open" role="dialog" aria-modal="true">
      <div class="cate-panel-head">
        <div class="cate-title">选择产品分类</div>
        <div class="cate-close" @click="onClose">×</div>
      </div>
      <input v-model="kw" class="form-input" placeholder="搜索分类名称" />
      <div class="cate-tree">
        <template v-for="n in tree" :key="n.id">
          <div v-if="match(n)" class="cate-row">
            <span :class="['cate-arrow', isOpen(n) ? 'open' : '']" @click="toggleOpen(n)">{{ iconOf(n) || '' }}</span>
            <label class="cate-check">
              <input type="checkbox" :checked="isPicked(n)" @change="togglePick(n)" />
              <span>{{ n.name }}</span>
            </label>
          </div>
          <template v-if="n.children && isOpen(n)">
            <div v-for="c in n.children.filter(match)" :key="c.id" class="cate-row child">
              <span class="cate-arrow-placeholder" />
              <label class="cate-check">
                <input type="checkbox" :checked="isPicked(c)" @change="togglePick(c)" />
                <span>{{ c.name }}</span>
              </label>
            </div>
          </template>
        </template>
      </div>
      <div class="cate-chips" v-if="picked.length">
        <span v-for="p in picked" :key="p.id" class="cate-chip">{{ p.name }}<i @click="togglePick(p)">×</i></span>
      </div>
      <div class="cate-panel-foot">
        <button class="act-btn pf-reset" @click="onReset">重置</button>
        <button class="act-btn apply" @click="onConfirm">确定</button>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.cate-mask { position: fixed; inset: 0; background: var(--color-mask); z-index: 1000; }
.cate-panel {
  position: fixed; left: 0; right: 0; bottom: 0; background: var(--color-card);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0; z-index: 1001;
  padding: var(--sp-3) var(--sp-3) calc(var(--sp-3) + env(safe-area-inset-bottom));
  box-shadow: var(--shadow-panel); display: flex; flex-direction: column;
  transform: translateY(0); max-height: 78vh; overflow: hidden;
}
.cate-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-2); }
.cate-title { font-size: var(--font-md); font-weight: 600; color: var(--color-text-strong); }
.cate-close { width: 26px; height: 26px; line-height: 24px; text-align: center; border-radius: 50%; background: #f2f4f7; color: #4e5969; font-size: 16px; cursor: pointer; }
.cate-panel .form-input { padding: 8px 10px; font-size: var(--font-base); margin-bottom: var(--sp-2); }
.cate-tree { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; min-height: 0; max-height: calc(78vh - 150px); }
.cate-row { display: flex; align-items: flex-start; padding: var(--sp-1) 0; font-size: var(--font-base); }
.cate-row.child { padding-left: 20px; }
.cate-arrow { flex: none; width: 18px; color: var(--color-text-3); font-size: var(--font-smd); cursor: pointer; user-select: none; text-align: center; }
.cate-arrow.open { color: var(--color-primary); }
.cate-arrow-placeholder { flex: none; width: 18px; }
.cate-check { display: flex; align-items: center; flex: 1; gap: 6px; color: var(--color-text-strong); cursor: pointer; }
.cate-check input { width: 16px; height: 16px; accent-color: var(--color-primary); }
.cate-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 0; }
.cate-chip { display: inline-flex; align-items: center; gap: 4px; background: var(--color-primary-bg-2); color: var(--color-primary); border-radius: var(--radius-chip); padding: 3px 8px; font-size: var(--font-smd); }
.cate-chip i { font-style: normal; cursor: pointer; font-size: 14px; line-height: 1; padding: 0 2px; }
.cate-panel-foot { display: flex; justify-content: flex-end; gap: var(--sp-3); margin-top: var(--sp-2); border-top: 1px solid var(--color-divider); padding-top: var(--sp-2); }
.cate-panel-foot .act-btn { width: 80px; padding: 7px 0; font-size: var(--font-base); }
.cate-panel-foot .act-btn.pf-reset { background: var(--color-card); color: var(--color-primary); border: 1px solid var(--color-primary); box-sizing: border-box; }
</style>
