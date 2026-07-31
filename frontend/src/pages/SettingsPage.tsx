import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'
import { apiClient } from '@/api/client'
import { useUIStore } from '@/store/uiStore'
import {
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  Volume2,
  VolumeX,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Save,
  Check,
} from 'lucide-react'

type TTSVoice = 'default' | 'male' | 'female'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  const [language, setLanguage] = useState('zh-CN')
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsVoice, setTtsVoice] = useState<TTSVoice>('default')
  const [showDestroyConfirm, setShowDestroyConfirm] = useState(false)
  const [destroyInput, setDestroyInput] = useState('')
  const [saved, setSaved] = useState(false)
  const [destroying, setDestroying] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDestroy = async () => {
    if (destroyInput !== '销毁数据') return
    setDestroying(true)
    try {
      await apiClient.post('/destroy', {})
      addToast({ type: 'success', message: '数据已销毁' })
      setShowDestroyConfirm(false)
      setDestroyInput('')
      logout()
      navigate('/login')
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : '销毁失败' })
    } finally {
      setDestroying(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <Header />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} />
          返回首页
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">设置</h1>
          <p className="mt-2 text-sm text-ink-secondary">管理您的账户偏好和应用配置</p>
        </div>

        <div className="space-y-6">
          {/* 账户信息 */}
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">账户信息</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-secondary">手机号</span>
                <span className="text-sm font-medium text-ink">{user?.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-secondary">用户 ID</span>
                <span className="text-sm font-mono text-ink-muted">{user?.id || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-secondary">剩余额度</span>
                <span className="text-sm font-medium text-accent">{user?.credits ?? 0} 点</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-secondary">角色</span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', user?.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-elevated text-ink-secondary')}>
                  {user?.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
            </div>
          </div>

          {/* 外观 */}
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">外观</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'light', label: '浅色', icon: Sun },
                { key: 'dark', label: '深色', icon: Moon },
              ] as const).map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => setTheme(item.key)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
                      theme === item.key
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-surface text-ink-secondary hover:bg-elevated'
                    )}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 语言 */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-ink-secondary" />
                <h2 className="text-base font-semibold text-ink">语言</h2>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          {/* TTS 偏好 */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ttsEnabled ? <Volume2 size={18} className="text-ink-secondary" /> : <VolumeX size={18} className="text-ink-secondary" />}
                <h2 className="text-base font-semibold text-ink">AI 配音</h2>
              </div>
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  ttsEnabled ? 'bg-accent' : 'bg-ink-muted/30'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    ttsEnabled ? 'left-6' : 'left-1'
                  )}
                />
              </button>
            </div>
            {ttsEnabled && (
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'default', label: '默认' },
                  { key: 'male', label: '男声' },
                  { key: 'female', label: '女声' },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTtsVoice(item.key)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      ttsVoice === item.key
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-surface text-ink-secondary hover:bg-elevated'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all',
                saved
                  ? 'bg-success hover:bg-success'
                  : 'bg-accent hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20'
              )}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? '已保存' : '保存设置'}
            </button>
          </div>

          {/* 数据销毁 */}
          <div className="card border-danger/20 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-danger">数据销毁</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  此操作将永久删除您的所有分析任务、上传文件和报告数据，且不可恢复。
                </p>
                <button
                  onClick={() => setShowDestroyConfirm(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  <Trash2 size={16} />
                  销毁所有数据
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 销毁确认弹窗 */}
      {showDestroyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-popover">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <ShieldCheck size={20} className="text-danger" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">确认数据销毁</h3>
                <p className="text-xs text-ink-secondary">此操作不可撤销，请谨慎操作</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-secondary">
              请输入「<span className="font-semibold text-danger">销毁数据</span>」以确认操作。
            </p>
            <input
              type="text"
              value={destroyInput}
              onChange={(e) => setDestroyInput(e.target.value)}
              placeholder="销毁数据"
              className="mt-3 w-full rounded-xl border border-line bg-base px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-danger focus:ring-2 focus:ring-danger/30"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowDestroyConfirm(false); setDestroyInput('') }}
                className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
              >
                取消
              </button>
              <button
                onClick={handleDestroy}
                disabled={destroyInput !== '销毁数据' || destroying}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all',
                  destroyInput === '销毁数据' && !destroying
                    ? 'bg-danger hover:bg-red-600'
                    : 'cursor-not-allowed bg-danger/50'
                )}
              >
                {destroying ? '销毁中…' : '确认销毁'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
