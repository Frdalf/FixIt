'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { 
  Laptop, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Star, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const CATEGORIES = [
  {
    name: 'Hardware',
    slug: 'hardware',
    description: 'Ganti LCD, keyboard, baterai, upgrade SSD/RAM, perbaikan port, dll.',
    icon: Laptop,
    color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
  },
  {
    name: 'Software',
    slug: 'software',
    description: 'Install OS, recovery data, bersihkan virus, optimasi performa, dll.',
    icon: Wrench,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50',
  },
  {
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Deep clean internal, pembersihan fan/port, ganti thermal paste.',
    icon: Sparkles,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
  },
  {
    name: 'Estetika & Proteksi',
    slug: 'estetika',
    description: 'Pasang skin laptop custom, tempered glass, pelindung anti-gores body.',
    icon: ShieldCheck,
    color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
  },
]

const TESTIMONIALS = [
  {
    name: 'Rian Prasetya',
    role: 'Mahasiswa',
    comment: 'Luar biasa cepat! Laptop mati total karena keyboard short, teknisi datang ke kosan dan ganti keyboard selesai dalam 30 menit. Harganya transparan.',
    rating: 5,
  },
  {
    name: 'Siti Aminah',
    role: 'Pekerja WFH',
    comment: 'Sangat terbantu karena tidak perlu keluar rumah. Thermal paste diganti, fan dibersihkan, sekarang laptop tidak cepat panas lagi dan performanya ngebut.',
    rating: 5,
  },
  {
    name: 'David Wijaya',
    role: 'Desainer Grafis',
    comment: 'Upgrade SSD Macbook Pro M1 berjalan lancar. Teknisi sangat profesional dan ramah. Recommended untuk area Jakarta.',
    rating: 5,
  },
]

export default function LandingPage() {
  const { user, profile, loading } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-900 text-white p-1.5 rounded-lg">
              <Laptop className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold font-heading text-blue-900 dark:text-blue-400">FixIT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#services" className="hover:text-blue-900 dark:hover:text-blue-400 transition-colors">Layanan</a>
            <a href="#features" className="hover:text-blue-900 dark:hover:text-blue-400 transition-colors">Keunggulan</a>
            <a href="#testimonials" className="hover:text-blue-900 dark:hover:text-blue-400 transition-colors">Testimoni</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-block">
                  Halo, {profile?.full_name || 'Pelanggan'}
                </span>
                <Link href={profile?.role === 'admin' ? '/admin' : profile?.role === 'teknisi' ? '/teknisi/tasks' : '/repairs'}>
                  <Button className="bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium px-4">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 font-medium rounded-xl text-xs sm:text-sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-medium">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 py-16 md:py-24 border-b border-slate-50 dark:border-slate-900">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-900 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Layanan Servis Laptop On-Demand Pertama di Indonesia
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-slate-900 dark:text-white leading-tight">
              Laptop Rusak?<br />
              <span className="text-blue-900 dark:text-blue-400">Teknisi Kami Datang</span> Ke Tempat Anda!
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto md:mx-0">
              Servis laptop terpercaya tanpa ribet. Hubungi kami, pilih jenis kerusakan, dan teknisi terdekat akan datang langsung untuk memperbaikinya secara transparan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Link href={user ? '/repairs' : '/login'} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl py-6 px-8 text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                  Pesan Servis Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#services" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold rounded-2xl py-6 px-8 text-base">
                  Lihat Layanan
                </Button>
              </a>
            </div>
          </div>
          <div className="relative flex justify-center items-center">
            {/* Visual illustration of laptop/repair */}
            <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-blue-100/50 dark:bg-blue-950/20 absolute -z-10 blur-3xl animate-pulse" />
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-3xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 p-2 rounded-xl">
                  <Star className="h-5 w-5 fill-amber-500 stroke-amber-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ulasan Pengguna</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">4.9/5.0 Rating Kepuasan</div>
                </div>
              </div>
              <div className="border-t border-slate-50 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1"><UserCheck className="h-4 w-4 text-emerald-500" /> 100+ Teknisi Aktif</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Garansi Perbaikan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">Layanan Perbaikan Kami</h2>
            <p className="text-slate-600 dark:text-slate-400">Kami menyediakan berbagai layanan perbaikan laptop terlengkap yang dikerjakan oleh teknisi ahli langsung di hadapan Anda.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <Card key={cat.slug} className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-md transition-all rounded-2xl group cursor-pointer flex flex-col justify-between">
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className={`p-3 rounded-xl w-fit border ${cat.color}`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors font-heading">{cat.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{cat.description}</p>
                  </div>
                  <Link href={user ? `/repairs/${cat.slug}` : '/login'} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-950 dark:text-blue-450 hover:underline pt-4 group-hover:gap-2 transition-all">
                    Pilih Layanan <ChevronRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-50 dark:border-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">Mengapa Memilih FixIT?</h2>
            <p className="text-slate-600 dark:text-slate-400">Solusi perbaikan laptop modern, efisien, dan terpercaya tanpa perlu macet di jalan menuju toko servis.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-center">
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-400 p-4 rounded-full w-fit mx-auto">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-heading">On-Demand Terdekat</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Algoritma kami mendeteksi lokasi Anda dan menugaskan teknisi terdekat untuk mempercepat kedatangan.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-center">
              <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 p-4 rounded-full w-fit mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-heading">Bergaransi & Transparan</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Semua servis disertai garansi resmi FixIT. Harga tercantum di aplikasi transparan tanpa ada biaya tambahan siluman.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-center">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 p-4 rounded-full w-fit mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-heading">Lacak Real-Time</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pantau pergerakan status teknisi Anda mulai dari keberangkatan, proses servis, hingga laptop selesai diperbaiki.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">Ulasan Pelanggan</h2>
            <p className="text-slate-600 dark:text-slate-400">Apa kata mereka yang telah menggunakan layanan perbaikan laptop on-demand FixIT.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <Card key={idx} className="border-slate-100 dark:border-slate-850 shadow-sm rounded-2xl p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between">
                <CardContent className="p-0 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 stroke-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{t.comment}"</p>
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12 border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-900 text-white p-1.5 rounded-lg">
                <Laptop className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold font-heading tracking-wider">FixIT</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Solusi Terbaik Perbaikan Laptop Terpercaya — Cepat, Profesional & Bergaransi. Dikerjakan langsung di lokasi Anda.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm font-heading mb-4 text-slate-200">Untuk Pelanggan</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/login" className="hover:underline">Masuk Akun</Link></li>
              <li><Link href="/register" className="hover:underline">Daftar Akun</Link></li>
              <li><Link href="/repairs" className="hover:underline">Pesan Servis</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm font-heading mb-4 text-slate-200">Untuk Teknisi</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/teknisi/login" className="hover:underline">Masuk Portal Teknisi</Link></li>
              <li><Link href="/teknisi/register" className="hover:underline">Gabung Mitra Teknisi</Link></li>
              <li><Link href="/admin/login" className="hover:underline">Konsol Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} FixIT. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </footer>
    </div>
  )
}
