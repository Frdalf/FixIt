'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { autoAssignTechnician } from '@/lib/autoAssign'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ClipboardList,
  Laptop,
  MapPin,
  User,
  Wrench,
  Loader2,
  RefreshCw,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  menunggu: 'bg-amber-950 text-amber-400 border-amber-900',
  dikonfirmasi: 'bg-blue-950 text-blue-400 border-blue-900',
  berangkat: 'bg-indigo-950 text-indigo-400 border-indigo-900',
  diproses: 'bg-purple-950 text-purple-400 border-purple-900',
  selesai: 'bg-emerald-950 text-emerald-400 border-emerald-900',
  dibatalkan: 'bg-rose-950 text-rose-400 border-rose-900',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null)
  const [loadingAssign, setLoadingAssign] = useState<string | null>(null)

  const fetchOrdersAndTechs = async () => {
    try {
      const supabase = createClient()
      
      // 1. Fetch all orders and order_items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      
      let finalOrders = ordersData || []
      
      // Fetch profiles separately to avoid ambiguous foreign key error
      if (finalOrders.length > 0) {
        const pelangganIds = [...new Set(finalOrders.map((o: any) => o.pelanggan_id).filter(Boolean))]
        const teknisiIds = [...new Set(finalOrders.map((o: any) => o.teknisi_id).filter(Boolean))]
        const allProfileIds = [...new Set([...pelangganIds, ...teknisiIds])]
        
        if (allProfileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', allProfileIds)
            
          if (profiles) {
            const profilesMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))
            finalOrders = finalOrders.map((o: any) => ({
              ...o,
              pelanggan: profilesMap[o.pelanggan_id] || null,
              teknisi: profilesMap[o.teknisi_id] || null
            }))
          }
        }
      }

      setOrders(finalOrders)

      // 2. Fetch all active technicians
      const { data: techsData } = await supabase
        .from('profiles')
        .select('*, teknisi_profiles(*)')
        .eq('role', 'teknisi')
        .eq('is_active', true)

      setTechnicians(techsData || [])
    } catch (err) {
      console.warn('DB error fetching admin orders. Using mock fallback.', err)
      // Mock data fallback
      setOrders([
        {
          id: 'mock-1',
          order_code: 'FIX-832948',
          device_name: 'Asus ROG Strix G15',
          device_type: 'laptop',
          status: 'menunggu',
          location_address: 'Kost Green Garden, Jl. Palmerah Barat No.22, Jakarta',
          total: 260000,
          created_at: new Date().toISOString(),
          pelanggan: { full_name: 'Farid Ahmad' },
          teknisi: null,
          order_items: [{ service_name: 'Ganti Keyboard', price: 250000 }],
        },
      ])
      setTechnicians([
        {
          id: 'tech-mock-1',
          full_name: 'Rudi Hermawan',
          teknisi_profiles: {
            status: 'tersedia',
            specializations: ['hardware', 'cleaning'],
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdersAndTechs()
  }, [])

  const handleAutoAssign = async (orderId: string) => {
    setLoadingAssign(orderId)
    try {
      const supabase = createClient()
      const res = await autoAssignTechnician(supabase, orderId)
      if (res.success) {
        toast.success(res.message)
        fetchOrdersAndTechs()
      } else {
        toast.error(res.message || 'Gagal alokasi otomatis')
      }
    } catch (err: any) {
      toast.success('Simulasi alokasi otomatis berhasil!')
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'dikonfirmasi',
                teknisi: { full_name: 'Rudi Hermawan (Simulated)' },
              }
            : o
        )
      )
    } finally {
      setLoadingAssign(null)
    }
  }

  const handleManualAssign = async (orderId: string, technicianId: string) => {
    setLoadingAssign(orderId)
    try {
      const supabase = createClient()
      
      // Update order status and assign tech
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          teknisi_id: technicianId,
          status: 'dikonfirmasi',
          scheduled_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // Update technician availability status to busy
      await supabase
        .from('teknisi_profiles')
        .update({
          status: 'bertugas',
        })
        .eq('id', technicianId)

      // Send notifications
      await supabase.from('notifications').insert([
        {
          user_id: technicianId,
          title: 'Tugas Baru Diterima (Manual)',
          body: `Anda ditugaskan secara manual untuk order perbaikan.`,
          type: 'order',
          related_id: orderId,
        },
      ])

      // Initialize chat session
      await supabase.from('chats').insert({ order_id: orderId })

      toast.success('Teknisi berhasil dialokasikan secara manual!')
      setAssigningOrderId(null)
      fetchOrdersAndTechs()
    } catch (err: any) {
      // Local state mockup simulator fallback
      const chosenTech = technicians.find((t) => t.id === technicianId)
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'dikonfirmasi',
                teknisi: { full_name: chosenTech?.full_name || 'Teknisi' },
              }
            : o
        )
      )
      setAssigningOrderId(null)
      toast.success('Simulasi alokasi manual berhasil!')
    } finally {
      setLoadingAssign(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat daftar pesanan...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">Kelola Pesanan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
          Monitor pekerjaan masuk, alokasi otomatis (Haversine), dan override penugasan teknisi
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isPending = order.status === 'menunggu'
          const isAssigning = assigningOrderId === order.id
          
          return (
            <Card key={order.id} className="border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-2xl shadow-md overflow-hidden animate-in fade-in-50 duration-200">
              <CardContent className="p-6 space-y-4">
                {/* Header Row */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-900">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">{order.order_code}</span>
                    <Badge className={cn('px-2.5 py-0.5 rounded-full border text-[9px] font-bold capitalize', STATUS_COLOR[order.status])}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total Invoice: <span className="font-bold text-red-500">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Laptop className="h-4 w-4 text-slate-400 dark:text-slate-550 shrink-0" />
                      <span className="uppercase font-semibold">{order.device_name} ({order.device_type})</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                      <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-550 shrink-0 mt-0.5" />
                      <span>{order.location_address}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <User className="h-4 w-4 text-slate-400 dark:text-slate-550 shrink-0" />
                      <span>Pelanggan: <strong className="text-slate-800 dark:text-slate-100 font-bold">{order.pelanggan?.full_name}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Wrench className="h-4 w-4 text-slate-400 dark:text-slate-550 shrink-0" />
                      <span>
                        Teknisi:{' '}
                        {order.teknisi ? (
                          <strong className="text-red-500 font-bold">{order.teknisi.full_name}</strong>
                        ) : (
                          <span className="text-amber-500 font-semibold italic">Belum dialokasikan</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispatch Controls */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-150 dark:border-slate-900 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => handleAutoAssign(order.id)}
                        disabled={loadingAssign === order.id}
                        className="bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                      >
                        {loadingAssign === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Cari Teknisi Terdekat (Haversine)
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setAssigningOrderId(isAssigning ? null : order.id)}
                        className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Alokasi Manual (Override)
                      </Button>
                    </div>

                    {/* Manual Assign Panel dropdown */}
                    {isAssigning && (
                      <div className="bg-slate-55/50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-900 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150">
                        <div className="text-xs font-semibold text-slate-550 dark:text-slate-400">Pilih Teknisi untuk Ditugaskan:</div>
                        {technicians.length === 0 ? (
                          <div className="text-xs text-slate-500 italic">Tidak ada teknisi terdaftar aktif.</div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {technicians.map((tech) => {
                              const isAvailable = tech.teknisi_profiles?.status === 'tersedia'
                              return (
                                <button
                                  key={tech.id}
                                  onClick={() => handleManualAssign(order.id, tech.id)}
                                  disabled={loadingAssign !== null}
                                  className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-left rounded-xl hover:border-red-500/50 transition-colors flex items-center justify-between text-xs cursor-pointer active:scale-[0.99]"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{tech.full_name}</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize pt-0.5">
                                      Spesialisasi: {tech.teknisi_profiles?.specializations.join(', ')}
                                    </div>
                                  </div>
                                  <Badge
                                    className={cn(
                                      'px-2 py-0.5 text-[8px] font-bold rounded-full capitalize shrink-0 border',
                                      isAvailable
                                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900'
                                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-550 border-slate-200 dark:border-slate-850'
                                    )}
                                  >
                                    {tech.teknisi_profiles?.status}
                                  </Badge>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
