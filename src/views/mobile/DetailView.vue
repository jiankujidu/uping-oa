<script setup lang="ts">
/**
 * 详情壳 —— 对应原 APK showDetailShell（navStack 逐级返回）。
 * 按 kind 分发到具体详情组件；topbar 由 MobileLayout 管（路径含 /detail 即显示 ‹返回）。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ApproveDetailPage from './ApproveDetailPage.vue'
import ApproveFormPage from './ApproveFormPage.vue'
import OrderDetailPage from './OrderDetailPage.vue'
import CustomerDetailPage from './CustomerDetailPage.vue'
import MessageDetailPage from './MessageDetailPage.vue'
import RichDetailPage from './RichDetailPage.vue'
import ProductDetailPage from './ProductDetailPage.vue'
import FileDetailPage from './FileDetailPage.vue'
import SalesAgreementPage from './SalesAgreementPage.vue'
import GenericDetailPage from './GenericDetailPage.vue'
import ComposePage from './ComposePage.vue'

const route = useRoute()
const kind = computed(() => String(route.params.kind || ''))
const id = computed(() => String(route.params.id || ''))
</script>

<template>
  <ApproveDetailPage v-if="kind === 'approve'" :id="id" />
  <ApproveFormPage v-else-if="kind === 'approve-form'" :type="id" />
  <OrderDetailPage v-else-if="kind === 'order-my' || kind === 'order-handle'" :id="id" :mode="kind" />
  <CustomerDetailPage v-else-if="kind === 'customer'" :id="id" />
  <MessageDetailPage v-else-if="kind.startsWith('message-')" :id="id" :tab="kind.replace('message-', '') as any" />
  <RichDetailPage v-else-if="kind === 'note' || kind === 'article'" :kind="kind" :id="id" />
  <ProductDetailPage v-else-if="kind === 'product'" :id="id" />
  <FileDetailPage v-else-if="kind === 'file'" :id="id" />
  <SalesAgreementPage v-else-if="kind === 'sales-agreement'" :id="id" />
  <GenericDetailPage v-else-if="kind === 'school' || kind === 'after' || kind === 'sample' || kind === 'platform-order'" :kind="kind" :id="id" />
  <ComposePage v-else-if="kind === 'message-compose'" />
  <div v-else class="empty-state"><div class="empty-text">未知详情类型：{{ kind }}</div></div>
</template>
