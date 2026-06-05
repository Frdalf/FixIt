'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Wrench, AlertCircle, Loader2 } from 'lucide-react'

function TeknisiLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorQuery = searchParams.get('error')

  useEffect(() => {
    if (errorQuery === 'inactive') {
      setErrorMessage(
        'Akun Anda belum aktif. Harap tunggu verifikasi dari Admin sebelum dapat masuk ke dashboard teknisi.'
      )
    }
  }, [errorQuery])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

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
      // Fetch profile to verify role and status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        toast.error('Gagal mengambil data profil')
        setLoading(false)
        return
      }

      if (profile.role !== 'teknisi') {
        await supabase.auth.signOut()
        toast.error('Akun ini tidak terdaftar sebagai Teknisi')
        setLoading(false)
        return
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()
        setErrorMessage(
          'Akun Anda belum aktif. Harap tunggu verifikasi dari Admin sebelum dapat masuk ke dashboard teknisi.'
        )
        setLoading(false)
        return
      }

      toast.success('Login teknisi berhasil!')
      router.push('/teknisi/tasks')
      router.refresh()
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      <Card className="border-slate-100 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-heading text-slate-800">Login Teknisi</CardTitle>
          <CardDescription>Masuk untuk mengelola tugas perbaikan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Kerja</Label>
              <Input
                id="email"
                type="email"
                placeholder="teknisi@fixit.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-slate-200"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xl py-6 transition-colors mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk Dashboard'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-sm text-center border-t border-slate-50 pt-6">
          <div>
            Belum terdaftar sebagai teknisi?{' '}
            <Link href="/teknisi/register" className="text-blue-600 hover:underline font-medium">
              Daftar sekarang
            </Link>
          </div>
          <div>
            <Link href="/login" className="text-slate-500 hover:underline">
              Bukan teknisi? Masuk sebagai Pelanggan
            </Link>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

export default function TeknisiLoginPage() {
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

        <Suspense fallback={
          <Card className="border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="text-xs text-slate-500 font-semibold mt-2">Memuat halaman login teknisi...</span>
          </Card>
        }>
          <TeknisiLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
