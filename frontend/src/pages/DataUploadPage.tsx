import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { scenarios } from '@/data/scenarios'
import { cn } from '@/lib/utils'
import { useUploadFile } from '@/hooks/useFiles'
import { useCreateTask } from '@/hooks/useTasks'
import { useUIStore } from '@/store/uiStore'
import type { FileUploadResponse } from '@/types/models'
import {
  UploadCloud,
  FileSpreadsheet,
  FileType2,
  Download,
  ArrowRight,
  ArrowLeft,
  Check,
  Table2,
  Lightbulb,
  ShieldCheck,
  X,
} from 'lucide-react'

type Step = 'select' | 'input' | 'mapping'

export default function DataUploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<Step>('select')
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'file' | 'form'>('file')
  const [dragging, setDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse[]>([])
  const [quickFields, setQuickFields] = useState<Record<string, string>>({
    total_orders: '',
    total_revenue: '',
    avg_rating: '',
    negative_reviews: '',
    food_cost_ratio: '',
    platform_fee_ratio: '',
  })

  const uploadMutation = useUploadFile()
  const createTaskMutation = useCreateTask()

  const selectedScenarioName = scenarios.find((s) => s.code === selectedScenario)?.name || ''

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleUpload(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file)
      setUploadedFiles((prev) => [...prev, result])
      addToast({ type: 'success', message: `${file.name} 上传成功` })
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '上传失败' })
    }
  }

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleQuickFieldChange = (key: string, value: string) => {
    setQuickFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleStartAnalysis = async () => {
    if (!selectedScenario) return
    const filledFields: Record<string, string> = {}
    Object.entries(quickFields).forEach(([k, v]) => {
      if (v) filledFields[k] = v
    })

    try {
      const task = await createTaskMutation.mutateAsync({
        scenario_code: selectedScenario,
        scenario_name: selectedScenarioName,
        title: `${selectedScenarioName}经营分析`,
        file_ids: uploadedFiles.map((f) => f.id),
        quick_fields: inputMode === 'form' ? filledFields : undefined,
      })
      addToast({ type: 'success', message: '分析任务已创建' })
      navigate(`/analysis/${task.id}`)
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '创建任务失败' })
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* 页面标题 + 步骤指示 */}
        <div className="mb-8">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={15} />
            返回首页
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">数据接入中心</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            上传文件或填写核心数字，系统自动识别字段并生成可信分析报告
          </p>

          {/* 步骤进度条 */}
          <div className="mt-6 flex items-center gap-2">
            {[
              { key: 'select', label: '选择场景', n: 1 },
              { key: 'input', label: '接入数据', n: 2 },
              { key: 'mapping', label: '确认字段', n: 3 },
            ].map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    step === s.key
                      ? 'bg-accent text-white'
                      : (step === 'input' && s.key === 'select') || (step === 'mapping' && (s.key === 'select' || s.key === 'input'))
                      ? 'bg-success text-white'
                      : 'bg-elevated text-ink-muted'
                  )}
                >
                  {(step === 'input' && s.key === 'select') || (step === 'mapping' && (s.key === 'select' || s.key === 'input')) ? (
                    <Check size={16} />
                  ) : (
                    s.n
                  )}
                </div>
                <span className={cn('text-sm font-medium', step === s.key ? 'text-ink' : 'text-ink-muted')}>
                  {s.label}
                </span>
                {i < 2 && <div className="h-px flex-1 bg-line" />}
              </div>
            ))}
          </div>
        </div>

        {/* ===== 步骤1：选择场景 ===== */}
        {step === 'select' && (
          <div className="animate-fade-in">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-warning" />
              <p className="text-sm text-ink-secondary">
                选择最匹配你业态的场景，系统会预加载对应的字段模板和分析指标
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {scenarios.map((scenario) => {
                const Icon = scenario.icon
                const isSelected = selectedScenario === scenario.code
                return (
                  <button
                    key={scenario.code}
                    onClick={() => setSelectedScenario(scenario.code)}
                    className={cn(
                      'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-accent bg-accent-soft ring-1 ring-accent'
                        : 'border-line bg-surface hover:border-accent/40'
                    )}
                  >
                    <div className="mb-3 flex w-full items-center justify-between">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-elevated', scenario.color)}>
                        <Icon size={18} />
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                          <Check size={13} />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold">{scenario.name}</span>
                    <span className="mt-0.5 text-2xs text-ink-muted">{scenario.desc}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                disabled={!selectedScenario}
                onClick={() => setStep('input')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all',
                  selectedScenario
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'cursor-not-allowed bg-elevated text-ink-muted'
                )}
              >
                下一步：接入数据
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===== 步骤2：接入数据 ===== */}
        {step === 'input' && (
          <div className="animate-fade-in">
            {/* 模式切换 */}
            <div className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1">
              <button
                onClick={() => setInputMode('file')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  inputMode === 'file' ? 'bg-accent text-white' : 'text-ink-secondary hover:text-ink'
                )}
              >
                <UploadCloud size={16} />
                上传文件
              </button>
              <button
                onClick={() => setInputMode('form')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  inputMode === 'form' ? 'bg-accent text-white' : 'text-ink-secondary hover:text-ink'
                )}
              >
                <Table2 size={16} />
                填写数字
              </button>
            </div>

            {/* 文件上传模式 */}
            {inputMode === 'file' && (
              <div className="space-y-6">
                {/* 拖拽区 */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 transition-colors',
                    dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                    dragging ? 'bg-accent text-white' : 'bg-elevated text-ink-muted'
                  )}>
                    <UploadCloud size={28} />
                  </div>
                  <p className="mt-4 text-base font-semibold">
                    {dragging ? '松开鼠标上传文件' : '拖拽文件到此处，或点击选择'}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    支持 Excel (.xlsx) / CSV 格式，单文件最大 10MB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                  >
                    {uploadMutation.isPending ? '上传中…' : '选择文件'}
                  </button>
                </div>

                {/* 已上传文件列表 */}
                {uploadedFiles.length > 0 && (
                  <div className="card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">已上传文件</span>
                      <span className="text-xs text-ink-muted">{uploadedFiles.length} 个文件</span>
                    </div>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 rounded-lg bg-elevated p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
                            {file.original_name.endsWith('.csv') ? (
                              <FileType2 size={18} className="text-green-500" />
                            ) : (
                              <FileSpreadsheet size={18} className="text-green-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{file.original_name}</div>
                            <div className="text-xs text-ink-muted">
                              {(file.size_bytes / 1024).toFixed(1)} KB · {file.row_count ?? 0} 行
                            </div>
                          </div>
                          <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">已就绪</span>
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-ink-muted hover:text-danger"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 模板下载 */}
                <div className="card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Download size={16} className="text-accent" />
                    <span className="text-sm font-semibold">下载标准模板</span>
                    <span className="text-xs text-ink-muted">从店铺后台导出后可直接上传</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['美团外卖导出模板', '饿了么订单模板', '淘宝生意参谋模板', '通用CSV模板'].map((tpl) => (
                      <button
                        key={tpl}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-base px-3 py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-accent/40 hover:text-accent"
                      >
                        <Download size={13} />
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 数据预览 — 上传成功后展示 */}
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Table2 size={16} className="text-accent" />
                      <span className="text-sm font-semibold">数据预览</span>
                      <span className="rounded-md bg-success/10 px-1.5 py-0.5 text-2xs font-medium text-success">order_export_202507.csv</span>
                    </div>
                    <span className="text-xs text-ink-muted">1,200 行 · 12 列</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-line bg-elevated text-left">
                          {['order_id', 'order_time', 'platform', 'actual_amount', 'rating', 'refund_flag'].map((col) => (
                            <th key={col} className="whitespace-nowrap px-3 py-2 font-mono font-medium text-ink-muted">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {[
                          ['O1001', '07-01 12:34', '美团', '28.50', '5', '0'],
                          ['O1002', '07-01 12:45', '美团', '45.00', '4', '0'],
                          ['O1003', '07-01 13:02', '饿了么', '32.00', '5', '0'],
                          ['O1004', '07-01 13:15', '美团', '18.50', '2', '0'],
                          ['O1005', '07-01 13:28', '饿了么', '56.00', '4', '1'],
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-elevated/50">
                            {row.map((cell, j) => (
                              <td key={j} className={cn(
                                'whitespace-nowrap px-3 py-2 font-mono tabular-nums',
                                j === 3 && 'font-semibold',
                                cell === '1' && 'text-danger',
                                cell === '2' && 'text-warning'
                              )}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-line px-4 py-2 text-center text-xs text-ink-muted">
                    仅展示前 5 行，完整数据已上传至分析任务工作区
                  </div>
                </div>

                {/* 历史数据集管理 */}
                <div className="card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-accent" />
                      <span className="text-sm font-semibold">历史数据集</span>
                      <span className="text-xs text-ink-muted">3 个文件</span>
                    </div>
                    <button className="text-xs font-medium text-accent hover:text-accent-hover">查看全部</button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'order_export_202506.csv', size: '221 KB', time: '2025-07-01', reports: 2 },
                      { name: 'review_data_202506.xlsx', size: '85 KB', time: '2025-07-01', reports: 1 },
                      { name: 'order_export_202505.csv', size: '198 KB', time: '2025-06-01', reports: 1 },
                    ].map((file) => (
                      <div key={file.name} className="flex items-center gap-3 rounded-lg bg-elevated p-2.5">
                        <FileType2 size={16} className="shrink-0 text-green-500" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{file.name}</div>
                          <div className="text-2xs text-ink-muted">{file.size} · {file.time} · 已生成 {file.reports} 份报告</div>
                        </div>
                        <button className="shrink-0 rounded-md border border-line bg-base px-2 py-1 text-2xs font-medium text-ink-secondary hover:text-accent">
                          复用
                        </button>
                        <button className="shrink-0 text-ink-muted hover:text-danger">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 数据安全提示 */}
                <div className="flex items-start gap-2 rounded-xl border border-success/20 bg-success/5 p-3 text-xs text-ink-secondary">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
                  <span>您的数据全程加密传输，服务端不留存永久副本。分析完成后可一键销毁，彻底不留数据残留。</span>
                </div>
              </div>
            )}

            {/* 表单录入模式 */}
            {inputMode === 'form' && (
              <div className="card p-6">
                <div className="mb-5">
                  <h3 className="text-base font-semibold">填写核心经营数字</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    只需填写关键数字，系统自动生成结构化数据并启动分析
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* 基础经营组 */}
                  <div className="sm:col-span-2">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">基础经营</div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">近30天总订单数</label>
                    <input
                      type="number"
                      placeholder="如 1200"
                      value={quickFields.total_orders}
                      onChange={(e) => handleQuickFieldChange('total_orders', e.target.value)}
                      className="w-full rounded-lg border border-line bg-base px-3 py-2.5 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">近30天实收金额（元）</label>
                    <input
                      type="number"
                      placeholder="如 36000"
                      value={quickFields.total_revenue}
                      onChange={(e) => handleQuickFieldChange('total_revenue', e.target.value)}
                      className="w-full rounded-lg border border-line bg-base px-3 py-2.5 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* 用户评价组 */}
                  <div className="sm:col-span-2">
                    <div className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">用户评价</div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">平均评分（1-5）</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      placeholder="如 4.2"
                      value={quickFields.avg_rating}
                      onChange={(e) => handleQuickFieldChange('avg_rating', e.target.value)}
                      className="w-full rounded-lg border border-line bg-base px-3 py-2.5 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">差评数</label>
                    <input
                      type="number"
                      placeholder="如 45"
                      value={quickFields.negative_reviews}
                      onChange={(e) => handleQuickFieldChange('negative_reviews', e.target.value)}
                      className="w-full rounded-lg border border-line bg-base px-3 py-2.5 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* 成本结构组 */}
                  <div className="sm:col-span-2">
                    <div className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">成本结构</div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">食材成本占比</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="如 0.35"
                        value={quickFields.food_cost_ratio}
                        onChange={(e) => handleQuickFieldChange('food_cost_ratio', e.target.value)}
                        className="w-full rounded-lg border border-line bg-base px-3 py-2.5 pr-8 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">平台扣点占比</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="如 0.22"
                        value={quickFields.platform_fee_ratio}
                        onChange={(e) => handleQuickFieldChange('platform_fee_ratio', e.target.value)}
                        className="w-full rounded-lg border border-line bg-base px-3 py-2.5 pr-8 text-sm tabular-nums focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-lg bg-accent-soft p-3 text-xs text-ink-secondary">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-accent" />
                  填写越完整，分析结论越精准。缺少的字段系统会标注为「估算」，不影响整体报告生成。
                </div>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep('select')}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink-secondary hover:bg-elevated"
              >
                <ArrowLeft size={16} />
                上一步
              </button>
              <button
                onClick={() => setStep('mapping')}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                下一步：确认字段
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===== 步骤3：字段映射确认 ===== */}
        {step === 'mapping' && (
          <div className="animate-fade-in">
            <div className="card p-6">
              <div className="mb-5">
                <h3 className="text-base font-semibold">确认字段映射</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  系统已自动识别文件中的字段，请确认映射关系是否正确
                </p>
              </div>

              {/* 映射表 */}
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-elevated text-left text-xs text-ink-muted">
                      <th className="px-4 py-3 font-medium">原始字段名</th>
                      <th className="px-4 py-3 font-medium">→</th>
                      <th className="px-4 py-3 font-medium">标准字段</th>
                      <th className="px-4 py-3 font-medium">示例值</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[
                      { raw: 'order_id', std: '订单编号', sample: 'O1001', status: 'ok' },
                      { raw: 'amt', std: '实收金额', sample: '28.50', status: 'guess' },
                      { raw: 'score', std: '用户评分', sample: '5', status: 'ok' },
                      { raw: 'delivery_time', std: '配送时长(分钟)', sample: '32', status: 'ok' },
                      { raw: 'refund', std: '— 未识别 —', sample: '0', status: 'unknown' },
                    ].map((row) => (
                      <tr key={row.raw} className="hover:bg-elevated/50">
                        <td className="px-4 py-3 font-mono text-xs">{row.raw}</td>
                        <td className="px-4 py-3 text-ink-muted">→</td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={row.std}
                            className="rounded-md border border-line bg-base px-2 py-1 text-xs focus:border-accent focus:ring-1 focus:ring-accent"
                          >
                            <option>{row.std}</option>
                            <option>订单编号</option>
                            <option>实收金额</option>
                            <option>原价金额</option>
                            <option>用户评分</option>
                            <option>— 未识别 —</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-ink-muted">{row.sample}</td>
                        <td className="px-4 py-3">
                          {row.status === 'ok' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              <Check size={12} /> 已匹配
                            </span>
                          )}
                          {row.status === 'guess' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                              推测
                            </span>
                          )}
                          {row.status === 'unknown' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                              需确认
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-ink-secondary">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-warning" />
                有 1 个字段未识别，请手动选择对应的标准字段，或选择「忽略此字段」
              </div>
            </div>

            {/* 导航按钮 */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep('input')}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink-secondary hover:bg-elevated"
              >
                <ArrowLeft size={16} />
                上一步
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={createTaskMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover disabled:opacity-60"
              >
                {createTaskMutation.isPending ? '创建中…' : '开始分析'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
