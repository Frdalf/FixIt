'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_SERVICES } from '@/lib/defaultServices'
import { useCheckoutStore } from '@/lib/store'
import { Service } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Clock, Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServiceCategoryListingPage({
  params,
}: {
  params: { category: string }
}) {
  const router = useRouter()
  const categorySlug = params.category
  const [categoryName, setCategoryName] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Zustand Store
  const selectedServices = useCheckoutStore((state) => state.selectedServices)
  const toggleService = useCheckoutStore((state) => state.toggleService)
  const getSubtotal = useCheckoutStore((state) => state.getSubtotal)

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      const fallback = DEFAULT_SERVICES[categorySlug]
      if (fallback) {
        setCategoryName(fallback.name)
        setServices(fallback.services)
      }

      // Try database fetch
      try {
        const supabase = createClient()
        // First get category details
        const { data: catData, error: catError } = await supabase
          .from('service_categories')
          .select('id, name')
          .eq('slug', categorySlug)
          .single()

        if (!catError && catData) {
          setCategoryName(catData.name)
          const { data: svcData, error: svcError } = await supabase
            .from('services')
            .select('*')
            .eq('category_id', catData.id)
            .eq('is_active', true)

          if (!svcError && svcData && svcData.length > 0) {
            setServices(svcData)
          }
        }
      } catch (err) {
        console.warn('Supabase not configured or query error. Using mock data.', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [categorySlug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="space-y-3 pt-6">
          <div className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <h2 className="text-xl font-bold font-heading dark:text-slate-100">Kategori Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kategori servis laptop "{categorySlug}" tidak ditemukan atau belum aktif.
        </p>
        <Link href="/repairs" className="inline-block pt-2">
          <Button className="bg-blue-900 text-white rounded-xl">Kembali Pilih Kategori</Button>
        </Link>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-32">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/repairs" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm text-slate-500 dark:text-slate-400">Kembali ke Kategori</span>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">
          Servis {categoryName}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pilih salah satu atau beberapa layanan perbaikan yang Anda butuhkan
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((svc) => {
          const isSelected = selectedServices.some((s) => s.id === svc.id)
          return (
            <Card
              key={svc.id}
              onClick={() => toggleService(svc)}
              className={cn(
                'border-slate-100 dark:border-slate-800 hover:border-blue-150 dark:hover:border-blue-500 transition-all rounded-2xl cursor-pointer select-none active:scale-[0.99]',
                isSelected ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'bg-white dark:bg-slate-900'
              )}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div
                  className={cn(
                    'mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0',
                    isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base font-heading">
                      {svc.name}
                    </h3>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-400 shrink-0">
                      {formatPrice(svc.price_min)} - {formatPrice(svc.price_max)}
                    </div>
                  </div>
                  
                  {svc.description && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {svc.description}
                    </p>
                  )}

                  {svc.duration_est && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                      <Clock className="h-3 w-3" />
                      Estimasi Pengerjaan: {svc.duration_est}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Floating Checkout Summary Panel */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-40 px-4">
          <div className="container mx-auto max-w-4xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 p-2.5 rounded-xl text-center font-bold text-xs shrink-0">
                {selectedServices.length} <span className="block text-[8px] font-normal uppercase">Layanan</span>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Estimasi Subtotal</div>
                <div className="text-base font-bold text-blue-900 dark:text-blue-400 font-heading">
                  {formatPrice(getSubtotal())}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => useCheckoutStore.getState().clearCart()}
                className="w-1/3 sm:w-auto border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl"
              >
                Reset
              </Button>
              <Link href="/orders/new" className="w-2/3 sm:w-auto flex-1">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl px-6 py-5 flex items-center justify-center gap-2">
                  Lanjutkan Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Helper Tip */}
      {selectedServices.length === 0 && (
        <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex gap-3 text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          <Info className="h-5 w-5 text-blue-900 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Anda dapat memilih lebih dari satu layanan perbaikan sekaligus (misal: Ganti Keyboard + Deep Clean). Biaya admin tetap sama per sekali kunjungan teknisi.
          </p>
        </div>
      )}
    </div>
  )
}
