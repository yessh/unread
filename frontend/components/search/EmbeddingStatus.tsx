'use client'

import { useEffect, useState } from 'react'
import { getEmbedStatus, startEmbedding, EmbeddingProgress } from '@/lib/api'

interface EmbeddingStatusProps {
  sessionId: number
  onDone?: () => void
}

export function EmbeddingStatus({ sessionId, onDone }: EmbeddingStatusProps) {
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null)
  const [polling, setPolling] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    // 초기 상태 조회
    getEmbedStatus(sessionId)
      .then((data) => {
        setProgress(data)
        if (data.status === 'DONE') onDone?.()  // eslint-disable-line react-hooks/exhaustive-deps
      })
      .catch(() => {})
  }, [sessionId])

  useEffect(() => {
    if (!polling) return

    const fetch = async () => {
      try {
        const data = await getEmbedStatus(sessionId)
        setProgress(data)
        if (data.status === 'DONE') {
          setPolling(false)
          onDone?.()
        } else if (data.status === 'FAILED') {
          setPolling(false)
        }
      } catch {
        // 서버 미연결 시 무시
      }
    }

    const intervalId = setInterval(fetch, 2000)
    return () => clearInterval(intervalId)
  }, [polling, sessionId])

  const handleStart = async () => {
    setStarting(true)
    try {
      await startEmbedding(sessionId)
      setPolling(true)
    } catch {
      // 오류 시 무시
    } finally {
      setStarting(false)
    }
  }

  if (!progress || progress.status === 'IDLE') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface-card px-4 py-3">
        <p className="flex-1 text-sm text-content-secondary">
          AI 검색 인덱스를 생성하면 자연어로 대화를 검색할 수 있습니다.
        </p>
        <button
          onClick={handleStart}
          disabled={starting}
          className="shrink-0 rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {starting ? '시작 중...' : '인덱스 생성'}
        </button>
      </div>
    )
  }

  if (progress.status === 'DONE') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-accent-success/10 px-4 py-3 text-sm text-accent-success">
        <span>검색 준비 완료</span>
        <span className="text-xs text-accent-success/70">({progress.total.toLocaleString()}개 메시지 인덱싱됨)</span>
      </div>
    )
  }

  if (progress.status === 'FAILED') {
    return (
      <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        임베딩 중 오류가 발생했습니다.
      </div>
    )
  }

  // IN_PROGRESS
  return (
    <div className="space-y-2 rounded-xl bg-surface-card px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-content-secondary">검색 인덱스 생성 중...</span>
        <span className="text-accent-primary font-semibold">
          {progress.done.toLocaleString()} / {progress.total.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-2 rounded-full bg-accent-primary transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="text-xs text-content-muted">완료 후 자연어 검색이 가능합니다.</p>
    </div>
  )
}
