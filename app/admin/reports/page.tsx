'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Flag,
  MessageSquare,
  AlertCircle,
  Loader2,
  Send,
  User,
  Laptop,
  CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'

export default function AdminReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchReports = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customer_reports')
        .select(`
          *,
          profiles:pelanggan_id (full_name, phone),
          orders:order_id (order_code, device_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err: any) {
      toast.error('Gagal mengambil data laporan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // Fetch report messages and setup realtime
  useEffect(() => {
    if (!selectedReport) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      setLoadingMessages(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('report_messages')
        .select('*')
        .eq('report_id', selectedReport.id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
      setLoadingMessages(false)
    }

    fetchMessages()

    const supabase = createClient()
    const channel = supabase
      .channel(`report_messages_${selectedReport.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'report_messages',
          filter: `report_id=eq.${selectedReport.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedReport])

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedReport || !user) return

    setIsReplying(true)
    try {
      const supabase = createClient()
      
      // 1. Insert reply message into report_messages
      const { error: msgErr } = await supabase
        .from('report_messages')
        .insert({
          report_id: selectedReport.id,
          sender_id: user.id,
          content: replyText,
        })
      
      if (msgErr) throw msgErr

      // 2. Update report status if it was pending
      if (selectedReport.status === 'pending') {
        const { error: updateErr } = await supabase
          .from('customer_reports')
          .update({ status: 'replied' })
          .eq('id', selectedReport.id)

        if (!updateErr) {
          fetchReports()
          setSelectedReport((prev: any) => ({ ...prev, status: 'replied' }))
        }
      }

      setReplyText('')
    } catch (err: any) {
      toast.error('Gagal mengirim balasan: ' + err.message)
    } finally {
      setIsReplying(false)
    }
  }

  const handleSelesai = async () => {
    if (!selectedReport) return
    setIsFinishing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('customer_reports')
        .update({ status: 'closed' })
        .eq('id', selectedReport.id)

      if (error) throw error
      toast.success('Laporan berhasil ditandai sebagai selesai')
      fetchReports()
      setSelectedReport((prev: any) => ({ ...prev, status: 'closed' }))
    } catch (err: any) {
      toast.error('Gagal menyelesaikan laporan: ' + err.message)
    } finally {
      setIsFinishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900 dark:text-blue-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Memuat laporan pelanggan...</span>
      </div>
    )
  }

  const pendingReports = reports.filter(r => r.status === 'pending')
  const processingReports = reports.filter(r => r.status === 'replied')
  const historyReports = reports.filter(r => r.status === 'closed')

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Flag className="h-8 w-8 text-rose-500" />
            Laporan Customer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Pantau dan tanggapi kendala yang dialami oleh pelanggan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Report List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                Menunggu Tanggapan
                <Badge variant="destructive" className="rounded-full px-2">{pendingReports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {pendingReports.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  Tidak ada laporan baru
                </div>
              ) : (
                pendingReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 rounded-xl mb-1 transition-colors border ${
                      selectedReport?.id === report.id
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                        : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{report.orders?.order_code}</span>
                      <span className="text-[9px] text-slate-400">{format(new Date(report.created_at), 'dd MMM', { locale: id })}</span>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-1 truncate">{report.subject}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{report.profiles?.full_name}</div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                Sedang Diproses
                <Badge variant="outline" className="rounded-full px-2 text-blue-600 bg-blue-50 border-blue-200">{processingReports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <div className="max-h-[250px] overflow-y-auto p-2">
              {processingReports.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  Tidak ada laporan diproses
                </div>
              ) : (
                processingReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 rounded-xl mb-1 transition-colors border ${
                      selectedReport?.id === report.id
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                        : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">{report.orders?.order_code}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-blue-200 text-blue-600 bg-blue-50">
                        Diproses
                      </Badge>
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-1 truncate">{report.subject}</div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">Riwayat Laporan</CardTitle>
            </CardHeader>
            <div className="max-h-[250px] overflow-y-auto p-2">
              {historyReports.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  Belum ada riwayat
                </div>
              ) : (
                historyReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 rounded-xl mb-1 transition-colors border ${
                      selectedReport?.id === report.id
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">{report.orders?.order_code}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-200 text-emerald-600 bg-emerald-50">
                        Selesai
                      </Badge>
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-1 truncate">{report.subject}</div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Report Detail & Reply */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm h-full flex flex-col max-h-[700px]">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={selectedReport.status === 'pending' ? 'destructive' : selectedReport.status === 'closed' ? 'outline' : 'default'} className="mb-2 text-[10px]">
                      {selectedReport.status === 'pending' ? 'Butuh Tanggapan' : selectedReport.status === 'closed' ? 'Selesai' : 'Diproses'}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedReport.subject}
                    </CardTitle>
                    <div className="text-xs text-slate-500 mt-1">
                      Dilaporkan pada {format(new Date(selectedReport.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </div>
                  </div>
                  {selectedReport.status !== 'closed' && (
                    <Button 
                      onClick={handleSelesai} 
                      disabled={isFinishing}
                      variant="outline" 
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30 text-xs rounded-xl"
                    >
                      {isFinishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Tandai Selesai
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  {/* Customer Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Pelanggan</div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedReport.profiles?.full_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{selectedReport.profiles?.phone || '-'}</div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Pesanan Terkait</div>
                        <div className="text-xs font-semibold text-blue-900 dark:text-blue-400 truncate">{selectedReport.orders?.order_code}</div>
                        <div className="text-[10px] text-slate-500 truncate">{selectedReport.orders?.device_name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat History Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
                  {/* Initial Report Description Message */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">Pesan Laporan (Otomatis)</div>
                      <p className="whitespace-pre-wrap">{selectedReport.description}</p>
                      <div className="text-[9px] mt-1.5 text-right font-medium text-slate-400">
                        {format(new Date(selectedReport.created_at), 'HH:mm', { locale: id })}
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
                                ? 'bg-rose-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
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

                {/* Reply Form */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  {selectedReport.status === 'closed' ? (
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-500 font-medium">
                      Laporan ini telah ditutup.
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Ketik balasan Anda di sini..."
                        className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-700"
                        disabled={isReplying}
                        required
                      />
                      <Button
                        type="submit"
                        disabled={isReplying}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                      >
                        {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Kirim
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl h-full border-dashed flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 font-heading">Tidak Ada Laporan Terpilih</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Silakan pilih laporan dari daftar di sebelah kiri untuk membaca detail kendala dan mengirimkan balasan.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
