'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Laptop, Calendar, ChevronRight, Loader2, History } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  menunggu: 'bg-amber-100 text-amber-800 border-amber-200',
  dikonfirmasi: 'bg-blue-100 text-blue-800 border-blue-200',
  berangkat: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  diproses: 'bg-purple-100 text-purple-800 border-purple-200',
  selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  dibatalkan: 'bg-rose-100 text-rose-800 border-rose-200',
}

export default function ServiceHistoryPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchHistory = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('pelanggan_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (err) {
        console.warn('Error fetching history. Using mock data.', err)
        setOrders([
          {
            id: 'mock-order-1',
            order_code: 'FIX-928374',
            status: 'selesai',
            device_name: 'MacBook Air M1 2020',
            device_type: 'laptop',
            total: 260000,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            order_items: [{ service_name: 'Deep Clean Internal' }],
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat riwayat servis...</span>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800">
          Riwayat Servis
        </h1>
        <p className="text-sm text-slate-500">
          Daftar seluruh pesanan perbaikan laptop Anda
        </p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-6 text-slate-500 space-y-3">
            <History className="h-8 w-8 text-slate-350 mx-auto" />
            <div className="text-sm font-medium">Belum ada riwayat pesanan</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Semua order perbaikan laptop yang Anda buat akan tercatat di sini.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const dateStr = format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })
            const colorClass = STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-800'
            return (
              <Link href={`/orders/${order.id}`} key={order.id}>
                <Card className="border-slate-100 hover:border-blue-100 hover:shadow-sm transition-all rounded-2xl bg-white cursor-pointer group">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shadow-sm shrink-0">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm font-heading">{order.device_name}</span>
                          <Badge className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize shrink-0', colorClass)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-900">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
