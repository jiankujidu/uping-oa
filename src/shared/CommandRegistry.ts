/**
 * 命令注册表 —— 双端交互收敛的唯一机制（任务书 §5）。
 *
 * 每个业务命令（删除/通过/驳回/导出/分享/转公海…）只注册一次；
 * 手机端由「长按对象 → 底部 ActionSheet」触发；
 * 桌面端由「右键行菜单 / 快捷键」触发；
 * run() 里的业务逻辑只有一份。
 */

export interface CommandContext {
  type?: string          // 'customer' | 'order' | 'approve' | 'msg' ...
  id?: number | string
  row?: any
  selected?: any[]       // 桌面批量选择
  [k: string]: any
}

export interface Command {
  id: string
  label: string
  danger?: boolean
  /** 桌面端快捷键（单键，如 'Delete' / 'a' / 'r'） */
  shortcut?: string
  /** 是否需要多选上下文（批量操作） */
  batch?: boolean
  when?: (ctx: CommandContext) => boolean
  run: (ctx: CommandContext) => void | Promise<void>
}

class CommandRegistry {
  private cmds = new Map<string, Command>()
  private ctx: CommandContext = {}

  register(cmd: Command) { this.cmds.set(cmd.id, cmd) }
  registerAll(cmds: Command[]) { cmds.forEach(c => this.cmds.set(c.id, c)) }
  unregister(id: string) { this.cmds.delete(id) }
  get(id: string) { return this.cmds.get(id) || null }

  /** 设置当前上下文对象（选中行/长按对象） */
  setContext(ctx: CommandContext) { this.ctx = ctx }
  getContext() { return this.ctx }

  /** 列出当前上下文可用命令（两端共用） */
  list(ctx?: CommandContext): Command[] {
    const c = ctx || this.ctx
    const out: Command[] = []
    this.cmds.forEach(cmd => {
      if (cmd.batch && !(c.selected && c.selected.length)) return
      if (cmd.when && !cmd.when(c)) return
      out.push(cmd)
    })
    const order: Record<string, number> = { view: 0, more: 1, danger: 2 }
    return out.sort((a, b) => {
      const ga = order[(a as any).group || 'more'] ?? 1
      const gb = order[(b as any).group || 'more'] ?? 1
      return ga - gb
    })
  }

  /** 执行命令 */
  async run(id: string, ctx?: CommandContext): Promise<void> {
    const cmd = this.cmds.get(id)
    if (!cmd) return
    await cmd.run(ctx || this.ctx)
  }

  /** 按快捷键查找（桌面端） */
  byShortcut(key: string): Command | null {
    let found: Command | null = null
    this.cmds.forEach(c => { if (c.shortcut && c.shortcut.toLowerCase() === key.toLowerCase()) found = c })
    return found
  }
}

export const registry = new CommandRegistry()
