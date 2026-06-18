'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_SERVICES } from '@/lib/defaultServices'
import { Service } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Wrench,
  Clock,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('hardware')
  
  // Edit Dialog State
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price_min: 0,
    price_max: 0,
    duration_est: '',
  })
  const [saving, setSaving] = useState(false)

  const loadServices = async () => {
    setLoading(true)
    
    // Default fallback
    const allFallback: Service[] = []
    Object.keys(DEFAULT_SERVICES).forEach((catKey) => {
      allFallback.push(...DEFAULT_SERVICES[catKey].services)
    })
    setServices(allFallback)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setServices(data)
      }
    } catch (err) {
      console.warn('DB error fetching services. Fallback to default lists.', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleToggleActive = async (svcId: string, currentActive: boolean) => {
    const nextActive = !currentActive
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('services')
        .update({
          is_active: nextActive,
        })
        .eq('id', svcId)

      if (error) throw error
      toast.success(nextActive ? 'Layanan diaktifkan' : 'Layanan dinonaktifkan')
      loadServices()
    } catch (err) {
      // Local state simulation
      setServices((prev) =>
        prev.map((s) => (s.id === svcId ? { ...s, is_active: nextActive } : s))
      )
      toast.success('Simulasi toggle aktif berhasil!')
    }
  }

  const openEditModal = (svc: Service) => {
    setEditingService(svc)
    setEditForm({
      name: svc.name,
      description: svc.description || '',
      price_min: svc.price_min,
      price_max: svc.price_max,
      duration_est: svc.duration_est || '',
    })
  }

  const openAddModal = () => {
    setEditForm({
      name: '',
      description: '',
      price_min: 0,
      price_max: 0,
      duration_est: '',
    })
    setIsAdding(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService && !isAdding) return
    setSaving(true)

    try {
      const supabase = createClient()
      
      if (isAdding) {
        const { error } = await supabase
          .from('services')
          .insert({
            name: editForm.name,
            description: editForm.description,
            price_min: Number(editForm.price_min),
            price_max: Number(editForm.price_max),
            duration_est: editForm.duration_est,
            category_id: activeCategory,
            is_active: true
          })
          
        if (error) throw error
        toast.success('Layanan baru berhasil ditambahkan!')
      } else if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: editForm.name,
            description: editForm.description,
            price_min: Number(editForm.price_min),
            price_max: Number(editForm.price_max),
            duration_est: editForm.duration_est,
          })
          .eq('id', editingService.id)

        if (error) throw error
        toast.success('Data layanan berhasil diperbarui!')
      }
      
      setEditingService(null)
      setIsAdding(false)
      loadServices()
    } catch (err: any) {
      toast.error('Gagal menyimpan layanan: ' + (err.message || 'Error'))
      setEditingService(null)
      setIsAdding(false)
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const filteredServices = services.filter((s) => s.category_id === activeCategory)

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat daftar harga...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">Kelola Layanan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Atur katalog layanan, rentang harga, estimasi waktu, dan status aktif
          </p>
        </div>
        
        <Button 
          onClick={openAddModal}
          className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-2 px-5 py-5"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Layanan
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-900">
        {['hardware', 'software', 'cleaning', 'estetika'].map((catKey) => (
          <button
            key={catKey}
            onClick={() => setActiveCategory(catKey)}
            className={cn(
              'flex-1 sm:flex-initial text-center px-6 pb-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all',
              activeCategory === catKey
                ? 'border-red-500 text-red-500 font-extrabold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {catKey === 'estetika' ? 'Estetika & Proteksi' : catKey}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="grid gap-4">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 text-slate-500 dark:text-slate-400 space-y-3">
            <Wrench className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto" />
            <div className="text-sm font-medium">Belum ada layanan aktif untuk kategori ini</div>
          </div>
        ) : (
          filteredServices.map((svc) => (
            <Card
              key={svc.id}
              className={cn(
                'border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-2xl shadow-md overflow-hidden transition-all',
                !svc.is_active ? 'opacity-60 border-slate-200/50 dark:border-slate-900/50' : ''
              )}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 font-heading text-sm sm:text-base">
                      {svc.name}
                    </h3>
                    {!svc.is_active && (
                      <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800 text-[8px] font-bold uppercase rounded-full">
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      {svc.description}
                    </p>
                  )}
                  {svc.duration_est && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      Estimasi: {svc.duration_est}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Rentang Harga</div>
                    <div className="text-xs sm:text-sm font-bold text-red-500 font-heading mt-0.5">
                      {formatPrice(svc.price_min)} - {formatPrice(svc.price_max)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Active status */}
                    <button
                      onClick={() => handleToggleActive(svc.id, svc.is_active)}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1.5 cursor-pointer"
                    >
                      {svc.is_active ? (
                        <ToggleRight className="h-7 w-7 text-emerald-500 fill-emerald-950/20" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-400 dark:text-slate-600" />
                      )}
                    </button>

                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      onClick={() => openEditModal(svc)}
                      className="border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400 rounded-xl p-3 h-auto"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Add Service Dialog Modal */}
      {(editingService || isAdding) && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg font-heading">
              {isAdding ? 'Tambah Layanan Baru' : 'Edit Detail Layanan'}
            </h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <Label htmlFor="editName" className="text-slate-500 dark:text-slate-400 text-xs">Nama Layanan</Label>
                <Input
                  id="editName"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="rounded-xl border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDesc" className="text-slate-500 dark:text-slate-400 text-xs">Deskripsi</Label>
                <textarea
                  id="editDesc"
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full text-xs sm:text-sm border border-slate-200 dark:border-slate-850 rounded-xl p-3 focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white resize-none"
                  placeholder="Deskripsi layanan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMin" className="text-slate-500 dark:text-slate-400 text-xs">Harga Minimum (Rp)</Label>
                  <Input
                    id="editMin"
                    type="number"
                    value={editForm.price_min}
                    onChange={(e) => setEditForm({ ...editForm, price_min: Number(e.target.value) })}
                    required
                    className="rounded-xl border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMax" className="text-slate-500 dark:text-slate-400 text-xs">Harga Maksimum (Rp)</Label>
                  <Input
                    id="editMax"
                    type="number"
                    value={editForm.price_max}
                    onChange={(e) => setEditForm({ ...editForm, price_max: Number(e.target.value) })}
                    required
                    className="rounded-xl border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDuration" className="text-slate-500 dark:text-slate-400 text-xs">Estimasi Durasi Pengerjaan</Label>
                <Input
                  id="editDuration"
                  value={editForm.duration_est}
                  onChange={(e) => setEditForm({ ...editForm, duration_est: e.target.value })}
                  placeholder="Contoh: 30 - 45 Menit"
                  className="rounded-xl border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setEditingService(null); setIsAdding(false); }}
                  className="w-1/2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
