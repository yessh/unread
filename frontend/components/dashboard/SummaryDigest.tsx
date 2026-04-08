'use client'

import type { ConversationSummary } from '@/lib/types'

interface SummaryDigestProps {
  summaryResult: ConversationSummary
}

const STATUS_STYLE: Record<string, string> = {
  확정: 'bg-green-900/40 text-green-300',
  미정: 'bg-yellow-900/40 text-yellow-300',
  취소: 'bg-red-900/40 text-red-400',
  변경: 'bg-blue-900/40 text-blue-300',
}

// 확정 상태일수록 높은 우선순위
const STATUS_PRIORITY: Record<string, number> = { 확정: 3, 변경: 2, 미정: 1, 취소: 0 }

type RawSchedule = ReturnType<typeof collectSchedules>[number]

function collectSchedules(tree_nodes: NonNullable<ConversationSummary['tree_nodes']>) {
  return tree_nodes.flatMap((n) =>
    (n.schedules ?? [])
      .filter((s) => s.event || s.time || s.location)
      .map((s) => ({ ...s, topic: n.title })),
  )
}

// 두 일정을 병합: 상태는 우선순위 높은 것, attendees/latecomers는 합집합
function mergeSchedule(a: RawSchedule, b: RawSchedule): RawSchedule {
  const aPriority = STATUS_PRIORITY[a.status ?? ''] ?? -1
  const bPriority = STATUS_PRIORITY[b.status ?? ''] ?? -1
  const base = aPriority >= bPriority ? a : b
  const mergedAttendees = Array.from(new Set([...(a.attendees ?? []), ...(b.attendees ?? [])]))
  const mergedLatecomers = Array.from(new Set([...(a.latecomers ?? []), ...(b.latecomers ?? [])]))
  return { ...base, attendees: mergedAttendees, latecomers: mergedLatecomers }
}

export function SummaryDigest({ summaryResult }: SummaryDigestProps) {
  const { tree_nodes } = summaryResult

  const raw = collectSchedules(tree_nodes ?? [])

  // 1단계: 이벤트 이름이 같은 항목끼리 병합 (제안→확정 흐름 통합)
  const byEventName = new Map<string, RawSchedule>()
  const noName: RawSchedule[] = []

  for (const s of raw) {
    const nameKey = (s.event ?? '').trim().toLowerCase()
    if (!nameKey) {
      noName.push(s)
      continue
    }
    const existing = byEventName.get(nameKey)
    byEventName.set(nameKey, existing ? mergeSchedule(existing, s) : s)
  }

  // 2단계: 이름 없는 항목 중 시각+장소가 같은 것 병합
  const noNameMerged = new Map<string, RawSchedule>()
  for (const s of noName) {
    const key = `${(s.time ?? '').trim().toLowerCase()}|${(s.location ?? '').trim().toLowerCase()}`
    const existing = noNameMerged.get(key)
    noNameMerged.set(key, existing ? mergeSchedule(existing, s) : s)
  }

  const allSchedules = [...Array.from(byEventName.values()), ...Array.from(noNameMerged.values())]

  if (allSchedules.length === 0) return null

  return (
    <div className="card space-y-4">
      <h3 className="text-base font-semibold text-content-primary">약속 · 일정 정리</h3>

      <div className="flex flex-col gap-4">
        {allSchedules.map((s, i) => {
          const hasAttendees = s.attendees && s.attendees.length > 0
          const lateSet = new Set(s.latecomers ?? [])
          const statusStyle = STATUS_STYLE[s.status ?? ''] ?? 'bg-surface-elevated text-content-secondary'

          return (
            <div
              key={i}
              className="rounded-lg border border-surface-elevated bg-surface-base px-4 py-4 space-y-3"
            >
              {/* 헤더: 주제 태그 + 이벤트명 + 상태 뱃지 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-content-secondary">
                  {s.topic}
                </span>
                {s.event && (
                  <span className="text-sm font-semibold text-content-primary">{s.event}</span>
                )}
                {s.status && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                    {s.status}
                  </span>
                )}
              </div>

              {/* 시각 · 장소 */}
              {(s.time || s.location) && (
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
              )}

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
