import { get, post } from './client'
import type { CheckInResponse, CreditLogItem, InviteCodeResponse } from '@/types/models'

export const inviteApi = {
  getCode: () => get<InviteCodeResponse>('/invite/code'),
  checkIn: () => post<CheckInResponse>('/invite/check-in', {}),
  creditLogs: () => get<CreditLogItem[]>('/invite/credits/logs'),
  claim: (inviteCode: string) =>
    post<{ credits_added: number; balance: number; inviter: string }>('/invite/claim', { invite_code: inviteCode }),
}
