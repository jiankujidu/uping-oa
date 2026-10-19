<script setup lang="ts">
/**
 * 双端开关容器：按 device store 渲染手机或桌面组件。
 * props.mobile / props.desktop 为组件定义（defineAsyncComponent 实例或普通组件）。
 */
import { computed, h } from 'vue'
import { useDeviceStore } from '@/stores/device'

const props = defineProps<{ mobile?: any; desktop?: any }>()
const device = useDeviceStore()
const cmp = computed(() => (device.isDesktop ? props.desktop : props.mobile) || null)
</script>

<template>
  <component :is="cmp" v-if="cmp" />
</template>
