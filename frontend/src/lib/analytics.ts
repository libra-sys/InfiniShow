/**
 * 前端数据埋点 SDK
 * 核心事件清单见 DEVELOPMENT_GUIDE_SUPPLEMENT.md 第 13.3 节
 */

type EventName =
  | 'page_view'
  | 'button_click'
  | 'scenario_select'
  | 'task_create'
  | 'task_complete'
  | 'task_fail'
  | 'report_view'
  | 'trace_expand'
  | 'follow_up_ask'
  | 'share_generate'
  | 'share_visit'
  | 'invite_convert'
  | 'credit_consume'
  | 'policy_click'

interface AnalyticsEvent {
  event_name: EventName
  user_id?: string
  anonymous_id?: string
  properties?: Record<string, unknown>
  timestamp: string
}

// 匿名 ID 生成
function getAnonymousId(): string {
  const KEY = 'analytics_anonymous_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(KEY, id)
  }
  return id
}

// 事件队列（批量发送）
const eventQueue: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushBatch()
    flushTimer = null
  }, 5000)
}

function flushBatch(): void {
  if (eventQueue.length === 0) return
  const batch = eventQueue.splice(0, eventQueue.length)
  // 发送到后端（如果可用）
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    fetch(`${baseUrl.replace('/api/v1', '')}/api/v1/analytics/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 静默失败
  }
}

export function track(
  eventName: EventName,
  properties?: Record<string, unknown>,
  userId?: string
): void {
  const event: AnalyticsEvent = {
    event_name: eventName,
    user_id: userId,
    anonymous_id: getAnonymousId(),
    properties,
    timestamp: new Date().toISOString(),
  }

  eventQueue.push(event)
  scheduleFlush()

  // 开发环境日志
  if (import.meta.env.DEV) {
    console.debug('[analytics]', eventName, properties)
  }
}

export const analytics = {
  track,
  flush: flushBatch,
  getAnonymousId,
}
