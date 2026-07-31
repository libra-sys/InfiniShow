/** 前端常量定义 */

export const APP_CONFIG = {
  appName: '可信经营洞察引擎',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.xlsx', '.xls', '.csv'],
  sseReconnectMaxRetries: 3,
  sseReconnectDelay: 3000,
}

export const SCENARIO_ICONS: Record<string, string> = {
  S01: 'utensils',
  S02: 'shopping-cart',
  S03: 'store',
  S04: 'apple',
  S05: 'scissors',
  S06: 'graduation-cap',
  S07: 'dumbbell',
  S08: 'paw-print',
  S09: 'car',
  S10: 'baby',
  S11: 'palette',
  S12: 'shopping-bag',
}

export const CONCLUSION_BADGE: Record<string, { label: string; color: string }> = {
  consistent: { label: '一致', color: 'bg-emerald-100 text-emerald-700' },
  questionable: { label: '存疑', color: 'bg-amber-100 text-amber-700' },
  inconsistent: { label: '不符', color: 'bg-rose-100 text-rose-700' },
}
