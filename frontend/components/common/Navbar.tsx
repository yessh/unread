'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useAnalysis } from '@/context/AnalysisContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const { resetAnalysis, sessionId } = useAnalysis()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleNewFile = () => {
    resetAnalysis()
    router.push('/upload')
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (sessionId) {
      router.push('/dashboard')
    } else {
      router.push('/upload')
    }
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-surface-elevated bg-surface-card/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/upload" onClick={handleLogoClick} className="flex items-center gap-2">
            <div className="flex-center h-8 w-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
              <span className="text-sm font-bold text-white">U</span>
            </div>
            <span className="text-lg font-bold text-content-primary">unread</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={handleNewFile}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-elevated"
                >
                  새 파일 분석
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-content-secondary">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-1.5 text-sm text-content-tertiary transition-colors hover:bg-surface-elevated hover:text-content-primary"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
