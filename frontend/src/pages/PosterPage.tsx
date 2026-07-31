import { useParams } from 'react-router-dom'
import { useSharePoster } from '@/hooks/useShares'

export default function PosterPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const { data: poster } = useSharePoster(shareCode || '')

  const title = poster?.title || '经营诊断报告'
  const snapshot = (poster?.snapshot_data || {}) as {
    overall_score?: string
    kpis?: unknown[]
    actions?: unknown[]
  }
  const score = snapshot.overall_score ? parseFloat(snapshot.overall_score) || 78 : 78
  const kpiCount = snapshot.kpis?.length || 0
  const actionCount = snapshot.actions?.length || 0

  return (
    <div
      className="relative flex flex-col items-center justify-between overflow-hidden"
      style={{ width: 750, height: 1334, background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)' }}
    >
      {/* 装饰网格 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 顶部光晕 */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />

      {/* 内容区 */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-12 pt-20 text-center">
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 4 4 5-5" />
            <circle cx="20" cy="9" r="1.5" fill="white" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          可信经营洞察
        </h1>
        <p className="mt-2 text-base text-blue-200">
          全溯源经营分析引擎
        </p>

        {/* 报告信息卡片 */}
        <div className="mt-12 w-full rounded-2xl bg-white/10 p-8 backdrop-blur-md">
          <p className="text-sm text-blue-200">我刚刚生成了一份</p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {title}
          </h2>
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{score}</div>
              <div className="mt-1 text-xs text-blue-200">健康度评分</div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{kpiCount}</div>
              <div className="mt-1 text-xs text-blue-200">项关键指标</div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{actionCount}</div>
              <div className="mt-1 text-xs text-blue-200">条行动建议</div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-blue-200">
          每个结论绑定原始数据，可追溯、可核验
        </p>
      </div>

      {/* 底部二维码区 */}
      <div className="relative z-10 flex w-full flex-col items-center pb-16">
        <div className="flex flex-col items-center rounded-2xl bg-white p-5 shadow-2xl">
          {/* 二维码占位 */}
          <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-slate-100">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <rect x="10" y="10" width="30" height="30" rx="4" fill="#0f172a" />
              <rect x="15" y="15" width="20" height="20" rx="2" fill="white" />
              <rect x="18" y="18" width="14" height="14" rx="1" fill="#0f172a" />
              <rect x="80" y="10" width="30" height="30" rx="4" fill="#0f172a" />
              <rect x="85" y="15" width="20" height="20" rx="2" fill="white" />
              <rect x="88" y="18" width="14" height="14" rx="1" fill="#0f172a" />
              <rect x="10" y="80" width="30" height="30" rx="4" fill="#0f172a" />
              <rect x="15" y="85" width="20" height="20" rx="2" fill="white" />
              <rect x="18" y="88" width="14" height="14" rx="1" fill="#0f172a" />
              <rect x="50" y="10" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="50" y="30" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="50" y="50" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="70" y="50" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="90" y="50" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="10" y="50" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="30" y="50" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="50" y="70" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="50" y="90" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="70" y="70" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="90" y="70" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="70" y="90" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="90" y="90" width="10" height="10" rx="2" fill="#0f172a" />
              <rect x="80" y="80" width="30" height="30" rx="4" fill="#0f172a" opacity="0.1" />
            </svg>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-700">扫码查看完整报告</p>
          <p className="mt-1 text-xs text-slate-400">{shareCode}</p>
        </div>
        <p className="mt-6 text-xs text-blue-300">
          https://app.infinisynapse.cn
        </p>
      </div>
    </div>
  )
}
