import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { adminApi } from '@/api/admin'

export function useAdminUsers(keyword?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin-users', keyword, page, pageSize],
    queryFn: () => adminApi.listUsers(keyword, page, pageSize),
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.toggleUserStatus(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useAdminCreditLogs(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin-credit-logs', page, pageSize],
    queryFn: () => adminApi.listCreditLogs(page, pageSize),
  })
}

export function useAdjustCredits() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      adminApi.adjustCredits(userId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useAdminTasks(status?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin-tasks', status, page, pageSize],
    queryFn: () => adminApi.listTasks(status, page, pageSize),
  })
}

export function useVerifyTask(taskId: string) {
  return useQuery({
    queryKey: ['admin-task-verify', taskId],
    queryFn: () => adminApi.verifyTask(taskId),
    enabled: !!taskId,
  })
}

export function useAdminPendingPolicies(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin-policies', page, pageSize],
    queryFn: () => adminApi.listPendingPolicies(page, pageSize),
  })
}

export function useReviewPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ policyId, status }: { policyId: string; status: string }) => adminApi.reviewPolicy(policyId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-policies'] }),
  })
}
