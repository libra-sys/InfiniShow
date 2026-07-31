import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/types/models'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (token: string, refreshToken: string, user: User) => void
  logout: () => void
  updateToken: (token: string, refreshToken?: string) => void
  updateUser: (user: Partial<User>) => void
  setUser: (user: User | null) => void
  updateCredits: (credits: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,

      login: (token, refreshToken, user) =>
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin' || user.role === 'superadmin',
        }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isAdmin: false,
        }),

      updateToken: (token, refreshToken) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      updateUser: (partial) =>
        set((state) => {
          if (!state.user) return state
          const newUser = { ...state.user, ...partial }
          return {
            user: newUser,
            isAdmin: newUser.role === 'admin' || newUser.role === 'superadmin',
          }
        }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        }),

      updateCredits: (credits) =>
        set((state) => {
          if (!state.user) return state
          return { user: { ...state.user, credits } }
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
)
