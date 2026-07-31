import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { cn, formatNumber } from '@/lib/utils'
import { useDeleteTask, useTasks } from '@/hooks/useTasks'
import { TaskStatus } from '@/types/enums'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; icon: typeof Loader2; color: string; bg: string; animate: string }> = {
  [TaskStatus.PENDING]: { label: '等待中', icon: Clock, color: 'text-ink-muted', bg: 'bg-elevated', animate: '' },
  [TaskStatus.CONNECTING]: { label: '连接中', icon: Loader2, color: 'text-accent', bg: 'bg-accent/10', animate: 'animate-spin' },
  [TaskStatus.RUNNING]: { label: '进行中', icon: Loader2, color: 'text-accent', bg: 'bg-accent/10', animate: 'animate-spin' },
  [TaskStatus.COMPLETED]: { label: '已完成', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', animate: '' },
  [TaskStatus.FAILED]: { label: '失败', icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', animate: '' },
  [TaskStatus.CANCELLED]: { label: '已取消', icon: XCircle, color: 'text-ink-muted', bg: 'bg-elevated', animate: '' },
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const { data } = useTasks(page, pageSize)
  const deleteMutation = useDeleteTask()

  const tasks = useMemo(() => data?.items || [], [data])

  const filtered = useMemo(
    () => tasks.filter((t) => (filter === 'all' ? true : t.status === filter)),
    [tasks, filter]
  )
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleDelete = (id: string) => {
    if (!window.confirm('确定删除该任务？此操作不可恢复。')) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} />
          返回首页
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">我的分析</h1>
            <p className="mt-1 text-sm text-ink-secondary">查看和管理您的所有分析任务</p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
          >
            新建分析
          </Link>
        </div>

        {/* 状态筛选 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { key: 'all', label: '全部' },
            { key: 'running', label: '进行中' },
            { key: 'completed', label: '已完成' },
            { key: 'failed', label: '失败' },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => { setFilter(item.key); setPage(1) }}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filter === item.key
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-line text-ink-secondary hover:bg-elevated hover:text-ink'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        <div className="space-y-3">
          {paged.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16">
              <FileBarChart size={48} className="text-ink-muted" />
              <p className="mt-4 text-sm text-ink-secondary">暂无任务</p>
              <Link to="/upload" className="mt-2 text-sm text-accent hover:text-accent-hover">
                去创建第一个分析
              </Link>
            </div>
          ) : (
            paged.map((task) => {
              const cfg = statusConfig[task.status]
              const Icon = cfg.icon
              return (
                <div
                  key={task.id}
                  className="card flex flex-col gap-4 p-5 transition-shadow hover:shadow-elevated sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
                      <Icon size={20} className={cn(cfg.color, cfg.animate)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink">{task.scenario_name}</h3>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(task.created_at).toLocaleString()}
                        </span>
                        <span>ID: {task.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {task.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/reports?task_id=${task.id}`)}
                        className="rounded-lg bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                      >
                        查看报告
                      </button>
                    )}
                    {task.status === 'running' && (
                      <button
                        onClick={() => navigate(`/analysis/${task.id}`)}
                        className="rounded-lg bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                      >
                        查看进度
                      </button>
                    )}
                    {task.status === 'failed' && (
                      <button
                        onClick={() => navigate('/upload')}
                        className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
                      >
                        重新分析
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              共 {formatNumber(total)} 条，第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-secondary transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-secondary transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
