<script setup lang="ts">
import { computed } from 'vue'
import { getProxyState, onProxyState } from '@/api/client'
import { ref } from 'vue'

const state = ref(getProxyState())
onProxyState(s => { state.value = s })

const text = computed(() => {
  if (state.value === 'down') return 'API 未连接：当前为内置演示数据（mock），配置 VITE_PROXY_BASE 并部署反代后连接真实 OA'
  return ''
})
</script>

<template>
  <div v-if="text" class="proxy-banner" role="status">
    <span class="dot" />
    <span class="txt">{{ text }}</span>
  </div>
</template>

<style scoped>
.proxy-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1300;
  display: flex; align-items: center; gap: 8px;
  background: #FFF7E6; color: #854F0B; border-bottom: 1px solid #FAC775;
  font-size: 12px; line-height: 1.5; padding: 7px 14px;
  padding-top: calc(7px + env(safe-area-inset-top));
}
.proxy-banner .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: #EF9F27; }
.proxy-banner .txt { min-width: 0; }
</style>
