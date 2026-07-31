import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { HumanInTheLoopPanel, PendingInput } from '@/components/analysis/HumanInTheLoopPanel'
import { cn } from '@/lib/utils'
import { useSSE } from '@/hooks/useSSE'
import { useTask } from '@/hooks/useTasks'
import { tasksApi } from '@/api/tasks'
import {
  Check,
  Loader2,
  Database,
  Calculator,
  FileText,
  ShieldCheck,
  Wifi,
  WifiOff,
  ArrowRight,
  Sparkles,
  Clock,
  X,
  Minimize2,
  AlertCircle,
} from 'lucide-react'

interface AnalysisStep {
  id: string
  name: string
  desc: string
  icon: typeof Database
  status: 'done' | 'active' | 'pending'
}

export default function AnalysisProgressPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { connect, disconnect, connected } = useSSE()
  const { data: task } = useTask(taskId || '')

  const [progress, setProgress] = useState(0)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [pendingInput, setPendingInput] = useState<PendingInput | null>(null)
  const [resolveLoading, setResolveLoading] = useState(false)
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; msg: string; connId?: string; taskId?: string }>>([])

  const handleResolveInput = async (inputId: string, value: string) => {
    setResolveLoading(true)
    try {
      // 使用追问接口作为人机协同输入的降级方案
      if (taskId) {
        await tasksApi.ask(taskId, { question: `${inputId}: ${value}` })
      }
      setPendingInput(null)
    } catch {
      console.error('resolve-inputs failed')
    } finally {
      setResolveLoading(false)
    }
  }

  const steps: AnalysisStep[] = [
    { id: 'clean', name: '数据清洗', desc: '识别字段、校验格式、剔除异常值', icon: Database, status: 'pending' },
    { id: 'calc', name: '指标核算', desc: '计算 GMV、客单价、差评率等核心指标', icon: Calculator, status: 'pending' },
    { id: 'trace', name: '溯源核对', desc: '绑定原始数据行号，验证结论一致性', icon: ShieldCheck, status: 'pending' },
    { id: 'report', name: '报告生成', desc: '生成健康度评分、图表与行动建议', icon: FileText, status: 'pending' },
  ]

  // 根据进度更新步骤状态
  useEffect(() => {
    if (progress < 25) setCurrentStepIdx(0)
    else if (progress < 55) setCurrentStepIdx(1)
    else if (progress < 80) setCurrentStepIdx(2)
    else if (progress < 100) setCurrentStepIdx(3)
  }, [progress])

  // 真实 SSE 连接
  useEffect(() => {
    if (!taskId) return

    setEventLogs((prev) => [...prev, { time: formatNow(), msg: '正在建立 SSE 连接...', connId: task?.conn_id || undefined }])

    const url = tasksApi.eventsUrl(taskId, task?.current_event_id || undefined)
    connect(url, {
      onMessage: (event) => {
        const data = event.data || {}
        const msg = data.message || `收到事件: ${data.type || 'unknown'}`
        setEventLogs((prev) => [...prev, { time: formatNow(), msg, taskId: data.task_id }])

        if (typeof data.progress === 'number') {
          setProgress(Math.min(data.progress, 99))
        }

        if (data.type === 'complete' || data.type === 'completed') {
          setProgress(100)
          disconnect()
          setTimeout(() => {
            navigate(`/reports?task_id=${taskId}`)
          }, 1500)
        } else if (data.type === 'error' || data.type === 'failed') {
          disconnect()
        }
      },
      onError: () => {
        setEventLogs((prev) => [...prev, { time: formatNow(), msg: 'SSE 连接异常，尝试重连...' }])
      },
    })

    return () => {
      disconnect()
    }
  }, [taskId, task?.current_event_id])

  const updatedSteps = steps.map((step, idx) => ({
    ...step,
    status: idx < currentStepIdx ? 'done' : idx === currentStepIdx ? 'active' : 'pending',
  }))

  function formatNow() {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* 顶部状态 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {progress < 100 ? '分析进行中' : '分析完成'}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              外卖餐饮店 · task_demo_001
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* SSE 连接状态 */}
            <div className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
              connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            )}>
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {connected ? 'SSE 已连接' : '连接中断，正在重连…'}
              <span className="hidden font-mono text-2xs opacity-70 sm:inline">conn_a3b9k7</span>
            </div>
            {/* 模拟人工介入触发（演示用） */}
            {progress < 100 && !pendingInput && (
              <button
                onClick={() =>
                  setPendingInput({
                    id: 'input_demo_001',
                    question: '系统检测到「实收金额」字段中有 3 条记录明显超出正常范围，请确认这些是促销满减订单还是异常数据？',
                    type: 'choice',
                    options: [
                      { label: '促销满减订单，纳入正常统计', value: 'promotion' },
                      { label: '异常数据，应当剔除', value: 'outlier' },
                      { label: '我不确定，跳过该字段', value: 'skip' },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning transition-colors hover:bg-warning/20"
              >
                <AlertCircle size={14} />
                模拟人工介入
              </button>
            )}
            {/* 取消任务 */}
            {progress < 100 && (
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-danger/40 hover:text-danger">
                <X size={14} />
                取消
              </button>
            )}
          </div>
        </div>

        {/* 进度条 + 预计时间 */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">
              {progress < 100 ? '正在分析…' : '分析完成'}
            </span>
            <div className="flex items-center gap-3">
              {progress < 100 && progress > 5 && (
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <Clock size={12} />
                  预计剩余 {Math.max(1, Math.ceil((100 - progress) * 0.3))} 秒
                </span>
              )}
              <span className="font-mono tabular-nums text-ink-secondary">{progress}%</span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* 步骤标签 */}
          <div className="mt-2 flex justify-between text-2xs text-ink-muted">
            <span className={cn(currentStepIdx >= 0 && 'text-accent')}>数据清洗</span>
            <span className={cn(currentStepIdx >= 1 && 'text-accent')}>指标核算</span>
            <span className={cn(currentStepIdx >= 2 && 'text-accent')}>溯源核对</span>
            <span className={cn(currentStepIdx >= 3 && 'text-accent')}>报告生成</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* 左侧：步骤时间线 */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-ink-secondary">挖掘现场</h2>
            <div className="space-y-1">
              {updatedSteps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.id} className="flex gap-3">
                    {/* 连接线 + 节点 */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                          step.status === 'done' && 'bg-success text-white',
                          step.status === 'active' && 'bg-accent text-white shadow-lg shadow-accent/30',
                          step.status === 'pending' && 'bg-elevated text-ink-muted'
                        )}
                      >
                        {step.status === 'done' ? (
                          <Check size={18} strokeWidth={2.5} />
                        ) : step.status === 'active' ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>
                      {idx < updatedSteps.length - 1 && (
                        <div className={cn(
                          'w-0.5 flex-1 min-h-[2rem] transition-colors',
                          step.status === 'done' ? 'bg-success' : 'bg-line'
                        )} />
                      )}
                    </div>

                    {/* 内容 */}
                    <div className={cn(
                      'pb-6 transition-opacity',
                      step.status === 'pending' && 'opacity-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-semibold',
                          step.status === 'active' && 'text-accent'
                        )}>
                          {step.name}
                        </span>
                        {step.status === 'active' && (
                          <span className="flex items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-2xs font-medium text-accent">
                            <Sparkles size={10} />
                            进行中
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">{step.desc}</p>

                      {/* 活跃步骤的实时数据 */}
                      {step.status === 'active' && step.id === 'clean' && (
                        <div className="mt-2 space-y-1 font-mono text-2xs text-ink-muted">
                          <div>→ 解析文件: order_export_202507.csv</div>
                          <div>→ 识别字段: 12 个</div>
                          <div>→ 数据行数: 1,200 行</div>
                        </div>
                      )}
                      {step.status === 'active' && step.id === 'calc' && (
                        <div className="mt-2 space-y-1 font-mono text-2xs text-ink-muted">
                          <div>→ GMV: ¥36,000.00 ✓</div>
                          <div>→ 客单价: ¥30.00 ✓</div>
                          <div className="text-accent">→ 差评率: 计算中…</div>
                        </div>
                      )}
                      {step.status === 'active' && step.id === 'trace' && (
                        <div className="mt-2 space-y-1 font-mono text-2xs">
                          <div className="text-success">→ GMV 溯源: 一致 ✦ (1,188行)</div>
                          <div className="text-warning">→ 差评率溯源: 存疑 ⚠ (3条评价缺失)</div>
                        </div>
                      )}
                      {step.status === 'active' && step.id === 'report' && (
                        <div className="mt-2 space-y-1 font-mono text-2xs text-ink-muted">
                          <div>→ 健康度评分: 78 (B+)</div>
                          <div>→ 雷达图: 生成中…</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右侧：实时事件日志 */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold">实时事件流</span>
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
                SSE Live
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-4">
              <div className="space-y-1.5 font-mono text-xs">
                {eventLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fade-in">
                    <span className="shrink-0 text-ink-muted">{log.time}</span>
                    <span className={cn(
                      'flex-1',
                      log.msg.includes('✦') ? 'text-success' :
                      log.msg.includes('⚠') ? 'text-warning' :
                      log.msg.includes('完毕') ? 'text-accent font-semibold' :
                      'text-ink-secondary'
                    )}>
                      {log.msg}
                    </span>
                  </div>
                ))}
                {progress < 100 && (
                  <div className="flex items-center gap-2 pt-1 text-ink-muted">
                    <span className="shrink-0">{new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span>
                    <Loader2 size={11} className="animate-spin" />
                    <span>等待下一个事件…</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 完成后的跳转 */}
        {progress >= 100 && (
          <div className="mt-8 animate-slide-up rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
              <Check size={24} strokeWidth={3} />
            </div>
            <h3 className="text-lg font-bold">分析完成！</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              报告已生成，包含健康度评分、5项核心指标、3条行动建议
            </p>
            <Link
              to="/reports/rpt_demo_001"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover"
            >
              查看完整报告
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* 断线恢复提示 */}
        {!connected && (
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <WifiOff size={16} />
              连接已断开
            </div>
            <p className="mt-1 text-xs text-ink-secondary">
              系统正在尝试重连（第 1 次/共 3 次）。任务不会丢失，重连后将继续推送进度。
            </p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg border border-warning/40 bg-surface px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10">
                立即重连
              </button>
              <Link to="/" className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-elevated">
                返回首页，稍后查看
              </Link>
            </div>
          </div>
        )}

        {/* 后台运行提示 */}
        {connected && progress < 100 && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
            <Minimize2 size={16} className="shrink-0 text-ink-muted" />
            <p className="flex-1 text-xs text-ink-secondary">
              分析任务在后台持续运行，你可以离开此页面。完成后我们会通知你查看报告。
            </p>
            <Link to="/" className="shrink-0 text-xs font-medium text-accent hover:text-accent-hover">
              先去逛逛 →
            </Link>
          </div>
        )}
      </div>

      {/* 人工介入面板 */}
      {pendingInput && (
        <HumanInTheLoopPanel
          pending={pendingInput}
          onSubmit={handleResolveInput}
          onCancel={() => setPendingInput(null)}
          submitting={resolveLoading}
        />
      )}
    </div>
  )
}
