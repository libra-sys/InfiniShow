import { useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { useAdminUsers, useToggleUserStatus } from '@/hooks/useAdmin'
import type { User } from '@/types/models'
import { Search, Ban, CheckCircle2, Loader2 } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { data } = useAdminUsers(search)
  const toggleMutation = useToggleUserStatus()

  const users = data?.items || []

  const toggleStatus = async (user: User) => {
    setLoadingId(user.id)
    await toggleMutation.mutateAsync(user.id)
    setLoadingId(null)
    setConfirmUser(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">用户管理</h1>
        <p className="text-sm text-ink-secondary">查看、筛选和管理平台用户</p>
      </div>

      {/* 搜索 */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索手机号、昵称或用户 ID"
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
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">用户</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">角色</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">状态</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">额度</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">注册时间</th>
                <th className="px-4 py-3 text-right font-medium text-ink-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-line transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-ink">{user.nickname || '未命名'}</div>
                      <div className="text-xs text-ink-muted">{user.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        user.role === 'admin' || user.role === 'superadmin'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-elevated text-ink-secondary'
                      )}
                    >
                      {user.role === 'admin' || user.role === 'superadmin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        user.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      )}
                    >
                      {user.is_active ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                      {user.is_active ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(user.credits)}</td>
                  <td className="px-4 py-3 text-ink-secondary">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setConfirmUser(user)}
                      disabled={loadingId === user.id || user.role === 'superadmin'}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        user.is_active
                          ? 'text-danger hover:bg-danger/10'
                          : 'text-success hover:bg-success/10'
                      )}
                    >
                      {loadingId === user.id ? <Loader2 size={12} className="animate-spin" /> : null}
                      {user.is_active ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-secondary">未找到匹配用户</div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmUser}
        title={confirmUser?.is_active ? '禁用用户' : '启用用户'}
        description={`确定要${confirmUser?.is_active ? '禁用' : '启用'}用户「${confirmUser?.nickname || confirmUser?.phone}」吗？`}
        danger={confirmUser?.is_active}
        confirmText="确认"
        onConfirm={() => confirmUser && toggleStatus(confirmUser)}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  )
}
