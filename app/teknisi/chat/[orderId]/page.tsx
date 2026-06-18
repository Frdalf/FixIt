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

export default function TeknisiChatRoomPage({ params }: { params: { orderId: string } }) {
  const orderId = params.orderId
  const { user } = useAuth()
  const router = useRouter()

  const [chat, setChat] = useState<any>(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
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
          .single()

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
        } else if (error) {
          if (error.code !== 'PGRST116') {
            setFetchError(error)
          }
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
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
        <Link href="/teknisi/chat">
          <Button className="bg-blue-900 text-white rounded-xl">Kembali ke Daftar Chat</Button>
        </Link>
      </div>
    )
  }

  const partnerName = chat.orders?.pelanggan?.full_name || 'Pelanggan FixIT'

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-2xl mx-auto bg-white border-x border-slate-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Link href="/teknisi/chat" className="text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {partnerName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm font-heading">{partnerName}</h2>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
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
                      ? 'bg-amber-500 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div
                    className={`text-[9px] mt-1.5 text-right font-medium ${
                      isMe ? 'text-amber-100' : 'text-slate-400'
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
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2 shrink-0 bg-white">
        <Input
          placeholder="Tulis pesan..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="rounded-xl border-slate-200 text-xs sm:text-sm py-5"
          required
        />
        <Button
          type="submit"
          className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl p-3 h-auto shrink-0 shadow-sm transition-colors active:scale-95"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
