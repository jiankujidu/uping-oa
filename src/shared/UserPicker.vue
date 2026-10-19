/**
 * 选人组件（通讯录）—— 手机端：底部面板 + 搜索 + 多选 chips；
 * 桌面端：居中模态（由 desktop 包装决定）。两端共用同一数据逻辑。
 */
<script setup lang="ts">
import { ref, watch } from 'vue'
import { API } from '@/api/endpoints'
import { toast } from './toast'

interface UserItem { id: number; username: string; name: string; mobile: string }

const props = withDefaults(defineProps<{
  modelValue: boolean
  multiple?: boolean
  selectedIds?: string
  title?: string
}>(), { multiple: true, selectedIds: '', title: '选择联系人' })

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', users: UserItem[]): void
}>()

const kw = ref('')
const loading = ref(false)
const users = ref<UserItem[]>([])
const picked = ref<UserItem[]>([])
const finished = ref(false)

watch(() => props.modelValue, v => {
  if (v && users.value.length === 0) load()
})

async function load(reset = true) {
  loading.value = true
  try {
    const r = await API.mailList(1, reset ? 500 : 200, kw.value || undefined)
    if (r && r.code === 0) {
      const list = Array.isArray(r.data) ? r.data : []
      users.value = list.map((u: any) => ({
        id: Number(u.id),
        username: String(u.username || ''),
        name: String(u.name || u.nickname || u.username || '用户'),
        mobile: String(u.mobile || '')
      }))
      // 回显已选
      if (props.selectedIds) {
        const ids = props.selectedIds.split(',').filter(Boolean)
        picked.value = users.value.filter(u => ids.includes(String(u.id)) || ids.includes(u.username))
      }
      finished.value = true
    }
  } catch (e: any) {
    toast(e?.message || '通讯录加载失败')
  } finally {
    loading.value = false
  }
}

function toggle(u: UserItem) {
  const i = picked.value.findIndex(x => x.id === u.id)
  if (i >= 0) picked.value.splice(i, 1)
  else {
    if (props.multiple) picked.value.push(u)
    else picked.value = [u]
  }
}

function onConfirm() {
  emit('confirm', picked.value.slice())
  emit('update:modelValue', false)
}
function onClose() { emit('update:modelValue', false) }
</script>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="up-mask" @click.self="onClose" />
    <div v-if="modelValue" class="up-panel" role="dialog" aria-modal="true">
      <div class="up-head">
        <button class="up-cancel" @click="onClose">取消</button>
        <div class="up-title">{{ title }}</div>
        <button class="up-ok" @click="onConfirm" :disabled="!picked.length">确定<span v-if="picked.length">({{ picked.length }})</span></button>
      </div>
      <div class="up-search">
        <input v-model="kw" class="form-input" placeholder="搜索姓名 / 账号" @keyup.enter="load()" />
        <button class="act-btn" @click="load()">搜索</button>
      </div>
      <div class="up-chips" v-if="picked.length">
        <span v-for="u in picked" :key="u.id" class="up-chip" @click="toggle(u)">{{ u.name }} ×</span>
      </div>
      <div class="up-list">
        <div v-if="loading" class="list-loading">加载中…</div>
        <button v-for="u in users" :key="u.id" :class="['up-item', picked.some(p => p.id === u.id) ? 'on' : '']" @click="toggle(u)">
          <span class="up-ava">{{ (u.name || 'U')[0] }}</span>
          <span class="up-meta">
            <span class="up-name">{{ u.name }}</span>
            <span class="up-sub">{{ u.username }}<template v-if="u.mobile"> · {{ u.mobile }}</template></span>
          </span>
          <span v-if="picked.some(p => p.id === u.id)" class="up-check">✓</span>
        </button>
        <div v-if="!loading && finished && !users.length" class="empty-state"><div class="empty-text">无匹配联系人</div></div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.up-mask { position: fixed; inset: 0; background: var(--color-mask); z-index: 1000; }
.up-panel {
  position: fixed; left: 0; right: 0; bottom: 0; top: 8vh; z-index: 1001;
  background: var(--color-card); border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  display: flex; flex-direction: column; box-shadow: var(--shadow-panel);
}
.up-head { display: flex; align-items: center; justify-content: space-between; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-divider); }
.up-cancel { font-size: var(--font-base); color: var(--color-text-3); min-height: 44px; padding: 0 4px; }
.up-title { font-size: var(--font-md); font-weight: 600; }
.up-ok { font-size: var(--font-base); color: var(--color-primary); font-weight: 600; min-height: 44px; padding: 0 4px; }
.up-ok:disabled { color: var(--color-text-4); }
.up-search { display: flex; gap: var(--sp-2); padding: var(--sp-3) var(--sp-4); }
.up-search .form-input { flex: 1; }
.up-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 var(--sp-4) var(--sp-2); }
.up-chip { background: var(--color-primary-bg-2); color: var(--color-primary); border-radius: var(--radius-chip); padding: 4px 10px; font-size: var(--font-smd); cursor: pointer; }
.up-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.up-item { display: flex; align-items: center; gap: var(--sp-3); width: 100%; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--color-divider); text-align: left; }
.up-item.on { background: var(--color-primary-bg); }
.up-ava { flex: none; width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: var(--font-base); }
.up-meta { flex: 1; min-width: 0; }
.up-name { display: block; font-size: var(--font-base); color: var(--color-text); }
.up-sub { display: block; font-size: var(--font-smd); color: var(--color-text-4); }
.up-check { color: var(--color-primary); font-weight: 700; }
</style>

