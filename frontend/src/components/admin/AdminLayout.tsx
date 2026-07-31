import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Coins,
  ClipboardList,
  FileCheck,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Shield,
} from 'lucide-react'

const navItems = [
  { label: '概览', path: '/admin', icon: LayoutDashboard },
  { label: '用户管理', path: '/admin/users', icon: Users },
  { label: '额度管理', path: '/admin/credits', icon: Coins },
  { label: '任务核验', path: '/admin/tasks', icon: ClipboardList },
  { label: '政策审核', path: '/admin/policies', icon: FileCheck },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-base">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-line bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Shield size={16} />
          </div>
          <span className="text-sm font-bold text-white">管理后台</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent/15 text-accent'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ChevronLeft size={18} />
            返回前台
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-elevated lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-medium text-ink-secondary">
            {navItems.find((n) => n.path === location.pathname)?.label || '概览'}
          </div>
          <div className="w-9" />
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
