'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { HourlyFrequencyChart } from '@/components/charts/HourlyFrequencyChart'
import { DayOfWeekFrequencyChart } from '@/components/charts/DayOfWeekFrequencyChart'
import { MonthlyFrequencyChart } from '@/components/charts/MonthlyFrequencyChart'
import { ParticipantShareChart } from '@/components/charts/ParticipantShareChart'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ParticipantAnalysisSection } from '@/components/participants/ParticipantAnalysisSection'
import { TimeRangeSlider } from '@/components/dashboard/TimeRangeSlider'
import { ConversationTreeView } from '@/components/dashboard/ConversationTreeView'
import { useAnalysis } from '@/context/AnalysisContext'
import { buildHourlyData, buildWeeklyData, buildParticipantDataFromMessages, buildDayOfWeekData } from '@/lib/chartUtils'

export default function DashboardPage() {
  const router = useRouter()
  const { parsedMessages, roomName, summaryResult, summaryHours, summarizeTimeRange, resetAnalysis } = useAnalysis()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parsedMessages) {
      router.push('/upload')
    }
  }, [parsedMessages, router])

  const hourlyData = useMemo(() => {
    if (!parsedMessages) return []
    return buildHourlyData(parsedMessages)
  }, [parsedMessages])

  const monthlyData = useMemo(() => {
    if (!parsedMessages) return []
    return buildWeeklyData(parsedMessages)
  }, [parsedMessages])

  const dayOfWeekData = useMemo(() => {
    if (!parsedMessages) return []
    return buildDayOfWeekData(parsedMessages)
  }, [parsedMessages])

  const participantData = useMemo(() => {
    if (!parsedMessages) return []
    return buildParticipantDataFromMessages(parsedMessages)
  }, [parsedMessages])

  const { latestTime, oldestTime } = useMemo(() => {
    if (!parsedMessages || parsedMessages.length === 0) return { latestTime: null, oldestTime: null }
    const times = parsedMessages.map((m) => m.timestamp.getTime())
    return {
      latestTime: new Date(Math.max(...times)),
      oldestTime: new Date(Math.min(...times)),
    }
  }, [parsedMessages])

  const handleSummarize = async (startTime: Date, endTime: Date) => {
    setLoading(true)
    setError(null)
    try {
      await summarizeTimeRange(startTime, endTime)
    } catch (e) {
      setError(e instanceof Error ? e.message : '요약 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    resetAnalysis()
    router.push('/upload')
  }

  if (!parsedMessages) return null

  const formatDate = (d: Date) =>
    d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <main className="min-h-screen bg-surface-base">
      {/* 헤더 */}
      <section className="border-b border-surface-elevated bg-surface-card/50 px-4 py-10 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-content-primary">{roomName}</h1>
            {oldestTime && latestTime && (
              <p className="text-sm text-content-secondary">
                {formatDate(oldestTime)} ~ {formatDate(latestTime)}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg border border-surface-elevated px-4 py-2 text-sm text-content-secondary hover:text-content-primary"
          >
            다시 업로드
          </button>
        </div>
      </section>

      {/* 총계 stat 카드 */}
      <section className="border-b border-surface-elevated bg-surface-card px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-8">
            <div>
              <div className="text-3xl font-bold text-accent-primary">
                {parsedMessages.length.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-content-secondary">총 메시지</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-secondary">
                {new Set(parsedMessages.map((m) => m.sender)).size.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-content-secondary">참여자</div>
            </div>
            {oldestTime && latestTime && (
              <div>
                <div className="text-3xl font-bold text-content-primary">
                  {Math.ceil((latestTime.getTime() - oldestTime.getTime()) / (1000 * 60 * 60 * 24)).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-content-secondary">일간 기록</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">

          {/* 1. 대화 요약 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-content-primary">대화 요약</h2>
            <p className="text-sm text-content-secondary">
              범위를 조절해 요약할 시간대를 선택하세요.
            </p>

            <TimeRangeSlider
              parsedMessages={parsedMessages}
              onSummarize={handleSummarize}
              loading={loading}
            />

            {/* 로딩 */}
            {loading && (
              <div className="flex justify-center py-10">
                <LoadingSpinner message="Gemini가 대화를 분석하고 있습니다..." />
              </div>
            )}

            {/* 에러 */}
            {error && !loading && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* 요약 결과 */}
            {summaryResult && !loading && (
              <div className="space-y-5">
                {/* 통계 수치 */}
                <div className="card grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-primary">
                      {summaryResult.message_count.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-content-secondary">메시지</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-secondary">
                      {summaryResult.participant_count}
                    </div>
                    <div className="mt-1 text-xs text-content-secondary">참여자</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-content-primary">{summaryHours}시간</div>
                    <div className="mt-1 text-xs text-content-secondary">선택 범위</div>
                  </div>
                </div>

                {/* 한 줄 요약 */}
                {summaryResult.summary && (
                  <p className="text-sm text-content-secondary">{summaryResult.summary}</p>
                )}

                {/* 트리 뷰 */}
                {summaryResult.tree_nodes && summaryResult.tree_nodes.length > 0 ? (
                  <ConversationTreeView nodes={summaryResult.tree_nodes} />
                ) : (
                  summaryResult.main_topics.length > 0 && (
                    <div className="card">
                      <h3 className="mb-2 font-semibold text-content-primary">주요 주제</h3>
                      <div className="flex flex-wrap gap-2">
                        {summaryResult.main_topics.map((topic, idx) => (
                          <Badge key={idx} variant="primary">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* 2. 채팅 통계 */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-content-primary">채팅 통계</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <HourlyFrequencyChart data={hourlyData} />
              <DayOfWeekFrequencyChart data={dayOfWeekData} />
              <ParticipantShareChart data={participantData} />
              {monthlyData.length > 1 && (
                <div className="lg:col-span-2">
                  <MonthlyFrequencyChart data={monthlyData} />
                </div>
              )}
            </div>
          </div>

          {/* 3. 참여자 성격 분석 */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-content-primary">참여자 성격 분석</h2>
              <p className="mt-1 text-sm text-content-secondary">
                분석할 참여자를 선택하세요. 선택할 때만 AI 분석을 요청합니다.
              </p>
            </div>
            <ParticipantAnalysisSection parsedMessages={parsedMessages} />
          </div>

        </div>
      </section>
    </main>
  )
}
