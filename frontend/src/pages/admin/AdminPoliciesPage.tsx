import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { useAdminPendingPolicies, useReviewPolicy } from '@/hooks/useAdmin'
import type { PolicyFeed } from '@/types/models'
import { Search, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: '待审核', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  approved: { label: '已通过', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  rejected: { label: '已驳回', icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
}

export default function AdminPoliciesPage() {
  const [search, setSearch] = useState('')
  const [confirmPolicy, setConfirmPolicy] = useState<{ policy: PolicyFeed; action: 'approved' | 'rejected' } | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { data } = useAdminPendingPolicies()
  const reviewMutation = useReviewPolicy()

  const policies = data?.items || []

  const filtered = policies.filter((p) =>
    p.title.includes(search) || (p.region || '').includes(search) || (p.source || '').includes(search)
  )

  const handleAction = async (policy: PolicyFeed, action: 'approved' | 'rejected') => {
    setLoadingId(policy.id)
    await reviewMutation.mutateAsync({ policyId: policy.id, status: action })
    setLoadingId(null)
    setConfirmPolicy(null)
  }

  const actionLabels: Record<string, { title: string; desc: string; danger: boolean }> = {
    approved: { title: '通过政策', desc: '确定将该政策标记为「已通过」并对外展示吗？', danger: false },
    rejected: { title: '驳回政策', desc: '确定驳回该政策吗？被驳回的政策不会对外展示。', danger: true },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">政策审核</h1>
        <p className="text-sm text-ink-secondary">审核待确认的政策信息，管理展示状态</p>
      </div>

      {/* 筛选 */}
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索政策标题、地区或来源"
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
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">政策标题</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">来源</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">地区</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">行业</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">状态</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">提交时间</th>
                <th className="px-4 py-3 text-right font-medium text-ink-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((policy) => {
                const cfg = statusConfig[policy.status] || statusConfig.pending
                const Icon = cfg.icon
                return (
                  <tr key={policy.id} className="border-b border-line hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-ink">{policy.title}</td>
                    <td className="px-4 py-3 text-ink-secondary">{policy.source || '-'}</td>
                    <td className="px-4 py-3 text-ink-secondary">{policy.region || '-'}</td>
                    <td className="px-4 py-3 text-ink-secondary">{policy.industry || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{policy.publish_date || new Date(policy.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {policy.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setConfirmPolicy({ policy, action: 'approved' })}
                              disabled={loadingId === policy.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/15"
                            >
                              {loadingId === policy.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              通过
                            </button>
                            <button
                              onClick={() => setConfirmPolicy({ policy, action: 'rejected' })}
                              disabled={loadingId === policy.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/15"
                            >
                              <XCircle size={12} />
                              驳回
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-secondary">暂无待审核政策</div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmPolicy}
        title={confirmPolicy ? actionLabels[confirmPolicy.action].title : ''}
        description={confirmPolicy ? actionLabels[confirmPolicy.action].desc : ''}
        danger={confirmPolicy ? actionLabels[confirmPolicy.action].danger : false}
        confirmText="确认"
        onConfirm={() => confirmPolicy && handleAction(confirmPolicy.policy, confirmPolicy.action)}
        onCancel={() => setConfirmPolicy(null)}
      />
    </div>
  )
}
