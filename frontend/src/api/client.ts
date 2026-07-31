import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'

import { useAuthStore } from '@/store/authStore'
import type { ApiResponse } from '@/types/models'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

async function refreshToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) return null

  try {
    const response = await axios.post<ApiResponse<{ access_token: string; refresh_token: string; expires_in: number; user_id: string; role: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken }
    )
    const data = response.data.data
    if (data) {
      useAuthStore.getState().updateToken(data.access_token, data.refresh_token)
      return data.access_token
    }
    return null
  } catch (error) {
    useAuthStore.getState().logout()
    window.location.href = '/login'
    return null
  }
}

// 请求拦截器：注入 Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一包装、Token 刷新、错误处理
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { data } = response
    if (data.code !== 200) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const newToken = await refreshToken()
      isRefreshing = false

      if (newToken) {
        onTokenRefreshed(newToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return apiClient(originalRequest)
      }
    }

    const message = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(message))
  }
)

/** 类型化的 GET 请求 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config)
  return response.data.data
}

/** 类型化的 POST 请求 */
export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config)
  return response.data.data
}

/** 类型化的 DELETE 请求 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config)
  return response.data.data
}

/** 文件上传请求 */
export async function uploadFile<T>(url: string, file: File, config?: AxiosRequestConfig): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config?.headers,
    },
  })
  return response.data.data
}

/** 创建 SSE EventSource */
export function createEventSource(url: string, token: string | null): EventSource {
  const fullUrl = `${API_BASE_URL.replace('/api/v1', '')}${url}`
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  // EventSource 不支持自定义 header，使用 token 查询参数作为降级
  const separator = fullUrl.includes('?') ? '&' : '?'
  return new EventSource(`${fullUrl}${separator}token=${token || ''}`)
}
