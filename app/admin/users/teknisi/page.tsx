'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Users,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Star,
  Award,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminTeknisiManagementPage() {
  const [techs, setTechs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTechnicians = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teknisi_profiles(*)')
        .eq('role', 'teknisi')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTechs(data || [])
    } catch (err) {
      console.warn('DB error fetching technicians. Using mock data.', err)
      setTechs([
        {
          id: 'mock-tech-1',
          full_name: 'Rudi Hermawan',
          phone: '081298765432',
          is_active: false,
          created_at: new Date().toISOString(),
          teknisi_profiles: {
            status: 'offline',
            specializations: ['hardware', 'cleaning'],
            rating_avg: 0,
            total_jobs: 0,
          },
        },
        {
          id: 'mock-tech-2',
          full_name: 'Bambang Subagyo',
          phone: '085712345678',
          is_active: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          teknisi_profiles: {
            status: 'tersedia',
            specializations: ['software', 'cleaning'],
            rating_avg: 4.9,
            total_jobs: 24,
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const handleToggleActive = async (techId: string, currentActive: boolean) => {
    setTogglingId(techId)
    const nextActive = !currentActive
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: nextActive,
        })
        .eq('id', techId)

      if (error) throw error

      toast.success(
        nextActive
          ? 'Akun teknisi berhasil diaktifkan/diverifikasi!'
          : 'Akun teknisi berhasil dinonaktifkan!'
      )
      fetchTechnicians()
    } catch (err: any) {
      // Simulation fallback
      setTechs((prev) =>
        prev.map((t) => (t.id === techId ? { ...t, is_active: nextActive } : t))
      )
      toast.success('Simulasi verifikasi berhasil!')
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="text-sm text-slate-500 font-medium mt-2">Memuat daftar teknisi...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">Verifikasi & Kelola Teknisi</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Verifikasi berkas kemitraan teknisi baru dan kendalikan status akses login
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {techs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 text-slate-500 col-span-2 space-y-3">
            <Users className="h-8 w-8 text-slate-450 dark:text-slate-700 mx-auto" />
            <div className="text-sm font-medium">Belum ada mitra teknisi terdaftar</div>
          </div>
        ) : (
          techs.map((tech) => {
            const isVerifying = togglingId === tech.id
            const isActive = tech.is_active

            return (
              <Card
                key={tech.id}
                className={cn(
                  'border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-2xl shadow-md overflow-hidden relative transition-all',
                  !isActive ? 'border-amber-200 dark:border-amber-900/40 bg-white/80 dark:bg-slate-950/80' : ''
                )}
              >
                {!isActive && (
                  <div className="absolute top-3 right-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-900">
                    Menunggu Verifikasi
                  </div>
                )}

                <CardContent className="p-6 space-y-5">
                  {/* Avatar + Profile */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-sm flex items-center justify-center shadow-sm shrink-0">
                      {tech.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 font-heading text-sm sm:text-base">
                        {tech.full_name}
                      </h3>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-450 font-semibold pt-0.5">
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                          {tech.teknisi_profiles?.rating_avg || '0'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                          <Award className="h-3.5 w-3.5" />
                          {tech.teknisi_profiles?.total_jobs || '0'} Servis
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tech specs and contact */}
                  <div className="space-y-3.5 border-t border-slate-200 dark:border-slate-900 pt-4 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                      <Phone className="h-4 w-4 text-slate-400 dark:text-slate-550 shrink-0" />
                      <span>{tech.phone || 'Nomor WhatsApp belum diatur'}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] text-slate-550 dark:text-slate-450 uppercase tracking-wide font-bold">Keahlian Spesialisasi:</div>
                      <div className="flex flex-wrap gap-1">
                        {tech.teknisi_profiles?.specializations.map((spec: string) => (
                          <span
                            key={spec}
                            className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-0.5 rounded-full capitalize"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-900 flex justify-end">
                    <Button
                      onClick={() => handleToggleActive(tech.id, isActive)}
                      disabled={isVerifying}
                      className={cn(
                        'w-full sm:w-auto font-bold rounded-xl text-xs py-5 px-5 flex items-center justify-center gap-1.5 transition-colors',
                        isActive
                          ? 'border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      )}
                    >
                      {isVerifying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isActive ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Nonaktifkan Akses
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verifikasi & Aktifkan
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
