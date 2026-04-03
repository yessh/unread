'use client'

import { useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { HighlightedMessage } from './HighlightedMessage'
import type { KeywordExtraction } from '@/lib/types'

interface KeywordResultListProps {
  results: KeywordExtraction[]
}

export function KeywordResultList({ results }: KeywordResultListProps) {
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(
    results.length > 0 ? results[0].keyword : null,
  )

  if (results.length === 0) {
    return (
      <div className="card flex-center flex-col gap-4 text-center">
        <div className="text-4xl">🔍</div>
        <p className="text-content-secondary">
          키워드를 입력하여 관련 메시지를 찾아보세요
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 키워드 탭 */}
      <div className="flex flex-wrap gap-2 border-b border-surface-elevated pb-4">
        {results.map((result) => (
          <button
            key={result.keyword}
            onClick={() => setExpandedKeyword(result.keyword)}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              expandedKeyword === result.keyword
                ? 'bg-accent-primary text-white'
                : 'bg-surface-card text-content-secondary hover:bg-surface-elevated'
            }`}
          >
            {result.keyword}
            <span className="ml-2 text-xs opacity-70">({result.total_count})</span>
          </button>
        ))}
      </div>

      {/* 선택된 키워드의 메시지 목록 */}
      {results
        .filter((r) => r.keyword === expandedKeyword)
        .map((result) => (
          <div key={result.keyword} className="space-y-4">
            {/* 신뢰도 */}
            <div className="flex items-center gap-4 rounded-lg bg-surface-card/50 p-4">
              <span className="text-sm text-content-secondary">신뢰도</span>
              <div className="flex-1 rounded-full bg-surface-elevated">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
                  style={{ width: `${result.relevance_score * 100}%` }}
                />
              </div>
              <span className="font-semibold text-accent-primary">
                {Math.round(result.relevance_score * 100)}%
              </span>
            </div>

            {/* 핵심 메시지 목록 */}
            <div className="space-y-3">
              {result.core_messages.map((msg, idx) => (
                <HighlightedMessage
                  key={idx}
                  sender={msg.sender}
                  content={msg.content}
                  relevance={msg.relevance}
                  keywords={[result.keyword]}
                />
              ))}
            </div>

            {/* 전체 메시지 수 정보 */}
            <Badge variant="secondary" size="sm">
              총 {result.total_count}개 관련 메시지
            </Badge>
          </div>
        ))}
    </div>
  )
}
