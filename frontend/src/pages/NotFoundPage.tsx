import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4">
      <div className="text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 4 4 5-5" />
              <circle cx="20" cy="9" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight text-accent">404</h1>
        <p className="mt-4 text-lg font-medium text-ink">页面不存在</p>
        <p className="mt-1 text-sm text-ink-secondary">您访问的页面可能已被移除或链接有误</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated"
          >
            <ArrowLeft size={16} />
            返回上一页
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
          >
            <Home size={16} />
            回到首页
          </Link>
        </div>
      </div>
    </div>
  )
}
