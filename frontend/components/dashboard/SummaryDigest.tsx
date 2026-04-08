'use client'

import type { ConversationSummary } from '@/lib/types'

interface SummaryDigestProps {
  summaryResult: ConversationSummary
}

export function SummaryDigest({ summaryResult }: SummaryDigestProps) {
  const { tree_nodes } = summaryResult

  // 모든 노드에서 일정 수집 (topic 이름 포함)
  const allSchedules = (tree_nodes ?? []).flatMap((n) =>
    (n.schedules ?? [])
      .filter((s) => s.event || s.time || s.location)
      .map((s) => ({ ...s, topic: n.title })),
  )

  if (allSchedules.length === 0) return null

  return (
    <div className="card space-y-4">
      <h3 className="text-base font-semibold text-content-primary">약속 · 일정 정리</h3>

      <div className="flex flex-col gap-4">
        {allSchedules.map((s, i) => {
          const hasAttendees = s.attendees && s.attendees.length > 0
          const lateSet = new Set(s.latecomers ?? [])

          return (
            <div
              key={i}
              className="rounded-lg border border-surface-elevated bg-surface-base px-4 py-4 space-y-3"
            >
              {/* 헤더: 주제 태그 + 이벤트명 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-content-secondary">
                  {s.topic}
                </span>
                {s.event && (
                  <span className="text-sm font-semibold text-content-primary">{s.event}</span>
                )}
              </div>

              {/* 시각 · 장소 */}
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {s.time && (
                  <span className="flex items-center gap-1.5 text-xs text-content-secondary">
                    <span className="text-accent-secondary font-medium">시각</span>
                    {s.time}
                  </span>
                )}
                {s.location && (
                  <span className="flex items-center gap-1.5 text-xs text-content-secondary">
                    <span className="text-accent-secondary font-medium">장소</span>
                    {s.location}
                  </span>
                )}
              </div>

              {/* 참석자 */}
              {hasAttendees && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
                    참석자
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.attendees!.map((name) => {
                      const isLate = lateSet.has(name)
                      return (
                        <span
                          key={name}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isLate
                              ? 'bg-orange-900/40 text-orange-300 ring-1 ring-orange-500/40'
                              : 'bg-surface-elevated text-content-primary'
                          }`}
                        >
                          {name}
                          {isLate && <span className="text-[10px] text-orange-400">지각</span>}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
