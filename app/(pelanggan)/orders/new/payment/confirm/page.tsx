'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

function MockConfirmPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const paymentId = searchParams.get('paymentId')

  const [loading, setLoading] = useState(false)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  useEffect(() => {
    if (!orderId || !paymentId) {
      router.push('/repairs')
      return
    }

    const fetchDetails = async () => {
      try {
        const supabase = createClient()
        const { data: order } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single()
        
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single()

        setOrderDetails(order)
        setPaymentDetails(payment)
      } catch (err) {
        console.error('Error fetching order details:', err)
      }
    }

    fetchDetails()
  }, [orderId, paymentId, router])

  const handleSimulatePayment = async (status: 'success' | 'failed') => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isMock: true,
          orderId: orderId,
          paymentId: paymentId,
          status: status === 'success' ? 'paid' : 'failed',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memproses simulasi')
      }

      if (status === 'success') {
        toast.success('Simulasi Pembayaran Berhasil! Teknisi sedang dialokasikan.')
        router.push(`/orders/${orderId}`)
      } else {
        toast.error('Simulasi Pembayaran Gagal.')
        router.push(`/orders/${orderId}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (!orderDetails || !paymentDetails) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat detail simulasi...</span>
      </div>
    )
  }

  return (
    <Card className="border-slate-100 shadow-md rounded-2xl">
      <CardHeader className="text-center pb-4 border-b border-slate-50">
        <CardTitle className="text-xl font-bold font-heading text-slate-800">
          Simulator Pembayaran FixIT
        </CardTitle>
        <CardDescription>
          Kode Transaksi: {orderDetails.order_code}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Invoice Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Perangkat:</span>
            <span className="font-semibold text-slate-800 uppercase">{orderDetails.device_name} ({orderDetails.device_type})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Metode:</span>
            <span className="font-semibold text-slate-850 uppercase">{paymentDetails.method}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/50 pt-2 mt-2 font-bold text-blue-900">
            <span>Total Bayar:</span>
            <span>{formatPrice(orderDetails.total)}</span>
          </div>
        </div>

        {/* Simulated Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => handleSimulatePayment('success')}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl py-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Simulasikan Pembayaran Berhasil
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSimulatePayment('failed')}
            disabled={loading}
            className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold rounded-xl py-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-rose-700" />
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Simulasikan Pembayaran Gagal
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MockConfirmPaymentPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md">
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-800 mt-0.5" />
          <div>
            <strong>Mode Sandbox / Development:</strong> Gateway pembayaran Midtrans tidak terkonfigurasi. Halaman ini adalah simulator transaksi untuk memverifikasi alur checkout dan alokasi teknisi secara otomatis.
          </div>
        </div>

        <Suspense fallback={
          <Card className="border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            <span className="text-xs text-slate-500 font-semibold mt-2">Memuat simulator pembayaran...</span>
          </Card>
        }>
          <MockConfirmPaymentContent />
        </Suspense>
      </div>
    </div>
  )
}
