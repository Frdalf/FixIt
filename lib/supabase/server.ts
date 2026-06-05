import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://placeholder.supabase.co'
  } else {
    // Clean up trailing slashes and /rest/v1 suffix
    supabaseUrl = supabaseUrl.trim().replace(/\/+$/, '')
    if (supabaseUrl.endsWith('/rest/v1')) {
      supabaseUrl = supabaseUrl.slice(0, -8)
    }
  }
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Can be ignored if called from Server Component
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Can be ignored if called from Server Component
          }
        },
      },
    }
  )
}
