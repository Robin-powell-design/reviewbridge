import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/', '/create', '/edit', '/results']

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtected(pathname)) return NextResponse.next()

  const authCookie = request.cookies.get('site-auth')?.value
  if (authCookie === 'authenticated') return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next|api|login|r/|favicon.ico|.*\\..*).*)'],
}
