import type { ConclusionLevel, FileType, ShareType, TaskStatus, UserRole } from './enums'

/** 统一分页元数据 */
export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

/** 统一 API 响应 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: PaginationMeta | Record<string, unknown>
}

/** 用户 */
export interface User {
  id: string
  phone: string
  nickname: string | null
  avatar: string | null
  role: UserRole
  credits: number
  invite_code: string | null
  invited_by: string | null
  last_check_in_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/** 登录/Token */
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user_id: string
  role: UserRole
}

/** 用户积分 */
export interface UserCredits {
  credits: number
  today_checked_in: boolean
  last_check_in_at: string | null
}

/** 任务 */
export interface Task {
  id: string
  scenario_code: string
  scenario_name: string
  title: string | null
  status: TaskStatus
  progress: number
  conn_id: string | null
  task_id: string | null
  current_event_id: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskSummary {
  id: string
  user_id: string
  scenario_code: string
  scenario_name: string
  title: string | null
  status: TaskStatus
  progress: number
  conn_id: string | null
  task_id: string | null
  created_at: string
}

export interface TaskEvent {
  event_id: string
  type: string
  task_id: string
  data: {
    type: string
    task_id: string
    progress?: number
    message?: string
    [key: string]: unknown
  }
}

/** 文件 */
export interface FileRecord {
  id: string
  original_name: string
  file_type: FileType
  storage_key: string
  size_bytes: number
  columns: Array<{ name: string; type: string; sample: string }> | null
  row_count: number | null
  created_at: string
}

export interface FileUploadResponse extends FileRecord {}

/** 报告 */
export interface HealthScore {
  dimension: string
  score: number
  weight: number
}

export interface KpiItem {
  name: string
  value: string | number
  unit?: string
  trend?: string
  yoy?: string
}

export interface ConclusionItem {
  metric: string
  value: string
  level: ConclusionLevel
  source_rows: number[]
  formula?: string
  verification_process?: string
}

export interface ActionItem {
  title: string
  priority: string
  description: string
  expected_effect?: string
}

export interface Report {
  id: string
  task_id: string
  title: string
  overall_score: string | null
  health_scores: HealthScore[] | null
  kpis: KpiItem[] | null
  charts: Array<Record<string, unknown>> | null
  conclusions: ConclusionItem[] | null
  actions: ActionItem[] | null
  raw_data_summary: Record<string, unknown> | null
  markdown_content: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
}

export interface ReportListItem {
  id: string
  task_id: string
  title: string
  overall_score: string | null
  created_at: string
}

/** 分享 */
export interface ShareSnapshot {
  token: string
  share_url: string
  share_type: ShareType
  title: string
  expires_at: string | null
}

export interface ShareDetail {
  token: string
  title: string
  share_type: ShareType
  snapshot_data: Record<string, unknown>
  poster_url: string | null
  view_count: number
  created_at: string
  expires_at: string | null
}

/** 政策 */
export interface PolicyFeed {
  id: string
  title: string
  source: string | null
  source_url: string | null
  region: string | null
  industry: string | null
  summary: string | null
  publish_date: string | null
  status: string
  view_count: number
  tags: string[] | null
  created_at: string
  updated_at: string
}

/** 积分流水 */
export interface CreditLogItem {
  type: string
  amount: number
  balance: number
  created_at: string
  description: string | null
}

export interface InviteCodeResponse {
  invite_code: string
  invite_url: string
  invite_count: number
}

export interface CheckInResponse {
  success: boolean
  credits_added: number
  total_credits: number
  next_check_in_at: string | null
}
