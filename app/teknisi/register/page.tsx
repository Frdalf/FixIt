'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Wrench } from 'lucide-react'

const SPECIALIZATION_OPTIONS = [
  { id: 'hardware', label: 'Hardware (Ganti LCD, Keyboard, Baterai, SSD)' },
  { id: 'software', label: 'Software (Install OS, Optimasi, Virus, Backup)' },
  { id: 'cleaning', label: 'Cleaning (Deep Clean, Ganti Thermal Paste)' },
  { id: 'estetika', label: 'Estetika & Proteksi (Skin, Anti-Gores, Tempered Glass)' },
]

export default function TeknisiRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckboxChange = (id: string) => {
    setSpecializations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }

    if (specializations.length === 0) {
      toast.error('Pilih minimal satu spesialisasi')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Default mock location around Jakarta for technician tracking
    const defaultLat = -6.2088 + (Math.random() - 0.5) * 0.05
    const defaultLng = 106.8456 + (Math.random() - 0.5) * 0.05

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: 'teknisi',
          specializations: specializations,
          latitude: defaultLat,
          longitude: defaultLng,
        },
      },
    })

    if (error) {
      toast.error(error.message || 'Registrasi gagal')
      setLoading(false)
      return
    }

    if (data.user) {
      toast.success(
        'Registrasi berhasil! Akun Anda dinonaktifkan sementara untuk diverifikasi Admin.'
      )
      router.push('/teknisi/login?error=inactive')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-amber-500 text-white p-2 rounded-xl">
            <Wrench className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold font-heading tracking-wider text-slate-800">
            FixIT <span className="text-sm font-semibold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">Teknisi</span>
          </span>
        </div>

        <Card className="border-slate-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-heading text-slate-800">Daftar Mitra Teknisi</CardTitle>
            <CardDescription>Gabung sebagai mitra teknisi FixIT</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp/HP</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Kerja</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>
              
              <div className="space-y-2 pt-2">
                <Label className="text-slate-700 font-medium">Spesialisasi Keahlian</Label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {SPECIALIZATION_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id={`spec-${option.id}`}
                        checked={specializations.includes(option.id)}
                        onChange={() => handleCheckboxChange(option.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800 cursor-pointer"
                      />
                      <label
                        htmlFor={`spec-${option.id}`}
                        className="text-xs text-slate-600 select-none cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl border-slate-200"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xl py-6 transition-colors mt-4"
              >
                {loading ? 'Mendaftar...' : 'Daftar Sebagai Teknisi'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-sm text-center border-t border-slate-50 pt-6">
            <div>
              Sudah memiliki akun?{' '}
              <Link href="/teknisi/login" className="text-blue-600 hover:underline font-medium">
                Masuk di sini
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
