import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  // Clean up URL
  let sanitizedUrl = supabaseUrl.trim().replace(/\/+$/, '')
  if (sanitizedUrl.endsWith('/rest/v1')) {
    sanitizedUrl = sanitizedUrl.slice(0, -8)
  }

  return createSupabaseClient(sanitizedUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
