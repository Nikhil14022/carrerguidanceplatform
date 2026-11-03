import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req: any) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  const requestHeaders = new Headers(req.headers)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CORS Headers - Allow mobile app access
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight OPTIONS requests for mobile
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers: response.headers, status: 200 })
  }

  const origin = req.nextUrl.origin

  // Redirect to login if not authenticated
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/api/client') || pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/parent') || pathname.startsWith('/api/parent') || pathname.startsWith('/mentor') || pathname.startsWith('/api/mentor')) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // --- Strict Role Enforcement ---
  const isMentorRole = role === 'EXPERT' || role === 'MENTOR_PERMANENT' || role === 'MENTOR_TEMPORARY';
  const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Admin access (also allow Mentors to access structured-report endpoint)
  const isSharedAdminApi = pathname.startsWith('/api/admin/clients/') && pathname.includes('/structured-report');
  if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && !isAdminRole && !(isMentorRole && isSharedAdminApi)) {
    // If they are a mentor hitting admin urls, redirect them to mentor dashboard
    if (isMentorRole) return NextResponse.redirect(new URL('/mentor', origin));
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Mentor access (Admins and Super Admins can also access mentor APIs & views)
  if ((pathname.startsWith('/mentor') || pathname.startsWith('/api/mentor')) && !isMentorRole && !isAdminRole) {
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Parent access: Cannot access /dashboard (Student View)
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/api/client')) && role === 'PARENT') {
    return NextResponse.redirect(new URL('/parent', origin))
  }

  // Student access: Cannot access /parent (Student View)
  if ((pathname.startsWith('/parent') || pathname.startsWith('/api/parent')) && role !== 'PARENT') {
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Restrictions for mentors accessing client dashboard UI (allow /api/client for proxy module editing)
  if (pathname.startsWith('/dashboard') && isMentorRole) {
    return NextResponse.redirect(new URL('/mentor', origin))
  }

  // Redirection after login/register
  if ((pathname === '/login' || pathname === '/register') && isLoggedIn) {
    if (role === 'PARENT') return NextResponse.redirect(new URL('/parent', origin))
    if (isAdminRole) return NextResponse.redirect(new URL('/admin', origin))
    if (isMentorRole) return NextResponse.redirect(new URL('/mentor', origin))
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  return response
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/parent/:path*',
    '/mentor/:path*',
    '/api/client/:path*',
    '/api/admin/:path*',
    '/api/parent/:path*',
    '/api/mentor/:path*',
    '/login',
    '/register'
  ]
}
