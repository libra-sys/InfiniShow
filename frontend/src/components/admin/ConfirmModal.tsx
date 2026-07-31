import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-popover">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', danger ? 'bg-danger/10' : 'bg-warning/10')}>
            <AlertTriangle size={20} className={danger ? 'text-danger' : 'text-warning'} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <p className="text-xs text-ink-secondary">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all',
              danger ? 'bg-danger hover:bg-red-600' : 'bg-accent hover:bg-accent-hover'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
