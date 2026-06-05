'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCheckoutStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Laptop, AlertTriangle, MapPin, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import MapPicker with SSR disabled to prevent Leaflet errors
const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-500 font-medium border border-slate-200">
      Memuat peta...
    </div>
  ),
})

export default function NewOrderPage() {
  const router = useRouter()

  // Zustand Store
  const selectedServices = useCheckoutStore((state) => state.selectedServices)
  const getSubtotal = useCheckoutStore((state) => state.getSubtotal)
  const setDevice = useCheckoutStore((state) => state.setDevice)
  const setLocation = useCheckoutStore((state) => state.setLocation)
  const setOrderNotes = useCheckoutStore((state) => state.setOrderNotes)

  // Form Local State
  const [deviceName, setDeviceNameState] = useState('')
  const [deviceType, setDeviceTypeState] = useState<'laptop' | 'pc'>('laptop')
  const [locationAddress, setLocationAddressState] = useState('')
  const [locationLat, setLocationLatState] = useState<number | null>(null)
  const [locationLng, setLocationLngState] = useState<number | null>(null)
  const [locationNotes, setLocationNotesState] = useState('')
  const [notes, setNotesState] = useState('')
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true)

  // Redirect if no services are selected
  useEffect(() => {
    if (selectedServices.length === 0) {
      router.push('/repairs')
    }
  }, [selectedServices, router])

  // Validation
  useEffect(() => {
    const isDeviceNameValid = deviceName.trim().length > 2
    const isLocationValid = locationAddress.trim().length > 5 && locationLat !== null && locationLng !== null
    setIsSubmitDisabled(!(isDeviceNameValid && isLocationValid))
  }, [deviceName, locationAddress, locationLat, locationLng])

  const handleMapChange = (lat: number, lng: number, address: string) => {
    setLocationLatState(lat)
    setLocationLngState(lng)
    setLocationAddressState(address)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitDisabled) return

    // Save to Zustand store
    setDevice(deviceName, deviceType)
    setLocation(locationAddress, locationLat, locationLng, locationNotes)
    setOrderNotes(notes)

    // Route to payment page
    router.push('/orders/new/payment')
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
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/repairs" className="text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm text-slate-500 font-medium">Batal & Kembali</span>
      </div>

      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800">
          Detail Pengiriman & Layanan
        </h1>
        <p className="text-sm text-slate-500">
          Lengkapi informasi perangkat dan koordinat lokasi pertemuan servis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device Information */}
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold font-heading text-slate-800 flex items-center gap-2">
              <Laptop className="h-4.5 w-4.5 text-blue-900" />
              Detail Perangkat Laptop / PC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Nama & Model Perangkat</Label>
              <Input
                id="deviceName"
                placeholder="Contoh: Asus ROG Strix G15, MacBook Pro M1 2020"
                value={deviceName}
                onChange={(e) => setDeviceNameState(e.target.value)}
                required
                className="rounded-xl border-slate-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipe Perangkat</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeviceTypeState('laptop')}
                  className={cn(
                    'py-3.5 border rounded-xl font-semibold text-sm transition-all text-center',
                    deviceType === 'laptop'
                      ? 'border-blue-500 bg-blue-50/20 text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Laptop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTypeState('pc')}
                  className={cn(
                    'py-3.5 border rounded-xl font-semibold text-sm transition-all text-center',
                    deviceType === 'pc'
                      ? 'border-blue-500 bg-blue-50/20 text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  PC / Desktop
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold font-heading text-slate-800 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-blue-900" />
              Titik Lokasi Pertemuan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Pilih Titik di Peta (Geser Pin)</Label>
              <MapPicker onChange={handleMapChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <textarea
                id="address"
                rows={3}
                value={locationAddress}
                onChange={(e) => setLocationAddressState(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 resize-none bg-slate-50"
                placeholder="Geser pin pada peta untuk melacak alamat..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationNotes">Catatan Tambahan Lokasi (Opsional)</Label>
              <Input
                id="locationNotes"
                placeholder="Contoh: Pagar hitam, rumah tingkat 2, dekat masjid"
                value={locationNotes}
                onChange={(e) => setLocationNotesState(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Notes */}
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold font-heading text-slate-800 flex items-center gap-2">
              <Keyboard className="h-4.5 w-4.5 text-blue-900" />
              Catatan Kerusakan Laptop (Opsional)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotesState(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Jelaskan detail keluhan atau gejala kerusakan laptop Anda agar teknisi dapat mempersiapkan alat kerja..."
            />
          </CardContent>
        </Card>

        {/* Selected Services Summary */}
        <Card className="border-slate-100 rounded-2xl shadow-sm bg-blue-50/10">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold font-heading text-slate-800">
              Layanan yang Dipesan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {selectedServices.map((svc) => (
              <div key={svc.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{svc.name}</span>
                <span className="font-semibold text-slate-850">{formatPrice(svc.price_min)}</span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base font-bold text-blue-900 font-heading">
              <span>Estimasi Subtotal</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="space-y-3">
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl py-6 text-base shadow-md shadow-amber-500/10 transition-colors"
          >
            Lanjutkan ke Pembayaran
          </Button>

          {isSubmitDisabled && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Harap isi nama perangkat dan geser pin di peta untuk memverifikasi lokasi.</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
