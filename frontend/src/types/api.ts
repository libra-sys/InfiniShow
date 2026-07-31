import type {
  CheckInResponse,
  FileRecord,
  FileUploadResponse,
  InviteCodeResponse,
  PolicyFeed,
  Report,
  ReportListItem,
  ShareDetail,
  ShareSnapshot,
  Task,
  TaskEvent,
  TaskSummary,
  TokenResponse,
  User,
  UserCredits,
} from './models'

/** 认证请求 */
export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  phone: string
  password: string
  nickname: string | null
  invite_code?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

/** 任务请求 */
export interface TaskCreateRequest {
  scenario_code: string
  scenario_name: string
  title?: string
  prompt_text?: string
  file_ids: string[]
  quick_fields?: Record<string, unknown>
}

export interface TaskAskRequest {
  question: string
}

/** 报告请求 */
export interface ReportExportRequest {
  format: 'pdf' | 'markdown'
}

export interface ReportCompareRequest {
  report_ids: string[]
}

/** 分享请求 */
export interface ShareCreateRequest {
  report_id?: string
  task_id?: string
  share_type: 'report' | 'poster'
  title: string
  password?: string
  expires_days?: number
}

/** 政策请求 */
export interface PolicySearchParams {
  keyword?: string
  region?: string
  industry?: string
  page?: number
  page_size?: number
}

export interface PolicyFeedbackRequest {
  policy_id: string
  feedback_type: 'useful' | 'outdated' | 'irrelevant' | 'error'
  content?: string
}

/** API 返回类型映射 */
export type ApiTypes = {
  'auth/register': User
  'auth/login': TokenResponse
  'auth/refresh': TokenResponse
  'auth/logout': { message: string }
  'users/me': User
  'users/credits': UserCredits
  'tasks': Task
  'tasks/list': TaskSummary[]
  'tasks/events': TaskEvent
  'tasks/ask': Record<string, unknown>
  'files/upload': FileUploadResponse
  'files/list': FileRecord[]
  'reports': Report
  'reports/list': ReportListItem[]
  'reports/export': { format: string; url: string }
  'reports/compare': Record<string, unknown>
  'shares': ShareSnapshot
  'shares/detail': ShareDetail
  'policies': PolicyFeed[]
  'invite/code': InviteCodeResponse
  'invite/check-in': CheckInResponse
  'invite/credits/logs': Array<{ type: string; amount: number; balance: number; created_at: string; description?: string }>
  'destroy': { message: string }
}
