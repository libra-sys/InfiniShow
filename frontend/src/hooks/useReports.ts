import { useMutation, useQuery } from '@tanstack/react-query'

import { reportsApi } from '@/api/reports'
import type { ReportCompareRequest, ReportExportRequest } from '@/types/api'

export function useReports(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['reports', page, pageSize],
    queryFn: () => reportsApi.list(page, pageSize),
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.getById(id),
    enabled: !!id,
  })
}

export function useReportByTask(taskId: string) {
  return useQuery({
    queryKey: ['report-by-task', taskId],
    queryFn: () => reportsApi.getByTask(taskId),
    enabled: !!taskId,
  })
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReportExportRequest }) => reportsApi.export(id, data),
  })
}

export function useCompareReports() {
  return useMutation({
    mutationFn: (data: ReportCompareRequest) => reportsApi.compare(data),
  })
}
