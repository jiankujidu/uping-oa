/** 全局 Toast（对应原 APK app-toast，深色半透底/居中/1.8s） */
import { reactive } from 'vue'

export interface ToastItem { id: number; msg: string }
export const toastItems = reactive<ToastItem[]>([])
let seq = 0

export function toast(msg: string, dur = 1800) {
  const id = ++seq
  toastItems.push({ id, msg })
  setTimeout(() => {
    const i = toastItems.findIndex(x => x.id === id)
    if (i >= 0) toastItems.splice(i, 1)
  }, dur)
}
