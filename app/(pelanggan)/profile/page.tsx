'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, User, Phone, Mail, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export default function PelangganProfilePage() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    router.push('/')
  }

  if (!profile) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-md pb-24">
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold font-heading text-slate-800">Profil Saya</h1>

        {/* User Card */}
        <Card className="border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden">
          <div className="h-20 bg-blue-900" />
          <CardContent className="p-6 pt-0 relative">
            <div className="h-16 w-16 rounded-full bg-amber-500 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white absolute -top-8 left-6 shadow-sm">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="pt-10">
              <h2 className="text-lg font-bold text-slate-800 font-heading">{profile.full_name}</h2>
              <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full capitalize mt-1 inline-block">
                {profile.role}
              </span>
            </div>

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm text-slate-650">
              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span>{profile.phone || 'Nomor WhatsApp belum diatur'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">Pelanggan Aktif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl py-6 flex items-center justify-center gap-2 font-bold"
        >
          <LogOut className="h-4.5 w-4.5" />
          Keluar dari Akun
        </Button>
      </div>
    </div>
  )
}
