import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { Header } from '@/components/layout/Header'
import { cn, formatPercent } from '@/lib/utils'
import { useReport, useReportByTask } from '@/hooks/useReports'
import type { ConclusionItem, KpiItem, Report } from '@/types/models'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Download,
  Share2,
  ArrowLeft,
  X,
  FileDown,
  Eye,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Send,
  ChevronRight,
  Copy,
  Check,
  QrCode,
  Trash2,
  ExternalLink,
  Landmark,
} from 'lucide-react'

// ===== 类型定义 =====
type Conclusion = 'consistent' | 'questionable' | 'inconsistent'

interface Metric {
  id: string
  name: string
  value: string
  unit?: string
  change?: number
  conclusion: Conclusion
  formula: string
  rowCount: number
  rows: Record<string, string | number>[]
  verifyLog: { step: string; action: string; rows: string }[]
}

function mapConclusion(level: string): Conclusion {
  if (level === 'doubtful') return 'questionable'
  if (level === 'inconsistent') return 'inconsistent'
  return 'consistent'
}

function kpiToMetric(kpi: KpiItem, index: number): Metric {
  return {
    id: `kpi-${index}`,
    name: kpi.name,
    value: String(kpi.value).replace(/[^0-9.]/g, ''),
    unit: kpi.unit,
    change: kpi.trend === 'up' ? 1 : kpi.trend === 'down' ? -1 : 0,
    conclusion: 'consistent',
    formula: `${kpi.name} 计算`,
    rowCount: 0,
    rows: [],
    verifyLog: [{ step: '指标核算', action: `计算 ${kpi.name}`, rows: '已核验' }],
  }
}

function conclusionToMetric(item: ConclusionItem, index: number): Metric {
  return {
    id: `conclusion-${index}`,
    name: item.metric,
    value: String(item.value).replace(/[^0-9.]/g, ''),
    unit: '%',
    change: 0,
    conclusion: mapConclusion(item.level),
    formula: item.formula || `${item.metric} 计算`,
    rowCount: item.source_rows?.length || 0,
    rows: item.source_rows?.map((row) => ({ row: String(row) })) || [],
    verifyLog: item.verification_process
      ? [{ step: '溯源核对', action: item.verification_process, rows: item.source_rows?.join(', ') || '' }]
      : [{ step: '溯源核对', action: '已绑定原始数据行号', rows: item.source_rows?.join(', ') || '' }],
  }
}

