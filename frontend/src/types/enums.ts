/** 用户角色 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

/** 任务状态 */
export enum TaskStatus {
  PENDING = 'pending',
  CONNECTING = 'connecting',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/** 报告状态 */
export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** 溯源结论等级 */
export enum ConclusionLevel {
  CONSISTENT = 'consistent',
  DOUBTFUL = 'doubtful',
  INCONSISTENT = 'inconsistent',
}

/** 积分类型 */
export enum CreditType {
  REGISTER = 'register',
  DAILY_CHECKIN = 'daily_checkin',
  INVITE = 'invite',
  TASK_CONSUME = 'task_consume',
  ADMIN_ADJUST = 'admin_adjust',
}

/** 文件类型 */
export enum FileType {
  EXCEL = 'excel',
  CSV = 'csv',
  TEMPLATE = 'template',
  REPORT = 'report',
  POSTER = 'poster',
}

/** 分享类型 */
export enum ShareType {
  REPORT = 'report',
  POSTER = 'poster',
}

/** 政策状态 */
export enum PolicyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
