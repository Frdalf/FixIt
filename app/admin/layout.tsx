'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, ClipboardList, Users, Settings, LogOut, Laptop, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Kelola Pesanan', href: '/admin/orders', icon: ClipboardList },
  { label: 'Laporan Customer', href: '/admin/reports', icon: Flag },
  { label: 'Verifikasi Teknisi', href: '/admin/users/teknisi', icon: Users },
  { label: 'Kelola Layanan', href: '/admin/services', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/admin/login'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Berhasil keluar dari portal admin')
    router.push('/admin/login')
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="bg-red-600 text-white p-1.5 rounded-lg">
            <Laptop className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold font-heading tracking-wider text-slate-800 dark:text-slate-200">
            FixIT <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded-md ml-1">Admin</span>
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all select-none',
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all select-none cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Konsol</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-950/20">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Super Admin Active Session
          </div>
          <div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30">
          {children}
        </main>
      </div>
    </div>
  )
}
