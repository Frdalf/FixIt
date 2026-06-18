'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.error('Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali.')
      const url = new URL(window.location.href)
      url.searchParams.delete('expired')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message || 'Email atau password salah')
      setLoading(false)
      return
    }

    if (data.user) {
      // Validate role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        toast.error('Akses Ditolak: Akun ini bukan Super Admin')
        setLoading(false)
        return
      }

      toast.success('Login Super Admin berhasil!')
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900 min-h-screen relative">
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Kembali ke Beranda</span>
        <span className="sm:hidden">Kembali</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6 text-white">
          <div className="bg-red-600 text-white p-2 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold font-heading tracking-wider">
            FixIT <span className="text-sm font-semibold text-red-500 bg-red-950 px-2 py-0.5 rounded-md">Admin</span>
          </span>
        </div>

        <Card className="border-slate-800 bg-slate-950 text-white shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-heading text-slate-100">Portal Admin</CardTitle>
            <CardDescription className="text-slate-400">Masuk ke pusat kontrol utama sistem FixIT</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Admin</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fixit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl py-6 transition-colors mt-2"
              >
                {loading ? 'Memverifikasi...' : 'Masuk Konsol'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex items-center justify-center text-sm text-center border-t border-slate-900 pt-6">
            <Link href="/login" className="text-slate-400 hover:underline">
              Kembali ke Halaman Utama Pelanggan
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}

