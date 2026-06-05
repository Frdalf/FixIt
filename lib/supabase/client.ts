import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
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

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
