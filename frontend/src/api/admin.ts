import { get, post } from './client'
import type { PolicyFeed, TaskSummary, User } from '@/types/models'

export interface AdminUserListResponse {
  items: User[]
  meta: { page: number; page_size: number; total: number; total_pages: number }
}

export interface AdminCreditLogResponse {
  items: Array<{
    id: string
    user_id: string
    type: string
    amount: number
    balance: number
    created_at: string
  }>
  meta: { page: number; page_size: number; total: number; total_pages: number }
}

export interface AdminTaskListResponse {
  items: TaskSummary[]
  meta: { page: number; page_size: number; total: number; total_pages: number }
}

export const adminApi = {
  listUsers: (keyword?: string, page = 1, page_size = 20) =>
    get<AdminUserListResponse>(`/admin/users?keyword=${keyword || ''}&page=${page}&page_size=${page_size}`),
  toggleUserStatus: (userId: string) =>
    post<User>(`/admin/users/${userId}/toggle`, {}),
  listCreditLogs: (page = 1, page_size = 20) =>
    get<AdminCreditLogResponse>(`/admin/credits/logs?page=${page}&page_size=${page_size}`),
  adjustCredits: (userId: string, amount: number, reason: string) =>
    post<{ user_id: string; phone: string; credits: number }>('/admin/credits/adjust', { user_id: userId, amount, reason }),
  listTasks: (status?: string, page = 1, page_size = 20) =>
    get<AdminTaskListResponse>(`/admin/tasks?status=${status || ''}&page=${page}&page_size=${page_size}`),
  verifyTask: (taskId: string) =>
    get<TaskSummary>(`/admin/tasks/${taskId}/verify`),
  listPendingPolicies: (page = 1, page_size = 20) =>
    get<{ items: PolicyFeed[]; meta: { page: number; page_size: number; total: number; total_pages: number } }>(
      `/admin/policies/pending?page=${page}&page_size=${page_size}`
    ),
  reviewPolicy: (policyId: string, status: string) =>
    post<PolicyFeed>(`/admin/policies/${policyId}/review`, { status }),
}
