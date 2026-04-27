'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalysis } from '@/context/AnalysisContext'
import { computeRecap } from '@/lib/recapUtils'
import { RecapCard } from '@/components/recap/RecapCard'
import { Card1First } from '@/components/recap/Card1First'
import { Card2Total } from '@/components/recap/Card2Total'
import { Card3Words } from '@/components/recap/Card3Words'
import { Card4MonthlyKing } from '@/components/recap/Card4MonthlyKing'
import { Card5FirstSender } from '@/components/recap/Card5FirstSender'
import { Card6NightOwl } from '@/components/recap/Card6NightOwl'
import { Card7LongestDay } from '@/components/recap/Card7LongestDay'
import { Card8FoodVsLove } from '@/components/recap/Card8FoodVsLove'
import { Card9MonthRange } from '@/components/recap/Card9MonthRange'

const TOTAL_CARDS = 9

export default function RecapPage() {
  const router = useRouter()
  const { parsedMessages, roomName } = useAnalysis()
  const [current, setCurrent] = useState(0)

  const recap = useMemo(() => {
    if (!parsedMessages?.length) return null
    try {
      return computeRecap(parsedMessages)
    } catch {
      return null
    }
  }, [parsedMessages])

  const next = useCallback(() => {
    if (current < TOTAL_CARDS - 1) setCurrent(c => c + 1)
  }, [current])

  const prev = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1)
  }, [current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  if (!parsedMessages || !recap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="text-center">
          <p className="text-content-secondary mb-4">분석할 대화 파일이 없어요</p>
          <button
            onClick={() => router.push('/upload')}
            className="rounded-xl bg-accent-primary px-6 py-3 text-white font-semibold"
          >
            파일 올리러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-surface-base overflow-hidden"
      onClick={next}
    >
      {/* 상단 바 */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-6 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); router.push('/dashboard') }}
          className="text-sm text-content-muted hover:text-content-secondary transition-colors"
        >
          대시보드로
        </button>
        <span className="text-sm text-content-muted">{current + 1} / {TOTAL_CARDS}</span>
      </div>

      {/* 카드 영역 */}
      <div className="flex flex-1 items-center justify-center" key={current}>
        {current === 0 && (
          <RecapCard index={0} total={TOTAL_CARDS}>
            <Card1First
              date={recap.firstMessage.date}
              sender={recap.firstMessage.sender}
              content={recap.firstMessage.content}
              roomName={roomName || '이 대화'}
            />
          </RecapCard>
        )}
        {current === 1 && (
          <RecapCard index={1} total={TOTAL_CARDS}>
            <Card2Total
              messageCount={recap.totalStats.messageCount}
              dayCount={recap.totalStats.dayCount}
              senderCount={recap.totalStats.senderCount}
            />
          </RecapCard>
        )}
        {current === 2 && (
          <RecapCard index={2} total={TOTAL_CARDS}>
            <Card3Words topWords={recap.topWords} />
          </RecapCard>
        )}
        {current === 3 && (
          <RecapCard index={3} total={TOTAL_CARDS}>
            <Card6NightOwl
              topHours={recap.nightOwl.topHours}
              isLateNight={recap.nightOwl.isLateNight}
            />
          </RecapCard>
        )}
        {current === 4 && (
          <RecapCard index={4} total={TOTAL_CARDS}>
            <Card7LongestDay
              date={recap.longestDay.date}
              count={recap.longestDay.count}
              firstMsg={recap.longestDay.firstMsg}
              lastMsg={recap.longestDay.lastMsg}
            />
          </RecapCard>
        )}
        {current === 5 && (
          <RecapCard index={5} total={TOTAL_CARDS}>
            <Card8FoodVsLove
              foodCount={recap.foodVsLove.foodCount}
              loveCount={recap.foodVsLove.loveCount}
              winner={recap.foodVsLove.winner}
            />
          </RecapCard>
        )}
        {current === 6 && (
          <RecapCard index={6} total={TOTAL_CARDS}>
            <Card9MonthRange
              busiest={recap.monthRange.busiest}
              quietest={recap.monthRange.quietest}
            />
          </RecapCard>
        )}
        {current === 7 && (
          <RecapCard index={7} total={TOTAL_CARDS}>
            <Card4MonthlyKing monthlyKing={recap.monthlyKing} />
          </RecapCard>
        )}
        {current === 8 && (
          <RecapCard index={8} total={TOTAL_CARDS}>
            <Card5FirstSender firstSender={recap.firstSender} />
          </RecapCard>
        )}
      </div>

      {/* 하단 힌트 */}
      {current < TOTAL_CARDS - 1 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <p className="text-xs text-content-muted animate-pulse-slow">탭해서 다음으로</p>
        </div>
      )}

      {/* 마지막 카드: 대시보드 버튼 */}
      {current === TOTAL_CARDS - 1 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center px-8">
          <button
            onClick={(e) => { e.stopPropagation(); router.push('/dashboard') }}
            className="w-full max-w-sm rounded-2xl bg-accent-primary py-4 text-center font-semibold text-white shadow-glow"
          >
            자세히 분석하기
          </button>
        </div>
      )}
    </div>
  )
}
