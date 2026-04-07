'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api'
// OAuth2는 백엔드 포트로 직접 리다이렉트
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/upload')
    }
  }, [user, loading, router])

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/oauth2/authorization/google`
  }

  if (loading) return null

  return (
    <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-surface-elevated bg-surface-card p-8 shadow-lg">
          {/* 로고 */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary">
              <span className="text-2xl font-bold text-white">U</span>
            </div>
            <h1 className="text-2xl font-bold text-content-primary">unread</h1>
            <p className="mt-1 text-sm text-content-secondary">
              카카오톡 대화를 AI로 분석해보세요
            </p>
          </div>

          {/* 구글 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-surface-elevated bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
          >
            <GoogleIcon />
            Google로 계속하기
          </button>

          <p className="mt-6 text-center text-xs text-content-tertiary">
            로그인하면 분석 결과가 계정에 저장되어
            <br />
            언제든 다시 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.49-1.63.78-2.7.78-2.09 0-3.86-1.41-4.5-3.3H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.48 10.53c-.16-.49-.25-1-.25-1.53s.09-1.04.25-1.53V5.4H1.83a8 8 0 0 0 0 7.2l2.65-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.17c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.48 7.47c.63-1.89 2.4-3.3 4.5-3.3z"/>
    </svg>
  )
}
