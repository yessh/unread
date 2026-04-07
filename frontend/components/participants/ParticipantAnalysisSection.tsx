'use client'

import { useRef, useState } from 'react'
import { analyzeParticipantStream } from '@/lib/api'
import { ParticipantCard } from './ParticipantCard'
import { ParticipantCardSkeleton } from './ParticipantCardSkeleton'
import { getChartColor, getInitials } from '@/lib/chartUtils'
import type { ParsedMessage, ParticipantAnalysis, StreamingStatus } from '@/lib/types'

interface ParticipantAnalysisSectionProps {
  parsedMessages: ParsedMessage[]
}

export function ParticipantAnalysisSection({ parsedMessages }: ParticipantAnalysisSectionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>('idle')
  const [tokenCount, setTokenCount] = useState(0)
  const [previewText, setPreviewText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cache, setCache] = useState<Record<string, ParticipantAnalysis>>({})
  const cancelRef = useRef<(() => void) | null>(null)
  const accumulatedRef = useRef('')

  // 참여자별 메시지 집계 (버튼 목록용)
  const participantStats = (() => {
    const map = new Map<string, number>()
    for (const m of parsedMessages) {
      map.set(m.sender, (map.get(m.sender) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  })()

  const handleSelect = (name: string) => {
    // 진행 중인 스트림 취소
    cancelRef.current?.()
    cancelRef.current = null

    setSelected(name)
    setError(null)

    if (cache[name]) return // 이미 분석된 경우

    setStreamingStatus('streaming')
    setTokenCount(0)
    setPreviewText('')
    accumulatedRef.current = ''

    const messages = parsedMessages
      .filter((m) => m.sender === name)
      .map((m) => m.content)

    const cancel = analyzeParticipantStream(
      { participant_name: name, messages, total_messages: parsedMessages.length },
      (chunk) => {
        accumulatedRef.current += chunk
        setTokenCount((n) => n + 1)
        // personality_summary 값을 실시간으로 추출해서 표시
        const match = accumulatedRef.current.match(/"personality_summary"\s*:\s*"((?:[^"\\]|\\.)*)"?/)
        if (match) setPreviewText(match[1].replace(/\\"/g, '"'))
      },
      (fullText) => {
        try {
          const cleaned = fullText.replaceAll('```json', '').replaceAll('```', '').trim()
          const parsed = JSON.parse(cleaned) as ParticipantAnalysis
          const msgCount = messages.length
          const pct = parsedMessages.length > 0 ? (msgCount / parsedMessages.length) * 100 : 0
          setCache((prev) => ({
            ...prev,
            [name]: {
              ...parsed,
              name,
              message_count: msgCount,
              message_percentage: pct,
              emoji_usage_frequency: parsed.emoji_usage_frequency ?? 0,
            },
          }))
          setStreamingStatus('done')
        } catch {
          setError('분석 결과를 파싱하는 중 오류가 발생했습니다')
          setStreamingStatus('error')
        }
      },
      (err) => {
        setError(err.message)
        setStreamingStatus('error')
      }
    )

    cancelRef.current = cancel
  }

  const colorIndexOf = (name: string) => participantStats.findIndex((p) => p.name === name)

  return (
    <div className="space-y-6">
      {/* 참여자 버튼 목록 */}
      <div className="flex flex-wrap gap-3">
        {participantStats.map(({ name, count }, idx) => {
          const isSelected = selected === name
          const isAnalyzed = !!cache[name]
          const color = getChartColor(idx)
          const initials = getInitials(name)

          return (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              disabled={streamingStatus === 'streaming' && selected === name}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition border
                ${isSelected
                  ? 'text-white shadow-lg border-transparent'
                  : 'bg-surface-card text-content-primary hover:bg-surface-elevated border-surface-elevated'
                }
                disabled:cursor-not-allowed disabled:opacity-50`}
              style={isSelected ? { backgroundColor: color, boxShadow: `0 4px 14px ${color}55` } : {}}
            >
              <span
                className="flex-center h-6 w-6 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : color }}
              >
                {initials}
              </span>
              <span>{name}</span>
              <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-content-secondary'}`}>
                {count}개
              </span>
              {isAnalyzed && !isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
              )}
            </button>
          )
        })}
      </div>

      {/* 분석 결과 영역 */}
      {selected && (
        <div className="mt-2">
          {streamingStatus === 'streaming' && (
            <div className="max-w-sm">
              <ParticipantCardSkeleton
                name={selected}
                colorIndex={colorIndexOf(selected)}
                tokenCount={tokenCount}
                previewText={previewText}
              />
            </div>
          )}

          {streamingStatus === 'error' && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {(streamingStatus === 'done' || streamingStatus === 'idle') && cache[selected] && (
            <div className="max-w-sm">
              <ParticipantCard
                participant={cache[selected]}
                colorIndex={colorIndexOf(selected)}
              />
            </div>
          )}
        </div>
      )}

      {!selected && (
        <p className="text-sm text-content-secondary">참여자를 선택하면 성격 분석을 시작합니다.</p>
      )}
    </div>
  )
}
