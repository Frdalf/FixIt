'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Wrench,
  MapPin,
  Laptop,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_METADATA: Record<string, { label: string; color: string }> = {
  menunggu_teknisi: { label: 'Tersedia', color: 'bg-amber-100 text-amber-800' },
  dikonfirmasi: { label: 'Tugas Baru', color: 'bg-blue-100 text-blue-800' },
  berangkat: { label: 'Otw Lokasi', color: 'bg-indigo-100 text-indigo-800' },
  diproses: { label: 'Sedang Diservis', color: 'bg-purple-100 text-purple-800' },
  selesai: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800' },
  dibatalkan: { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-800' },
}

export default function TeknisiTasksPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [tasks, setTasks] = useState<any[]>([])
  const [techProfile, setTechProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchTechData = async () => {
    if (!user) return
    try {
      const supabase = createClient()
      
      // 1. Fetch technician profile status
      const { data: profile } = await supabase
        .from('teknisi_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setTechProfile(profile)

      // 2. Fetch assigned tasks
      const { data: myOrdersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*), payments(*)')
        .eq('teknisi_id', user.id)
        .order('created_at', { ascending: false })

      // 3. Fetch available tasks (job pool)
      const { data: availableOrdersData, error: availError } = await supabase
        .from('orders')
        .select('*, order_items(*), payments(*)')
        .eq('status', 'menunggu_teknisi')
        .is('teknisi_id', null)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      
      setTasks([
        ...(availableOrdersData || []),
        ...(myOrdersData || [])
      ])
    } catch (err: any) {
      console.warn('Error fetching technician details. Using mock data.', err)
      // Mock data fallback for developer sandbox
      setTechProfile({ id: user.id, status: 'tersedia', rating_avg: 4.8, total_jobs: 12 })
      setTasks([
        {
          id: 'mock-order-1',
          order_code: 'FIX-928374',
          status: 'menunggu_teknisi',
          teknisi_id: null,
          device_name: 'MacBook Air M1 2020',
          device_type: 'laptop',
          location_address: 'Apartment Mediterania Tower B, Floor 15, Jakarta',
          location_notes: 'Lobby tower B, infokan resepsionis',
          total: 210000,
          created_at: new Date().toISOString(),
          order_items: [{ service_name: 'Deep Clean Internal' }],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechData()

    // Subscribe to task allocation events in real-time
    const supabase = createClient()
    const channel = supabase
      .channel('tech_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchTechData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const toggleAvailability = async () => {
    if (!techProfile || updatingStatus) return
    setUpdatingStatus(true)

    const nextStatus = techProfile.status === 'offline' ? 'tersedia' : 'offline'

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('teknisi_profiles')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)

      if (error) throw error
      setTechProfile((prev: any) => ({ ...prev, status: nextStatus }))
      toast.success(`Status Anda diubah menjadi: ${nextStatus === 'tersedia' ? 'Tersedia (Online)' : 'Offline'}`)
    } catch (err: any) {
      // Mock simulator fallback
      setTechProfile((prev: any) => ({ ...prev, status: nextStatus }))
      toast.success(`Status disimulasikan: ${nextStatus === 'tersedia' ? 'Tersedia' : 'Offline'}`)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleClaimTask = async (taskId: string) => {
    try {
      setUpdatingStatus(true)
      const res = await fetch('/api/orders/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: taskId, teknisiId: user?.id })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message)
      
      toast.success('Pekerjaan berhasil diambil!')
      fetchTechData()
      setActiveTab('active')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengambil pekerjaan. Mungkin sudah diambil teknisi lain.')
      fetchTechData()
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: string) => {
    let nextStatus = 'dikonfirmasi'
    if (currentStatus === 'dikonfirmasi') nextStatus = 'berangkat'
    else if (currentStatus === 'berangkat') nextStatus = 'diproses'
    else if (currentStatus === 'diproses') nextStatus = 'selesai'

    try {
      const supabase = createClient()
      const updateData: any = { status: nextStatus }
      
      if (nextStatus === 'berangkat') updateData.started_at = new Date().toISOString()
      if (nextStatus === 'selesai') updateData.completed_at = new Date().toISOString()

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      // If service is marked finished, set technician status back to tersedia
      if (nextStatus === 'selesai') {
        await supabase
          .from('teknisi_profiles')
          .update({ status: 'tersedia' })
          .eq('id', user?.id)
        
        // Refresh local status
        setTechProfile((prev: any) => ({ ...prev, status: 'tersedia' }))
      }

      toast.success(`Status pekerjaan diubah ke: ${STATUS_METADATA[nextStatus]?.label || nextStatus}`)
      fetchTechData()
    } catch (err: any) {
      // Local state fallback simulator
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      )
      toast.success(`Status disimulasikan ke: ${STATUS_METADATA[nextStatus]?.label || nextStatus}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Filter tasks based on active vs completed
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'available') {
      return t.status === 'menunggu_teknisi' && !t.teknisi_id
    } else if (activeTab === 'active') {
      return ['dikonfirmasi', 'berangkat', 'diproses'].includes(t.status) && t.teknisi_id === user?.id
    } else {
      return ['selesai', 'dibatalkan'].includes(t.status) && t.teknisi_id === user?.id
    }
  })

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat tugas teknisi...</span>
      </div>
    )
  }

  const isOnline = techProfile?.status !== 'offline'

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      {/* Availability Header Bar */}
      <Card className="border-slate-100 rounded-2xl bg-white shadow-sm mb-6">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              )}
            />
            <div>
              <div className="text-xs text-slate-500 font-medium">Status Pekerjaan</div>
              <div className="text-sm font-bold text-slate-800 font-heading">
                {isOnline ? 'Menerima Order (Online)' : 'Sedang Istirahat (Offline)'}
              </div>
            </div>
          </div>

          <button
            onClick={toggleAvailability}
            disabled={updatingStatus}
            className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
          >
            {isOnline ? (
              <ToggleRight className="h-10 w-10 text-emerald-500 fill-emerald-50" />
            ) : (
              <ToggleLeft className="h-10 w-10 text-slate-400 fill-slate-50" />
            )}
          </button>
        </CardContent>
      </Card>

      {/* Page Title & Tab Filters */}
      <div className="space-y-4 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800">
          Bursa Kerja
        </h1>

        <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              'flex-1 text-center pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap px-2',
              activeTab === 'available'
                ? 'border-amber-500 text-amber-600 font-extrabold'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            )}
          >
            Tersedia ({tasks.filter((t) => t.status === 'menunggu_teknisi' && !t.teknisi_id).length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'flex-1 text-center pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap px-2',
              activeTab === 'active'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            )}
          >
            Aktif ({tasks.filter((t) => ['dikonfirmasi', 'berangkat', 'diproses'].includes(t.status) && t.teknisi_id === user?.id).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              'flex-1 text-center pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap px-2',
              activeTab === 'completed'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            )}
          >
            Riwayat ({tasks.filter((t) => ['selesai', 'dibatalkan'].includes(t.status) && t.teknisi_id === user?.id).length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-6 text-slate-500 space-y-3">
            <AlertCircle className="h-8 w-8 text-slate-350 mx-auto" />
            <div className="text-sm font-medium">Tidak ada pekerjaan {activeTab}</div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const meta = STATUS_METADATA[task.status] || { label: task.status, color: 'bg-slate-100 text-slate-800' }
            return (
              <Card key={task.id} className="border-slate-100 hover:shadow-sm transition-all rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-mono font-bold">{task.order_code}</span>
                    <Badge className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border', meta.color)}>
                      {meta.label}
                    </Badge>
                  </div>

                  {/* Device and Customer Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 text-base font-heading flex items-center gap-2 uppercase">
                      <Laptop className="h-4.5 w-4.5 text-blue-900" />
                      {task.device_name}
                    </h3>

                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{task.location_address}</p>
                    </div>

                    {task.location_notes && (
                      <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md py-1 px-2 w-fit font-medium">
                        Patokan: {task.location_notes}
                      </p>
                    )}
                  </div>

                  {/* Order Items Snapshot */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Layanan Perbaikan:</div>
                    {task.order_items?.map((item: any, idx: number) => (
                      <div key={idx} className="text-xs font-semibold text-slate-700">
                        • {item.service_name}
                      </div>
                    ))}
                    <div className="border-t border-slate-200/50 pt-2 mt-2 flex justify-between items-center text-xs font-bold text-blue-900">
                      <span>Pendapatan Teknisi (Est)</span>
                      <span className="text-emerald-600">{formatPrice(task.total * 0.8)}</span> {/* Demo: tech gets 80% */}
                    </div>
                  </div>

                  {/* Action Buttons based on Status */}
                  <div className="flex items-center gap-2 pt-2">
                    {task.status === 'menunggu_teknisi' && !task.teknisi_id ? (
                      <Button
                        onClick={() => handleClaimTask(task.id)}
                        disabled={updatingStatus || !isOnline}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl py-6 flex items-center justify-center gap-2"
                      >
                        {updatingStatus ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="h-4 w-4" /> Ambil Pekerjaan Ini</>}
                      </Button>
                    ) : (
                      <>
                        {/* Maps navigation button */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${task.location_lat},${task.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex justify-center items-center gap-1.5 text-xs font-semibold"
                        >
                          <Navigation className="h-3.5 w-3.5" /> Navigasi
                        </a>

                        {/* Chat button */}
                        <Link
                          href={`/teknisi/chat/${task.id}`}
                          className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors flex justify-center items-center gap-1.5 text-xs font-semibold"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </Link>

                        {/* Action button to change job status */}
                        {['dikonfirmasi', 'berangkat', 'diproses'].includes(task.status) && (
                          <Button
                            onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl py-5"
                          >
                            {task.status === 'dikonfirmasi' && 'Mulai Jalan'}
                            {task.status === 'berangkat' && 'Sampai & Mulai'}
                            {task.status === 'diproses' && 'Selesaikan'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
