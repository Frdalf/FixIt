'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Star, BadgeCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function KonsultasiPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState<string | null>(null)

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const supabase = createClient()
        // Fetch technicians who are online and active
        const { data, error } = await supabase
          .from('teknisi_profiles')
          .select('*, profiles!inner(*)')
          .eq('status', 'tersedia')
          .eq('profiles.is_active', true)
          
        if (error) throw error
        setTechnicians(data || [])
      } catch (err: any) {
        console.error('Error fetching technicians:', err)
        // Fallback mock data if query fails (e.g. for development)
        setTechnicians([
          {
            id: 'mock-tech-1',
            status: 'tersedia',
            rating_avg: 4.8,
            total_jobs: 24,
            specializations: ['hardware', 'software'],
            profiles: {
              full_name: 'Budi Santoso',
              is_active: true,
            }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTechnicians()
  }, [])

  const handleStartConsultation = async (techId: string) => {
    if (!user) {
      toast.error('Anda harus login terlebih dahulu')
      return
    }
    
    setStartingChat(techId)
    
    try {
      const supabase = createClient()
      
      // 1. Create a dummy order for consultation
      const orderCode = `CONS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          pelanggan_id: user.id,
          teknisi_id: techId,
          status: 'menunggu', // Stays in menunggu so it doesn't show in active jobs for technician
          device_name: 'Konsultasi Online',
          device_type: 'laptop', // dummy
          location_address: 'Konsultasi via Chat',
          subtotal: 0,
          admin_fee: 0,
          total: 0,
        })
        .select()
        .single()
        
      if (orderError) throw orderError
      
      // 2. Create the chat session linked to this dummy order
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          order_id: order.id
        })
        .select()
        .single()
        
      if (chatError) throw chatError
      
      // 3. Redirect to the chat room
      toast.success('Ruang konsultasi berhasil dibuat!')
      router.push(`/chat/${order.id}`)
      
    } catch (err: any) {
      console.error('Error starting consultation:', err)
      toast.error(`Gagal memulai konsultasi: ${err.message || 'Terjadi kesalahan'}`)
      setStartingChat(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat daftar teknisi...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <div className="space-y-2 mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold font-heading text-slate-800">
          Konsultasi Teknisi
        </h1>
        <p className="text-slate-500">
          Pilih teknisi yang tersedia untuk berdiskusi masalah perangkat Anda sebelum melakukan pemesanan.
        </p>
      </div>

      {technicians.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-6 text-slate-500 space-y-3">
          <MessageCircle className="h-12 w-12 text-slate-300 mx-auto" />
          <div className="text-lg font-medium text-slate-700">Tidak ada teknisi yang online</div>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Mohon maaf, saat ini tidak ada teknisi yang tersedia untuk konsultasi. Silakan coba beberapa saat lagi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((tech) => {
            const isStarting = startingChat === tech.id
            const name = tech.profiles?.full_name || 'Teknisi FixIT'
            
            return (
              <Card key={tech.id} className="border-slate-100 hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden group flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-900 font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg font-heading group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                        {name}
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-slate-700">{tech.rating_avg || '5.0'}</span>
                        <span className="text-xs text-slate-400">({tech.total_jobs} tugas)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {tech.specializations?.map((spec: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider rounded-md">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleStartConsultation(tech.id)}
                    disabled={startingChat !== null}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white rounded-xl py-6 font-bold shadow-sm transition-all"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyiapkan Ruang...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Konsultasi Sekarang
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
