<script setup lang="ts">
import { contextMenuState, closeContextMenu, runMenu } from './contextMenu'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()
function pick(id: string) { runMenu(id) }
</script>

<template>
  <teleport to="body">
    <div v-if="contextMenuState.visible && device.isDesktop" class="ctx-backdrop" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu" />
    <ul v-if="contextMenuState.visible && device.isDesktop" class="ctx-menu" :style="{ left: contextMenuState.x + 'px', top: contextMenuState.y + 'px' }" role="menu">
      <li v-if="contextMenuState.title" class="ctx-title">{{ contextMenuState.title }}</li>
      <li v-for="it in contextMenuState.items" :key="it.id" :class="['ctx-item', it.danger ? 'danger' : '']" @click="pick(it.id)" role="menuitem">{{ it.label }}</li>
    </ul>
  </teleport>
</template>

<style scoped>
.ctx-backdrop { position: fixed; inset: 0; z-index: 1200; }
.ctx-menu {
  position: fixed; z-index: 1201; min-width: 160px; max-width: 240px;
  background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-input);
  box-shadow: 0 6px 24px rgba(0,0,0,.12); padding: var(--sp-1) 0; list-style: none;
  font-size: var(--font-base); color: var(--color-text);
}
.ctx-title { padding: 6px 14px; font-size: var(--font-smd); color: var(--color-text-4); border-bottom: 1px solid var(--color-divider); margin-bottom: 4px; }
.ctx-item { padding: 8px 14px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ctx-item:hover { background: var(--color-primary-bg-2); color: var(--color-primary); }
.ctx-item.danger { color: var(--color-danger); }
.ctx-item.danger:hover { background: var(--color-danger-bg); }
</style>
