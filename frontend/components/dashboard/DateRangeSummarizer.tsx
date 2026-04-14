'use client'

import { useState, useMemo } from 'react'
import { useAnalysis } from '@/context/AnalysisContext'
import { summarizeConversation } from '@/lib/api'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { ConversationSummary } from '@/lib/types'

export function DateRangeSummarizer() {
  const { parsedMessages, sessionId } = useAnalysis()

  const { minDatetime, maxDatetime } = useMemo(() => {
    if (!parsedMessages || parsedMessages.length === 0) return { minDatetime: '', maxDatetime: '' }
    const times = parsedMessages.map((m) => m.timestamp.getTime())
    return {
      minDatetime: toDatetimeLocal(new Date(Math.min(...times))),
      maxDatetime: toDatetimeLocal(new Date(Math.max(...times))),
    }
  }, [parsedMessages])

  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')
  const [result, setResult] = useState<ConversationSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rangeMessageCount = useMemo(() => {
    if (!parsedMessages || !startDatetime || !endDatetime) return null
    const start = new Date(startDatetime).getTime()
    const end = new Date(endDatetime).getTime()
    if (start >= end) return null
    return parsedMessages.filter(
      (m) => m.timestamp.getTime() >= start && m.timestamp.getTime() <= end,
    ).length
  }, [parsedMessages, startDatetime, endDatetime])

  const canSubmit =
    !!startDatetime &&
    !!endDatetime &&
    new Date(startDatetime) < new Date(endDatetime) &&
    !loading

  const handleSummarize = async () => {
    if (!canSubmit || !sessionId || !parsedMessages) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const start = new Date(startDatetime).getTime()
      const end = new Date(endDatetime).getTime()
      const rangeMessages = parsedMessages
        .filter((m) => m.timestamp.getTime() >= start && m.timestamp.getTime() <= end)
        .map((m) => ({ sender: m.sender, content: m.content }))

      const summary = await summarizeConversation({
        session_id: sessionId,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        messages: rangeMessages,
      })
      setResult(summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : '요약 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-6">
      {/* 기간 안내 */}
      <div>
        <h3 className="mb-1 font-semibold text-content-primary">기간 선택</h3>
        <p className="text-sm text-content-secondary">
          {minDatetime && maxDatetime
            ? `대화 기간: ${formatDisplay(minDatetime)} ~ ${formatDisplay(maxDatetime)}`
            : '파싱된 메시지가 없습니다'}
        </p>
      </div>

      {/* 날짜/시간 입력 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-content-secondary">시작</label>
          <input
            type="datetime-local"
            value={startDatetime}
            min={minDatetime}
            max={maxDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
            className="w-full rounded-lg border border-surface-elevated bg-surface-base px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-content-secondary">종료</label>
          <input
            type="datetime-local"
            value={endDatetime}
            min={startDatetime || minDatetime}
            max={maxDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
            className="w-full rounded-lg border border-surface-elevated bg-surface-base px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* 실행 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSummarize}
          disabled={!canSubmit}
          className="rounded-lg bg-accent-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? '요약 중...' : '요약하기'}
        </button>
        {rangeMessageCount !== null && (
          <span className="text-sm text-content-secondary">
            선택 구간{' '}
            <span className="font-semibold text-accent-primary">
              {rangeMessageCount.toLocaleString()}
            </span>
            개 메시지
          </span>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Gemini가 대화를 분석하고 있습니다..." />
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* 결과 */}
      {result && !loading && (
        <div className="space-y-4 border-t border-surface-elevated pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex-center flex-col gap-1">
              <div className="text-2xl font-bold text-accent-primary">{result.message_count}</div>
              <div className="text-xs text-content-secondary">메시지</div>
            </div>
            <div className="flex-center flex-col gap-1">
              <div className="text-2xl font-bold text-accent-secondary">
                {result.participant_count}
              </div>
              <div className="text-xs text-content-secondary">참여자</div>
            </div>
            <div className="flex-center flex-col gap-1">
              <div className="text-xs font-medium text-content-primary">{result.period}</div>
              <div className="text-xs text-content-secondary">기간</div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-content-primary">요약</h4>
            <p className="text-sm leading-relaxed text-content-secondary">{result.summary}</p>
          </div>

          {result.main_topics.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-content-primary">주요 주제</h4>
              <div className="flex flex-wrap gap-2">
                {result.main_topics.map((topic, idx) => (
                  <Badge key={idx} variant="primary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplay(datetimeLocal: string): string {
  return new Date(datetimeLocal).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
