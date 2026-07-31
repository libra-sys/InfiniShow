import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { policiesApi } from '@/api/policies'
import { useUIStore } from '@/store/uiStore'
import type { PolicyFeed } from '@/types/models'
import {
  ArrowLeft,
  Search,
  MapPin,
  Building2,
  ExternalLink,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react'

const regions = ['全部', '北京市', '上海市', '广东省', '浙江省', '深圳市', '广州市']
const industries = ['全部', '餐饮', '电商', '综合零售', '美业', '教培', '健身']

export default function PolicyPage() {
  const [region, setRegion] = useState('全部')
  const [industry, setIndustry] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [policies, setPolicies] = useState<PolicyFeed[]>([])
  const [loading, setLoading] = useState(false)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down' | undefined>>({})
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await policiesApi.search({
          keyword: keyword || undefined,
          region: region === '全部' ? undefined : region,
          industry: industry === '全部' ? undefined : industry,
        })
        setPolicies(res.items)
      } catch (err) {
        addToast({ type: 'error', message: err instanceof Error ? err.message : '加载政策失败' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [region, industry, keyword])

  const loadPolicies = async () => {
    setLoading(true)
    try {
      const res = await policiesApi.search({
        keyword: keyword || undefined,
        region: region === '全部' ? undefined : region,
        industry: industry === '全部' ? undefined : industry,
      })
      setPolicies(res.items)
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '加载政策失败' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadPolicies()
  }

  const handleFeedback = async (id: string, type: 'up' | 'down') => {
    try {
      await policiesApi.feedback({
        policy_id: id,
        feedback_type: type === 'up' ? 'useful' : 'irrelevant',
      })
      setFeedbackMap((prev) => ({ ...prev, [id]: prev[id] === type ? undefined : type }))
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '反馈失败' })
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} />
          返回首页
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">政策匹配</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            基于您的经营属地与行业，智能匹配适用的政府扶持政策
          </p>
        </div>

        {/* 筛选栏 */}
        <div className="card mb-6 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* 属地 */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-ink-secondary">经营属地</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-line bg-surface py-2.5 pl-9 pr-8 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                >
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 行业 */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-ink-secondary">所属行业</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-line bg-surface py-2.5 pl-9 pr-8 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                >
                  {industries.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 关键词 */}
            <div className="flex-[2]">
              <label className="mb-1.5 block text-xs font-medium text-ink-secondary">关键词</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索政策名称或内容"
                  className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              查询
            </button>
          </div>
        </div>

        {/* 降级提示 */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <div className="text-xs leading-relaxed text-ink-secondary">
            <p className="font-medium text-ink">检索说明</p>
            <p className="mt-1">
              政策数据每日自动更新，首次查询属地时可能需 1-2 秒加载。
              当检索服务暂不可用时，系统将自动降级到本地种子库，确保基础政策覆盖。
            </p>
          </div>
        </div>

        {/* 结果列表 */}
        <div className="space-y-3">
          {policies.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16">
              <Search size={48} className="text-ink-muted" />
              <p className="mt-4 text-sm text-ink-secondary">未找到匹配的政策</p>
              <p className="mt-1 text-xs text-ink-muted">尝试更换筛选条件或关键词</p>
            </div>
          ) : (
            policies.map((policy) => (
              <div key={policy.id} className="card p-5 transition-shadow hover:shadow-elevated">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{policy.title}</h3>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {policy.region || '全国'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {policy.industry || '综合'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {policy.publish_date || '近期'}
                      </span>
                      <span>{policy.source || '政策来源'}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{policy.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    {policy.source_url && (
                      <a
                        href={policy.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
                      >
                        查看原文
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleFeedback(policy.id, 'up')}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                          feedbackMap[policy.id] === 'up'
                            ? 'bg-success/10 text-success'
                            : 'text-ink-muted hover:bg-elevated hover:text-ink'
                        )}
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleFeedback(policy.id, 'down')}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                          feedbackMap[policy.id] === 'down'
                            ? 'bg-danger/10 text-danger'
                            : 'text-ink-muted hover:bg-elevated hover:text-ink'
                        )}
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
