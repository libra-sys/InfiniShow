import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { cn, formatPercent } from '@/lib/utils'
import { useShare } from '@/hooks/useShares'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

interface KPICard {
  label: string
  value: string
  change: number
  status: 'good' | 'warn' | 'bad'
}

interface ActionItem {
  title: string
  desc: string
  priority: 'high' | 'medium' | 'low'
}

const priorityConfig = {
  high: { label: '高优先级', color: 'text-danger', bg: 'bg-danger/10' },
  medium: { label: '中优先级', color: 'text-warning', bg: 'bg-warning/10' },
  low: { label: '低优先级', color: 'text-accent', bg: 'bg-accent/10' },
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [showCta, setShowCta] = useState(true)
  const { data: share } = useShare(token || '')

  const snapshot = (share?.snapshot_data || {}) as {
    title?: string
    overall_score?: string
    kpis?: Array<{ name: string; value: string | number; trend?: string; yoy?: string }>
    actions?: Array<{ title: string; description: string; priority: string; expected_effect?: string }>
  }

  const kpis: KPICard[] = (snapshot.kpis || []).slice(0, 4).map((k) => ({
    label: k.name,
    value: String(k.value),
    change: k.yoy ? parseFloat(k.yoy) || 0 : 0,
    status: k.trend === 'up' ? 'good' : k.trend === 'down' ? 'bad' : 'warn',
  }))

  const actions: ActionItem[] = (snapshot.actions || []).slice(0, 3).map((a) => ({
    title: a.title,
    desc: a.description,
    priority: a.priority as 'high' | 'medium' | 'low',
  }))

  return (
    <div className="min-h-screen bg-base">
      {/* 顶部品牌栏 */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
                <circle cx="20" cy="9" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <span className="text-sm font-bold">可信经营洞察</span>
          </Link>
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
            分享快照
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* 报告头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{snapshot.title || share?.title || '经营诊断报告'}</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            分享 ID: {token}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <ShieldCheck size={12} />
            全链路可溯源 · 结论经数据核验
          </div>
        </div>

        {/* KPI 卡片 */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.length > 0 ? kpis.map((kpi) => (
            <div key={kpi.label} className="card p-4">
              <p className="text-xs text-ink-muted">{kpi.label}</p>
              <p className="mt-1 text-lg font-bold text-ink">{kpi.value}</p>
              <div className={cn('mt-1 flex items-center gap-0.5 text-xs font-medium', kpi.change > 0 ? 'text-success' : kpi.change < 0 ? 'text-danger' : 'text-ink-muted')}>
                {kpi.change > 0 ? <TrendingUp size={12} /> : kpi.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {formatPercent(kpi.change)}
              </div>
            </div>
          )) : (
            <div className="col-span-full card p-4 text-sm text-ink-muted text-center">暂无 KPI 数据</div>
          )}
        </div>

        {/* 经营健康度 */}
        <div className="card mb-8 p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">经营健康度评分</h2>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-accent/20">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-accent">78</div>
                <div className="text-xs text-ink-muted">良好</div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: '盈利能力', score: 82 },
                { label: '运营效率', score: 75 },
                { label: '客户满意', score: 80 },
                { label: '成本控制', score: 70 },
                { label: '成长潜力', score: 85 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-ink-secondary">{item.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-2 rounded-full bg-accent transition-all"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-ink">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 行动建议 */}
        <div className="card mb-8 p-6">
          <h2 className="mb-4 text-base font-semibold text-ink">行动建议</h2>
          <div className="space-y-4">
            {actions.map((action, i) => {
              const cfg = priorityConfig[action.priority as 'high' | 'medium' | 'low'] || priorityConfig.medium
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-sm font-bold text-ink-muted">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{action.title}</h3>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{action.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 溯源说明 */}
        <div className="mb-8 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <h3 className="text-sm font-semibold text-ink">可信溯源</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                本报告所有结论均绑定原始数据行号，可追溯至具体订单、评价和财务记录。
                报告由 InfiniSynapse AI 引擎实时生成，支持平台后台核验。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 底部裂变提示 */}
      {showCta && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                <Zap size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">我也来测一测</p>
                <p className="text-xs text-ink-secondary">上传数据，3分钟出报告</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCta(false)}
                className="hidden rounded-lg px-3 py-2 text-xs text-ink-muted transition-colors hover:text-ink sm:block"
              >
                关闭
              </button>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
              >
                免费体验
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
