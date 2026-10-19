<script setup lang="ts">
import { sheetState, closeSheet } from './actionSheet'

function pick(v: any) { closeSheet(v) }
function onMask() { closeSheet() }
</script>

<template>
  <teleport to="body">
    <div v-if="sheetState.visible" class="as-mask" @click.self="onMask" />
    <div v-if="sheetState.visible" class="action-sheet open" role="dialog" aria-modal="true">
      <div class="action-sheet-title" v-if="sheetState.title">{{ sheetState.title }}</div>
      <div class="action-sheet-body">
        <button
          v-for="(a, i) in sheetState.actions"
          :key="i"
          :class="['as-item', a.danger ? 'danger' : '']"
          @click="pick(a.value)"
        >
          <span class="as-label">{{ a.label }}</span>
          <span v-if="a.desc" class="as-desc">{{ a.desc }}</span>
        </button>
      </div>
      <button class="as-cancel" @click="onMask">取消</button>
    </div>
  </teleport>
</template>

<style scoped>
.as-mask { position: fixed; inset: 0; background: var(--color-mask); z-index: 1000; }
.action-sheet-body { overflow-y: auto; -webkit-overflow-scrolling: touch; min-height: 0; }
.as-item { display: block; width: 100%; text-align: center; padding: 14px 0; font-size: 15px; color: var(--color-text); border-bottom: 1px solid var(--color-divider); }
.as-item:last-child { border-bottom: none; }
.as-item.danger { color: var(--color-danger); }
.as-label { display: block; }
.as-desc { display: block; font-size: 12px; color: var(--color-text-4); margin-top: 2px; }
.as-cancel { display: block; width: 100%; margin-top: 10px; padding: 13px 0; text-align: center; font-size: 15px; color: var(--color-text-3); background: var(--color-bg); border-radius: var(--radius-input); }
</style>
