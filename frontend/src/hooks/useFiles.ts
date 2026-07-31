import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { filesApi } from '@/api/files'

export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: () => filesApi.list(),
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => filesApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}
