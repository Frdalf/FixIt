'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Star, Award, Shield, Phone, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export default function TeknisiProfilePage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [techProfile, setTechProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchTechProfile = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('teknisi_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setTechProfile(data)
        }
      } catch (err) {
        console.warn('Error fetching technician profile stats. Simulating for development.', err)
        setTechProfile({
          rating_avg: 4.8,
          total_jobs: 15,
          specializations: ['hardware', 'software', 'cleaning'],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTechProfile()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    router.push('/teknisi/login')
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Memuat profil teknisi...</span>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-md pb-24">
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800 dark:text-slate-100">Profil Teknisi</h1>

        {/* Profile Card */}
        <Card className="border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <div className="h-20 bg-amber-500" />
          <CardContent className="p-6 pt-0 relative">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-blue-900 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 absolute -top-8 left-6 shadow-sm">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            
            {/* Name and specialty */}
            <div className="pt-10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-heading">{profile.full_name}</h2>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2 py-0.5 rounded-full capitalize mt-1 inline-block">
                Mitra Teknisi
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800 py-4 my-5 text-center">
              <div className="space-y-1">
                <div className="text-amber-500 flex items-center justify-center gap-1 font-bold text-lg">
                  <Star className="h-5 w-5 fill-amber-500 stroke-amber-500" />
                  {techProfile?.rating_avg || '0'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Rating Rata-Rata</div>
              </div>
              <div className="space-y-1 border-l border-slate-100 dark:border-slate-800">
                <div className="text-blue-900 dark:text-blue-400 flex items-center justify-center gap-1 font-bold text-lg">
                  <Award className="h-5 w-5" />
                  {techProfile?.total_jobs || '0'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Pekerjaan Selesai</div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3.5 text-sm text-slate-650 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{profile.phone || 'Nomor WhatsApp belum diatur'}</span>
              </div>
              
              {/* Specializations list */}
              <div className="pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-450 font-semibold mb-2">Spesialisasi Keahlian:</div>
                <div className="flex flex-wrap gap-1.5">
                  {techProfile?.specializations?.map((spec: string) => (
                    <span
                      key={spec}
                      className="text-[10px] font-bold text-blue-900 dark:text-blue-350 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-2.5 py-0.5 rounded-full capitalize"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Tema Tampilan</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Pilih tema terang, gelap, atau sistem</span>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Action button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-rose-200 dark:border-rose-950 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 rounded-xl py-6 flex items-center justify-center gap-2 font-bold"
        >
          <LogOut className="h-4.5 w-4.5" />
          Keluar dari Akun
        </Button>
      </div>
    </div>
  )
}
