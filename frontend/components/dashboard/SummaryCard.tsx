'use client'

import { useState } from 'react'
import { Badge } from '@/components/common/Badge'
import type { ConversationSummary } from '@/lib/types'

interface SummaryCardProps {
  summary: ConversationSummary
  roomName: string
  analysisTimestamp: string
}

export function SummaryCard({ summary, roomName, analysisTimestamp }: SummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const timestamp = new Date(analysisTimestamp)
  const formattedDate = timestamp.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="card">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">{roomName}</h2>
          <p className="text-sm text-content-secondary">{formattedDate}에 분석됨</p>
        </div>
      </div>

      <div className="border-t border-surface-elevated py-4">
        {/* 통계 */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="flex-center flex-col gap-2">
            <div className="text-3xl font-bold text-accent-primary">{summary.message_count}</div>
            <div className="text-xs text-content-secondary">메시지</div>
          </div>
          <div className="flex-center flex-col gap-2">
            <div className="text-3xl font-bold text-accent-secondary">{summary.participant_count}</div>
            <div className="text-xs text-content-secondary">참여자</div>
          </div>
          <div className="flex-center flex-col gap-2">
            <div className="text-xl font-bold text-accent-success">✓</div>
            <div className="text-xs text-content-secondary">분석 완료</div>
          </div>
        </div>

        {/* 요약 */}
        <div className="mb-6">
          <h3 className="mb-2 font-semibold text-content-primary">대화 요약</h3>
          <p className={`text-sm leading-relaxed text-content-secondary ${!isExpanded && 'line-clamp-2'}`}>
            {summary.summary}
          </p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm font-medium text-accent-primary hover:text-accent-secondary"
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        </div>

        {/* 주요 주제 */}
        {summary.main_topics.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold text-content-primary">주요 주제</h3>
            <div className="flex flex-wrap gap-2">
              {summary.main_topics.map((topic, idx) => (
                <Badge key={idx} variant="primary">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
