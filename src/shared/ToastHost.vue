<script setup lang="ts">
import { toastItems } from './toast'
</script>

<template>
  <transition-group name="toast-fade">
    <div v-for="t in toastItems" :key="t.id" class="app-toast">{{ t.msg }}</div>
  </transition-group>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .2s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }
</style>
