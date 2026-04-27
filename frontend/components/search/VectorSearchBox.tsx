'use client'

import { useState } from 'react'
import { ragSearch, RagSearchResult } from '@/lib/api'

interface VectorSearchBoxProps {
  sessionId: number
  disabled?: boolean
}

export function VectorSearchBox({ sessionId, disabled = false }: VectorSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<RagSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSources, setShowSources] = useState(false)

  const handleSearch = async () => {
    if (!query.trim() || disabled) return
    setLoading(true)
    setError(null)
    setResult(null)
    setShowSources(false)
    try {
      const data = await ragSearch({ sessionId, query: query.trim(), limit: 10 })
      setResult(data)
    } catch (e) {
      setError('검색 중 오류가 발생했습니다. 임베딩이 완료되었는지 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* 입력창 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={disabled ? '인덱스를 먼저 생성해주세요' : '예: 갈등이 있었던 순간, 약속 잡은 대화, 서운했던 메시지...'}
          disabled={disabled}
          className="flex-1 rounded-xl bg-surface-elevated px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-40"
        />
        <button
          onClick={handleSearch}
          disabled={disabled || loading || !query.trim()}
          className="rounded-xl bg-accent-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? '분석 중...' : '검색'}
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* RAG 답변 */}
      {result && (
        <div className="space-y-3">
          {/* AI 답변 */}
          <div className="rounded-xl bg-surface-card px-5 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-accent-primary">AI 답변</span>
              <span className="text-xs text-content-muted">참고 메시지 {result.retrievedCount}개 기반</span>
            </div>
            <p className="text-sm text-content-primary leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>

          {/* 참고 메시지 토글 */}
          {result.sources.length > 0 && (
            <div>
              <button
                onClick={() => setShowSources((v) => !v)}
                className="text-xs text-content-muted hover:text-content-secondary transition"
              >
                {showSources ? '▲ 참고 메시지 접기' : `▼ 참고 메시지 보기 (${result.sources.length}개)`}
              </button>

              {showSources && (
                <div className="mt-2 space-y-2">
                  {result.sources.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-xl bg-surface-elevated px-4 py-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-accent-primary">{msg.senderName}</span>
                        <span className="text-xs text-content-muted">{formatTime(msg.messageTime)}</span>
                      </div>
                      <p className="text-sm text-content-primary">{msg.messageContent}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
