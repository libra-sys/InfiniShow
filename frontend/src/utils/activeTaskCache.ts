/**
 * 活跃任务缓存 — localStorage 持久化
 * 用于 SSE 断线恢复和页面刷新同步
 */

const CACHE_KEY = 'credible_insight_active_task'

export interface ActiveTaskCache {
  taskId: string
  connId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  lastEventId: string
  createdAt: number
  scenarioCode: string
  reportId?: string
}

export function getActiveTaskCache(): ActiveTaskCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ActiveTaskCache
  } catch {
    return null
  }
}

export function setActiveTaskCache(cache: Partial<ActiveTaskCache>): void {
  try {
    const existing = getActiveTaskCache()
    const updated: ActiveTaskCache = {
      taskId: cache.taskId ?? existing?.taskId ?? '',
      connId: cache.connId ?? existing?.connId ?? '',
      status: cache.status ?? existing?.status ?? 'pending',
      lastEventId: cache.lastEventId ?? existing?.lastEventId ?? '',
      createdAt: cache.createdAt ?? existing?.createdAt ?? Date.now(),
      scenarioCode: cache.scenarioCode ?? existing?.scenarioCode ?? '',
      reportId: cache.reportId ?? existing?.reportId,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function updateActiveTaskCache(updates: Partial<ActiveTaskCache>): void {
  setActiveTaskCache(updates)
}

export function clearActiveTaskCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // 静默失败
  }
}

export function hasActiveTask(): boolean {
  const cache = getActiveTaskCache()
  if (!cache) return false
  // 超过 1 小时的任务缓存视为过期
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  return cache.createdAt > oneHourAgo && cache.status !== 'completed' && cache.status !== 'failed'
}
