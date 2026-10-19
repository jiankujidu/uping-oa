<script setup lang="ts">
import { confirmState, closeConfirm } from './confirm'

function onMask() { closeConfirm(false) }
function onOk() { closeConfirm(true) }
function onCancel() { closeConfirm(false) }
</script>

<template>
  <div v-if="confirmState.visible" class="confirm-mask" @click.self="onMask">
    <div class="confirm-dialog" role="alertdialog" aria-modal="true">
      <div class="confirm-title" v-if="confirmState.title && confirmState.title !== '提示'">{{ confirmState.title }}</div>
      <div class="confirm-body">{{ confirmState.message }}</div>
      <div class="confirm-foot">
        <button @click="onCancel">{{ confirmState.cancelText }}</button>
        <button :class="['ok', confirmState.danger ? 'danger' : '']" @click="onOk">{{ confirmState.okText }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-title { padding: 18px 20px 0; text-align: center; font-size: 15px; font-weight: 600; color: #1f2329; }
</style>
