import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest, RegisterRequest } from '@/types/api'
import { UserRole } from '@/types/enums'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { login: storeLogin, logout: storeLogout } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      storeLogin(data.access_token, data.refresh_token, {
        id: data.user_id,
        phone: '',
        nickname: '',
        avatar: null,
        role: data.role as UserRole,
        credits: 0,
        invite_code: null,
        invited_by: null,
        last_check_in_at: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/')
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate('/login')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
    },
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: useAuthStore.getState().isAuthenticated,
  })

  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}

export function useLogin() {
  return useMutation({ mutationFn: (data: LoginRequest) => authApi.login(data) })
}

export function useRegister() {
  return useMutation({ mutationFn: (data: RegisterRequest) => authApi.register(data) })
}
