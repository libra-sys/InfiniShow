import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    if (!phone.trim()) return setError('请输入手机号'), false
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) return setError('手机号格式不正确'), false
    if (!password) return setError('请输入密码'), false
    if (password.length < 6) return setError('密码长度不能少于6位'), false
    if (password !== confirmPassword) return setError('两次输入的密码不一致'), false
    if (!agreed) return setError('请阅读并同意用户协议'), false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      await authApi.register({
        phone: phone.trim(),
        password,
        nickname: null,
        invite_code: inviteCode.trim() || undefined,
      })
      // 注册成功后自动登录
      const loginData = await authApi.login({ phone: phone.trim(), password })
      const user = await authApi.getMe()
      login(loginData.access_token, loginData.refresh_token, user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络异常，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>

        <div className="card p-8">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
                <circle cx="20" cy="9" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">可信经营洞察</h1>
              <p className="text-xs text-ink-muted">创建新账户</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 手机号 */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
                手机号
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="设置登录密码（至少6位）"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 pr-10 text-sm text-ink outline-none transition-all placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
                确认密码
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 pr-10 text-sm text-ink outline-none transition-all placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 邀请码 */}
            <div>
              <label htmlFor="inviteCode" className="mb-1.5 block text-sm font-medium text-ink">
                邀请码 <span className="font-normal text-ink-muted">（选填）</span>
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="如有邀请码请填写"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* 用户协议 */}
            <label className="flex cursor-pointer items-start gap-2.5">
              <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-line">
                {agreed && <Check size={12} className="text-accent" />}
              </div>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <span className="text-xs leading-relaxed text-ink-secondary">
                我已阅读并同意
                <Link to="/terms" className="text-accent hover:text-accent-hover">《用户协议》</Link>
                和
                <Link to="/privacy" className="text-accent hover:text-accent-hover">《隐私政策》</Link>
              </span>
            </label>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            {/* 提交 */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all',
                loading
                  ? 'cursor-not-allowed bg-accent/70'
                  : 'bg-accent hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20'
              )}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-muted">或</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <p className="text-center text-sm text-ink-secondary">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
