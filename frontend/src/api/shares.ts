import { get, post } from './client'
import type { ShareCreateRequest } from '@/types/api'
import type { ShareDetail, ShareSnapshot } from '@/types/models'

export const sharesApi = {
  create: (data: ShareCreateRequest) => post<ShareSnapshot>('/shares', data),
  getByToken: (token: string, password?: string) =>
    get<ShareDetail>(`/shares/${token}${password ? `?password=${password}` : ''}`),
  getPoster: (token: string) => get<{ token: string; title: string; poster_url: string | null; snapshot_data: Record<string, unknown> }>(`/shares/${token}/poster`),
  generatePoster: (token: string) => post<{ job_id: string; status: string }>(`/shares/poster/${token}`, {}),
  getStats: (token: string) =>
    get<{ token: string; view_count: number; unique_visitor_count: number; converted_count: number; created_at: string | null }>(`/shares/${token}/stats`),
}
