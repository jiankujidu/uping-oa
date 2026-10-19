<script setup lang="ts">
/**
 * 桌面端详情 —— 居中模态承载，内部复用手机端详情组件（功能完全对等，逻辑同一份）。
 * 桌面专属增益：Esc 关闭、宽屏时表单双列、工具栏常驻。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ApproveDetailPage from '@/views/mobile/ApproveDetailPage.vue'
import ApproveFormPage from '@/views/mobile/ApproveFormPage.vue'
import OrderDetailPage from '@/views/mobile/OrderDetailPage.vue'
import CustomerDetailPage from '@/views/mobile/CustomerDetailPage.vue'
import MessageDetailPage from '@/views/mobile/MessageDetailPage.vue'
import RichDetailPage from '@/views/mobile/RichDetailPage.vue'
import ProductDetailPage from '@/views/mobile/ProductDetailPage.vue'
import FileDetailPage from '@/views/mobile/FileDetailPage.vue'
import SalesAgreementPage from '@/views/mobile/SalesAgreementPage.vue'
import GenericDetailPage from '@/views/mobile/GenericDetailPage.vue'
import ComposePage from '@/views/mobile/ComposePage.vue'

const route = useRoute()
const router = useRouter()
const kind = computed(() => String(route.params.kind || ''))
const id = computed(() => String(route.params.id || ''))

const TITLES: Record<string, string> = {
  approve: '审批详情', 'approve-form': '发起审批', order: '订单详情', customer: '客户详情',
  note: '公告详情', article: '问答详情', product: '产品详情', file: '附件详情',
  'sales-agreement': '销售协议（供货合同）', school: '校展详情', after: '售后详情', sample: '样本详情',
  'platform-order': '平台订单详情', 'message-compose': '写消息'
}
const title = computed(() => TITLES[kind.value] || '详情')
const wide = computed(() => ['approve-form', 'sales-agreement', 'message-compose'].includes(kind.value))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') router.back()
}
if (typeof window !== 'undefined') window.addEventListener('keydown', onKey)
</script>

<template>
  <div class="dmodal-mask" @click.self="router.back()">
    <div class="dmodal" :class="{ wide }">
      <div class="dmodal-head">
        <span class="t">{{ title }}<span class="kbd-hint" v-if="id"> · #{{ id }}</span></span>
        <span class="x" @click="router.back()" title="Esc 关闭">✕</span>
      </div>
      <div class="dmodal-body detail-host">
        <ApproveDetailPage v-if="kind === 'approve'" :id="id" />
        <ApproveFormPage v-else-if="kind === 'approve-form'" :type="id" />
        <OrderDetailPage v-else-if="kind === 'order-my' || kind === 'order-handle'" :id="id" :mode="kind" />
        <CustomerDetailPage v-else-if="kind === 'customer'" :id="id" />
        <MessageDetailPage v-else-if="kind.startsWith('message-') && kind !== 'message-compose'" :id="id" :tab="kind.replace('message-', '') as any" />
        <RichDetailPage v-else-if="kind === 'note' || kind === 'article'" :kind="kind" :id="id" />
        <ProductDetailPage v-else-if="kind === 'product'" :id="id" />
        <FileDetailPage v-else-if="kind === 'file'" :id="id" />
        <SalesAgreementPage v-else-if="kind === 'sales-agreement'" :id="id" />
        <GenericDetailPage v-else-if="['school','after','sample','platform-order'].includes(kind)" :kind="kind" :id="id" />
        <ComposePage v-else-if="kind === 'message-compose'" />
        <p v-else class="coming-soon">未知详情类型：{{ kind }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dmodal.wide { max-width: 880px; }
.x { cursor: pointer; color: var(--color-text-4); padding: 4px 8px; }
.coming-soon { font-size: var(--font-base); color: var(--color-text-2); line-height: 1.9; }
/* 详情组件在桌面容器内：去掉手机 margin 限制，表单双列 */
.detail-host :deep(.form-card) { margin-left: 0; margin-right: 0; }
.detail-host :deep(.ops) { padding-left: 0; padding-right: 0; }
.detail-host :deep(.seg) { margin-left: 0; margin-right: 0; }
@media (max-width: 1023px) { .dmodal-mask { display: none; } }
</style>
