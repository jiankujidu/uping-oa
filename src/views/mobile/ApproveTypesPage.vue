<script setup lang="ts">
/** 审批类型选择 —— 对应原 APK openApproveType（approve_meta.js 全量 10 类表单目录） */
import { useRouter } from 'vue-router'
import { APPROVE_TYPES } from './approveTypes'

const router = useRouter()
function launch(type: number) { router.push('/detail/approve-form/' + type) }
</script>

<template>
  <div class="types-page">
    <div class="tip">选择要发起的审批类型</div>
    <div class="grid">
      <button v-for="t in APPROVE_TYPES" :key="t.type" class="type-item" @click="launch(t.type)">
        <span class="gi-icon">{{ t.icon }}</span><span class="gi-text">{{ t.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tip { font-size: var(--font-smd); color: var(--color-text-4); padding: var(--sp-3) var(--sp-4); }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-1); padding: 0 var(--sp-4); }
.type-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: var(--color-card); border-radius: var(--radius-card); padding: var(--sp-4) var(--sp-1);
  min-height: 80px; box-shadow: var(--shadow-card);
}
.type-item:active { background: var(--color-primary-bg); }
.gi-icon { font-size: 24px; }
.gi-text { font-size: var(--font-smd); color: var(--color-text); }
</style>
