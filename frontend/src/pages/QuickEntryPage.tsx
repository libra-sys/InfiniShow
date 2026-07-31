import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { scenarios } from '@/data/scenarios'
import { cn } from '@/lib/utils'
import { useCreateTask } from '@/hooks/useTasks'
import { useUIStore } from '@/store/uiStore'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react'

interface FieldDef {
  key: string
  label: string
  type: 'number' | 'text' | 'select'
  required: boolean
  placeholder?: string
  options?: string[]
  min?: number
  max?: number
}

interface FormGroup {
  title: string
  fields: FieldDef[]
}

const formGroupsMap: Record<string, FormGroup[]> = {
  S01: [
    {
      title: '基础经营',
      fields: [
        { key: 'total_orders', label: '近30天总订单数', type: 'number', required: true, placeholder: '例如：1200' },
        { key: 'total_revenue', label: '近30天实收金额（元）', type: 'number', required: true, placeholder: '例如：36000' },
      ],
    },
    {
      title: '用户评价',
      fields: [
        { key: 'avg_rating', label: '平均评分（1-5）', type: 'number', required: false, min: 1, max: 5, placeholder: '例如：4.2' },
        { key: 'bad_review_count', label: '差评数', type: 'number', required: false, placeholder: '例如：45' },
      ],
    },
    {
      title: '成本结构',
      fields: [
        { key: 'food_cost_rate', label: '食材成本率（0-1）', type: 'number', required: false, min: 0, max: 1, placeholder: '例如：0.35' },
        { key: 'platform_fee_rate', label: '平台扣点率（0-1）', type: 'number', required: false, min: 0, max: 1, placeholder: '例如：0.22' },
        { key: 'delivery_duration_avg', label: '平均配送时长（分钟）', type: 'number', required: false, placeholder: '例如：38' },
      ],
    },
  ],
  S02: [
    {
      title: '基础经营',
      fields: [
        { key: 'total_orders', label: '近30天总订单数', type: 'number', required: true, placeholder: '例如：500' },
        { key: 'total_revenue', label: '近30天销售额（元）', type: 'number', required: true, placeholder: '例如：25000' },
      ],
    },
    {
      title: '流量转化',
      fields: [
        { key: 'uv', label: '店铺访客数', type: 'number', required: false, placeholder: '例如：8000' },
        { key: 'return_rate', label: '退货率（0-1）', type: 'number', required: false, min: 0, max: 1, placeholder: '例如：0.08' },
        { key: 'ad_spend', label: '广告花费（元）', type: 'number', required: false, placeholder: '例如：3000' },
      ],
    },
  ],
}

const defaultGroups: FormGroup[] = [
  {
    title: '基础经营',
    fields: [
      { key: 'total_revenue', label: '近30天营业额（元）', type: 'number', required: true, placeholder: '例如：50000' },
      { key: 'total_customers', label: '近30天客流量', type: 'number', required: false, placeholder: '例如：800' },
    ],
  },
  {
    title: '成本与利润',
    fields: [
      { key: 'cost_rate', label: '综合成本率（0-1）', type: 'number', required: false, min: 0, max: 1, placeholder: '例如：0.6' },
      { key: 'rent', label: '月租金（元）', type: 'number', required: false, placeholder: '例如：8000' },
    ],
  },
]

export default function QuickEntryPage() {
  const { scenarioCode } = useParams<{ scenarioCode: string }>()
  const navigate = useNavigate()
  const createTask = useCreateTask()
  const addToast = useUIStore((s) => s.addToast)

  const scenario = useMemo(
    () => scenarios.find((s) => s.code === scenarioCode),
    [scenarioCode]
  )

  const groups = useMemo(
    () => (scenarioCode && formGroupsMap[scenarioCode]) || defaultGroups,
    [scenarioCode]
  )

  const initialValues: Record<string, string> = {}
  groups.forEach((g) => g.fields.forEach((f) => (initialValues[f.key] = '')))

  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submitting = createTask.isPending

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    groups.forEach((g) => {
      g.fields.forEach((f) => {
        const v = values[f.key]?.trim()
        if (f.required && !v) {
          next[f.key] = '此项为必填'
          return
        }
        if (v && f.type === 'number') {
          const n = Number(v)
          if (Number.isNaN(n)) {
            next[f.key] = '请输入有效数字'
          } else if (f.min !== undefined && n < f.min) {
            next[f.key] = `最小值为 ${f.min}`
          } else if (f.max !== undefined && n > f.max) {
            next[f.key] = `最大值为 ${f.max}`
          }
        }
      })
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const inputs: Record<string, number | string> = {}
      groups.forEach((g) =>
        g.fields.forEach((f) => {
          const v = values[f.key]?.trim()
          if (!v) return
          inputs[f.key] = f.type === 'number' ? Number(v) : v
        })
      )

      const task = await createTask.mutateAsync({
        scenario_code: scenarioCode || 'S01',
        scenario_name: scenario?.name || '快速录入分析',
        title: `${scenario?.name || '经营'}快速诊断`,
        file_ids: [],
        quick_fields: inputs,
      })
      addToast({ type: 'success', message: '分析任务已创建' })
      navigate(`/analysis/${task.id}`)
    } catch (err) {
      setErrors({ _global: err instanceof Error ? err.message : '提交失败' })
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link to="/upload" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} />
          返回数据接入
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {scenario ? `${scenario.name} — 快速录入` : '快速录入'}
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            填写核心经营数字即可生成专业分析报告，无需准备数据文件
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {groups.map((group) => (
            <div key={group.title} className="card p-6">
              <h2 className="mb-4 text-base font-semibold text-ink">{group.title}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className={cn(field.type === 'text' && 'sm:col-span-2')}>
                    <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium text-ink">
                      {field.label}
                      {field.required && <span className="ml-1 text-danger">*</span>}
                    </label>
                    <input
                      id={field.key}
                      type={field.type === 'number' ? 'number' : 'text'}
                      step={field.type === 'number' ? 'any' : undefined}
                      min={field.min}
                      max={field.max}
                      value={values[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={cn(
                        'w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-muted',
                        errors[field.key]
                          ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30'
                          : 'border-line focus:border-accent focus:ring-2 focus:ring-accent/30'
                      )}
                    />
                    {errors[field.key] && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                        <AlertCircle size={12} />
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {errors._global && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {errors._global}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/upload"
              className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all',
                submitting
                  ? 'cursor-not-allowed bg-accent/70'
                  : 'bg-accent hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20'
              )}
            >
              {submitting ? (
                '提交中...'
              ) : (
                <>
                  提交分析
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* 提示 */}
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
          <Check size={18} className="mt-0.5 shrink-0 text-success" />
          <div className="text-xs leading-relaxed text-ink-secondary">
            <p className="font-medium text-ink">数据安全提示</p>
            <p className="mt-1">
              系统将根据您填写的数字反推分布并生成不少于30行的模拟明细数据，
              以确保 AI 分析结果具有统计意义。所有数据仅在分析期间临时存储，
              任务完成后可按需销毁。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
