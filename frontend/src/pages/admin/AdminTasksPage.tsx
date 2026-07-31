import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAdminTasks } from '@/hooks/useAdmin'
import { Search, ExternalLink, Copy, Check } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '等待中', color: 'text-ink-muted', bg: 'bg-elevated' },
  connecting: { label: '连接中', color: 'text-accent', bg: 'bg-accent/10' },
  running: { label: '进行中', color: 'text-accent', bg: 'bg-accent/10' },
  completed: { label: '已完成', color: 'text-success', bg: 'bg-success/10' },
  failed: { label: '失败', color: 'text-danger', bg: 'bg-danger/10' },
  cancelled: { label: '已取消', color: 'text-ink-muted', bg: 'bg-elevated' },
}

export default function AdminTasksPage() {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { data } = useAdminTasks()

  const tasks = data?.items || []

  const filtered = tasks.filter(
    (t) =>
      t.id.includes(search) ||
      t.conn_id?.includes(search) ||
      t.scenario_name.includes(search)
  )

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getVerifyUrl = () => `https://app.infinisynapse.cn`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">任务核验</h1>
        <p className="text-sm text-ink-secondary">查看全部任务并跳转 InfiniSynapse 平台核验</p>
      </div>

      {/* 搜索 */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索任务 ID、connId 或场景"
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
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">任务 ID</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">connId</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">场景</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">状态</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">进度</th>
                <th className="px-4 py-3 text-left font-medium text-ink-secondary">创建时间</th>
                <th className="px-4 py-3 text-right font-medium text-ink-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} className="border-b border-line hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{task.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-secondary">
                    <div className="flex items-center gap-2">
                      {task.conn_id || '-'}
                      {task.conn_id && (
                        <button
                          onClick={() => copyToClipboard(task.conn_id!, task.id)}
                          className="text-ink-muted hover:text-accent"
                          title="复制 connId"
                        >
                          {copiedId === task.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{task.scenario_name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig[task.status]?.bg || 'bg-elevated', statusConfig[task.status]?.color || 'text-ink-muted')}>
                      {statusConfig[task.status]?.label || task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{task.progress}%</td>
                  <td className="px-4 py-3 text-ink-secondary">{new Date(task.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={getVerifyUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
                    >
                      核验
                      <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-secondary">未找到任务</div>
        )}
      </div>
    </div>
  )
}
