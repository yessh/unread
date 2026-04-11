'use client'

import { useEffect, useState } from 'react'
import { getEmbedStatus, EmbeddingProgress } from '@/lib/api'

interface EmbeddingStatusProps {
  sessionId: number
}

export function EmbeddingStatus({ sessionId }: EmbeddingStatusProps) {
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null)

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>

    const fetch = async () => {
      try {
        const data = await getEmbedStatus(sessionId)
        setProgress(data)
        if (data.status === 'DONE' || data.status === 'FAILED') {
          clearInterval(intervalId)
        }
      } catch {
        // 서버 미연결 시 무시
      }
    }

    fetch()
    intervalId = setInterval(fetch, 2000)
    return () => clearInterval(intervalId)
  }, [sessionId])

  if (!progress || progress.status === 'IDLE') return null

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
