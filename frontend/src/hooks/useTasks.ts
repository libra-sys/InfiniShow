import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { tasksApi } from '@/api/tasks'
import type { TaskAskRequest, TaskCreateRequest } from '@/types/api'

export function useTasks(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['tasks', page, pageSize],
    queryFn: () => tasksApi.list(page, pageSize),
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TaskCreateRequest) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useAskTask(taskId: string) {
  return useMutation({
    mutationFn: (data: TaskAskRequest) => tasksApi.ask(taskId, data),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
