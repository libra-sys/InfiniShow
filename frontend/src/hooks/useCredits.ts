import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { inviteApi } from '@/api/invite'

export function useCredits() {
  return useQuery({
    queryKey: ['credits'],
    queryFn: () => inviteApi.creditLogs(),
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => inviteApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useInviteCode() {
  return useQuery({
    queryKey: ['invite-code'],
    queryFn: () => inviteApi.getCode(),
  })
}
