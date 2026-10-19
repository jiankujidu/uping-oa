/**
 * 全局命令注册 —— 双端交互收敛（任务书 §5）。
 * 每个业务命令只写一份 run()；手机端长按→ActionSheet，桌面端右键/快捷键。
 * 在 main.ts 引入即完成注册。
 */
import { registry } from './CommandRegistry'
import { confirm } from './confirm'
import { toast } from './toast'
import { API } from '@/api/endpoints'

export function registerBuiltinCommands(invalidate?: (kind?: string) => void) {
  registry.registerAll([
    {
      id: 'approve.pass',
      label: '通过',
      shortcut: 'a',
      when: (ctx) => ctx.type === 'approve',
      run: async (ctx) => {
        const ok = await confirm({ title: '通过审批', message: '确认通过该审批？', okText: '通过' })
        if (!ok) return
        const r = await API.approveCheck(Number(ctx.id || 0), 2, ctx.remark || '')
        if (r && r.code === 0) { toast('已通过'); invalidate?.('approve') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'approve.reject',
      label: '驳回',
      shortcut: 'r',
      danger: true,
      when: (ctx) => ctx.type === 'approve',
      run: async (ctx) => {
        const ok = await confirm({ title: '驳回审批', message: '确认驳回该审批？', okText: '驳回', danger: true })
        if (!ok) return
        const r = await API.approveCheck(Number(ctx.id || 0), 3, ctx.remark || '')
        if (r && r.code === 0) { toast('已驳回'); invalidate?.('approve') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'order.check',
      label: '审单通过',
      when: (ctx) => ctx.type === 'order',
      run: async (ctx) => {
        const ok = await confirm({ title: '审单通过', message: '确认通过该订单？', okText: '通过' })
        if (!ok) return
        const r = await API.orderFlowCheck(Number(ctx.id || 0), 1, ctx.remark || '')
        if (r && r.code === 0) { toast('已通过'); invalidate?.('order') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'order.reject',
      label: '审单驳回',
      danger: true,
      when: (ctx) => ctx.type === 'order',
      run: async (ctx) => {
        const ok = await confirm({ title: '审单驳回', message: '确认驳回该订单？', okText: '驳回', danger: true })
        if (!ok) return
        const r = await API.orderFlowCheck(Number(ctx.id || 0), 2, ctx.remark || '')
        if (r && r.code === 0) { toast('已驳回'); invalidate?.('order') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'order.agreement',
      label: '生成销售协议',
      when: (ctx) => ctx.type === 'order',
      run: (ctx) => { location.hash = '#/detail/sales-agreement/' + ctx.id }
    },
    {
      id: 'customer.sea',
      label: '转入公海',
      danger: true,
      when: (ctx) => ctx.type === 'customer',
      run: async (ctx) => {
        const ok = await confirm({ title: '转入公海', message: '确认将该客户转入公海？', okText: '转入', danger: true })
        if (!ok) return
        const r = await API.customerToSea(Number(ctx.id || 0))
        if (r && r.code === 0) { toast('已转入公海'); invalidate?.('customer') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'customer.transfer',
      label: '转移客户',
      when: (ctx) => ctx.type === 'customer',
      run: async (ctx) => {
        const input = prompt('输入接收人 UID：')
        if (!input) return
        const r = await API.customerTransfer({ id: Number(ctx.id || 0), uid: Number(input) })
        if (r && r.code === 0) { toast('已转移'); invalidate?.('customer') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'customer.edit',
      label: '编辑客户',
      when: (ctx) => ctx.type === 'customer',
      run: (ctx) => { location.hash = '#/p/customer-add' }
    },
    {
      id: 'order.delete',
      label: '删除订单',
      danger: true,
      when: (ctx) => ctx.type === 'order',
      run: async (ctx) => {
        const ok = await confirm({ title: '删除订单', message: '删除后不可恢复，确认删除？', okText: '删除', danger: true })
        if (!ok) return
        const r = await API.orderDelete(Number(ctx.id || 0))
        if (r && r.code === 0) { toast('已删除'); invalidate?.('order') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'msg.delete',
      label: '删除消息',
      danger: true,
      when: (ctx) => ctx.type === 'msg',
      run: async (ctx) => {
        const r = await API.messageCheck(String(ctx.id || ''), 2, ctx.source || 0)
        if (r && r.code === 0) { toast('已删除'); invalidate?.('msg') }
        else toast(r?.msg || '操作失败')
      }
    },
    {
      id: 'order.export',
      label: '导出选中（CSV）',
      batch: true,
      when: (ctx) => ctx.type === 'order',
      run: async (ctx) => {
        const { exportCsv } = await import('./exportImport')
        exportCsv(ctx.selected || [], 'orders-export', [
          { key: 'code', label: '订单号' }, { key: 'customer_name', label: '客户' },
          { key: 'amount', label: '金额' }, { key: 'status_name', label: '状态' },
          { key: 'create_time', label: '创建时间' }
        ])
      }
    }
  ])
}
