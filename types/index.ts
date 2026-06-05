export interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: 'pelanggan' | 'teknisi' | 'admin'
  is_active: boolean
  created_at: string
}

export interface TeknisiProfile {
  id: string
  status: 'tersedia' | 'bertugas' | 'offline'
  specializations: string[]
  rating_avg: number
  total_jobs: number
  latitude: number | null
  longitude: number | null
  updated_at: string
  profile?: Profile // Joined profile
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  is_active: boolean
}

export interface Service {
  id: string
  category_id: string
  name: string
  description: string | null
  price_min: number
  price_max: number
  duration_est: string | null
  is_active: boolean
  created_at: string
}

export type OrderStatus = 'menunggu' | 'dikonfirmasi' | 'berangkat' | 'diproses' | 'selesai' | 'dibatalkan'

export interface Order {
  id: string
  order_code: string
  pelanggan_id: string
  teknisi_id: string | null
  status: OrderStatus
  device_name: string
  device_type: 'laptop' | 'pc'
  location_address: string
  location_lat: number | null
  location_lng: number | null
  location_photo: string | null
  location_notes: string | null
  order_notes: string | null
  subtotal: number
  admin_fee: number
  total: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  
  // Relations
  pelanggan?: Profile
  teknisi?: Profile
  order_items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  service_id: string | null
  service_name: string
  price: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  method: 'qris' | 'virtual_account'
  va_bank: 'bca' | 'bni' | 'mandiri' | null
  midtrans_order_id: string | null
  midtrans_token: string | null
  midtrans_redirect: string | null
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'
  paid_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Chat {
  id: string
  order_id: string
  created_at: string
  order?: Order
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  order_id: string
  pelanggan_id: string
  teknisi_id: string
  rating: number
  comment: string | null
  created_at: string
  pelanggan?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'order' | 'payment' | 'chat' | 'system'
  is_read: boolean
  related_id: string | null
  created_at: string
}
