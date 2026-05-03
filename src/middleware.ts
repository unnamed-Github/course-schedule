import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/weather']
const COOKIE_NAME = 'auth_token'

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/_next/') || /\.(.*)$/.test(pathname)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') return NextResponse.next()

  if (isPublic(pathname)) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
