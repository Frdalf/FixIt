'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wrench, History, MessageSquare, User, Laptop, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

const NAV_ITEMS = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Servis', href: '/repairs', icon: Wrench },
  { label: 'Riwayat', href: '/history', icon: History },
  { label: 'Konsultasi', href: '/konsultasi', icon: HelpCircle },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Profil', href: '/profile', icon: User },
]

export default function PelangganLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-900 text-white p-1.5 rounded-lg">
              <Laptop className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold font-heading text-blue-900 dark:text-blue-400">FixIT</span>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-8 text-sm font-medium text-slate-650 dark:text-slate-400">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'hover:text-blue-900 dark:hover:text-blue-400 transition-colors',
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                      ? 'text-blue-900 dark:text-blue-400 font-bold border-b-2 border-blue-900 dark:border-blue-400 pb-1'
                      : ''
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-l border-slate-100 dark:border-slate-900 pl-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shadow-lg px-4 py-2">
        <div className="flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors text-slate-500 py-1 px-3 rounded-xl',
                  isActive ? 'text-blue-900 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/20' : 'hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-900 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
