<script setup lang="ts">
import { onMounted } from 'vue'
import ToastHost from '@/shared/ToastHost.vue'
import ConfirmHost from '@/shared/ConfirmHost.vue'
import ActionSheetHost from '@/shared/ActionSheetHost.vue'
import ContextMenuHost from '@/shared/ContextMenuHost.vue'
import ProxyBanner from '@/shared/ProxyBanner.vue'
import { useDeviceStore } from '@/stores/device'

const device = useDeviceStore()

onMounted(() => { device.bind() })
</script>

<template>
  <ProxyBanner />
  <router-view v-slot="{ Component }">
    <transition name="page-slide" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <ToastHost />
  <ConfirmHost />
  <ActionSheetHost />
  <ContextMenuHost />
</template>
