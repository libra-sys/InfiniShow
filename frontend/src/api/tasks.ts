import { del, get, post } from './client'
import type { TaskAskRequest, TaskCreateRequest } from '@/types/api'
import type { Task, TaskSummary } from '@/types/models'

export const tasksApi = {
  create: (data: TaskCreateRequest) => post<Task>('/tasks', data),
  quick: (data: { scenario_code: string; inputs: Record<string, unknown>; scenario_name?: string; title?: string }) =>
    post<Task>('/tasks/quick', data),
  list: (page = 1, page_size = 20) =>
    get<{ items: TaskSummary[]; meta: { page: number; page_size: number; total: number; total_pages: number } }>(
      `/tasks?page=${page}&page_size=${page_size}`
    ),
  getById: (id: string) => get<Task>(`/tasks/${id}`),
  getStatus: (id: string) =>
    get<{ task_id: string; status: string; progress: number; current_step: string | null; report_id: string | null; error_message: string | null; updated_at: string | null }>(`/tasks/${id}/status`),
  ask: (id: string, data: TaskAskRequest) => post<Record<string, unknown>>(`/tasks/${id}/ask`, data),
  delete: (id: string) => del<{ message: string }>(`/tasks/${id}`),
  getPendingInputs: (id: string) =>
    get<{ task_id: string; status: string; questions: Array<{ field: string; question: string; options?: string[] }> }>(`/tasks/${id}/pending-inputs`),
  resolveInputs: (id: string, resolutions: Array<Record<string, unknown>>) =>
    post<{ task_id: string; status: string }>(`/tasks/${id}/resolve-inputs`, { resolutions }),
  eventsUrl: (id: string, lastEventId?: string) => {
    let url = `/api/v1/tasks/${id}/events`
    if (lastEventId) url += `?last_event_id=${lastEventId}`
    return url
  },
}
