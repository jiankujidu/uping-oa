import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/api/endpoints'

/** 消息未读角标 + 轮询（原 APK 原生 10s 轮询 → 网页：页面可见时 10s + 切回前台补拉） */
export const useMsgBadgeStore = defineStore('msgBadge', () => {
  const unread = ref(0)
  let timer: number | null = null

  async function pull() {
    try {
      const r = await API.indexInfo()
      if (r && r.code === 0 && r.data && typeof r.data.msg_num !== 'undefined') {
        unread.value = Number(r.data.msg_num) || 0
      }
    } catch { /* 角标失败静默，不影响主流程 */ }
  }

  function start() {
    stop()
    pull()
    timer = window.setInterval(pull, 10000)
    document.addEventListener('visibilitychange', onVisible)
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null }
    document.removeEventListener('visibilitychange', onVisible)
  }
  function onVisible() {
    if (!document.hidden) pull()
  }

  return { unread, pull, start, stop }
})
