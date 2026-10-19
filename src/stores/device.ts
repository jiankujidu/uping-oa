import { defineStore } from 'pinia'

export type DeviceKind = 'phone' | 'desktop'

/**
 * 双端判定：
 *  >=1024px 且 (hover:hover) 且 (pointer:fine) → 桌面布局
 *  <768px → 手机布局
 *  768–1024 → 手机布局放大版（方案理由见 PLAN.md §C：
 *    该区间放桌面三栏会挤压表格；客户/订单表单字段多，纵向单列更舒适；
 *    原 APK 本身即手机应用，平板最贴近"还原"目标的是手机布局放大版）
 */
const mqDesktop = window.matchMedia('(min-width:1024px) and (hover:hover) and (pointer:fine)')
const mqPhone = window.matchMedia('(max-width:767px)')

export const useDeviceStore = defineStore('device', {
  state: () => ({
    kind: 'phone' as DeviceKind,
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    hasFinePointer: false,
    canHover: false,
    override: 'auto' as 'auto' | 'phone' | 'desktop'
  }),
  getters: {
    isDesktop: (s) => s.kind === 'desktop',
    isPhone: (s) => s.kind === 'phone'
  },
  actions: {
    detect() {
      this.hasFinePointer = mqDesktop.matches
      this.canHover = window.matchMedia('(hover:hover)').matches
      this.width = window.innerWidth
      const desktop = (this.width >= 1024) && window.matchMedia('(pointer:fine)').matches
      if (this.override === 'desktop') this.kind = 'desktop'
      else if (this.override === 'phone') this.kind = 'phone'
      else this.kind = desktop ? 'desktop' : 'phone'
    },
    setOverride(v: 'auto' | 'phone' | 'desktop') {
      this.override = v
      this.detect()
    },
    bind() {
      this.detect()
      const on = () => this.detect()
      mqDesktop.addEventListener('change', on)
      window.addEventListener('resize', on)
    }
  }
})
