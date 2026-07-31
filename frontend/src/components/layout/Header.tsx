import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import {
  Menu,
  X,
  LogOut,
  Settings,
  History,
  Shield,
  ChevronDown,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { isAuthenticated, isAdmin, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const navItems = [
    { label: '首页', path: '/' },
    { label: '数据接入', path: '/upload' },
    { label: '示例报告', path: '/reports/demo-s01' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 4 4 5-5" />
              <circle cx="20" cy="9" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-base font-bold leading-tight">可信经营洞察</div>
            <div className="text-2xs text-ink-muted leading-tight">全溯源经营分析引擎</div>
          </div>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === item.path
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-secondary hover:bg-elevated hover:text-ink'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <span className="hidden max-w-[80px] truncate lg:block">{user.nickname || user.phone}</span>
                <ChevronDown size={14} className={cn('transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-line bg-surface p-1 shadow-popover">
                    <Link
                      to="/history"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                    >
                      <History size={16} />
                      我的分析
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                    >
                      <Settings size={16} />
                      设置
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                      >
                        <Shield size={16} />
                        管理后台
                      </Link>
                    )}
                    <div className="my-1 h-px bg-line" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover md:block"
            >
              登录 / 注册
            </Link>
          )}

          {/* 移动端汉堡菜单 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-elevated hover:text-ink md:hidden"
            aria-label="菜单"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 移动端展开菜单 */}
      {mobileOpen && (
        <div className="animate-slide-up border-t border-line bg-surface md:hidden">
          <nav className="mx-auto max-w-8xl px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-accent-soft text-accent'
                    : 'text-ink-secondary hover:bg-elevated hover:text-ink'
                )}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  to="/history"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                >
                  我的分析
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                >
                  设置
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                  >
                    管理后台
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileOpen(false)
                  }}
                  className="mt-2 block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  退出登录
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                登录 / 注册
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
