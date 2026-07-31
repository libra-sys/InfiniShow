import { del, get, uploadFile } from './client'
import type { FileRecord, FileUploadResponse } from '@/types/models'

export const filesApi = {
  upload: (file: File) => uploadFile<FileUploadResponse>('/files/upload', file),
  list: () => get<FileRecord[]>('/files'),
  download: (id: string) => get<never>(`/files/${id}/download`),
  delete: (id: string) => del<{ message: string }>(`/files/${id}`),
}
