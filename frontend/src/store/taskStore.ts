import { create } from 'zustand'

import type { TaskEvent } from '@/types/models'

interface TaskState {
  activeTaskId: string | null
  progress: number
  status: string
  events: TaskEvent[]
  currentEventId: string | null
  errorMessage: string | null
  setActiveTask: (taskId: string | null) => void
  addEvent: (event: TaskEvent) => void
  setProgress: (progress: number) => void
  setStatus: (status: string) => void
  setError: (message: string | null) => void
  reset: () => void
}

export const useTaskStore = create<TaskState>((set) => ({
  activeTaskId: null,
  progress: 0,
  status: 'pending',
  events: [],
  currentEventId: null,
  errorMessage: null,

  setActiveTask: (taskId) => set({ activeTaskId: taskId, progress: 0, status: 'pending', events: [], errorMessage: null }),

  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
      currentEventId: event.event_id ?? state.currentEventId,
    })),

  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),
  setError: (errorMessage) => set({ errorMessage }),
  reset: () =>
    set({
      activeTaskId: null,
      progress: 0,
      status: 'pending',
      events: [],
      currentEventId: null,
      errorMessage: null,
    }),
}))
