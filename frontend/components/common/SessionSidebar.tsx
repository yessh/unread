'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessions, ChatSessionSummary } from '@/lib/api'
import { useAnalysis } from '@/context/AnalysisContext'
import { useAuth } from '@/context/AuthContext'

export function SessionSidebar() {
  const { user } = useAuth()
  const { loadSession, resetAnalysis } = useAnalysis()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, user])

  if (!user) return null

  const handleSelectSession = async (session: ChatSessionSummary) => {
    setLoadingId(session.id)
    resetAnalysis()
    await loadSession(session.id, session.roomName)
    setLoadingId(null)
    setOpen(false)
    router.push('/dashboard')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="이전 파일 목록"
        className="fixed left-0 top-1/2 z-50 -translate-y-1/2 rounded-r-xl bg-surface-card border border-l-0 border-surface-elevated px-2 py-4 shadow-lg transition-all hover:bg-surface-elevated"
      >
        <span className="flex flex-col items-center gap-1 text-content-secondary">
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
          <span className="[writing-mode:vertical-rl] text-xs font-medium select-none">이전 파일</span>
        </span>
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 패널 */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col bg-surface-card shadow-2xl border-r border-surface-elevated transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-surface-elevated px-5 py-4">
          <h2 className="text-base font-semibold text-content-primary">업로드한 파일</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-content-tertiary hover:bg-surface-elevated"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-12 text-center text-sm text-content-tertiary">업로드한 파일이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => handleSelectSession(s)}
                    disabled={loadingId !== null}
                    className="w-full rounded-xl border border-surface-elevated bg-surface-base p-4 text-left transition-all hover:border-accent-primary/40 hover:bg-surface-elevated disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 font-medium text-content-primary text-sm">{s.roomName}</span>
                      {loadingId === s.id && (
                        <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-content-tertiary">
                      <span>{formatDate(s.uploadedAt)}</span>
                      <span>·</span>
                      <span>{s.messageCount.toLocaleString()}개 메시지</span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block rounded-md bg-accent-primary/10 px-2 py-0.5 text-xs text-accent-primary font-medium">
                        분석하기
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
