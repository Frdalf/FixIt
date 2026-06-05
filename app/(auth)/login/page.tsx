'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Laptop, ArrowRight, Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('next') || '/'

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
      // Get user profile details to ensure active session
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      toast.success('Login berhasil!')
      
      if (profile?.role === 'admin') {
        router.push('/admin')
      } else if (profile?.role === 'teknisi') {
        router.push('/teknisi/tasks')
      } else {
        router.push(redirectPath)
      }
      router.refresh()
    }
  }

  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-heading text-slate-800">Masuk Akun</CardTitle>
        <CardDescription>Masuk untuk memesan layanan servis laptop Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
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
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl py-6 transition-colors mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-sm text-center border-t border-slate-50 pt-6">
        <div>
          Belum punya akun?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Daftar sekarang
          </Link>
        </div>
        <div className="w-full flex items-center justify-between text-xs text-slate-500 pt-2">
          <Link href="/teknisi/login" className="hover:underline flex items-center gap-1 text-slate-600">
            Area Teknisi <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/admin/login" className="hover:underline flex items-center gap-1 text-slate-600">
            Portal Admin <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 min-h-screen">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-blue-900 text-white p-2 rounded-xl">
            <Laptop className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold font-heading tracking-wider text-blue-900">FixIT</span>
        </div>

        <Suspense fallback={
          <Card className="border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            <span className="text-xs text-slate-500 font-semibold mt-2">Memuat halaman login...</span>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
