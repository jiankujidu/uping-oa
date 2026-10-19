/**
 * 底部 ActionSheet —— 手机端主弹层形态（对应源码 .cate-panel / ActionSheet 动效）。
 * 桌面端禁止使用本组件（桌面用居中模态/右键菜单，见桌面设计规范）。
 * Esc / 遮罩关闭。
 */
import { reactive } from 'vue'

export interface SheetAction {
  label: string
  value: any
  danger?: boolean
  desc?: string
}

interface SheetState {
  visible: boolean
  title: string
  actions: SheetAction[]
}
const state = reactive<SheetState>({ visible: false, title: '', actions: [] })
let resolver: ((v: any) => void) | null = null

export function actionSheet(title: string, actions: SheetAction[]): Promise<any> {
  Object.assign(state, { visible: true, title, actions })
  return new Promise(resolve => { resolver = resolve })
}

export function closeSheet(v?: any) {
  state.visible = false
  if (resolver) { resolver(typeof v === 'undefined' ? null : v); resolver = null }
}

export const sheetState = state
