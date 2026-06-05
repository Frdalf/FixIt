'use client'

import Link from 'next/link'
import { 
  Laptop, 
  Wrench, 
  ShieldCheck, 
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const CATEGORIES = [
  {
    name: 'Hardware',
    slug: 'hardware',
    description: 'Ganti LCD, keyboard, baterai, upgrade SSD/RAM, perbaikan port, dll.',
    icon: Laptop,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    count: '8 Layanan',
  },
  {
    name: 'Software',
    slug: 'software',
    description: 'Install OS, recovery data, bersihkan virus, optimasi performa, dll.',
    icon: Wrench,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    count: '5 Layanan',
  },
  {
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Deep clean internal, pembersihan fan/port, ganti thermal paste.',
    icon: Sparkles,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    count: '3 Layanan',
  },
  {
    name: 'Estetika & Proteksi',
    slug: 'estetika',
    description: 'Pasang skin laptop custom, tempered glass, pelindung anti-gores body.',
    icon: ShieldCheck,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    count: '3 Layanan',
  },
]

export default function RepairsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-800">
          Pilih Kategori Servis
        </h1>
        <p className="text-sm text-slate-500">
          Silakan pilih kategori perbaikan laptop yang Anda butuhkan
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link href={`/repairs/${cat.slug}`} key={cat.slug}>
            <Card className="border-slate-100 hover:border-blue-100 hover:shadow-md transition-all rounded-2xl cursor-pointer h-full group">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl border ${cat.color}`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {cat.count}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-800 font-heading group-hover:text-blue-900 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-blue-900 group-hover:underline pt-2">
                  Lihat Layanan <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
