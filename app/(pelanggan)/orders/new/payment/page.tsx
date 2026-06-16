'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCheckoutStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ShieldCheck, QrCode, Landmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    snap: any
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Zustand Store
  const selectedServices = useCheckoutStore((state) => state.selectedServices)
  const deviceName = useCheckoutStore((state) => state.deviceName)
  const deviceType = useCheckoutStore((state) => state.deviceType)
  const locationAddress = useCheckoutStore((state) => state.locationAddress)
  const locationLat = useCheckoutStore((state) => state.locationLat)
  const locationLng = useCheckoutStore((state) => state.locationLng)
  const locationNotes = useCheckoutStore((state) => state.locationNotes)
  const orderNotes = useCheckoutStore((state) => state.orderNotes)
  const adminFee = useCheckoutStore((state) => state.adminFee)
  const getSubtotal = useCheckoutStore((state) => state.getSubtotal)
  const getTotal = useCheckoutStore((state) => state.getTotal)
  const clearCart = useCheckoutStore((state) => state.clearCart)
  const teknisiId = useCheckoutStore((state) => state.teknisiId)

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'virtual_account'>('qris')
  const [vaBank, setVaBank] = useState<'bca' | 'bni' | 'mandiri'>('bca')
  const [loading, setLoading] = useState(false)
  const [midtransLoaded, setMidtransLoaded] = useState(false)

  // Redirect if cart is empty
  useEffect(() => {
    if (selectedServices.length === 0) {
      router.push('/repairs')
    }
  }, [selectedServices, router])

  // Load Midtrans Snap Script dynamically if not already loaded
  useEffect(() => {
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

    // Check if script is already added
    if (document.getElementById('midtrans-snap')) {
      setMidtransLoaded(true)
      return
    }

    if (clientKey) {
      const script = document.createElement('script')
      script.src = snapUrl
      script.id = 'midtrans-snap'
      script.setAttribute('data-client-key', clientKey)
      script.onload = () => setMidtransLoaded(true)
      script.onerror = () => {
        console.warn('Failed to load Midtrans script. Mock checkout will be available.')
        setMidtransLoaded(false)
      }
      document.body.appendChild(script)
    }
  }, [])

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Harap login terlebih dahulu')
      return
    }

    setLoading(true)

    // Call checkout api
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: selectedServices,
          deviceName,
          deviceType,
          locationAddress,
          locationLat,
          locationLng,
          locationNotes,
          orderNotes,
          paymentMethod,
          vaBank: paymentMethod === 'virtual_account' ? vaBank : null,
          subtotal: getSubtotal(),
          adminFee,
          total: getTotal(),
          pelangganId: user.id,
          teknisiId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memproses pembayaran')
      }

      const { orderId, paymentId, midtransToken, isMock } = result

      if (isMock) {
        // Redirect to mock simulation page
        toast.info('Masuk ke mode simulasi pembayaran (Sandbox)...')
        router.push(`/orders/new/payment/confirm?orderId=${orderId}&paymentId=${paymentId}`)
        clearCart()
        return
      }

      // Midtrans Snap flow
      if (window.snap && midtransToken) {
        window.snap.pay(midtransToken, {
          onSuccess: (paymentResult: any) => {
            toast.success('Pembayaran sukses!')
            router.push(`/orders/${orderId}`)
            clearCart()
          },
          onPending: (paymentResult: any) => {
            toast.info('Menunggu pembayaran...')
            router.push(`/orders/${orderId}`)
            clearCart()
          },
          onError: (paymentResult: any) => {
            toast.error('Pembayaran gagal')
            router.push(`/orders/${orderId}`)
            clearCart()
          },
          onClose: () => {
            toast.warning('Anda menutup panel pembayaran')
            router.push(`/orders/${orderId}`)
            clearCart()
          },
        })
      } else {
        // Script didn't load or token missing, fall back to mock checkout
        toast.warn('Gagal memuat gateway pembayaran. Dialihkan ke pembayaran simulasi.')
        router.push(`/orders/new/payment/confirm?orderId=${orderId}&paymentId=${paymentId}`)
        clearCart()
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

  if (selectedServices.length === 0) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/orders/new" className="text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm text-slate-500 font-medium">Kembali ke Detail Lokasi</span>
      </div>

      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800">
          Metode Pembayaran
        </h1>
        <p className="text-sm text-slate-500">
          Pilih metode pembayaran aman untuk mengonfirmasi order servis laptop
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Methods */}
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold font-heading text-slate-800">
              Pilih Metode
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* QRIS */}
            <div
              onClick={() => setPaymentMethod('qris')}
              className={cn(
                'p-4 border rounded-2xl flex items-center gap-4 cursor-pointer select-none transition-all active:scale-[0.99]',
                paymentMethod === 'qris'
                  ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500'
                  : 'border-slate-100 hover:bg-slate-50'
              )}
            >
              <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl shrink-0">
                <QrCode className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm font-heading">QRIS (OVO, GoPay, Dana, LinkAja)</h3>
                <p className="text-xs text-slate-500">Pembayaran instan menggunakan scan kode QR</p>
              </div>
            </div>

            {/* Virtual Account */}
            <div
              onClick={() => setPaymentMethod('virtual_account')}
              className={cn(
                'p-4 border rounded-2xl flex items-center gap-4 cursor-pointer select-none transition-all active:scale-[0.99]',
                paymentMethod === 'virtual_account'
                  ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500'
                  : 'border-slate-100 hover:bg-slate-50'
              )}
            >
              <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl shrink-0">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm font-heading">Virtual Account (Transfer Bank)</h3>
                <p className="text-xs text-slate-500">BCA, BNI, Mandiri. Konfirmasi pembayaran otomatis.</p>
              </div>
            </div>

            {/* VA Banks Selection */}
            {paymentMethod === 'virtual_account' && (
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                {['bca', 'bni', 'mandiri'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setVaBank(bank as any)}
                    className={cn(
                      'py-2.5 rounded-lg text-xs font-bold uppercase transition-all',
                      vaBank === bank
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-650 hover:bg-slate-100'
                    )}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold font-heading text-slate-800">
              Rincian Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Estimasi Biaya Servis</span>
              <span className="font-semibold text-slate-700">{formatPrice(getSubtotal())}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Biaya Kunjungan & Admin</span>
              <span className="font-semibold text-slate-700">{formatPrice(adminFee)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base font-bold text-blue-900 font-heading">
              <span>Total Pembayaran</span>
              <span>{formatPrice(getTotal())}</span>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-xs text-slate-500 leading-relaxed">
          <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>Pembayaran Anda dilindungi enkripsi SSL 256-bit dan diproses secara aman oleh Midtrans.</span>
        </div>

        {/* Pay Button */}
        <Button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl py-6 text-base transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Menghubungkan Server...
            </span>
          ) : (
            'Bayar Sekarang'
          )}
        </Button>
      </div>
    </div>
  )
}
