import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-react'

export interface PendingInput {
  id: string
  question: string
  type: 'choice' | 'text'
  options?: { label: string; value: string }[]
}

interface HumanInTheLoopPanelProps {
  pending: PendingInput
  onSubmit: (inputId: string, value: string) => void
  onCancel?: () => void
  submitting?: boolean
}

export function HumanInTheLoopPanel({
  pending,
  onSubmit,
  onCancel,
  submitting = false,
}: HumanInTheLoopPanelProps) {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const handleSubmit = () => {
    const finalValue = pending.type === 'choice' ? selected : value
    if (!finalValue) return
    onSubmit(pending.id, finalValue)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-popover">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
            <AlertCircle size={20} className="text-warning" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">分析需要您的确认</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              AI 在处理数据时遇到了需要人工确认的问题，请您协助解答以便继续分析。
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-base p-4">
          <p className="text-sm font-medium text-ink">{pending.question}</p>

          {pending.type === 'choice' && pending.options && (
            <div className="mt-4 grid gap-2">
              {pending.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelected(opt.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all',
                    selected === opt.value
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-surface text-ink-secondary hover:bg-elevated hover:text-ink'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      selected === opt.value
                        ? 'border-accent bg-accent text-white'
                        : 'border-line'
                    )}
                  >
                    {selected === opt.value && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {pending.type === 'text' && (
            <div className="mt-4">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                placeholder="请输入您的回答..."
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
            >
              取消任务
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || (pending.type === 'choice' ? !selected : !value.trim())}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all',
              submitting || (pending.type === 'choice' ? !selected : !value.trim())
                ? 'cursor-not-allowed bg-accent/70'
                : 'bg-accent hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20'
            )}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? '提交中...' : '提交确认'}
          </button>
        </div>
      </div>
    </div>
  )
}
