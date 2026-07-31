import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UIState {
  toasts: Toast[]
  isLoading: boolean
  loadingText: string
  drawerOpen: boolean
  drawerContent: React.ReactNode | null
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setLoading: (isLoading: boolean, text?: string) => void
  openDrawer: (content: React.ReactNode) => void
  closeDrawer: () => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isLoading: false,
  loadingText: '',
  drawerOpen: false,
  drawerContent: null,

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setLoading: (isLoading, text = '') => set({ isLoading, loadingText: text }),
  openDrawer: (content) => set({ drawerOpen: true, drawerContent: content }),
  closeDrawer: () => set({ drawerOpen: false, drawerContent: null }),
}))
