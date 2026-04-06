'use client'

import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import type { ParsedMessage } from '@/lib/types'

interface Props {
  parsedMessages: ParsedMessage[]
  onSummarize: (startTime: Date, endTime: Date) => void
  loading: boolean
}

const MINUTES_IN_DAY = 1440
const VIEW_WINDOW = MINUTES_IN_DAY  // 한 번에 24시간 표시
const SNAP = 15

function snap15(m: number): number {
  return Math.round(m / SNAP) * SNAP
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function TimeRangeSlider({ parsedMessages, onSummarize, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 타임라인 기준점 + 최대 범위 계산
  // - origin: 가장 최신 날짜 기준 2일 전 자정
  // - totalMinutes: 마지막 메시지 시각을 30분 올림한 값
  const { originMs, totalMinutes } = useMemo(() => {
    if (parsedMessages.length === 0) {
      return { originMs: Date.now() - 2 * 86400000, totalMinutes: MINUTES_IN_DAY }
    }
    const maxTs = Math.max(...parsedMessages.map((m) => m.timestamp.getTime()))
    const newestDay = new Date(maxTs)
    newestDay.setHours(0, 0, 0, 0)
    const originMs = newestDay.getTime() - 2 * MINUTES_IN_DAY * 60000
    const lastAbsMin = (maxTs - originMs) / 60000
    const totalMinutes = Math.ceil(lastAbsMin / 30) * 30
    return { originMs, totalMinutes }
  }, [parsedMessages])

  // 타임스탬프 → 절대 분 (origin 기준)
  const toAbsMin = useCallback(
    (ts: Date) => (ts.getTime() - originMs) / 60000,
    [originMs],
  )

  // 30분 단위 파형 버킷
  const { buckets, maxBucket } = useMemo(() => {
    const b = new Array(Math.ceil(totalMinutes / 30)).fill(0)
    for (const m of parsedMessages) {
      const idx = Math.floor(toAbsMin(m.timestamp) / 30)
      if (idx >= 0 && idx < b.length) b[idx]++
    }
    return { buckets: b, maxBucket: Math.max(...b, 1) }
  }, [parsedMessages, toAbsMin, totalMinutes])

  // 최신 날짜(오른쪽)부터 시작 — totalMinutes 기준으로 초기화 및 동기화
  const [viewOffset, setViewOffset] = useState(() => Math.max(0, totalMinutes - VIEW_WINDOW))
  const [startMin, setStartMin] = useState(() => Math.max(0, totalMinutes - VIEW_WINDOW))
  const [endMin, setEndMin] = useState(() => totalMinutes)

  useEffect(() => {
    setViewOffset(Math.max(0, totalMinutes - VIEW_WINDOW))
    setStartMin(Math.max(0, totalMinutes - VIEW_WINDOW))
    setEndMin(totalMinutes)
  }, [totalMinutes])

  type DragMode = 'none' | 'start' | 'end' | 'pan'
  const drag = useRef<{
    mode: DragMode
    originX: number
    originOffset: number
  }>({ mode: 'none', originX: 0, originOffset: 0 })

  // 절대 분 → 뷰 내 % 위치
  const toPercent = (absMin: number) => ((absMin - viewOffset) / VIEW_WINDOW) * 100

  // 화면 X좌표 → 절대 분 (15분 스냅)
  const xToAbsMin = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return viewOffset
      const rect = containerRef.current.getBoundingClientRect()
      const frac = (clientX - rect.left) / rect.width
      return clamp(snap15(viewOffset + frac * VIEW_WINDOW), 0, totalMinutes)
    },
    [viewOffset, totalMinutes],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const handle = (e.target as HTMLElement)
        .closest('[data-handle]')
        ?.getAttribute('data-handle') as 'start' | 'end' | null
      drag.current = {
        mode: handle ?? 'pan',
        originX: e.clientX,
        originOffset: viewOffset,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [viewOffset],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const { mode, originX, originOffset } = drag.current
      if (mode === 'pan') {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const deltaMin = -((e.clientX - originX) / rect.width) * VIEW_WINDOW
        setViewOffset(clamp(originOffset + deltaMin, 0, totalMinutes - VIEW_WINDOW))
      } else if (mode === 'start') {
        const m = xToAbsMin(e.clientX)
        setStartMin(clamp(m, 0, endMin - SNAP))
      } else if (mode === 'end') {
        const m = xToAbsMin(e.clientX)
        setEndMin(clamp(m, startMin + SNAP, totalMinutes))
      }
    },
    [endMin, startMin, xToAbsMin],
  )

  const onPointerUp = useCallback(() => {
    drag.current.mode = 'none'
  }, [])

  // 선택 범위 내 메시지 수
  const selectedCount = useMemo(
    () =>
      parsedMessages.filter((m) => {
        const a = toAbsMin(m.timestamp)
        return a >= startMin && a < endMin
      }).length,
    [parsedMessages, startMin, endMin, toAbsMin],
  )

  // X축 레이블 (4시간마다, 뷰 안에 있는 것만)
  const xLabels = useMemo(() => {
    const result: { pct: number; label: string; key: number }[] = []
    for (let absMin = 0; absMin <= totalMinutes; absMin += 240) {
      const pct = ((absMin - viewOffset) / VIEW_WINDOW) * 100
      if (pct < -4 || pct > 104) continue
      const ts = new Date(originMs + absMin * 60000)
      const h = ts.getHours()
      const label =
        h === 0
          ? ts.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
          : `${h}시`
      result.push({ pct, label, key: absMin })
    }
    return result
  }, [viewOffset, originMs, totalMinutes])

  // 뷰에 보이는 버킷만 렌더
  const visibleBuckets = useMemo(() => {
    return buckets
      .map((count, i) => {
        const startAbs = i * 30
        const left = ((startAbs - viewOffset) / VIEW_WINDOW) * 100
        const width = (30 / VIEW_WINDOW) * 100
        if (left + width < -0.5 || left > 100.5) return null
        const inRange = startAbs >= startMin && startAbs + 30 <= endMin
        return { left, width, count, inRange, key: i }
      })
      .filter(Boolean) as { left: number; width: number; count: number; inRange: boolean; key: number }[]
  }, [buckets, viewOffset, startMin, endMin])

  // 날짜 경계선 (뷰에 보이는 것만)
  const dayDividers = [1, 2]
    .map((d) => {
      const pct = ((d * MINUTES_IN_DAY - viewOffset) / VIEW_WINDOW) * 100
      return pct > 0 && pct < 100 ? { key: d, pct } : null
    })
    .filter(Boolean) as { key: number; pct: number }[]

  const startPct = toPercent(startMin)
  const endPct = toPercent(endMin)

  // 스크롤 진행도 (하단 인디케이터)
  const scrollProgress = totalMinutes > VIEW_WINDOW ? viewOffset / (totalMinutes - VIEW_WINDOW) : 0
  const thumbWidth = Math.min(100, (VIEW_WINDOW / totalMinutes) * 100)

  if (parsedMessages.length === 0) return null

  return (
    <div className="space-y-2">
      {/* 메인 트랙 */}
      <div
        ref={containerRef}
        className="relative h-16 select-none overflow-hidden rounded-xl bg-surface-elevated cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* 파형 */}
        {visibleBuckets.map((b) => (
          <div
            key={b.key}
            className="absolute bottom-0 rounded-t-sm transition-colors duration-75"
            style={{
              left: `${b.left}%`,
              width: `${b.width}%`,
              height: `${Math.max(b.count > 0 ? 3 : 0, (b.count / maxBucket) * 82)}%`,
              background: b.inRange ? 'rgba(124,106,247,0.55)' : 'rgba(124,106,247,0.13)',
            }}
          />
        ))}

        {/* 날짜 경계선 */}
        {dayDividers.map(({ key, pct }) => (
          <div
            key={key}
            className="pointer-events-none absolute top-0 h-full w-px bg-white/10"
            style={{ left: `${pct}%` }}
          />
        ))}

        {/* 선택 범위 상하 테두리 */}
        {endPct > 0 && startPct < 100 && (
          <div
            className="pointer-events-none absolute top-0 h-full border-t-2 border-b-2 border-accent-primary/70"
            style={{
              left: `${clamp(startPct, 0, 100)}%`,
              width: `${clamp(endPct, 0, 100) - clamp(startPct, 0, 100)}%`,
            }}
          />
        )}

        {/* 시작 핸들 */}
        {startPct > -3 && startPct < 103 && (
          <div
            data-handle="start"
            className="absolute top-0 z-10 flex h-full w-4 -translate-x-1/2 cursor-ew-resize items-center justify-center"
            style={{ left: `${startPct}%` }}
          >
            <div className="flex h-full w-[6px] flex-col items-center justify-center gap-[3px] rounded bg-accent-primary shadow-lg">
              <span className="block h-3 w-[2px] rounded-full bg-white/60" />
              <span className="block h-3 w-[2px] rounded-full bg-white/60" />
            </div>
          </div>
        )}

        {/* 종료 핸들 */}
        {endPct > -3 && endPct < 103 && (
          <div
            data-handle="end"
            className="absolute top-0 z-10 flex h-full w-4 -translate-x-1/2 cursor-ew-resize items-center justify-center"
            style={{ left: `${endPct}%` }}
          >
            <div className="flex h-full w-[6px] flex-col items-center justify-center gap-[3px] rounded bg-accent-primary shadow-lg">
              <span className="block h-3 w-[2px] rounded-full bg-white/60" />
              <span className="block h-3 w-[2px] rounded-full bg-white/60" />
            </div>
          </div>
        )}
      </div>

      {/* X축 레이블 */}
      <div className="relative h-5">
        {xLabels.map(({ pct, label, key }) => (
          <span
            key={key}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-content-secondary"
            style={{ left: `${pct}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* 스크롤 인디케이터 */}
      <div className="relative h-1 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="absolute h-full rounded-full bg-accent-primary/40 transition-all duration-75"
          style={{
            left: `${scrollProgress * (100 - thumbWidth)}%`,
            width: `${thumbWidth}%`,
          }}
        />
      </div>

      {/* 선택 범위 정보 + 요약 버튼 */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-elevated bg-surface-card px-5 py-4">
        <div className="flex items-center gap-3">
          {/* 시작 */}
          <TimeStampDisplay absMin={startMin} originMs={originMs} />

          <span className="text-content-secondary">→</span>

          {/* 종료 */}
          <TimeStampDisplay absMin={endMin} originMs={originMs} />

          <span className="ml-1 text-xs text-content-secondary">
            · {selectedCount.toLocaleString()}개
          </span>
        </div>

        <button
          onClick={() => {
            const startTime = new Date(originMs + startMin * 60000)
            const endTime = new Date(originMs + endMin * 60000)
            onSummarize(startTime, endTime)
          }}
          disabled={loading || selectedCount === 0}
          className="shrink-0 rounded-xl bg-accent-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-primary/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          요약하기
        </button>
      </div>
    </div>
  )
}

function TimeStampDisplay({ absMin, originMs }: { absMin: number; originMs: number }) {
  const ts = new Date(originMs + absMin * 60000)
  const date = ts.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
  const time = ts.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div className="text-center">
      <div className="mb-0.5 inline-block rounded-md bg-accent-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-accent-primary">
        {date}
      </div>
      <div className="text-base font-bold tabular-nums text-content-primary">{time}</div>
    </div>
  )
}
