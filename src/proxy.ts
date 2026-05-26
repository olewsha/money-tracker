import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PREFIXES = ['/login', '/register', '/auth']

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function buildRedirect(
  request: NextRequest,
  path: string,
  cookieJar: NextResponse
): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = path
  url.search = ''
  if (path === '/login') {
    // preserve any reason param the caller wants to set
    const reason = request.nextUrl.searchParams.get('reason')
    if (reason) url.searchParams.set('reason', reason)
  }
  const redirectResponse = NextResponse.redirect(url)
  cookieJar.cookies.getAll().forEach((c) => {
    redirectResponse.cookies.set(c.name, c.value)
  })
  return redirectResponse
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const publicRoute = isPublic(pathname)

  if (!user && !publicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  // For signed-in users on protected routes, look up the profile once and
  // enforce both the "blocked" and "admin" gates. We use maybeSingle so a
  // missing profile row (race during signup) doesn't 500 the whole site.
  if (user && !publicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      url.searchParams.set('reason', 'blocked')
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value)
      })
      return redirectResponse
    }

    if (isAdminPath(pathname) && profile?.role !== 'admin') {
      return buildRedirect(request, '/', supabaseResponse)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except: API routes (they do their own auth check and
    // must return JSON 401, not redirect to HTML), Next.js internals, and
    // static asset files.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
