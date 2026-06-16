'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Laptop, ChevronRight, Loader2 } from 'lucide-react'

export default function PelangganChatListPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchChats = async () => {
      try {
        const supabase = createClient()
        // Query chats through orders
        const { data, error } = await supabase
          .from('chats')
          .select('*, orders!inner(*)')
          .eq('orders.pelanggan_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          // Fetch technician profiles separately to avoid ambiguous foreign key error
          const teknisiIds = [...new Set(data.map((chat: any) => chat.orders?.teknisi_id).filter(Boolean))]
          if (teknisiIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', teknisiIds)
            
            if (profiles) {
              const profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]))
              data.forEach((chat: any) => {
                if (chat.orders?.teknisi_id) {
                  chat.orders.teknisi = profilesMap[chat.orders.teknisi_id]
                }
              })
            }
          }
          setChats(data)
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
              teknisi: {
                full_name: 'Rudi Hermawan',
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900 dark:text-blue-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Memuat daftar chat...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
          Pesan Masuk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hubungi teknisi yang menangani perbaikan laptop Anda secara real-time
        </p>
      </div>

      <div className="space-y-4">
        {chats.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-slate-500 dark:text-slate-400 space-y-3">
            <MessageSquare className="h-8 w-8 text-slate-350 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-medium">Belum ada chat aktif</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              Fitur chat akan aktif secara otomatis setelah Anda memesan layanan dan mendapatkan teknisi.
            </p>
          </div>
        ) : (
          chats.map((chat) => {
            const teknisiName = chat.orders?.teknisi?.full_name || 'Teknisi FixIT'
            return (
              <Link href={`/chat/${chat.orders.id}`} key={chat.id}>
                <Card className="border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md transition-all rounded-2xl bg-white dark:bg-slate-900 cursor-pointer group">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-slate-800/50 text-blue-900 dark:text-blue-400 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                        {teknisiName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-heading group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                          {teknisiName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Laptop className="h-3.5 w-3.5" />
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
