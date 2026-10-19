<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div class="sk-list">
    <div v-for="i in rows" :key="i" class="skeleton-row" />
  </div>
</template>
