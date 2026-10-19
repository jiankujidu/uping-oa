<script setup lang="ts">
defineProps<{ icon?: string; text: string; actionText?: string }>()
const emit = defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon || '—' }}</div>
    <div class="empty-text">{{ text }}</div>
    <button v-if="actionText" class="act-btn" @click="emit('action')">{{ actionText }}</button>
  </div>
</template>
