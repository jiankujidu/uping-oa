/**
 * 手机端下拉刷新 composable（桌面端用刷新按钮/自动轮询替代）。
 * 用法：绑定 touchstart/touchmove/touchend 到滚动容器。
 */
import { ref } from 'vue'

export function usePullRefresh(onRefresh: () => Promise<void> | void) {
  const pulling = ref(false)
  const distance = ref(0)
  const refreshing = ref(false)
  const THRESHOLD = 60

  let startY = 0
  let scrollEl: HTMLElement | null = null

  function onStart(e: TouchEvent, el: HTMLElement) {
    scrollEl = el
    if (el.scrollTop <= 0 && !refreshing.value) {
      startY = e.touches[0].clientY
      pulling.value = true
    }
  }

  function onMove(e: TouchEvent) {
    if (!pulling.value || refreshing.value) return
    const dy = e.touches[0].clientY - startY
    if (dy > 0) distance.value = Math.min(90, dy * 0.5)
  }

  async function onEnd() {
    if (!pulling.value) return
    pulling.value = false
    if (distance.value >= THRESHOLD * 0.5) {
      refreshing.value = true
      distance.value = THRESHOLD
      try { await onRefresh() } finally {
        refreshing.value = false
        distance.value = 0
      }
    } else {
      distance.value = 0
    }
  }

  return { pulling, distance, refreshing, onStart, onMove, onEnd }
}
