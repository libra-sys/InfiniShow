import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 格式化金额 */
export function formatCurrency(value: number, unit = '元'): string {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}万${unit}`
  }
  return `${value.toLocaleString('zh-CN')}${unit}`
}

/** 格式化百分比 */
export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/** 格式化数字 */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN')
}
