/** 二次确认对话框（居中模态，双端通用；手机端对应源码 uiConfirm） */
import { reactive } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  okText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean
}
const state = reactive<ConfirmState>({ visible: false, message: '' })
let resolver: ((ok: boolean) => void) | null = null

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  Object.assign(state, { title: '提示', okText: '确定', cancelText: '取消', danger: false, ...opts, visible: true })
  return new Promise(resolve => { resolver = resolve })
}

export function closeConfirm(ok: boolean) {
  state.visible = false
  if (resolver) { resolver(ok); resolver = null }
}

export const confirmState = state
