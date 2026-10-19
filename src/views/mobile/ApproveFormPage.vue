<script setup lang="ts">
/**
 * 审批填单 —— 对应原 APK openApproveForm（表单引擎）。
 * 24 类表单字段元数据来自 approveTypes.ts（approve_meta.js 提取）。
 * 字段类型：text/textarea/select/datetime/number/amount/file。
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'
import { esc } from '@/utils/format'
import { APPROVE_FIELDS } from './approveTypes'
import AttachmentUpload from '@/shared/AttachmentUpload.vue'
import UserPicker from '@/shared/UserPicker.vue'

const props = defineProps<{ type: string }>()
const router = useRouter()

const fields = computed(() => APPROVE_FIELDS[props.type] || [])
const form = reactive<Record<string, any>>({})
const files = ref<{ name: string; size: number }[]>([])
const checkers = ref<{ id: number; name: string }[]>([])
const copies = ref<{ id: number; name: string }[]>([])
const pickerFor = ref<'checker' | 'copy' | null>(null)
const submitting = ref(false)

function onField(k: string, v: any) { form[k] = v }

async function submit() {
  submitting.value = true
  try {
    const data: Record<string, any> = { type: Number(props.type), flow_id: 0 }
    for (const k in form) data[k] = form[k]
    data.check_admin_ids = checkers.value.map(c => c.id).join(',')
    data.copy_uids = copies.value.map(c => c.id).join(',')
    data.file_ids = ''
    const r = await API.approveSubmit(data)
    if (r && r.code === 0) { toast('提交成功'); router.back() }
    else toast(r?.msg || '提交失败')
  } finally { submitting.value = false }
}

function onPickerConfirm(users: { id: number; name: string }[]) {
  if (pickerFor.value === 'checker') checkers.value = users
  if (pickerFor.value === 'copy') copies.value = users
  pickerFor.value = null
}
</script>

<template>
  <div class="approve-form">
    <div class="form-card">
      <template v-for="f in fields" :key="f.key">
        <div class="field">
          <label>{{ f.label }}</label>
          <input v-if="f.type === 'text' || f.type === 'number' || f.type === 'datetime' || f.type === 'amount'"
            class="form-input" :type="f.type === 'number' || f.type === 'amount' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'"
            :placeholder="'请输入' + f.label" @input="onField(f.key, ($event.target as HTMLInputElement).value)" />
          <textarea v-else-if="f.type === 'textarea'" class="form-textarea" :placeholder="'请输入' + f.label" @input="onField(f.key, ($event.target as HTMLTextAreaElement).value)" />
          <select v-else-if="f.type === 'select'" class="form-select" @change="onField(f.key, ($event.target as HTMLSelectElement).value)">
            <option value="">请选择</option>
            <option v-for="o in f.options" :key="o.v" :value="o.v">{{ o.t }}</option>
          </select>
        </div>
      </template>
    </div>

    <div class="section-title">审批流程</div>
    <div class="form-card">
      <button class="picker-row" @click="pickerFor = 'checker'">
        <span class="label">审核人</span>
        <span class="val">{{ checkers.length ? checkers.map(c => c.name).join('、') : '请选择 ›' }}</span>
      </button>
      <button class="picker-row" @click="pickerFor = 'copy'">
        <span class="label">抄送人</span>
        <span class="val">{{ copies.length ? copies.map(c => c.name).join('、') : '请选择（可选）›' }}</span>
      </button>
    </div>

    <div class="section-title">附件</div>
    <div class="form-card"><AttachmentUpload v-model="files" /></div>

    <div class="submit-wrap"><button class="act-btn block" :disabled="submitting" @click="submit">{{ submitting ? '提交中…' : '提交审批' }}</button></div>

    <UserPicker :model-value="pickerFor === 'checker' || pickerFor === 'copy'" :multiple="true"
      :title="pickerFor === 'checker' ? '选择审核人' : '选择抄送人'"
      @update:model-value="pickerFor = null" @confirm="onPickerConfirm" />
  </div>
</template>

<style scoped>
.section-title { font-size: var(--font-base); font-weight: 600; color: var(--color-text-2); padding: var(--sp-3) var(--sp-4) var(--sp-1); }
.form-card { background: var(--color-card); margin: var(--sp-2) var(--sp-4); border-radius: var(--radius-card); padding: var(--sp-4); box-shadow: var(--shadow-card); }
.field { margin-bottom: var(--sp-4); }
.field label { display: block; font-size: var(--font-base); color: var(--color-text-2); margin-bottom: 6px; }
.picker-row { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; padding: var(--sp-2) 0; border-bottom: 1px solid var(--color-divider); }
.picker-row:last-child { border-bottom: none; }
.picker-row .label { font-size: var(--font-base); color: var(--color-text-2); }
.picker-row .val { font-size: var(--font-base); color: var(--color-text); max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.submit-wrap { padding: var(--sp-5) var(--sp-4) var(--sp-7); }
</style>
