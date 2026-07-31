import { get, post } from './client'

export interface Package {
  id: string
  name: string
  credits: number
  price_cents: number
  price_yuan: string
  currency: string
  valid_days: number
}

export interface Order {
  order_id: string
  amount_cents: number
  status: string
  payment_channel: string
  pay_url: string
}

export const paymentsApi = {
  listPackages: () => get<Package[]>('/packages'),
  createOrder: (packageId: string, paymentChannel: string = 'wechat') =>
    post<Order>('/orders', { package_id: packageId, payment_channel: paymentChannel }),
  queryOrder: (orderId: string) =>
    post<{ order_id: string; status: string; amount_cents: number; paid_at: string | null }>(`/orders/${orderId}/query`, {}),
}
