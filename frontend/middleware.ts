import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/upload', '/dashboard', '/recap']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('access_token')
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/upload/:path*', '/dashboard/:path*', '/recap/:path*'],
}
