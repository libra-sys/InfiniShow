/** 表单校验工具 */

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码至少 8 位' }
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: '密码需包含字母' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码需包含数字' }
  }
  return { valid: true }
}

export function validateNumber(value: unknown, min?: number, max?: number): { valid: boolean; message?: string } {
  const num = Number(value)
  if (isNaN(num)) {
    return { valid: false, message: '必须是数字' }
  }
  if (min !== undefined && num < min) {
    return { valid: false, message: `不能小于 ${min}` }
  }
  if (max !== undefined && num > max) {
    return { valid: false, message: `不能大于 ${max}` }
  }
  return { valid: true }
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return allowedTypes.includes(ext)
}
