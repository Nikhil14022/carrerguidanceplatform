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

  // Redirect to login if not authenticated
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/api/client') || pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/parent') || pathname.startsWith('/api/parent') || pathname.startsWith('/mentor') || pathname.startsWith('/api/mentor')) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // --- Strict Role Enforcement ---
  const isMentorRole = role === 'EXPERT' || role === 'MENTOR_PERMANENT' || role === 'MENTOR_TEMPORARY';

  // Admin access
  if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    // If they are a mentor hitting admin urls, redirect them to mentor dashboard
    if (isMentorRole) return NextResponse.redirect(new URL('/mentor', req.url));
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Mentor access
  if ((pathname.startsWith('/mentor') || pathname.startsWith('/api/mentor')) && !isMentorRole) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Parent access: Cannot access /dashboard (Student View)
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/api/client')) && role === 'PARENT') {
    return NextResponse.redirect(new URL('/parent', req.url))
  }

  // Student access: Cannot access /parent (Student View)
  if ((pathname.startsWith('/parent') || pathname.startsWith('/api/parent')) && role !== 'PARENT') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Restrictions for mentors accessing dashboard
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/api/client')) && isMentorRole) {
    return NextResponse.redirect(new URL('/mentor', req.url))
  }

  // Redirection after login/register
  if ((pathname === '/login' || pathname === '/register') && isLoggedIn) {
    if (role === 'PARENT') return NextResponse.redirect(new URL('/parent', req.url))
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin', req.url))
    if (isMentorRole) return NextResponse.redirect(new URL('/mentor', req.url))
    return NextResponse.redirect(new URL('/dashboard', req.url))
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
