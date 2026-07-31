import { useMutation, useQuery } from '@tanstack/react-query'

import { sharesApi } from '@/api/shares'
import type { ShareCreateRequest } from '@/types/api'

export function useCreateShare() {
  return useMutation({
    mutationFn: (data: ShareCreateRequest) => sharesApi.create(data),
  })
}

export function useShare(token: string, password?: string) {
  return useQuery({
    queryKey: ['share', token, password],
    queryFn: () => sharesApi.getByToken(token, password),
    enabled: !!token,
  })
}

export function useSharePoster(token: string) {
  return useQuery({
    queryKey: ['share-poster', token],
    queryFn: () => sharesApi.getPoster(token),
    enabled: !!token,
  })
}
