<script setup lang="ts">
/** 新增客户 —— 对应原 APK renderCustomerAddPage（归属自动带出 + 省市区三级） */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@/api/endpoints'
import { toast } from '@/shared/toast'

const router = useRouter()
const form = ref({
  name: '', mobile: '', address: '', content: '', remark: '',
  provinceid: '', cityid: '', distid: ''
})
const belong = ref({ belong_name: '', belong_department: '' })
const citys = ref<{ id: number; name: string }[]>([])
const dists = ref<{ id: number; name: string }[]>([])
const saving = ref(false)

async function loadDefaults() {
  try {
    const r = await API.customerAddDefaults()
    if (r && r.code === 0 && r.data) {
      belong.value = { belong_name: r.data.belong_name || '', belong_department: r.data.belong_department || '' }
    }
  } catch { /* 演示模式：不填充 */ }
}
loadDefaults()

async function onProvince() {
  form.value.cityid = ''; form.value.distid = ''; citys.value = []; dists.value = []
  if (!form.value.provinceid) return
  const r = await API.regionCitys(Number(form.value.provinceid))
  citys.value = Array.isArray(r?.data) ? r.data : []
}
async function onCity() {
  form.value.distid = ''; dists.value = []
  if (!form.value.cityid) return
  const r = await API.regionDists(Number(form.value.cityid))
  dists.value = Array.isArray(r?.data) ? r.data : []
}

async function submit() {
  if (!form.value.name.trim()) { toast('请填写客户名称'); return }
  saving.value = true
  try {
    const r = await API.customerAdd(form.value)
    if (r && r.code === 0) { toast('新增成功'); router.back() }
    else toast(r?.msg || '新增失败')
  } finally { saving.value = false }
}
</script>

<template>
  <div class="page-form">
    <div class="form-card">
      <div class="field"><label>客户名称 <i class="req">*</i></label><input v-model="form.name" class="form-input" placeholder="请输入客户名称" /></div>
      <div class="field"><label>联系电话</label><input v-model="form.mobile" class="form-input" placeholder="请输入联系电话" /></div>
      <div class="field">
        <label>所在地</label>
        <div class="chain">
          <input v-model="form.provinceid" class="form-input" placeholder="省" @change="onProvince" />
          <input v-model="form.cityid" class="form-input" placeholder="市" @change="onCity" />
          <input v-model="form.distid" class="form-input" placeholder="区/县" />
        </div>
      </div>
      <div class="field"><label>地址</label><input v-model="form.address" class="form-input" placeholder="详细地址" /></div>
      <div class="field"><label>备注</label><textarea v-model="form.remark" class="form-textarea" placeholder="备注信息" /></div>
      <div class="belong" v-if="belong.belong_name || belong.belong_department">
        归属：{{ belong.belong_department || '-' }} / {{ belong.belong_name || '-' }}
      </div>
    </div>
    <div class="submit-wrap"><button class="act-btn block" :disabled="saving" @click="submit">{{ saving ? '提交中…' : '提交' }}</button></div>
  </div>
</template>

<style scoped>
.page-form { padding-bottom: var(--sp-6); }
.form-card { background: var(--color-card); margin: var(--sp-3) var(--sp-4); border-radius: var(--radius-card); padding: var(--sp-4); box-shadow: var(--shadow-card); }
.field { margin-bottom: var(--sp-4); }
.field label { display: block; font-size: var(--font-base); color: var(--color-text-2); margin-bottom: 6px; }
.req { color: var(--color-danger); font-style: normal; }
.chain { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--sp-2); }
.belong { font-size: var(--font-smd); color: var(--color-text-4); background: var(--color-bg); border-radius: var(--radius-btn-sm); padding: var(--sp-2) var(--sp-3); }
.submit-wrap { padding: 0 var(--sp-4); }
</style>
