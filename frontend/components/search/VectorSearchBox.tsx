'use client'

import { useState } from 'react'
import { vectorSearch, VectorSearchResult } from '@/lib/api'

interface VectorSearchBoxProps {
  sessionId: number
}

export function VectorSearchBox({ sessionId }: VectorSearchBoxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VectorSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const data = await vectorSearch({ sessionId, query: query.trim(), limit: 20 })
      setResults(data)
    } catch (e) {
      setError('검색 중 오류가 발생했습니다. 임베딩이 완료되었는지 확인해주세요.')
      setResults([])
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
          placeholder="예: 갈등이 있었던 순간, 약속 잡은 대화, 서운했던 메시지..."
          className="flex-1 rounded-xl bg-surface-elevated px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:ring-2 focus:ring-accent-primary"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="rounded-xl bg-accent-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* 결과 없음 */}
      {searched && !loading && !error && results.length === 0 && (
        <p className="text-sm text-content-muted">관련 메시지를 찾지 못했습니다.</p>
      )}

      {/* 결과 목록 */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-content-muted">{results.length}개 메시지 발견</p>
          {results.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl bg-surface-card px-4 py-3 transition hover:bg-surface-elevated"
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
  )
}
