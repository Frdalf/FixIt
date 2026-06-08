'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 rounded-xl border border-slate-200/50 dark:border-slate-800/50"
      >
        <div className="h-4.5 w-4.5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-9 w-9 rounded-xl border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-350 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] text-amber-500 animate-in spin-in-90 duration-300" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-blue-900 dark:text-blue-400 animate-in spin-in-90 duration-300" />
      )}
    </Button>
  )
}
