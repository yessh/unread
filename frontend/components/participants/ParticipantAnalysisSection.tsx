'use client'

import { useState } from 'react'
import { analyzeParticipant } from '@/lib/api'
import { ParticipantCard } from './ParticipantCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { getChartColor, getInitials } from '@/lib/chartUtils'
import type { ParsedMessage, ParticipantAnalysis } from '@/lib/types'

interface ParticipantAnalysisSectionProps {
  parsedMessages: ParsedMessage[]
}

export function ParticipantAnalysisSection({ parsedMessages }: ParticipantAnalysisSectionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cache, setCache] = useState<Record<string, ParticipantAnalysis>>({})

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

  const handleSelect = async (name: string) => {
    setSelected(name)
    setError(null)

    if (cache[name]) return // 이미 분석된 경우

    setLoading(true)
    try {
      const messages = parsedMessages
        .filter((m) => m.sender === name)
        .map((m) => m.content)

      const result = await analyzeParticipant({
        participant_name: name,
        messages,
        total_messages: parsedMessages.length,
      })

      setCache((prev) => ({ ...prev, [name]: result }))
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
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
              disabled={loading && selected === name}
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
          {loading && (
            <div className="flex justify-center py-10">
              <LoadingSpinner message={`${selected}님을 분석하고 있습니다...`} />
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {cache[selected] && !loading && (
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
