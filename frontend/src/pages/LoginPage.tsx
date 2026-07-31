import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    if (!phone.trim()) return setError('请输入手机号'), false
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) return setError('手机号格式不正确'), false
    if (!password) return setError('请输入密码'), false
    if (password.length < 6) return setError('密码长度不能少于6位'), false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      const data = await authApi.login({ phone: phone.trim(), password })
      // 登录后获取用户信息
      const user = await authApi.getMe()
      login(data.access_token, data.refresh_token, user)
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
        {/* 返回首页 */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          返回首页
        </Link>

        <div className="card p-8">
          {/* Logo */}
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
              <p className="text-xs text-ink-muted">登录您的账户</p>
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
                  placeholder="请输入密码"
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

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent accent-accent focus:ring-accent/30"
                />
                <span className="text-ink-secondary">记住我</span>
              </label>
              <Link to="/forgot-password" className="text-accent hover:text-accent-hover">
                忘记密码？
              </Link>
            </div>

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
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 分割线 */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-muted">或</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {/* 注册入口 */}
          <p className="text-center text-sm text-ink-secondary">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
