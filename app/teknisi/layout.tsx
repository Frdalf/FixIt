'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, MessageSquare, User, Laptop } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Tugas', href: '/teknisi/tasks', icon: ClipboardList },
  { label: 'Chat', href: '/teknisi/chat', icon: MessageSquare },
  { label: 'Profil', href: '/teknisi/profile', icon: User },
]

export default function TeknisiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Skip layout for login/register pages
  const isAuthPage = pathname === '/teknisi/login' || pathname === '/teknisi/register'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 bg-slate-50">
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/teknisi/tasks" className="flex items-center gap-2">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg">
              <Laptop className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold font-heading text-slate-800">
              FixIT <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Teknisi</span>
            </span>
          </Link>
          <nav className="flex items-center gap-8 text-sm font-medium text-slate-600">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'hover:text-blue-900 transition-colors',
                  pathname === item.href || (item.href !== '/teknisi/tasks' && pathname.startsWith(item.href))
                    ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-1'
                    : ''
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-lg px-4 py-2">
        <div className="flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/teknisi/tasks' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors text-slate-500 py-1 px-3 rounded-xl',
                  isActive ? 'text-amber-600 font-semibold bg-amber-50/50' : 'hover:text-slate-850'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-amber-500' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
