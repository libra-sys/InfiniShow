import { get, post } from './client'
import type { LoginRequest, RefreshTokenRequest, RegisterRequest } from '@/types/api'
import type { TokenResponse, User } from '@/types/models'

export const authApi = {
  register: (data: RegisterRequest) => post<User>('/auth/register', data),
  login: (data: LoginRequest) => post<TokenResponse>('/auth/login', data),
  refresh: (data: RefreshTokenRequest) => post<TokenResponse>('/auth/refresh', data),
  logout: () => post<{ message: string }>('/auth/logout', {}),
  getMe: () => get<User>('/users/me'),
}
