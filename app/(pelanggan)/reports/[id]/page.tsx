'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ChevronLeft, Send, Laptop, Loader2, Flag } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function PelangganReportDetailPage({ params }: { params: { id: string } }) {
  const reportId = params.id
  const { user } = useAuth()
  const router = useRouter()

  const [report, setReport] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    const fetchReportData = async () => {
      try {
        const supabase = createClient()
        const { data: reportData, error } = await supabase
          .from('customer_reports')
          .select('*, orders!inner(*)')
          .eq('id', reportId)
          .eq('pelanggan_id', user.id)
          .single()

        if (error) throw error
        setReport(reportData)
      } catch (err: any) {
        toast.error('Laporan tidak ditemukan.')
        router.push('/reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [reportId, user, router])

  useEffect(() => {
    if (!report) return

    const fetchMessages = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('report_messages')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
      setLoadingMessages(false)
    }

    fetchMessages()

    const supabase = createClient()
    const channel = supabase
      .channel(`report_messages_${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_messages',
          filter: `report_id=eq.${reportId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [report])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !user || !report || report.status === 'closed') return

    setIsSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('report_messages')
        .insert({
          report_id: reportId,
          sender_id: user.id,
          content: inputText,
        })
      
      if (error) throw error
      setInputText('')
    } catch (err: any) {
      toast.error('Gagal mengirim pesan: ' + err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Memuat detail laporan...</span>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen max-w-2xl mx-auto w-full bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-heading line-clamp-1">{report.subject}</h2>
              <Badge 
                variant={report.status === 'pending' ? 'destructive' : report.status === 'closed' ? 'outline' : 'default'} 
                className={`text-[9px] px-1.5 py-0 h-4 ${report.status === 'closed' ? 'border-emerald-200 text-emerald-600 dark:text-emerald-400' : ''}`}
              >
                {report.status === 'pending' ? 'Menunggu' : report.status === 'closed' ? 'Selesai' : 'Diproses'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
              <Laptop className="h-3 w-3" />
              <span>
                {report.orders?.device_name} ({report.orders?.order_code})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
        {/* Initial Report Description Message */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed bg-blue-600 text-white rounded-br-none shadow-sm">
            <div className="text-xs font-bold text-blue-200 mb-1">Pesan Laporan (Otomatis)</div>
            <p className="whitespace-pre-wrap">{report.description}</p>
            <div className="text-[9px] mt-1.5 text-right font-medium text-blue-200">
              {format(new Date(report.created_at), 'HH:mm', { locale: id })}
            </div>
          </div>
        </div>

        {/* Real Chat Messages */}
        {loadingMessages ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
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
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-sm leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
                  }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1">Admin FixIT</div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div
                    className={`text-[9px] mt-1.5 text-right font-medium ${
                      isMe ? 'text-blue-200' : 'text-slate-400'
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
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {report.status === 'closed' ? (
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-500 font-medium">
            Laporan ini telah ditutup oleh Admin.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              placeholder="Tulis pesan ke admin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm py-5"
              required
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 h-auto shrink-0 shadow-sm transition-colors active:scale-95"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
