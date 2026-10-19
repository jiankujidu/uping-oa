/** 桌面端右键上下文菜单（对应手机端 ActionSheet，命令源同一注册表） */
import { reactive } from 'vue'
import { registry, type CommandContext } from './CommandRegistry'

interface MenuState {
  visible: boolean
  x: number
  y: number
  title: string
  items: { id: string; label: string; danger: boolean }[]
}
const state = reactive<MenuState>({ visible: false, x: 0, y: 0, title: '', items: [] })
let currentCtx: CommandContext = {}

export function openContextMenu(e: MouseEvent, ctx: CommandContext, title = '') {
  e.preventDefault()
  currentCtx = ctx
  registry.setContext(ctx)
  const cmds = registry.list(ctx)
  state.items = cmds.map(c => ({ id: c.id, label: c.label, danger: !!c.danger }))
  state.title = title
  // 边缘翻转，避免溢出窗口
  state.x = Math.min(e.clientX, window.innerWidth - 180)
  state.y = Math.min(e.clientY, window.innerHeight - state.items.length * 36 - 60)
  state.visible = true
}

export function closeContextMenu() { state.visible = false }

export async function runMenu(id: string) {
  state.visible = false
  await registry.run(id, currentCtx)
}

export const contextMenuState = state
