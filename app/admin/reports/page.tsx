'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  ChevronRight,
  Send,
  User,
  Laptop
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedReport) return

    setIsReplying(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Harap login sebagai admin')

      // 1. Ensure chat room exists for this order
      let chatId = null
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('order_id', selectedReport.order_id)
        .limit(1)
        .maybeSingle()

      if (chatError) throw chatError

      if (existingChat) {
        chatId = existingChat.id
      } else {
        // Create new chat
        const { data: newChat, error: newChatErr } = await supabase
          .from('chats')
          .insert({ order_id: selectedReport.order_id })
          .select()
          .single()
        
        if (newChatErr) throw newChatErr
        chatId = newChat.id
      }

      // 2. Insert reply message
      const { error: msgErr } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: replyText,
        })
      
      if (msgErr) throw msgErr

      // 3. Update report status
      const { error: updateErr } = await supabase
        .from('customer_reports')
        .update({ status: 'replied' })
        .eq('id', selectedReport.id)

      if (updateErr) throw updateErr

      toast.success('Balasan berhasil dikirim ke pelanggan')
      setReplyText('')
      setSelectedReport(null)
      fetchReports()

    } catch (err: any) {
      toast.error('Gagal mengirim balasan: ' + err.message)
    } finally {
      setIsReplying(false)
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
  const historyReports = reports.filter(r => r.status !== 'pending')

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
              <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">Riwayat Laporan</CardTitle>
            </CardHeader>
            <div className="max-h-[300px] overflow-y-auto p-2">
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
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-200 text-emerald-600 bg-emerald-50">Selesai</Badge>
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
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm h-full flex flex-col">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={selectedReport.status === 'pending' ? 'destructive' : 'outline'} className="mb-2 text-[10px]">
                      {selectedReport.status === 'pending' ? 'Butuh Tanggapan' : 'Selesai'}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedReport.subject}
                    </CardTitle>
                    <div className="text-xs text-slate-500 mt-1">
                      Dilaporkan pada {format(new Date(selectedReport.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </div>
                  </div>
                  <Link href={`/admin/chat/${selectedReport.order_id}`}>
                    <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30 text-xs rounded-xl">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Buka Ruang Chat
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Customer Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Pelanggan</div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedReport.profiles?.full_name}</div>
                        <div className="text-[10px] text-slate-500">{selectedReport.profiles?.phone || '-'}</div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Pesanan Terkait</div>
                        <div className="text-xs font-semibold text-blue-900 dark:text-blue-400">{selectedReport.orders?.order_code}</div>
                        <div className="text-[10px] text-slate-500 truncate">{selectedReport.orders?.device_name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Description */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Detail Laporan</h3>
                    <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedReport.description}
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <form onSubmit={handleReply} className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Balas Laporan (Pesan akan dikirim ke Ruang Chat Pesanan)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Ketik balasan Anda di sini..."
                        className="flex-1 bg-white dark:bg-slate-900 rounded-xl"
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
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl h-full border-dashed flex flex-col items-center justify-center p-12 text-center">
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