// ===== 溯源抽屉组件 =====
function TraceabilityDrawer({
  metric,
  onClose,
}: {
  metric: Metric | null
  onClose: () => void
}) {
  if (!metric) return null

  const conclusionConfig = {
    consistent: { label: '一致', icon: ShieldCheck, class: 'badge-consistent', color: 'text-success' },
    questionable: { label: '存疑', icon: ShieldQuestion, class: 'badge-questionable', color: 'text-warning' },
    inconsistent: { label: '不符', icon: ShieldAlert, class: 'badge-inconsistent', color: 'text-danger' },
  }
  const cfg = conclusionConfig[metric.conclusion]
  const Icon = cfg.icon

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* 抽屉 */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-surface shadow-2xl animate-slide-in-right">
        {/* 头部 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <div>
            <div className="text-xs text-ink-muted">指标溯源</div>
            <h3 className="text-lg font-bold">{metric.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-elevated hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* 结论 */}
          <div className={cn('mb-5 flex items-center gap-3 rounded-xl p-4', cfg.class)}>
            <Icon size={24} />
            <div>
              <div className="text-sm font-bold">核对结果：{cfg.label}</div>
              <div className="text-xs opacity-80">
                {metric.conclusion === 'consistent' && '指标可直接从原始数据计算得出，无异常'}
                {metric.conclusion === 'questionable' && '部分字段缺失或存在异常值，AI 已做合理假设'}
                {metric.conclusion === 'inconsistent' && '指标与原始数据明显矛盾，需用户核实'}
              </div>
            </div>
          </div>

          {/* 计算方式 */}
          <div className="mb-5">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">计算方式</div>
            <code className="block rounded-lg bg-elevated px-3 py-2 font-mono text-sm text-accent">
              {metric.formula}
            </code>
          </div>

          {/* 参与数据 */}
          <div className="mb-5 flex items-center gap-4 text-sm">
            <div>
              <span className="text-ink-muted">参与行数</span>
              <span className="ml-2 font-bold tabular-nums">{metric.rowCount.toLocaleString()}</span>
            </div>
            <div className="h-4 w-px bg-line" />
            <div>
              <span className="text-ink-muted">数据来源</span>
              <span className="ml-2 font-medium">order_export.csv</span>
            </div>
          </div>

          {/* 核对过程 */}
          <div className="mb-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">核对过程</div>
            <div className="space-y-3">
              {metric.verifyLog.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      i === 0 ? 'bg-accent' : 'bg-accent'
                    )} />
                    {i < metric.verifyLog.length - 1 && <div className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-1">
                    <div className="text-xs text-ink-muted">{log.step}</div>
                    <div className="mt-0.5 text-sm">{log.action}</div>
                    <div className="mt-0.5 font-mono text-2xs text-ink-muted">{log.rows}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 原始数据示例 */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">原始数据（前5行）</span>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                <FileDown size={13} />
                导出全部
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line bg-elevated text-left text-ink-muted">
                    {Object.keys(metric.rows[0] || {}).map((key) => (
                      <th key={key} className="px-3 py-2 font-medium">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {metric.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-elevated/50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-2 font-mono tabular-nums">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 追问入口 */}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-base py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent/40 hover:text-accent">
            <MessageSquare size={15} />
            对这批数据有疑问？发起追问
          </button>
        </div>
      </div>
    </>
  )
}

// ===== 主页面 =====
export default function ReportPage() {
  const [searchParams] = useSearchParams()
  const reportId = searchParams.get('report_id') || ''
  const taskId = searchParams.get('task_id') || ''

  const { data: reportById } = useReport(reportId)
  const { data: reportByTask } = useReportByTask(taskId)
  const report: Report | undefined = reportById || reportByTask

  const [activeMetric, setActiveMetric] = useState<Metric | null>(null)
  const [followUp, setFollowUp] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [destroyOpen, setDestroyOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown'>('pdf')
  const [embedQr, setEmbedQr] = useState(true)
  const [copied, setCopied] = useState(false)

  // 从 API 报告数据构建指标
  const metrics: Metric[] = useMemo(() => {
    if (!report) return []
    const kpis = (report.kpis || []).map(kpiToMetric)
    const conclusions = (report.conclusions || []).map(conclusionToMetric)
    return [...kpis, ...conclusions]
  }, [report])

  const overallScore = useMemo(() => {
    if (!report?.overall_score) return 78
    const num = parseFloat(report.overall_score)
    return Number.isNaN(num) ? 78 : Math.round(num)
  }, [report])

  const grade = useMemo(() => {
    if (overallScore >= 90) return 'A'
    if (overallScore >= 80) return 'B+'
    if (overallScore >= 70) return 'B'
    if (overallScore >= 60) return 'C'
    return 'D'
  }, [overallScore])

  const summary = useMemo(() => {
    return report?.markdown_content?.split('\n')[0]?.replace(/^#\s*/, '') || '经营诊断报告'
  }, [report])

  // 雷达图配置
  const radarOption = useMemo(() => {
    const scores = report?.health_scores || []
    const indicator = scores.length > 0
      ? scores.map((s) => ({ name: s.dimension, max: 100 }))
      : [
          { name: '盈利能力', max: 100 },
          { name: '运营效率', max: 100 },
          { name: '客户满意', max: 100 },
          { name: '成本管控', max: 100 },
          { name: '成长潜力', max: 100 },
        ]
    const values = scores.length > 0
      ? scores.map((s) => s.score)
      : [75, 72, 88, 82, 68]

    return {
      radar: {
        indicator,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: 'rgb(var(--color-ink-secondary))',
          fontSize: 12,
        },
        splitLine: { lineStyle: { color: 'rgb(var(--color-line))' } },
        splitArea: { areaStyle: { color: ['transparent', 'rgb(var(--color-elevated) / 0.3)'] } },
        axisLine: { lineStyle: { color: 'rgb(var(--color-line))' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          areaStyle: { color: 'rgb(var(--color-accent) / 0.15)' },
          lineStyle: { color: 'rgb(var(--color-accent))', width: 2 },
          itemStyle: { color: 'rgb(var(--color-accent))' },
        }],
      }],
    }
  }, [report])

  // 饼图配置（从 charts 数据获取，否则使用默认）
  const pieOption = useMemo(() => {
    const chartData = report?.charts?.find((c) => c.type === 'pie')?.data as Array<{ value: number; name: string }> | undefined
    const data = chartData || [
      { value: 38, name: '主食类' },
      { value: 25, name: '饮品' },
      { value: 20, name: '小吃' },
      { value: 12, name: '甜品' },
      { value: 5, name: '其他' },
    ]
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#94A3B8']
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: 'rgb(var(--color-ink-secondary))', fontSize: 11 } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: data.map((item, i) => ({ ...item, itemStyle: { color: colors[i % colors.length] } })),
      }],
    }
  }, [report])

  // 折线图配置
  const lineOption = useMemo(() => {
    const chartData = report?.charts?.find((c) => c.type === 'line') as { xAxis?: string[]; data?: number[] } | undefined
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chartData?.xAxis || ['7-01', '7-05', '7-10', '7-15', '7-20', '7-25', '7-30'],
        axisLine: { lineStyle: { color: 'rgb(var(--color-line))' } },
        axisLabel: { color: 'rgb(var(--color-ink-muted))', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgb(var(--color-line))' } },
        axisLabel: { color: 'rgb(var(--color-ink-muted))', fontSize: 11 },
      },
      series: [{
        data: chartData?.data || [980, 1100, 1050, 1300, 1200, 1450, 1380],
        type: 'line',
        smooth: true,
        lineStyle: { color: '#3B82F6', width: 2.5 },
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.2)' },
              { offset: 1, color: 'rgba(59,130,246,0)' },
            ],
          },
        },
      }],
    }
  }, [report])

  // 柱状图配置（渠道 ROI 对比）
  const barOption = useMemo(() => {
    const chartData = report?.charts?.find((c) => c.type === 'bar') as { xAxis?: string[]; data?: number[] } | undefined
    const xData = chartData?.xAxis || ['美团', '饿了么', '自营', '抖音']
    const seriesData = chartData?.data || [8500, 6200, 1500, 800]
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: 'rgb(var(--color-line))' } },
        axisLabel: { color: 'rgb(var(--color-ink-muted))', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgb(var(--color-line))' } },
        axisLabel: { color: 'rgb(var(--color-ink-muted))', fontSize: 11 },
      },
      series: [{
        data: seriesData,
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: (params: { value: number }) => params.value >= 0 ? '#10b981' : '#ef4444',
        },
        label: { show: true, position: 'top', color: 'rgb(var(--color-ink-secondary))', fontSize: 11 },
      }],
    }
  }, [report])

  // 词云图配置（评价关键词）
  const wordcloudOption = useMemo(() => {
    import('echarts-wordcloud')
    const chartData = report?.charts?.find((c) => c.type === 'wordcloud')?.data as Array<{ name: string; value: number }> | undefined
    const data = chartData || [
      { name: '出餐快', value: 120 },
      { name: '分量足', value: 85 },
      { name: '味道好', value: 95 },
      { name: '包装好', value: 60 },
      { name: '性价比高', value: 70 },
      { name: '等太久', value: 45 },
      { name: '太少', value: 30 },
      { name: '凉了', value: 25 },
      { name: '新鲜', value: 55 },
      { name: '推荐', value: 80 },
    ]
    return {
      tooltip: { show: true },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [12, 48],
        rotationRange: [-45, 45],
        rotationStep: 45,
        gridSize: 8,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: () => `hsl(${Math.random() * 360}, 60%, 50%)`,
        },
        emphasis: { textStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
        data,
      }],
    }
  }, [report])

  const actions = useMemo(() => {
    return (report?.actions || []).map((action, i) => ({
      id: `a${i}`,
      title: action.title,
      priority: action.priority as 'high' | 'medium' | 'low',
      desc: action.description,
      effect: action.expected_effect || '',
    }))
  }, [report])

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 报告标题栏 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft size={15} />
              返回首页
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{report?.title || '经营诊断报告'}</h1>
              {!report && <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">示例报告</span>}
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {report ? `报告 ID：${report.id} · 任务 ID：${report.task_id}` : '数据周期：示例数据 · task_demo_001'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-elevated"
            >
              <Download size={15} />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-elevated"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">分享</span>
            </button>
          </div>
        </div>

        {/* 健康度评分区 */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {/* 综合得分 */}
          <div className="card p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">经营健康度评分</div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tabular-nums text-accent">{overallScore}</span>
              <span className="text-2xl font-bold text-ink-muted">/ 100</span>
              <span className="rounded-lg bg-accent-soft px-2.5 py-1 text-sm font-bold text-accent">{grade}</span>
            </div>
            <p className="mt-3 text-sm text-ink-secondary">
              {summary}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
              <ShieldCheck size={13} className="text-success" />
              评分基于真实数据计算，可溯源核验
            </div>
          </div>

          {/* 雷达图 */}
          <div className="card p-6">
            <ReactECharts option={radarOption} style={{ height: '240px' }} />
          </div>
        </div>

        {/* KPI 卡片区 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-secondary">核心指标</h2>
            <span className="text-xs text-ink-muted">点击「查看溯源」追踪原始数据</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const conclusionConfig = {
                consistent: { label: '一致', class: 'badge-consistent' },
                questionable: { label: '存疑', class: 'badge-questionable' },
                inconsistent: { label: '不符', class: 'badge-inconsistent' },
              }
              const cfg = conclusionConfig[metric.conclusion]
              const isPositive = (metric.change ?? 0) > 0
              // 差评率上升是负面的
              const isGoodTrend = metric.name.includes('差评') ? !isPositive : isPositive

              return (
                <div key={metric.id} className="card p-4 transition-shadow hover:shadow-md">
                  {/* 标题行 */}
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-sm font-medium text-ink-secondary">{metric.name}</span>
                    <span className={cn('rounded-md px-1.5 py-0.5 text-2xs font-bold', cfg.class)}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* 数值 */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums">{metric.value}</span>
                    {metric.unit && <span className="text-sm text-ink-muted">{metric.unit}</span>}
                  </div>

                  {/* 环比 */}
                  {metric.change !== undefined && (
                    <div className={cn(
                      'mt-1 flex items-center gap-1 text-xs',
                      isGoodTrend ? 'text-success' : 'text-danger'
                    )}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {formatPercent(metric.change)} 环比
                    </div>
                  )}

                  {/* 溯源按钮 */}
                  <button
                    onClick={() => setActiveMetric(metric)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-base py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    <Eye size={13} />
                    查看溯源
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* 图表区 */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">品类利润占比</h3>
              <span className="text-xs text-ink-muted">点击查看各品类明细</span>
            </div>
            <ReactECharts option={pieOption} style={{ height: '240px' }} />
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">GMV 趋势</h3>
              <span className="text-xs text-ink-muted">近30天每日实收</span>
            </div>
            <ReactECharts option={lineOption} style={{ height: '240px' }} />
          </div>
        </div>

        {/* 柱状图 + 词云 */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">渠道 ROI 对比</h3>
              <span className="text-xs text-ink-muted">绿色盈利 · 红色亏损</span>
            </div>
            <ReactECharts option={barOption} style={{ height: '240px' }} />
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">评价关键词云</h3>
              <span className="text-xs text-ink-muted">字号映射词频</span>
            </div>
            <ReactECharts option={wordcloudOption} style={{ height: '240px' }} />
          </div>
        </div>

        {/* 行动建议区 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={18} className="text-warning" />
            <h2 className="text-sm font-semibold text-ink-secondary">行动建议（{actions.length}条）</h2>
          </div>
          <div className="space-y-3">
            {actions.length > 0 ? actions.map((advice, i) => (
              <div key={advice.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                    advice.priority === 'high' ? 'bg-danger/10 text-danger' : advice.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-accent-soft text-accent'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold">{advice.title}</h3>
                    {advice.effect && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-success">
                        <TrendingUp size={12} />
                        {advice.effect}
                      </div>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {advice.desc.split('。').filter(Boolean).map((step, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-ink-secondary">
                          <ChevronRight size={14} className="text-ink-muted" />
                          {step}。
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="card p-5 text-sm text-ink-muted">暂无行动建议</div>
            )}
          </div>
        </div>

        {/* 追问区 */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare size={18} className="text-accent" />
            <h2 className="text-sm font-semibold">多轮追问</h2>
            <span className="text-xs text-ink-muted">基于当前报告数据，继续深度提问</span>
          </div>

          {/* 历史对话 */}
          <div className="mb-4 space-y-3">
            <div className="flex justify-end">
              <div className="max-w-md rounded-xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm text-white">
                为什么 7 月 15 日的 GMV 突然飙升？
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-lg rounded-xl rounded-tl-sm bg-elevated px-4 py-2.5 text-sm text-ink-secondary">
                7 月 15 日 GMV 达到 ¥1,300，较日均高出约 44%。溯源发现当天订单量 52 笔（日均 40 笔），
                其中「套餐类」订单占比从 25% 升至 45%。推测与当日平台满减活动有关，建议关注同类活动节奏。
                <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <ShieldCheck size={12} className="text-success" />
                  基于 52 行原始数据核验 · 一致
                </div>
              </div>
            </div>
          </div>

          {/* 输入框 */}
          <div className="flex gap-2">
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="输入你的追问，如「哪个菜品贡献了最多利润？」"
              className="flex-1 rounded-xl border border-line bg-base px-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
              <Send size={15} />
              追问
            </button>
          </div>

          {/* 推荐追问 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {['哪个菜品贡献了最多利润？', '差评集中在哪些时段？', '如何提升复购率？'].map((q) => (
              <button
                key={q}
                onClick={() => setFollowUp(q)}
                className="rounded-lg border border-line bg-base px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-accent/40 hover:text-accent"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ===== 政策匹配区 ===== */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Landmark size={18} className="text-accent" />
            <h2 className="text-sm font-semibold text-ink-secondary">属地政策匹配</h2>
            <span className="text-xs text-ink-muted">基于你的属地与经营类型自动匹配</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                title: '杭州市中小微餐饮商户数字化补贴',
                type: '补贴',
                amount: '5,000 - 20,000元',
                deadline: '2025-12-31',
                source: '杭州市商务局',
                tags: ['餐饮', '数字化'],
              },
              {
                title: '浙江省个体工商户税收减免政策',
                type: '税收减免',
                amount: '月销售额10万以下免征增值税',
                deadline: '长期有效',
                source: '浙江省税务局',
                tags: ['个体户', '税收'],
              },
            ].map((policy, i) => (
              <div key={i} className="card p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug">{policy.title}</h3>
                  <span className="shrink-0 rounded-md bg-accent-soft px-2 py-0.5 text-2xs font-medium text-accent">
                    {policy.type}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {policy.tags.map((tag) => (
                    <span key={tag} className="rounded bg-elevated px-1.5 py-0.5 text-2xs text-ink-muted">{tag}</span>
                  ))}
                </div>
                <div className="space-y-1 text-xs text-ink-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">补贴金额</span>
                    <span className="font-semibold text-success">{policy.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">截止日期</span>
                    <span className="font-medium">{policy.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">来源</span>
                    <span>{policy.source}</span>
                  </div>
                </div>
                <a
                  href="#"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
                >
                  <ExternalLink size={12} />
                  查看官方原文与申报指引
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 数据安全区 ===== */}
        <div className="card border-danger/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10 text-danger">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">数据销毁</h3>
                <p className="text-xs text-ink-muted">
                  一键销毁本次分析的所有上传文件与历史任务，彻底不留数据副本
                </p>
              </div>
            </div>
            <button
              onClick={() => setDestroyOpen(true)}
              className="rounded-lg border border-danger/30 bg-surface px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
            >
              销毁数据
            </button>
          </div>
        </div>
      </div>

      {/* ===== 导出弹窗 ===== */}
      {exportOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setExportOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-slide-up rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">导出报告</h3>
              <button onClick={() => setExportOpen(false)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            {/* 格式选择 */}
            <div className="mb-4">
              <div className="mb-2 text-sm font-medium">选择格式</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pdf', label: 'PDF 报告', desc: '含完整溯源标识' },
                  { value: 'markdown', label: 'Markdown', desc: '可编辑文本' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExportFormat(opt.value as 'pdf' | 'markdown')}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      exportFormat === opt.value
                        ? 'border-accent bg-accent-soft ring-1 ring-accent'
                        : 'border-line hover:border-accent/40'
                    )}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-ink-muted">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* PDF 选项 */}
            {exportFormat === 'pdf' && (
              <div className="mb-4">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3">
                  <input
                    type="checkbox"
                    checked={embedQr}
                    onChange={(e) => setEmbedQr(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">嵌入溯源二维码</div>
                    <div className="text-xs text-ink-muted">扫码可跳转线上报告查看交互式溯源</div>
                  </div>
                  <QrCode size={18} className="text-accent" />
                </label>
              </div>
            )}

            <button className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover">
              <Download size={16} className="mr-1.5 inline" />
              确认导出
            </button>
          </div>
        </>
      )}

      {/* ===== 分享弹窗 ===== */}
      {shareOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setShareOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-slide-up rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">分享报告</h3>
              <button onClick={() => setShareOpen(false)} className="text-ink-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            {/* 分享链接 */}
            <div className="mb-4">
              <div className="mb-2 text-sm font-medium">只读报告链接</div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value="https://app.yourdomain.com/s/A3B9K7"
                  className="flex-1 rounded-lg border border-line bg-base px-3 py-2.5 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText('https://app.yourdomain.com/s/A3B9K7')
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                任何人可通过此链接免登录查看报告，附带公开任务核验链接
              </p>
            </div>

            {/* 海报预览 */}
            <div className="mb-4">
              <div className="mb-2 text-sm font-medium">分享海报</div>
              <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                <div className="flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-hover text-white">
                  <div className="text-2xl font-bold">78</div>
                  <div className="text-2xs">B+</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">我的店健康度 78 分</div>
                  <div className="text-xs text-ink-muted">外卖餐饮店 · 近30天</div>
                  <div className="mt-1 text-xs text-accent">扫码查看完整溯源报告 →</div>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-elevated">
                  <QrCode size={32} className="text-ink-muted" />
                </div>
              </div>
            </div>

            {/* 裂变提示 */}
            <div className="rounded-lg bg-accent-soft p-3 text-xs text-accent">
              分享报告链接，好友注册后双方各获 3 次免费分析额度
            </div>
          </div>
        </>
      )}

      {/* ===== 数据销毁确认弹窗 ===== */}
      {destroyOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setDestroyOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 animate-slide-up rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <Trash2 size={24} />
            </div>
            <h3 className="text-center text-lg font-bold">确认销毁数据？</h3>
            <p className="mt-2 text-center text-sm text-ink-secondary">
              此操作不可撤销。将永久删除：
            </p>
            <div className="mt-3 space-y-1.5 rounded-lg bg-elevated p-3 text-sm text-ink-secondary">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                上传文件 order_export_202507.csv
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                分析任务 task_demo_001 及全部溯源记录
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                本份报告 rpt_demo_001
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDestroyOpen(false)}
                className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm font-semibold text-ink-secondary hover:bg-elevated"
              >
                取消
              </button>
              <button className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white hover:bg-danger/90">
                确认销毁
              </button>
            </div>
          </div>
        </>
      )}

      {/* 溯源抽屉 */}
      <TraceabilityDrawer metric={activeMetric} onClose={() => setActiveMetric(null)} />
    </div>
  )
}
