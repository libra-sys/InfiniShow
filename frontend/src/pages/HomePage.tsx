import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { scenarios } from '@/data/scenarios'
import {
  ArrowRight,
  Upload,
  FileSearch,
  FileCheck2,
  ShieldCheck,
  Eye,
  Zap,
  Share2,
  TrendingUp,
  ChevronDown,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base">
      <Header />

      {/* ===== Hero 区 ===== */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 — 微妙的网格 + 渐变光晕，不用紫蓝渐变 */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--color-line)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--color-line)/0.4)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto max-w-8xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* 左侧：价值主张 */}
            <div className="animate-slide-up">
              {/* 标签 */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary">
                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                全链路基于 InfiniSynapse · 真实任务可核验
              </div>

              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                不用写代码
                <br />
                <span className="text-accent">3 分钟</span>
                出一份
                <br />
                全溯源可信任的
                <br />
                经营诊断报告
              </h1>

              <p className="mt-5 max-w-md text-base text-ink-secondary sm:text-lg">
                每个结论绑定原始数据行号，输出「一致 / 存疑 / 不符」三档明确结果。
                拿到结果就能直接落地决策，不再担心 AI 幻觉。
              </p>

              {/* 主 CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/upload"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30"
                >
                  <Upload size={18} strokeWidth={2.5} />
                  上传数据，生成专属报告
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#scenarios"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
                >
                  <Zap size={16} strokeWidth={2.5} className="text-accent" />
                  先看看示例报告
                </a>
              </div>

              {/* 信任指标 */}
              <div className="mt-10 flex items-center gap-6 text-sm">
                <div>
                  <div className="text-2xl font-bold tabular-nums">12</div>
                  <div className="text-xs text-ink-muted">类经营场景</div>
                </div>
                <div className="h-8 w-px bg-line" />
                <div>
                  <div className="text-2xl font-bold tabular-nums">3<span className="text-base font-normal text-ink-muted">分钟</span></div>
                  <div className="text-xs text-ink-muted">出完整报告</div>
                </div>
                <div className="h-8 w-px bg-line" />
                <div>
                  <div className="text-2xl font-bold tabular-nums">100<span className="text-base font-normal text-ink-muted">%</span></div>
                  <div className="text-xs text-ink-muted">结论可溯源</div>
                </div>
              </div>
            </div>

            {/* 右侧：报告预览卡 — 用真实数据感而非装饰图 */}
            <div className="relative hidden lg:block animate-fade-in">
              <div className="absolute -right-4 -top-4 rounded-2xl border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                ✦ 一致
              </div>
              <div className="card-elevated overflow-hidden p-6">
                {/* 报告头 */}
                <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <div className="text-xs text-ink-muted">外卖餐饮店 · 近30天</div>
                    <div className="mt-0.5 text-lg font-bold">经营健康度 78</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-base font-bold text-accent">
                    B+
                  </div>
                </div>

                {/* KPI 行 */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-elevated p-3">
                    <div className="text-xs text-ink-muted">GMV</div>
                    <div className="mt-1 text-xl font-bold tabular-nums">¥36,000</div>
                    <div className="text-xs text-success">↑ 12% 环比</div>
                  </div>
                  <div className="rounded-lg bg-elevated p-3">
                    <div className="text-xs text-ink-muted">差评率</div>
                    <div className="mt-1 text-xl font-bold tabular-nums">3.8%</div>
                    <div className="text-xs text-danger">↑ 0.5% 环比</div>
                  </div>
                </div>

                {/* 溯源行 */}
                <div className="rounded-lg border border-line p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                    <ShieldCheck size={13} className="text-success" />
                    GMV 溯源核对
                  </div>
                  <div className="space-y-1 font-mono text-2xs text-ink-muted">
                    <div className="flex justify-between">
                      <span>→ SUM(actual_amount)</span>
                      <span className="text-ink-secondary">1,188 行</span>
                    </div>
                    <div className="flex justify-between">
                      <span>→ 剔除退款订单</span>
                      <span className="text-ink-secondary">12 行</span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-1">
                      <span className="font-semibold text-success">核对结果</span>
                      <span className="font-semibold text-success">一致 ✦</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 浮动溯源标签 */}
              <div className="absolute -bottom-3 -left-6 animate-slide-in-right rounded-xl border border-line bg-surface px-4 py-2.5 shadow-lg">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-accent" />
                  <span className="text-xs font-medium">点击任意指标查看原始数据</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 12 场景一键体验 ===== */}
      <section id="scenarios" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                选你的业态，一键体验
              </h2>
              <p className="mt-2 text-sm text-ink-secondary">
                12 类高频经营场景，预置真实示例数据，无需注册直接看完整报告
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              没有合适场景？上传自己的数据
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* 场景网格 — 不是全部等大，用 CSS grid 营造节奏 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scenarios.map((scenario, index) => {
              const Icon = scenario.icon
              return (
                <Link
                  key={scenario.code}
                  to={`/reports/demo-${scenario.code.toLowerCase()}`}
                  className="group relative flex flex-col rounded-xl border border-line bg-base p-5 transition-all hover:border-accent/40 hover:shadow-md"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* 图标 + 编号 */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-elevated ${scenario.color}`}>
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <span className="font-mono text-xs text-ink-muted">{scenario.code}</span>
                  </div>

                  {/* 名称 */}
                  <h3 className="text-base font-semibold">{scenario.name}</h3>
                  <p className="mt-1 text-xs text-ink-muted">{scenario.desc}</p>

                  {/* 指标标签 */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {scenario.metrics.map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-elevated px-2 py-0.5 text-2xs font-medium text-ink-secondary"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* 悬浮体验提示 */}
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    <Zap size={13} />
                    一键体验
                    <ArrowRight size={13} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== 三步流程 ===== */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              三步拿到可信报告
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              全程引导，无需任何代码基础
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* 步骤 1 */}
            <div className="relative">
              <div className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft font-bold text-accent">
                    1
                  </div>
                  <Upload size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-semibold">上传或填写数据</h3>
                <p className="mt-2 text-sm text-ink-secondary">
                  拖拽 Excel/CSV 文件，或直接填写核心数字。支持外卖、电商、便利店等 12 类场景标准模板。
                </p>
              </div>
              {/* 连接线 */}
              <div className="absolute right-[-12px] top-1/2 hidden h-px w-6 bg-line md:block" />
            </div>

            {/* 步骤 2 */}
            <div className="relative">
              <div className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft font-bold text-accent">
                    2
                  </div>
                  <FileSearch size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-semibold">AI 实时分析</h3>
                <p className="mt-2 text-sm text-ink-secondary">
                  实时推送「数据清洗 → 指标核算 → 结论生成」全流程进度，每个数字绑定原始数据行号。
                </p>
              </div>
              <div className="absolute right-[-12px] top-1/2 hidden h-px w-6 bg-line md:block" />
            </div>

            {/* 步骤 3 */}
            <div>
              <div className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft font-bold text-accent">
                    3
                  </div>
                  <FileCheck2 size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-semibold">获取可信报告</h3>
                <p className="mt-2 text-sm text-ink-secondary">
                  健康度评分 + KPI 卡片 + 交互图表 + 行动建议。支持 PDF 导出、分享海报、多轮追问。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 可信溯源卖点 ===== */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* 左侧文案 */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                <ShieldCheck size={14} />
                核心差异化
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                每个数字都能追到
                <br />
                原始数据的<span className="text-accent">具体行号</span>
              </h2>
              <p className="mt-4 text-sm text-ink-secondary sm:text-base">
                普通AI分析工具的结论随机性强，没有明确依据。我们全量继承头部作品的数字核查体系，
                所有指标自动绑定原始数据行号，输出三档可解释结论，完全杜绝 AI 幻觉。
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { label: '一致', desc: '指标可直接从原始数据计算得出，无异常', color: 'success' },
                  { label: '存疑', desc: '部分字段缺失或存在异常值，AI 已做合理假设', color: 'warning' },
                  { label: '不符', desc: '指标与原始数据明显矛盾，需用户核实', color: 'danger' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold badge-${item.color === 'success' ? 'consistent' : item.color === 'warning' ? 'questionable' : 'inconsistent'}`}>
                      {item.label}
                    </span>
                    <span className="text-sm text-ink-secondary">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：溯源流程可视化 */}
            <div className="card-elevated p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">指标：近30天 GMV</span>
                <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">一致 ✦</span>
              </div>

              <div className="space-y-3">
                {[
                  { step: '数据清洗', action: '识别字段映射：actual_amount → 实收金额', rows: '1,200 行' },
                  { step: '数据清洗', action: '剔除退款订单（refund_flag = 1）', rows: '12 行', highlight: true },
                  { step: '指标核算', action: '对 actual_amount 字段执行 SUM 聚合', rows: '1,188 行' },
                  { step: '结论生成', action: '计算结果 ¥36,000.00，与 AI 结论一致', rows: '✦ 核对通过' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.highlight ? 'bg-warning' : 'bg-accent'}`} />
                      {i < 3 && <div className="w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-1">
                      <div className="text-xs font-medium text-ink-muted">{item.step}</div>
                      <div className="mt-0.5 text-sm">{item.action}</div>
                      <div className="mt-0.5 font-mono text-2xs text-ink-muted">{item.rows}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-muted">
                <Eye size={13} />
                报告中每个指标均可点击查看完整溯源详情与原始数据
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 用户评价 / 社会证明 ===== */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              老板们已经在用
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              来自不同业态经营者的真实反馈
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                quote: '以前看美团后台数据头都大了，现在3分钟就知道哪几个菜品拖后腿，差评率两周降了1.2%。',
                name: '张老板',
                business: '外卖餐饮店 · 杭州',
                metric: '差评率 -1.2%',
              },
              {
                quote: '最打动我的是每个数字都能追到原始行号，不像其他AI工具给个结论就完事，这个真的敢拿来开会用。',
                name: '李姐',
                business: '社区便利店 · 成都',
                metric: '周转天数 -3天',
              },
              {
                quote: '不用注册就能先体验，填几个数字就出报告。分享给同行还能免费拿额度，已经在群里推荐了。',
                name: '王哥',
                business: '电商小店 · 广州',
                metric: 'ROI +18%',
              },
            ].map((item, i) => (
              <div key={i} className="card flex flex-col p-6">
                <div className="mb-3 text-3xl leading-none text-accent">"</div>
                <p className="flex-1 text-sm leading-relaxed text-ink-secondary">
                  {item.quote}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-ink-muted">{item.business}</div>
                  </div>
                  <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">
                    {item.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              常见问题
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              关于数据安全、使用门槛、赛事合规的解答
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: '我的经营数据安全吗？',
                a: '所有数据全程加密传输，服务端不留存原始数据永久副本。支持「分析后即焚」，分析完成后可一键销毁所有上传文件与历史任务，彻底不留任何数据副本。',
              },
              {
                q: '需要会写代码吗？',
                a: '完全不需要。上传 Excel/CSV 文件或直接填写核心数字即可，系统自动识别字段、映射、计算。12 类场景预置标准模板，从店铺后台导出后直接上传。',
              },
              {
                q: 'AI 生成的结论可信吗？',
                a: '每个指标结论都绑定原始数据的具体行号，输出「一致/存疑/不符」三档明确结果。您可以点击任意指标查看完整溯源详情，包括计算公式、参与行数、核对过程和原始数据行。',
              },
              {
                q: '分析任务真实发起吗？',
                a: '是的。全链路基于 InfiniSynapse Server API 实现，所有核心任务均真实发起并可在平台后台核验 Task ID。不存在演示造假，评委可通过公开链接查验全流程分析记录。',
              },
              {
                q: '免费额度用完了怎么办？',
                a: '新用户注册赠送 10 次免费分析额度，每日签到可领取额外次数。分享报告链接给好友，好友注册后双方各获得 3 次额外额度，实现低成本裂变。',
              },
              {
                q: '支持哪些业态？',
                a: '目前已覆盖 12 类高频经营场景：外卖餐饮、电商小店、便利店、生鲜店、美发美甲、教培、健身、宠物服务、汽车后市场、母婴零售、文创手作、综合零售。后续可持续扩展。',
              },
            ].map((faq, i) => (
              <details key={i} className="group card overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold transition-colors hover:bg-elevated/50">
                  {faq.q}
                  <ChevronDown size={16} className="text-ink-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-line px-4 py-3 text-sm text-ink-secondary">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            现在就开始你的第一份可信报告
          </h2>
          <p className="mt-3 text-sm text-ink-secondary">
            新用户赠送 10 次免费分析额度，无需注册即可体验全部场景
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30"
            >
              <Upload size={18} strokeWidth={2.5} />
              上传数据开始分析
            </Link>
            <Link
              to="/reports/demo-s01"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-elevated"
            >
              <TrendingUp size={18} strokeWidth={2.5} />
              查看示例报告
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-success" />
              分析后即焚，不留数据副本
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 size={14} className="text-accent" />
              分享报告可兑换免费额度
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-warning" />
              支持多轮追问深度分析
            </span>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 14l4-4 4 4 5-5" />
                </svg>
              </div>
              可信经营洞察引擎
            </div>
            <div className="text-xs text-ink-muted">
              全链路基于 InfiniSynapse Server API · 真实任务可核验
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
