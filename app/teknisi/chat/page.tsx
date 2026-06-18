'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Laptop, ChevronRight, Loader2, HelpCircle } from 'lucide-react'

export default function TeknisiChatListPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchChats = async () => {
      try {
        const supabase = createClient()
        // Query chats through orders assigned to this technician
        const { data, error } = await supabase
          .from('chats')
          .select('*, orders!inner(*)')
          .eq('orders.teknisi_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          // Fetch pelanggan profiles separately to avoid ambiguous foreign key error
          const pelangganIds = [...new Set(data.map((chat: any) => chat.orders?.pelanggan_id).filter(Boolean))]
          if (pelangganIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', pelangganIds)
            
            if (profiles) {
              const profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]))
              data.forEach((chat: any) => {
                if (chat.orders?.pelanggan_id) {
                  chat.orders.pelanggan = profilesMap[chat.orders.pelanggan_id]
                }
              })
            }
          }
          // Filter duplicate chats based on order_id
          const uniqueChats = data.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.order_id === v.order_id) === i);
          setChats(uniqueChats)
        }
      } catch (err) {
        console.warn('Error fetching chats. Using mock data.', err)
        setChats([
          {
            id: 'mock-chat-1',
            order_id: 'mock-order-1',
            orders: {
              order_code: 'FIX-928374',
              device_name: 'MacBook Air M1 2020',
              pelanggan: {
                full_name: 'Farid Ahmad',
              },
            },
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [user])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat daftar chat...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
          Chat Pelanggan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kirim pesan langsung ke pelanggan untuk koordinasi kedatangan & detail servis
        </p>
      </div>

      <div className="space-y-4">
        {chats.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-slate-500 dark:text-slate-400 space-y-3">
            <MessageSquare className="h-8 w-8 text-slate-350 mx-auto" />
            <div className="text-sm font-medium">Belum ada chat aktif</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Fitur chat akan aktif secara otomatis setelah Anda menerima alokasi order pekerjaan baru.
            </p>
          </div>
        ) : (
          chats.map((chat) => {
            const pelangganName = chat.orders?.pelanggan?.full_name || 'Pelanggan FixIT'
            const isKonsultasi = chat.orders.device_name === 'Konsultasi Online'
            
            return (
              <Link href={`/teknisi/chat/${chat.orders.id}`} key={chat.id}>
                <Card className="border-slate-100 dark:border-slate-800 hover:border-amber-250 dark:hover:border-amber-600 hover:shadow-sm transition-all rounded-2xl bg-white dark:bg-slate-900 cursor-pointer group">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                        {pelangganName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-heading group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {pelangganName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {isKonsultasi ? (
                            <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {chat.orders.device_name} ({chat.orders.order_code})
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
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
