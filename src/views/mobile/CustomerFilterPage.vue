<script setup lang="ts">
/** 客户筛选面板 —— 对应原 APK openCustFilter（等级/来源/意向/状态/微信/时间 chips） */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/shared/toast'

const router = useRouter()

const GROUPS = [
  { key: 'grade', label: '客户等级', options: ['A', 'B', 'C', 'D'] },
  { key: 'source', label: '客户来源', options: ['介绍', '网络', '展会', '主动开发'] },
  { key: 'intent', label: '意向程度', options: ['高', '中', '低'] },
  { key: 'status', label: '客户状态', options: ['潜在', '跟进中', '成交', '沉睡'] },
  { key: 'wechat', label: '加过微信', options: ['是', '否'] }
]
const picked = ref<Record<string, string>>({})

function pick(k: string, v: string) {
  if (picked.value[k] === v) delete picked.value[k]
  else picked.value[k] = v
}
function reset() { picked.value = {}; toast('已重置') }
function apply() {
  // 与客户 Tab 约定：结果写 sessionStorage，返回时刷新
  sessionStorage.setItem('upoa:cust-filter', JSON.stringify(picked.value))
  router.back()
}
</script>

<template>
  <div class="filter-page">
    <div v-for="g in GROUPS" :key="g.key" class="group">
      <div class="group-title">{{ g.label }}</div>
      <div class="chips">
        <button v-for="o in g.options" :key="o" :class="['chip', picked[g.key] === o ? 'on' : '']" @click="pick(g.key, o)">{{ o }}</button>
      </div>
    </div>
    <div class="foot-bar">
      <button class="act-btn ghost reset" @click="reset">重置</button>
      <button class="act-btn apply" @click="apply">确定</button>
    </div>
  </div>
</template>

<style scoped>
.filter-page { padding-bottom: 80px; }
.group { margin: var(--sp-3) var(--sp-4); background: var(--color-card); border-radius: var(--radius-card); padding: var(--sp-4); box-shadow: var(--shadow-card); }
.group-title { font-size: var(--font-base); font-weight: 600; color: var(--color-text); margin-bottom: var(--sp-3); }
.chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.chip { padding: 7px 14px; border-radius: 16px; background: var(--color-bg); color: var(--color-text-2); font-size: var(--font-base); }
.chip.on { background: var(--color-primary-bg-2); color: var(--color-primary); font-weight: 500; }
.foot-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: var(--sp-3); padding: var(--sp-3) var(--sp-4) calc(var(--sp-3) + env(safe-area-inset-bottom)); background: var(--color-card); border-top: 1px solid var(--color-border); }
.foot-bar .act-btn { flex: 1; padding: 11px 0; }
.foot-bar .reset { max-width: 120px; }
</style>
