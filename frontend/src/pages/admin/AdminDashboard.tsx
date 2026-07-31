import { Link } from 'react-router-dom'
import { Users, Coins, ClipboardList, FileCheck, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { useAdminTasks, useAdminUsers } from '@/hooks/useAdmin'

export default function AdminDashboard() {
  const { data: usersData } = useAdminUsers()
  const { data: tasksData } = useAdminTasks()

  const completedTasks = tasksData?.items?.filter((t) => t.status === 'completed').length || 0

  const stats = [
    { label: '注册用户', value: usersData?.meta?.total || 0, change: 0, icon: Users, path: '/admin/users' },
    { label: '总任务', value: tasksData?.meta?.total || 0, change: 0, icon: ClipboardList, path: '/admin/tasks' },
    { label: '已完成任务', value: completedTasks, change: 0, icon: Coins, path: '/admin/tasks' },
    { label: '待审政策', value: 0, change: 0, icon: FileCheck, path: '/admin/policies' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">数据概览</h1>
        <p className="text-sm text-ink-secondary">平台核心运营指标实时监控</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const positive = stat.change > 0
          return (
            <Link
              key={stat.label}
              to={stat.path}
              className="card group p-5 transition-shadow hover:shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon size={20} />
                </div>
                <div className={cn('flex items-center gap-0.5 text-xs font-medium', positive ? 'text-success' : stat.change < 0 ? 'text-danger' : 'text-ink-muted')}>
                  {positive ? <TrendingUp size={12} /> : stat.change < 0 ? <TrendingDown size={12} /> : null}
                  {stat.change === 0 ? '—' : `${Math.abs(stat.change)}%`}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-ink">{formatNumber(stat.value)}</div>
                <div className="text-xs text-ink-muted">{stat.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 快捷入口 */}
      <div className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">快捷入口</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: '查看用户列表', desc: '筛选与禁用账号', path: '/admin/users' },
            { label: '调整用户额度', desc: '手动发放或扣除', path: '/admin/credits' },
            { label: '核验任务', desc: '查看 connId 与平台链接', path: '/admin/tasks' },
            { label: '审核政策', desc: '待审核与已归档', path: '/admin/policies' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-elevated"
            >
              <div className="text-sm font-medium text-ink">{item.label}</div>
              <div className="mt-1 text-xs text-ink-muted">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
