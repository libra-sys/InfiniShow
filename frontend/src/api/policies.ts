import { get, post } from './client'
import type { PolicyFeedbackRequest, PolicySearchParams } from '@/types/api'
import type { PolicyFeed } from '@/types/models'

export const policiesApi = {
  search: (params: PolicySearchParams = {}) => {
    const query = new URLSearchParams()
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.region) query.append('region', params.region)
    if (params.industry) query.append('industry', params.industry)
    query.append('page', String(params.page || 1))
    query.append('page_size', String(params.page_size || 20))
    return get<{ items: PolicyFeed[]; meta: { page: number; page_size: number; total: number; total_pages: number } }>(
      `/policies?${query.toString()}`
    )
  },
  feedback: (data: PolicyFeedbackRequest) => post<{ message: string }>(`/policies/${data.policy_id}/feedback`, data),
}
