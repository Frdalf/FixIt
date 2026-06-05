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
import { Laptop } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: 'pelanggan',
        },
      },
    })

    if (error) {
      toast.error(error.message || 'Registrasi gagal')
      setLoading(false)
      return
    }

    if (data.user) {
      toast.success('Registrasi berhasil! Silakan login.')
      router.push('/login')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-blue-900 text-white p-2 rounded-xl">
            <Laptop className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold font-heading tracking-wider text-blue-900">FixIT</span>
        </div>

        <Card className="border-slate-100 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-heading text-slate-800">Daftar Akun</CardTitle>
            <CardDescription>Buat akun baru untuk memesan perbaikan laptop</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
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
                <Label htmlFor="email">Email</Label>
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
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl py-6 transition-colors mt-2"
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-sm text-center border-t border-slate-50 pt-6">
            <div>
              Sudah punya akun?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Masuk di sini
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
