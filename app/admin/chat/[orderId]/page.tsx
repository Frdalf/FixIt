'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeChat } from '@/hooks/useRealtimeChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Send, Laptop, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function AdminChatRoomPage({ params }: { params: { orderId: string } }) {
  const orderId = params.orderId
  const { user } = useAuth()
  const router = useRouter()

  const [chat, setChat] = useState<any>(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch chat metadata linked to this order
  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        const supabase = createClient()
        const { data: chatData, error } = await supabase
          .from('chats')
          .select('*, orders!inner(*)')
          .eq('order_id', orderId)
          .limit(1)
          .maybeSingle()

        if (!error && chatData) {
          // Fetch pelanggan profile separately to avoid ambiguous foreign key error
          if (chatData.orders?.pelanggan_id) {
            const { data: pelangganProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', chatData.orders.pelanggan_id)
              .single()
            
            chatData.orders.pelanggan = pelangganProfile
          }
          setChat(chatData)
        } else if (!error && !chatData) {
            // Auto-create chat if not exists (0 rows)
            const { data: newChat, error: createError } = await supabase
              .from('chats')
              .insert({ order_id: orderId })
              .select('*, orders!inner(*)')
              .single()

            if (!createError && newChat) {
              if (newChat.orders?.pelanggan_id) {
                const { data: pelangganProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', newChat.orders.pelanggan_id)
                  .single()
                newChat.orders.pelanggan = pelangganProfile
              }
              setChat(newChat)
            } else {
              // If race condition where it was just created, try fetch again, or just show error
              if (createError?.code === '23505' || createError?.code === 'PGRST116') {
                 const { data: retryChat } = await supabase.from('chats').select('*, orders!inner(*)').eq('order_id', orderId).limit(1).maybeSingle()
                 if (retryChat) setChat(retryChat)
              } else {
                 setFetchError(createError || new Error('Gagal membuat ruang chat baru'))
              }
            }
        } else {
          setFetchError(error)
        }
      } catch (err) {
        console.warn('Error fetching chat session details. Simulating for development.', err)
        setChat({
          id: 'mock-chat-1',
          order_id: orderId,
          orders: {
            order_code: 'FIX-928374',
            device_name: 'MacBook Air M1 2020',
            pelanggan: {
              full_name: 'Farid Ahmad',
            },
          },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChatDetails()
  }, [orderId])

  // Hook into Realtime Messages
  const { messages, sendMessage } = useRealtimeChat(chat?.id)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !user) return

    await sendMessage(user.id, inputText)
    setInputText('')
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="text-sm text-slate-500 font-medium mt-2">Menghubungkan ruang obrolan...</span>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold font-heading">Ruang Chat Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">
          Pesanan ini belum memiliki sesi obrolan aktif.
        </p>
        <Link href="/admin/reports">
          <Button className="bg-rose-600 text-white rounded-xl">Kembali ke Laporan</Button>
        </Link>
      </div>
    )
  }

  const partnerName = chat.orders?.pelanggan?.full_name || 'Pelanggan FixIT'

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-2xl mx-auto bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Link href="/admin/reports" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {partnerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-heading">{partnerName}</h2>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Laptop className="h-3 w-3" />
              <span>
                {chat.orders?.device_name} ({chat.orders?.order_code})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 dark:bg-slate-950/20">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            Kirim pesan pertama untuk berkoordinasi dengan pelanggan.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in-30 slide-in-from-bottom-2 duration-150`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-sm text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div
                    className={`text-[9px] mt-1.5 text-right font-medium ${
                      isMe ? 'text-rose-100' : 'text-slate-400'
                    }`}
                  >
                    {format(new Date(msg.created_at), 'HH:mm', { locale: id })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-white dark:bg-slate-900">
        <Input
          placeholder="Tulis pesan balasan..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm py-5"
          required
        />
        <Button
          type="submit"
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl p-3 h-auto shrink-0 shadow-sm transition-colors active:scale-95"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
