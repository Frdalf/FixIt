'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag, Laptop, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function PelangganReportsListPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchReports = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('customer_reports')
          .select('*, orders!inner(order_code, device_name)')
          .eq('pelanggan_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setReports(data)
        }
      } catch (err) {
        console.warn('Error fetching reports.', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [user])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900 dark:text-blue-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Memuat daftar laporan...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Flag className="h-6 w-6 text-rose-500" />
          Laporan Saya
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pantau status laporan dan keluhan Anda kepada Admin
        </p>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-slate-500 dark:text-slate-400 space-y-3 shadow-sm">
            <Flag className="h-8 w-8 text-slate-350 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-medium">Belum ada laporan</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              Anda dapat membuat laporan jika terjadi kendala pada pesanan Anda.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <Link href={`/reports/${report.id}`} key={report.id}>
              <Card className="border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md transition-all rounded-2xl bg-white dark:bg-slate-900 cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-1">
                      <Flag className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={report.status === 'pending' ? 'destructive' : report.status === 'selesai' ? 'outline' : 'default'} 
                          className={`text-[9px] px-1.5 py-0 h-4 ${report.status === 'selesai' ? 'border-emerald-200 text-emerald-600 dark:text-emerald-400' : ''}`}
                        >
                          {report.status === 'pending' ? 'Menunggu' : report.status === 'selesai' ? 'Selesai' : 'Diproses'}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(report.created_at), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-heading line-clamp-1">
                        {report.subject}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Laptop className="h-3.5 w-3.5" />
                        <span>
                          {report.orders?.device_name} ({report.orders?.order_code})
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
