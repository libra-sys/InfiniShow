import { get, post } from './client'
import type { ReportCompareRequest, ReportExportRequest } from '@/types/api'
import type { Report, ReportListItem } from '@/types/models'

export const reportsApi = {
  list: (page = 1, page_size = 20) =>
    get<{ items: ReportListItem[]; meta: { page: number; page_size: number; total: number; total_pages: number } }>(
      `/reports?page=${page}&page_size=${page_size}`
    ),
  getById: (id: string) => get<Report>(`/reports/${id}`),
  getByTask: (taskId: string) => get<Report>(`/reports/by-task/${taskId}`),
  demo: (scenarioCode: string) =>
    post<{ report_id: string; task_id: string; redirect_url: string }>('/reports/demo', { scenario_code: scenarioCode }),
  export: (id: string, data: ReportExportRequest) => post<{ format: string; url: string }>(`/reports/${id}/export`, data),
  compare: (data: ReportCompareRequest) => post<Record<string, unknown>>('/reports/compare', data),
  getHealthScore: (id: string) =>
    get<{ report_id: string; total_score: string | null; dimensions: Array<{ dimension: string; score: number; weight: number }>; score_source: string }>(`/reports/${id}/health-score`),
  getMetricTrace: (reportId: string, metricId: string, page = 1, pageSize = 10) =>
    get<{ metric_id: string; metric_name: string; conclusion: string; formula: string; row_count: number; rows: Array<Record<string, unknown>>; pagination: { page: number; page_size: number; total: number } }>(
      `/reports/${reportId}/metrics/${metricId}/trace?page=${page}&page_size=${pageSize}`
    ),
  exportMetricData: (reportId: string, metricId: string) =>
    `/api/v1/reports/${reportId}/metrics/${metricId}/export`,
  downloadPdf: (id: string) => `/api/v1/reports/${id}/pdf`,
  downloadMarkdown: (id: string) => `/api/v1/reports/${id}/markdown`,
}
