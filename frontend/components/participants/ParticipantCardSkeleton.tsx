'use client'

import { useEffect, useRef, useState } from 'react'
import { getChartColor, getInitials } from '@/lib/chartUtils'

interface ParticipantCardSkeletonProps {
  name: string
  colorIndex: number
  tokenCount: number
  previewText: string
}

export function ParticipantCardSkeleton({ name, colorIndex, previewText }: ParticipantCardSkeletonProps) {
  const bgColor = getChartColor(colorIndex)
  const initials = getInitials(name)

  // 타이핑 효과: previewText가 늘어날 때 한 글자씩 표시
  const [displayed, setDisplayed] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (previewText.length <= displayed.length) return

    const next = previewText[displayed.length]
    timerRef.current = setTimeout(() => {
      setDisplayed((prev) => prev + next)
    }, 18) // 글자당 18ms → 자연스러운 타이핑 속도

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [previewText, displayed])

  return (
    <div className="card-hover group opacity-90">
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex-center h-12 w-12 rounded-full font-bold text-white"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-content-primary">{name}</h3>
          <p className="text-sm text-content-secondary">실시간 분석 중...</p>
        </div>
      </div>

      {/* 성격 요약 — 스트리밍 텍스트 */}
      <div className="border-t border-surface-elevated pt-4 space-y-4">
        <div className="min-h-[3rem] text-sm text-content-primary leading-relaxed">
          {displayed ? (
            <span>
              {displayed}
              {/* 깜빡이는 커서 */}
              <span className="ml-0.5 inline-block w-0.5 h-4 bg-accent-primary align-middle animate-pulse" />
            </span>
          ) : (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-surface-elevated" />
              <div className="h-3 w-4/5 animate-pulse rounded-full bg-surface-elevated" />
            </div>
          )}
        </div>

        {/* 나머지 필드 — shimmer */}
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-surface-elevated" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-surface-elevated" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-surface-elevated" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-2 flex-1 animate-pulse rounded-full bg-surface-elevated" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-surface-elevated" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-surface-elevated" />
        </div>
        <div className="h-2 w-full animate-pulse rounded-full bg-surface-elevated" />
      </div>
    </div>
  )
}
