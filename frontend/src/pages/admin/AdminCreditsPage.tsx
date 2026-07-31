import { useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'
import { useAdminCreditLogs, useAdjustCredits } from '@/hooks/useAdmin'
import { useUIStore } from '@/store/uiStore'
import { Search, Plus, Minus, Loader2 } from 'lucide-react'

export default function AdminCreditsPage() {
  const [search, setSearch] = useState('')
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ userId: '', amount: '', reason: '' })
  const addToast = useUIStore((s) => s.addToast)

  const { data } = useAdminCreditLogs()
  const adjustMutation = useAdjustCredits()

  const logs = data?.items || []
  const filtered = logs.filter(
    (l) =>
      l.user_id.includes(search) ||
      l.type.includes(search) ||
      String(l.amount).includes(search)
  )

  const handleAdjust = async () => {
    if (!adjustForm.userId || !adjustForm.amount || !adjustForm.reason) return
    try {
      await adjustMutation.mutateAsync({
        userId: adjustForm.userId,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason,
      })
      addToast({ type: 'success', message: '额度调整成功' })
      setShowAdjust(false)
      setAdjustForm({ userId: '', amount: '', reason: '' })
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '调整失败' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">额度管理</h1>
          <p className="text-sm text-ink-secondary">查询额度流水并手动调整用户额度</p>
        </div>
        <button
          onClick={() => setShowAdjust(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
        >
          <Plus size={16} />
          调整额度
        </button>
      </div>

      {/* 搜索 */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户或原因"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* 表格 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-elevated/50">
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">时间</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">用户</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">变动</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">余额</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">原因</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">操作人</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-line transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-ink-secondary">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{log.user_id}</div>
                    <div className="text-xs text-ink-muted">{log.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 font-medium',
                        log.amount > 0 ? 'text-success' : 'text-danger'
                      )}
                    >
                      {log.amount > 0 ? <Plus size={12} /> : <Minus size={12} />}
                      {Math.abs(log.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(log.balance)}</td>
                  <td className="px-4 py-3 text-ink">{log.type}</td>
                  <td className="px-4 py-3 text-ink-secondary">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-secondary">未找到记录</div>
        )}
      </div>

      {/* 调整额度弹窗 */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-popover">
            <h3 className="text-base font-semibold text-ink">调整额度</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">用户 ID</label>
                <input
                  type="text"
                  value={adjustForm.userId}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, userId: e.target.value }))}
                  placeholder="例如：u_001"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">变动数量（正数增加，负数扣除）</label>
                <input
                  type="number"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="例如：10 或 -5"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">原因</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="例如：运营补偿"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowAdjust(false)}
                className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
              >
                取消
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjustMutation.isPending || !adjustForm.userId || !adjustForm.amount || !adjustForm.reason}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all',
                  adjustMutation.isPending || !adjustForm.userId || !adjustForm.amount || !adjustForm.reason
                    ? 'cursor-not-allowed bg-accent/70'
                    : 'bg-accent hover:bg-accent-hover'
                )}
              >
                {adjustMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                确认调整
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
