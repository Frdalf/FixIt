import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    // Fallback if environment variables are not set during initial loading
    return response
  }

  // Clean up trailing slashes and /rest/v1 suffix
  supabaseUrl = supabaseUrl.trim().replace(/\/+$/, '')
  if (supabaseUrl.endsWith('/rest/v1')) {
    supabaseUrl = supabaseUrl.slice(0, -8)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Route protection logic
  const url = request.nextUrl.clone()
  const path = url.pathname

  // Skip API routes, static assets, images, etc.
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return response
  }

  if (user) {
    // Get user profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Inactive Technician check
      if (profile.role === 'teknisi' && !profile.is_active) {
        if (path.startsWith('/teknisi') && path !== '/teknisi/login' && path !== '/teknisi/register') {
          url.pathname = '/teknisi/login'
          url.searchParams.set('error', 'inactive')
          return NextResponse.redirect(url)
        }
      }

      // Check role based route protection
      if (path.startsWith('/admin') && profile.role !== 'admin' && path !== '/admin/login') {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      if (path.startsWith('/teknisi') && profile.role !== 'teknisi' && path !== '/teknisi/login' && path !== '/teknisi/register') {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Prevent authenticated users from visiting login/register pages
      if (['/login', '/register', '/teknisi/login', '/teknisi/register', '/admin/login'].includes(path)) {
        if (profile.role === 'admin') {
          url.pathname = '/admin'
        } else if (profile.role === 'teknisi') {
          url.pathname = '/teknisi/tasks'
        } else {
          url.pathname = '/'
        }
        return NextResponse.redirect(url)
      }
    }
  } else {
    // Protected routes configuration
    const isProtectedPelanggan = ['/repairs', '/orders', '/history', '/chat', '/profile'].some(p => path.startsWith(p))
    const isProtectedTeknisi = path.startsWith('/teknisi') && path !== '/teknisi/login' && path !== '/teknisi/register'
    const isProtectedAdmin = path.startsWith('/admin') && path !== '/admin/login'

    if (isProtectedPelanggan) {
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    if (isProtectedTeknisi) {
      url.pathname = '/teknisi/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    if (isProtectedAdmin) {
      url.pathname = '/admin/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
  }

  return response
}
